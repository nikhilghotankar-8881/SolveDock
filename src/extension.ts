import * as vscode from 'vscode';
import { SolveDockViewProvider } from './views/SolveDockViewProvider';
import { SolutionStore } from './knowledge/SolutionStore';
import { SearchService } from './search/SearchService';
import { registerSearchKnowledgeCommand } from './commands/searchKnowledge';
import { registerCreateSolutionCommand } from './commands/createSolution';

/**
 * Called when the SolveDock extension is activated.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('SolveDock is now active.');

  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const solutionStore = new SolutionStore(workspaceRoot);
  const searchService = new SearchService();

  // Register SolveDock sidebar Webview View Provider
  const provider = new SolveDockViewProvider(context.extensionUri, solutionStore, searchService);
  const viewDisposable = vscode.window.registerWebviewViewProvider(
    SolveDockViewProvider.viewType,
    provider
  );

  // Helper to sync solutions with search service and view
  async function reloadKnowledge(): Promise<void> {
    if (!workspaceRoot) return;
    try {
      const { solutions } = await solutionStore.loadAllSolutions();
      searchService.indexSolutions(solutions);
      provider.refreshView(solutions);
    } catch (err) {
      console.error('Failed to reload solutions:', err);
    }
  }

  // Initial load
  if (workspaceRoot) {
    await reloadKnowledge();
  }

  // Register: SolveDock: Open (focuses sidebar container)
  const openCmd = vscode.commands.registerCommand('solvedock.open', () => {
    vscode.commands.executeCommand('workbench.view.extension.solvedock');
  });

  // Register: SolveDock: Search Solutions (Interactive Palette QuickPick search)
  const searchCmd = registerSearchKnowledgeCommand(context, searchService);

  // Register: SolveDock: Create Solution (Phase 5)
  const createCmd = registerCreateSolutionCommand(
    context,
    solutionStore,
    searchService,
    () => {
      reloadKnowledge();
    }
  );

  // Watch for solution file changes to update search index and verification checks
  if (workspaceRoot) {
    const watcher = vscode.workspace.createFileSystemWatcher(
      new vscode.RelativePattern(solutionStore.getSolutionsDir(), '*.md')
    );

    watcher.onDidChange(async (uri) => {
      try {
        const content = await vscode.workspace.fs.readFile(uri);
        const parsed = solutionStore.parseMarkdown(Buffer.from(content).toString('utf8'), uri.fsPath);
        if (parsed.success && parsed.solution) {
          searchService.updateSolution(parsed.solution);
          await reloadKnowledge();
        }
      } catch (err) {
        console.error('Error handling modified solution file:', err);
      }
    });

    watcher.onDidCreate(async () => {
      await reloadKnowledge();
    });

    watcher.onDidDelete((uri) => {
      const filename = uri.fsPath.split(/[\\/]/).pop()?.replace('.md', '');
      if (filename) {
        searchService.removeSolution(filename);
        reloadKnowledge();
      }
    });

    context.subscriptions.push(watcher);
  }

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
