import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { Solution, SolutionFrontmatter, SolutionStatus } from '../models/Solution';

export interface ParseResult {
  success: boolean;
  solution?: Solution;
  error?: string;
  filePath?: string;
}

export class SolutionStore {
  private readonly _solutionsDirName = path.join('.solvedock', 'solutions');

  constructor(private readonly _workspaceRoot?: string) {}

  /**
   * Returns the directory path where solutions are stored.
   */
  public getSolutionsDir(): string {
    if (!this._workspaceRoot) {
      throw new Error('No workspace folder is currently open.');
    }
    return path.join(this._workspaceRoot, this._solutionsDirName);
  }

  /**
   * Ensures that the .solvedock/solutions directory exists.
   */
  public async ensureDirectory(): Promise<string> {
    const dir = this.getSolutionsDir();
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }
    return dir;
  }

  /**
   * Sanitizes a title to generate a safe, deterministic filename.
   */
  public sanitizeFilename(idOrTitle: string): string {
    const safe = idOrTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    return `${safe || 'solution'}.md`;
  }

  /**
   * Serializes a Solution object into standard Markdown with YAML frontmatter.
   */
  public serializeSolution(solution: Solution): string {
    const frontmatter: SolutionFrontmatter = {
      id: solution.id,
      title: solution.title,
      technology: solution.technology,
      tags: solution.tags,
      status: solution.status,
    };

    if (solution.environment) {
      frontmatter.environment = solution.environment;
    }

    if (solution.verifiedAt) {
      frontmatter.verifiedAt = solution.verifiedAt;
    }

    const sections = [
      '## Problem\n',
      solution.problem.trim(),
      '\n\n## Root Cause\n',
      solution.rootCause.trim(),
      '\n\n## Solution\n',
      solution.resolution.trim(),
    ];

    const body = sections.join('\n');
    return matter.stringify(body, frontmatter);
  }

  /**
   * Parses Markdown content with YAML frontmatter into a Solution object.
   */
  public parseMarkdown(content: string, filePath?: string): ParseResult {
    try {
      const parsed = matter(content);
      const data = parsed.data as Partial<SolutionFrontmatter>;

      if (!data.id || typeof data.id !== 'string' || data.id.trim() === '') {
        return {
          success: false,
          error: 'Missing or invalid "id" in frontmatter metadata.',
          filePath,
        };
      }

      if (!data.title || typeof data.title !== 'string' || data.title.trim() === '') {
        return {
          success: false,
          error: 'Missing or empty "title" in frontmatter metadata.',
          filePath,
        };
      }

      const validStatuses: SolutionStatus[] = ['draft', 'reviewed', 'verified', 'outdated'];
      const status: SolutionStatus =
        data.status && validStatuses.includes(data.status as SolutionStatus)
          ? (data.status as SolutionStatus)
          : 'draft';

      const technology = Array.isArray(data.technology)
        ? data.technology
        : typeof data.technology === 'string'
        ? [data.technology]
        : [];

      const tags = Array.isArray(data.tags)
        ? data.tags
        : typeof data.tags === 'string'
        ? [data.tags]
        : [];

      const sections = this.extractSections(parsed.content);

      const solution: Solution = {
        id: data.id.trim(),
        title: data.title.trim(),
        technology,
        tags,
        problem: sections.problem,
        rootCause: sections.rootCause,
        resolution: sections.resolution,
        environment: data.environment,
        status,
        verifiedAt: data.verifiedAt ? String(data.verifiedAt) : undefined,
        sourcePath: filePath,
      };

      return {
        success: true,
        solution,
        filePath,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Failed to parse Markdown: ${err.message || String(err)}`,
        filePath,
      };
    }
  }

  /**
   * Extracts section contents from Markdown body (## Problem, ## Root Cause, ## Solution).
   */
  public extractSections(body: string): {
    problem: string;
    rootCause: string;
    resolution: string;
  } {
    const lines = body.split('\n');
    let currentSection: 'problem' | 'rootCause' | 'resolution' | null = null;
    const contents: Record<'problem' | 'rootCause' | 'resolution', string[]> = {
      problem: [],
      rootCause: [],
      resolution: [],
    };

    for (const line of lines) {
      const trimmed = line.trim();
      const match = trimmed.match(/^##\s+(.+)$/i);

      if (match) {
        const header = match[1].toLowerCase();
        if (header.includes('problem')) {
          currentSection = 'problem';
          continue;
        } else if (header.includes('root cause') || header.includes('cause')) {
          currentSection = 'rootCause';
          continue;
        } else if (header.includes('solution') || header.includes('resolution')) {
          currentSection = 'resolution';
          continue;
        } else {
          currentSection = null;
          continue;
        }
      }

      if (currentSection) {
        contents[currentSection].push(line);
      }
    }

    return {
      problem: contents.problem.join('\n').trim(),
      rootCause: contents.rootCause.join('\n').trim(),
      resolution: contents.resolution.join('\n').trim(),
    };
  }

  /**
   * Reads and parses all solution files in the workspace.
   */
  public async loadAllSolutions(): Promise<{ solutions: Solution[]; errors: ParseResult[] }> {
    const dir = this.getSolutionsDir();
    if (!fs.existsSync(dir)) {
      return { solutions: [], errors: [] };
    }

    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const solutions: Solution[] = [];
    const errors: ParseResult[] = [];
    const seenIds = new Set<string>();

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const fullPath = path.join(dir, entry.name);
        try {
          const content = await fs.promises.readFile(fullPath, 'utf-8');
          const res = this.parseMarkdown(content, fullPath);

          if (res.success && res.solution) {
            if (seenIds.has(res.solution.id)) {
              errors.push({
                success: false,
                error: `Duplicate solution ID detected: "${res.solution.id}". File ignored.`,
                filePath: fullPath,
              });
            } else {
              seenIds.add(res.solution.id);
              solutions.push(res.solution);
            }
          } else {
            errors.push(res);
          }
        } catch (err: any) {
          errors.push({
            success: false,
            error: `Failed to read file: ${err.message || String(err)}`,
            filePath: fullPath,
          });
        }
      }
    }

    return { solutions, errors };
  }

  /**
   * Saves a new solution to disk. Throws if a record with the same ID already exists.
   */
  public async saveSolution(solution: Solution): Promise<string> {
    await this.ensureDirectory();
    const existing = await this.loadAllSolutions();

    const duplicate = existing.solutions.find((s) => s.id === solution.id);
    if (duplicate) {
      throw new Error(`A solution with ID "${solution.id}" already exists.`);
    }

    const filename = this.sanitizeFilename(solution.id);
    const targetPath = path.join(this.getSolutionsDir(), filename);

    if (fs.existsSync(targetPath)) {
      throw new Error(`Target file "${filename}" already exists. Cannot overwrite.`);
    }

    const markdown = this.serializeSolution(solution);
    await fs.promises.writeFile(targetPath, markdown, 'utf-8');

    return targetPath;
  }

  /**
   * Updates an existing solution file.
   */
  public async updateSolution(solution: Solution): Promise<string> {
    if (!solution.sourcePath || !fs.existsSync(solution.sourcePath)) {
      throw new Error(`Original solution file not found at: ${solution.sourcePath}`);
    }

    const markdown = this.serializeSolution(solution);
    await fs.promises.writeFile(solution.sourcePath, markdown, 'utf-8');
    return solution.sourcePath;
  }
}
