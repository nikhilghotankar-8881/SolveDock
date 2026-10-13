import * as vscode from 'vscode';
import { SolveDockViewProvider } from './views/SolveDockViewProvider';

/**
 * Called when the SolveDock extension is activated.
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('SolveDock is now active.');

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

  // Register: SolveDock: Refresh Knowledge (placeholder — Phase 3)
  const refreshCmd = vscode.commands.registerCommand(
    'solvedock.refreshKnowledge',
    () => {
      vscode.window.showInformationMessage(
        'SolveDock: Refresh Knowledge — reloading local knowledge.'
      );
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
