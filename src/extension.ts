import * as vscode from 'vscode';

/**
 * Called when the SolveDock extension is activated.
 * Activation is triggered by the events defined in package.json activationEvents.
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log('SolveDock is now active.');

  // Register: SolveDock: Open
  const openCmd = vscode.commands.registerCommand('solvedock.open', () => {
    vscode.commands.executeCommand('workbench.view.extension.solvedock');
  });

  // Register: SolveDock: Search Solutions (placeholder — Phase 4)
  const searchCmd = vscode.commands.registerCommand(
    'solvedock.searchSolutions',
    () => {
      vscode.window.showInformationMessage(
        'SolveDock: Search Solutions — coming in Phase 4.'
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
        'SolveDock: Refresh Knowledge — coming in Phase 3.'
      );
    }
  );

  context.subscriptions.push(openCmd, searchCmd, createCmd, refreshCmd);
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate(): void {
  console.log('SolveDock deactivated.');
}
