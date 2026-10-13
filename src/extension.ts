import * as vscode from 'vscode';
import { SolveDockViewProvider } from './views/SolveDockViewProvider';
import { SolutionStore } from './knowledge/SolutionStore';
import { SearchService } from './search/SearchService';
import { registerSearchKnowledgeCommand } from './commands/searchKnowledge';

/**
 * Called when the SolveDock extension is activated.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('SolveDock is now active.');

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const solutionStore = new SolutionStore(workspaceRoot);
  const searchService = new SearchService();

  // Index existing workspace solutions if available
  if (workspaceRoot) {
    try {
      const { solutions } = await solutionStore.loadAllSolutions();
      searchService.indexSolutions(solutions);
    } catch (err) {
      console.error('Failed to load initial solutions for search index:', err);
    }
  }

  // Register SolveDock sidebar Webview View Provider
  const provider = new SolveDockViewProvider(context.extensionUri, solutionStore, searchService);
  const viewDisposable = vscode.window.registerWebviewViewProvider(
    SolveDockViewProvider.viewType,
    provider
  );

  // Register: SolveDock: Open (focuses sidebar container)
  const openCmd = vscode.commands.registerCommand('solvedock.open', () => {
    vscode.commands.executeCommand('workbench.view.extension.solvedock');
  });

  // Register: SolveDock: Search Solutions (Interactive Palette QuickPick search)
  const searchCmd = registerSearchKnowledgeCommand(context, searchService);

  // Register: SolveDock: Create Solution (placeholder — Phase 5)
  const createCmd = vscode.commands.registerCommand(
    'solvedock.createSolution',
    () => {
      vscode.window.showInformationMessage(
        'SolveDock: Create Solution — coming in Phase 5.'
      );
    }
  );

  // Register: SolveDock: Refresh Knowledge
  const refreshCmd = vscode.commands.registerCommand(
    'solvedock.refreshKnowledge',
    async () => {
      try {
        if (!workspaceRoot) {
          vscode.window.showInformationMessage('SolveDock: Open a workspace to load solutions.');
          return;
        }
        const { solutions, errors } = await solutionStore.loadAllSolutions();
        searchService.indexSolutions(solutions);
        provider.refreshView(solutions);

        if (errors.length > 0) {
          vscode.window.showWarningMessage(
            `SolveDock: Loaded ${solutions.length} solution(s), with ${errors.length} error(s) in files.`
          );
        } else {
          vscode.window.showInformationMessage(
            `SolveDock: Refreshed knowledge base (${solutions.length} solution(s) loaded).`
          );
        }
      } catch (err: any) {
        vscode.window.showErrorMessage(`SolveDock refresh failed: ${err.message || String(err)}`);
      }
    }
  );

  context.subscriptions.push(viewDisposable, openCmd, searchCmd, createCmd, refreshCmd);
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
  console.log('SolveDock deactivated.');
}
