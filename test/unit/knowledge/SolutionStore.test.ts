import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SolutionStore } from '../../../src/knowledge/SolutionStore';
import { Solution } from '../../../src/models/Solution';

describe('SolutionStore', () => {
  let tempDir: string;
  let store: SolutionStore;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'solvedock-test-'));
    store = new SolutionStore(tempDir);
  });

  afterEach(async () => {
    if (fs.existsSync(tempDir)) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('determines the correct solutions directory', () => {
    expect(store.getSolutionsDir()).toBe(path.join(tempDir, '.solvedock', 'solutions'));
  });

  it('creates the directory when calling ensureDirectory', async () => {
    const dir = await store.ensureDirectory();
    expect(fs.existsSync(dir)).toBe(true);
  });

  it('sanitizes titles/IDs into safe filenames', () => {
    expect(store.sanitizeFilename('Python Dotenv 001')).toBe('python-dotenv-001.md');
    expect(store.sanitizeFilename('Fix: PostgreSQL & Docker error!')).toBe('fix-postgresql-docker-error.md');
    expect(store.sanitizeFilename('   ')).toBe('solution.md');
  });

  it('serializes and parses a complete Solution record with frontmatter', () => {
    const original: Solution = {
      id: 'python-dotenv-001',
      title: 'Python dotenv Module Not Found',
      technology: ['Python'],
      tags: ['imports', 'dependencies'],
      status: 'verified',
      environment: 'Windows, Python venv',
      verifiedAt: '2026-10-13',
      problem: 'Cannot import dotenv module in virtual env.',
      rootCause: 'python-dotenv was installed globally, not in the active venv.',
      resolution: 'Activate venv and execute pip install python-dotenv.',
    };

    const markdown = store.serializeSolution(original);
    expect(markdown).toContain('id: python-dotenv-001');
    expect(markdown).toContain('## Problem');
    expect(markdown).toContain('## Root Cause');
    expect(markdown).toContain('## Solution');

    const result = store.parseMarkdown(markdown, '/fake/path.md');
    expect(result.success).toBe(true);
    expect(result.solution).toBeDefined();

    const parsed = result.solution!;
    expect(parsed.id).toBe(original.id);
    expect(parsed.title).toBe(original.title);
    expect(parsed.technology).toEqual(original.technology);
    expect(parsed.tags).toEqual(original.tags);
    expect(parsed.status).toBe('verified');
    expect(parsed.environment).toBe(original.environment);
    expect(parsed.verifiedAt).toBe(original.verifiedAt);
    expect(parsed.problem).toBe(original.problem);
    expect(parsed.rootCause).toBe(original.rootCause);
    expect(parsed.resolution).toBe(original.resolution);
  });

  it('handles invalid or incomplete records gracefully without crashing', () => {
    // Missing ID
    const noId = `---
title: Missing ID
---
## Problem
Test`;
    const resNoId = store.parseMarkdown(noId);
    expect(resNoId.success).toBe(false);
    expect(resNoId.error).toContain('id');

    // Missing Title
    const noTitle = `---
id: test-id
---
## Problem
Test`;
    const resNoTitle = store.parseMarkdown(noTitle);
    expect(resNoTitle.success).toBe(false);
    expect(resNoTitle.error).toContain('title');

    // Completely broken frontmatter
    const corrupted = `---
title: [unclosed yaml
---`;
    const resCorrupted = store.parseMarkdown(corrupted);
    expect(resCorrupted.success).toBe(false);
  });

  it('saves new solutions and prevents duplicate IDs', async () => {
    const solution: Solution = {
      id: 'sol-001',
      title: 'Solution 1',
      technology: ['Node.js'],
      tags: ['npm'],
      status: 'draft',
      problem: 'Error during npm install',
      rootCause: 'Lockfile conflict',
      resolution: 'Delete package-lock.json and run npm install',
    };

    const savedPath = await store.saveSolution(solution);
    expect(fs.existsSync(savedPath)).toBe(true);

    // Attempting to save duplicate ID should fail
    await expect(store.saveSolution(solution)).rejects.toThrow(
      'A solution with ID "sol-001" already exists.'
    );
  });

  it('loads all valid solutions and detects duplicate or invalid files in directory', async () => {
    await store.ensureDirectory();
    const solutionsDir = store.getSolutionsDir();

    // Valid file 1
    const valid1: Solution = {
      id: 'sol-1',
      title: 'First Solution',
      technology: ['Git'],
      tags: ['rebase'],
      status: 'reviewed',
      problem: 'Merge conflict',
      rootCause: 'Diverged history',
      resolution: 'git rebase origin/main',
    };
    await store.saveSolution(valid1);

    // Invalid file
    await fs.promises.writeFile(
      path.join(solutionsDir, 'invalid.md'),
      '# Missing Frontmatter',
      'utf-8'
    );

    const loaded = await store.loadAllSolutions();
    expect(loaded.solutions.length).toBe(1);
    expect(loaded.solutions[0].id).toBe('sol-1');
    expect(loaded.errors.length).toBe(1);
  });

  it('updates existing solutions', async () => {
    const solution: Solution = {
      id: 'update-test',
      title: 'Original Title',
      technology: ['Docker'],
      tags: ['network'],
      status: 'draft',
      problem: 'Container cannot connect',
      rootCause: 'Port not published',
      resolution: 'Use -p 8080:80',
    };

    const savedPath = await store.saveSolution(solution);
    solution.sourcePath = savedPath;
    solution.title = 'Updated Title';
    solution.status = 'reviewed';

    const updatedPath = await store.updateSolution(solution);
    expect(updatedPath).toBe(savedPath);

    const reloaded = await store.loadAllSolutions();
    expect(reloaded.solutions[0].title).toBe('Updated Title');
    expect(reloaded.solutions[0].status).toBe('reviewed');
  });
});
