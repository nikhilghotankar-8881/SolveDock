import * as vscode from 'vscode';
import { SearchService } from '../search/SearchService';

export function registerSearchKnowledgeCommand(
  context: vscode.ExtensionContext,
  searchService: SearchService
): vscode.Disposable {
  return vscode.commands.registerCommand('solvedock.searchSolutions', async () => {
    // Focus the sidebar first
    await vscode.commands.executeCommand('workbench.view.extension.solvedock');

    // Prompt for quick search query from Command Palette
    const query = await vscode.window.showInputBox({
      prompt: 'Search technical solutions in SolveDock',
      placeHolder: 'e.g. PostgreSQL connection refused',
    });

    if (query === undefined) {
      return; // Cancelled
    }

    const trimmed = query.trim();
    if (!trimmed) {
      vscode.window.showInformationMessage('Please enter a search term.');
      return;
    }

    const results = searchService.search(trimmed);
    if (results.length === 0) {
      vscode.window.showInformationMessage(
        'No relevant solutions found. Try a different search or record a new solution.'
      );
      return;
    }

    interface SolutionQuickPickItem extends vscode.QuickPickItem {
      filePath?: string;
    }

    const items: SolutionQuickPickItem[] = results.map((r) => ({
      label: `$(file-code) ${r.solution.title}`,
      description: `[${r.solution.status.toUpperCase()}] ${r.solution.technology.join(', ')}`,
      detail: r.solution.problem,
      filePath: r.solution.sourcePath,
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `Found ${results.length} result(s) for "${trimmed}". Select to open.`,
    });

    if (selected && selected.filePath) {
      try {
        const doc = await vscode.workspace.openTextDocument(selected.filePath);
        await vscode.window.showTextDocument(doc);
      } catch (err: any) {
        vscode.window.showErrorMessage(`Failed to open solution file: ${err.message || String(err)}`);
      }
    }
  });
}
