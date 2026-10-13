import * as vscode from 'vscode';
import { SolveDockViewProvider } from './views/SolveDockViewProvider';
import { SearchService } from './search/SearchService';
import { registerSearchKnowledgeCommand } from './commands/searchKnowledge';
import { registerCreateSolutionCommand } from './commands/createSolution';
import { WorkspaceManager } from './knowledge/WorkspaceManager';

let workspaceManager: WorkspaceManager | undefined;

/**
 * Called when the SolveDock extension is activated.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('SolveDock is now active.');

  const searchService = new SearchService();
  workspaceManager = new WorkspaceManager(searchService);

  // Register SolveDock sidebar Webview View Provider
  const provider = new SolveDockViewProvider(context.extensionUri, workspaceManager, searchService, context);
  const viewDisposable = vscode.window.registerWebviewViewProvider(
    SolveDockViewProvider.viewType,
    provider
  );

  // Connect workspace updates to sidebar refresh
  workspaceManager.onDidUpdate((solutions) => {
    provider.refreshView(solutions);
  });

  // Initialize workspace manager
  await workspaceManager.initialize();

  // Watch for workspace folders changes (added, removed, or switched)
  const folderChangeDisposable = vscode.workspace.onDidChangeWorkspaceFolders(async () => {
    if (workspaceManager) {
      await workspaceManager.initialize();
    }
  });

  // Register: SolveDock: Open (focuses sidebar container)
  const openCmd = vscode.commands.registerCommand('solvedock.open', () => {
    vscode.commands.executeCommand('workbench.view.extension.solvedock');
  });

  // Register: SolveDock: Search Solutions (Interactive Palette QuickPick search)
  const searchCmd = registerSearchKnowledgeCommand(context, searchService);

  // Register: SolveDock: Create Solution (Quick entry & Template authoring)
  const createCmds = registerCreateSolutionCommand(
    context,
    workspaceManager,
    searchService,
    async () => {
      if (workspaceManager) {
        await workspaceManager.reloadAll();
      }
    }
  );

  // Register: SolveDock: Refresh Knowledge
  const refreshCmd = vscode.commands.registerCommand('solvedock.refreshKnowledge', async () => {
    try {
      if (!workspaceManager || workspaceManager.getStores().length === 0) {
        vscode.window.showInformationMessage('SolveDock: Open a workspace folder to load solutions.');
        return;
      }

      const { solutions, errorsCount } = await workspaceManager.reloadAll();
      provider.refreshView(solutions);

      if (errorsCount > 0) {
        vscode.window.showWarningMessage(
          `SolveDock: Loaded ${solutions.length} solution(s), with ${errorsCount} file error(s).`
        );
      } else {
        vscode.window.showInformationMessage(
          `SolveDock: Refreshed knowledge base (${solutions.length} solution(s) loaded).`
        );
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`SolveDock refresh failed: ${err.message || String(err)}`);
    }
  });

  context.subscriptions.push(
    viewDisposable,
    folderChangeDisposable,
    openCmd,
    searchCmd,
    ...createCmds,
    refreshCmd
  );
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
  if (workspaceManager) {
    workspaceManager.dispose();
    workspaceManager = undefined;
  }
  console.log('SolveDock deactivated.');
}
