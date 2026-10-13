import * as vscode from 'vscode';
import { SolveDockViewProvider } from './views/SolveDockViewProvider';
import { SolutionStore } from './knowledge/SolutionStore';

/**
 * Called when the SolveDock extension is activated.
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('SolveDock is now active.');

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const solutionStore = new SolutionStore(workspaceRoot);

  // Register SolveDock sidebar Webview View Provider
  const provider = new SolveDockViewProvider(context.extensionUri);
  const viewDisposable = vscode.window.registerWebviewViewProvider(
    SolveDockViewProvider.viewType,
    provider
  );

  // Register: SolveDock: Open (focuses sidebar container)
  const openCmd = vscode.commands.registerCommand('solvedock.open', () => {
    vscode.commands.executeCommand('workbench.view.extension.solvedock');
  });

  // Register: SolveDock: Search Solutions (placeholder — Phase 4)
  const searchCmd = vscode.commands.registerCommand(
    'solvedock.searchSolutions',
    () => {
      vscode.commands.executeCommand('workbench.view.extension.solvedock');
      vscode.window.showInformationMessage(
        'SolveDock: Search Solutions — type your query in the sidebar search bar.'
      );
    }
  );

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
