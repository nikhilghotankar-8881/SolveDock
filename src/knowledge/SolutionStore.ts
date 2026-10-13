import * as fs from 'fs';
import * as path from 'path';
import matter from 'gray-matter';
import { Solution, SolutionFrontmatter, SolutionStatus, VALID_SOLUTION_STATUSES } from '../models/Solution';
import { SolutionValidator } from './SolutionValidator';

export interface ParseResult {
  success: boolean;
  solution?: Solution;
  error?: string;
  filePath?: string;
}

export class SolutionStore {
  private readonly _solutionsDirName = path.join('.solvedock', 'solutions');

  constructor(
    private readonly _workspaceRoot?: string,
    private readonly _workspaceName?: string
  ) {}

  public get workspaceRoot(): string | undefined {
    return this._workspaceRoot;
  }

  public get workspaceName(): string | undefined {
    return this._workspaceName;
  }

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
   * Strips all directory separators, parent traversal sequences, and unsafe characters.
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
   * Asserts and canonicalizes that a target path resides strictly inside the knowledge directory.
   */
  public assertPathInSolutionsDir(targetPath: string): string {
    const solutionsDir = path.resolve(this.getSolutionsDir());
    const resolvedTarget = path.resolve(targetPath);

    // Ensure target path is strictly within solutionsDir
    const relative = path.relative(solutionsDir, resolvedTarget);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      throw new Error(`Security Exception: Access denied. Path "${targetPath}" is outside knowledge directory.`);
    }

    return resolvedTarget;
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
   * Validates frontmatter, arrays, strings, dates, and sections without crashing.
   */
  public parseMarkdown(content: string, filePath?: string): ParseResult {
    try {
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return {
          success: false,
          error: 'Empty solution file.',
          filePath,
        };
      }

      let parsed: matter.GrayMatterFile<string>;
      try {
        parsed = matter(content);
      } catch (yamlErr: any) {
        return {
          success: false,
          error: `Malformed YAML frontmatter: ${yamlErr.message || String(yamlErr)}`,
          filePath,
        };
      }

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

      const statusCandidate = typeof data.status === 'string' ? (data.status.toLowerCase() as SolutionStatus) : 'draft';
      const status: SolutionStatus = VALID_SOLUTION_STATUSES.includes(statusCandidate)
        ? statusCandidate
        : 'draft';

      // Parse and clean technology array
      let technology: string[] = [];
      if (Array.isArray(data.technology)) {
        technology = data.technology
          .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim());
      } else if (typeof data.technology === 'string' && data.technology.trim().length > 0) {
        technology = [data.technology.trim()];
      }

      // Parse and clean tags array
      let tags: string[] = [];
      if (Array.isArray(data.tags)) {
        tags = data.tags
          .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim());
      } else if (typeof data.tags === 'string' && data.tags.trim().length > 0) {
        tags = [data.tags.trim()];
      }

      // Parse verified date
      let verifiedAt: string | undefined;
      if (data.verifiedAt) {
        const dateStr = String(data.verifiedAt).trim();
        if (!isNaN(Date.parse(dateStr))) {
          verifiedAt = dateStr;
        }
      }

      const sections = this.extractSections(parsed.content);

      const solution: Solution = {
        id: data.id.trim(),
        title: data.title.trim(),
        technology,
        tags,
        problem: sections.problem,
        rootCause: sections.rootCause,
        resolution: sections.resolution,
        environment: typeof data.environment === 'string' ? data.environment.trim() : undefined,
        status,
        verifiedAt,
        sourcePath: filePath,
        workspaceName: this._workspaceName,
      };

      // Perform validation check
      const validation = SolutionValidator.validate(solution);
      if (!validation.valid) {
        return {
          success: false,
          error: `Validation failed: ${validation.errors.join('; ')}`,
          filePath,
        };
      }

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
    if (!this._workspaceRoot) {
      return { solutions: [], errors: [] };
    }

    const dir = this.getSolutionsDir();
    if (!fs.existsSync(dir)) {
      return { solutions: [], errors: [] };
    }

    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch (err: any) {
      return {
        solutions: [],
        errors: [{ success: false, error: `Cannot read solutions directory: ${err.message || String(err)}` }],
      };
    }

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
                error: `Duplicate solution ID detected: "${res.solution.id}". File ignored to prevent duplicate indexing.`,
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
    this.assertPathInSolutionsDir(targetPath);

    if (fs.existsSync(targetPath)) {
      throw new Error(`Target file "${filename}" already exists. Cannot overwrite.`);
    }

    const markdown = this.serializeSolution(solution);
    await fs.promises.writeFile(targetPath, markdown, 'utf-8');

    return targetPath;
  }

  /**
   * Updates an existing solution file with path containment assertion.
   */
  public async updateSolution(solution: Solution): Promise<string> {
    if (!solution.sourcePath || !fs.existsSync(solution.sourcePath)) {
      throw new Error(`Original solution file not found at: ${solution.sourcePath}`);
    }

    this.assertPathInSolutionsDir(solution.sourcePath);

    const markdown = this.serializeSolution(solution);
    await fs.promises.writeFile(solution.sourcePath, markdown, 'utf-8');
    return solution.sourcePath;
  }
}
