import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { SolutionStore } from '../../../src/knowledge/SolutionStore';
import { SearchService } from '../../../src/search/SearchService';
import { Solution } from '../../../src/models/Solution';
import { SolveDockViewProvider } from '../../../src/views/SolveDockViewProvider';
import * as vscode from 'vscode';

describe('Phase 7: Functional Integration Test Matrix', () => {
  let tempWorkspace: string;
  let store: SolutionStore;
  let search: SearchService;

  beforeEach(async () => {
    tempWorkspace = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'solvedock-p7-'));
    store = new SolutionStore(tempWorkspace);
    search = new SearchService();
  });

  afterEach(async () => {
    if (fs.existsSync(tempWorkspace)) {
      await fs.promises.rm(tempWorkspace, { recursive: true, force: true });
    }
    vi.clearAllMocks();
  });

  it('TC1 & TC2: Search an existing solution and verify fuzzy retrieval', async () => {
    const sol: Solution = {
      id: 'tc-postgres-01',
      title: 'PostgreSQL connection refused port 5432',
      technology: ['PostgreSQL'],
      tags: ['database'],
      problem: 'connection to server on socket failed',
      rootCause: 'service inactive',
      resolution: 'systemctl start postgresql',
      status: 'verified',
    };
    await store.saveSolution(sol);
    search.updateSolution(sol);

    // Exact
    const exact = search.search('PostgreSQL connection refused');
    expect(exact.length).toBeGreaterThan(0);
    expect(exact[0].solution.id).toBe('tc-postgres-01');

    // Fuzzy wording
    const fuzzy = search.search('Postgres connection failure 5432');
    expect(fuzzy.length).toBeGreaterThan(0);
    expect(fuzzy[0].solution.id).toBe('tc-postgres-01');
  });

  it('TC3: Search for an unknown error returns empty array without false positives', () => {
    const res = search.search('nonexistent-error-code-xyz-999');
    expect(res).toHaveLength(0);
  });

  it('TC4, TC5 & TC6: Create solution, edit solution, and verify persistence across reloads', async () => {
    const sol: Solution = {
      id: 'tc-persist-01',
      title: 'Initial Title',
      technology: ['Docker'],
      tags: ['network'],
      problem: 'Container unreachable',
      rootCause: 'Port mapping absent',
      resolution: 'Expose port 8080',
      status: 'draft',
    };

    // Save
    const savedPath = await store.saveSolution(sol);
    expect(fs.existsSync(savedPath)).toBe(true);

    // Reload store (simulating editor restart)
    const newStoreInstance = new SolutionStore(tempWorkspace);
    const loaded1 = await newStoreInstance.loadAllSolutions();
    expect(loaded1.solutions).toHaveLength(1);
    expect(loaded1.solutions[0].title).toBe('Initial Title');

    // Edit and persist
    sol.sourcePath = savedPath;
    sol.title = 'Updated Title After Edit';
    sol.status = 'reviewed';
    await newStoreInstance.updateSolution(sol);

    // Reopen again
    const loaded2 = await new SolutionStore(tempWorkspace).loadAllSolutions();
    expect(loaded2.solutions[0].title).toBe('Updated Title After Edit');
    expect(loaded2.solutions[0].status).toBe('reviewed');
  });

  it('TC7: Loading invalid markdown file does not crash the engine and logs parse error', async () => {
    await store.ensureDirectory();
    const badFile = path.join(store.getSolutionsDir(), 'corrupted.md');
    await fs.promises.writeFile(badFile, '---\nmalformed yaml [unclosed\n---\nBody', 'utf-8');

    const result = await store.loadAllSolutions();
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.solutions).toHaveLength(0);
  });

  it('TC8: Opening source document calls workspace openTextDocument and showTextDocument', async () => {
    const provider = new SolveDockViewProvider(vscode.Uri.file('/mock') as any);
    const targetFile = path.join(tempWorkspace, 'test.md');
    await fs.promises.writeFile(targetFile, '# test', 'utf-8');

    vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue({} as any);

    await provider.openSolutionFile(targetFile);
    expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(targetFile);
    expect(vscode.window.showTextDocument).toHaveBeenCalled();
  });

  it('TC9: Open an empty workspace produces empty list without throwing', async () => {
    const emptyWorkspace = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'solvedock-empty-'));
    const emptyStore = new SolutionStore(emptyWorkspace);
    const res = await emptyStore.loadAllSolutions();
    expect(res.solutions).toHaveLength(0);
    expect(res.errors).toHaveLength(0);
    await fs.promises.rm(emptyWorkspace, { recursive: true, force: true });
  });
});
