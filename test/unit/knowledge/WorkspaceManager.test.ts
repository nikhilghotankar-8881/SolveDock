import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { WorkspaceManager } from '../../../src/knowledge/WorkspaceManager';
import { SearchService } from '../../../src/search/SearchService';

describe('WorkspaceManager - Multi-Root & Lifecycle Management', () => {
  let searchService: SearchService;
  let manager: WorkspaceManager;

  beforeEach(() => {
    vi.clearAllMocks();
    searchService = new SearchService();
    manager = new WorkspaceManager(searchService);
  });

  it('handles zero-workspace configuration gracefully', async () => {
    (vscode.workspace as any).workspaceFolders = undefined;
    await manager.initialize();

    expect(manager.getStores()).toHaveLength(0);
    expect(searchService.getAllSolutions()).toHaveLength(0);
  });

  it('initializes single and multi-root folders correctly', async () => {
    const mockFolderA = {
      uri: vscode.Uri.file('/projects/frontend'),
      name: 'frontend',
      index: 0,
    };
    const mockFolderB = {
      uri: vscode.Uri.file('/projects/backend'),
      name: 'backend',
      index: 1,
    };

    (vscode.workspace as any).workspaceFolders = [mockFolderA, mockFolderB];

    await manager.initialize();

    const stores = manager.getStores();
    expect(stores).toHaveLength(2);
    expect(stores.map((s) => s.workspaceName)).toEqual(['frontend', 'backend']);
  });

  it('handles dynamic workspace folder addition and removal', async () => {
    const mockFolderA = {
      uri: vscode.Uri.file('/projects/frontend'),
      name: 'frontend',
      index: 0,
    };

    (vscode.workspace as any).workspaceFolders = [mockFolderA];
    await manager.initialize();
    expect(manager.getStores()).toHaveLength(1);

    // Dynamic addition of backend
    const mockFolderB = {
      uri: vscode.Uri.file('/projects/backend'),
      name: 'backend',
      index: 1,
    };

    await manager.handleFoldersChanged({
      added: [mockFolderB as any],
      removed: [],
    });

    expect(manager.getStores()).toHaveLength(2);

    // Dynamic removal of frontend
    await manager.handleFoldersChanged({
      added: [],
      removed: [mockFolderA as any],
    });

    const remainingStores = manager.getStores();
    expect(remainingStores).toHaveLength(1);
    expect(remainingStores[0].workspaceName).toBe('backend');
  });

  it('disposes all watchers and stores cleanly on dispose', async () => {
    const mockFolder = {
      uri: vscode.Uri.file('/projects/app'),
      name: 'app',
      index: 0,
    };
    (vscode.workspace as any).workspaceFolders = [mockFolder];
    await manager.initialize();

    manager.dispose();
    expect(manager.getStores()).toHaveLength(0);
  });
});
