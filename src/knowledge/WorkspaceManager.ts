import * as vscode from 'vscode';
import { SolutionStore } from './SolutionStore';
import { SearchService } from '../search/SearchService';
import { Solution } from '../models/Solution';

export interface WorkspaceKnowledgeState {
  store: SolutionStore;
  watcher: vscode.FileSystemWatcher;
}

/**
 * Manages SolutionStore instances, SearchService indexing, and FileSystemWatchers
 * across zero, single, and multi-root workspace configurations.
 */
export class WorkspaceManager {
  private _workspaceMap: Map<string, WorkspaceKnowledgeState> = new Map();
  private _disposables: vscode.Disposable[] = [];
  private _onDidUpdateCallback?: (solutions: Solution[]) => void;

  constructor(private readonly _searchService: SearchService) {}

  public onDidUpdate(callback: (solutions: Solution[]) => void): void {
    this._onDidUpdateCallback = callback;
  }

  /**
   * Initializes workspace stores and watchers based on current workspace folders.
   */
  public async initialize(): Promise<void> {
    this.disposeWatchers();
    this._workspaceMap.clear();

    const folders = vscode.workspace.workspaceFolders || [];
    for (const folder of folders) {
      const rootPath = folder.uri.fsPath;
      const store = new SolutionStore(rootPath, folder.name);

      const pattern = new vscode.RelativePattern(store.getSolutionsDir(), '*.md');
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);

      watcher.onDidChange(async (uri) => {
        await this.handleFileChange(uri, store);
      });

      watcher.onDidCreate(async () => {
        await this.reloadAll();
      });

      watcher.onDidDelete((uri) => {
        const filename = uri.fsPath.split(/[\\/]/).pop()?.replace('.md', '');
        if (filename) {
          this._searchService.removeSolution(filename);
        }
        this.notifyUpdate();
      });

      this._workspaceMap.set(rootPath, { store, watcher });
    }

    await this.reloadAll();
  }

  /**
   * Returns all active SolutionStore instances.
   */
  public getStores(): SolutionStore[] {
    return Array.from(this._workspaceMap.values()).map((s) => s.store);
  }

  /**
   * Returns the primary or default SolutionStore.
   */
  public getDefaultStore(): SolutionStore | undefined {
    const first = this._workspaceMap.values().next().value;
    return first ? first.store : undefined;
  }

  /**
   * Resolves the appropriate SolutionStore that owns a given file path.
   */
  public getStoreForPath(filePath: string): SolutionStore | undefined {
    for (const [root, state] of this._workspaceMap.entries()) {
      if (filePath.startsWith(root)) {
        return state.store;
      }
    }
    return this.getDefaultStore();
  }

  /**
   * Reloads and indexes solutions across all active workspace roots.
   */
  public async reloadAll(): Promise<{ solutions: Solution[]; errorsCount: number }> {
    const allSolutions: Solution[] = [];
    let errorsCount = 0;

    for (const { store } of this._workspaceMap.values()) {
      try {
        const { solutions, errors } = await store.loadAllSolutions();
        allSolutions.push(...solutions);
        errorsCount += errors.length;
      } catch (err) {
        console.error('Failed to load solutions for workspace root:', err);
      }
    }

    this._searchService.indexSolutions(allSolutions);
    this.notifyUpdate();
    return { solutions: allSolutions, errorsCount };
  }

  private async handleFileChange(uri: vscode.Uri, store: SolutionStore): Promise<void> {
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      const parsed = store.parseMarkdown(Buffer.from(content).toString('utf8'), uri.fsPath);
      if (parsed.success && parsed.solution) {
        this._searchService.updateSolution(parsed.solution);
        this.notifyUpdate();
      }
    } catch (err) {
      console.error('Error handling modified solution file:', err);
    }
  }

  private notifyUpdate(): void {
    if (this._onDidUpdateCallback) {
      const current = this.getAllCachedSolutions();
      this._onDidUpdateCallback(current);
    }
  }

  public getAllCachedSolutions(): Solution[] {
    return this._searchService.getAllSolutions();
  }

  /**
   * Handles workspace folder changes dynamically.
   */
  public async handleFoldersChanged(event: vscode.WorkspaceFoldersChangeEvent): Promise<void> {
    for (const folder of event.removed) {
      const rootPath = folder.uri.fsPath;
      const state = this._workspaceMap.get(rootPath);
      if (state) {
        state.watcher.dispose();
        this._workspaceMap.delete(rootPath);
      }
    }

    for (const folder of event.added) {
      const rootPath = folder.uri.fsPath;
      if (!this._workspaceMap.has(rootPath)) {
        const store = new SolutionStore(rootPath, folder.name);
        const pattern = new vscode.RelativePattern(store.getSolutionsDir(), '*.md');
        const watcher = vscode.workspace.createFileSystemWatcher(pattern);
        watcher.onDidChange(async (uri) => {
          await this.handleFileChange(uri, store);
        });
        watcher.onDidCreate(async () => {
          await this.reloadAll();
        });
        watcher.onDidDelete((uri) => {
          const filename = uri.fsPath.split(/[\\/]/).pop()?.replace('.md', '');
          if (filename) {
            this._searchService.removeSolution(filename);
          }
          this.notifyUpdate();
        });
        this._workspaceMap.set(rootPath, { store, watcher });
      }
    }

    await this.reloadAll();
  }

  public disposeWatchers(): void {
    for (const state of this._workspaceMap.values()) {
      state.watcher.dispose();
    }
  }

  public dispose(): void {
    this.disposeWatchers();
    this._workspaceMap.clear();
    for (const d of this._disposables) {
      d.dispose();
    }
  }
}
