import * as vscode from 'vscode';
import { SearchService } from '../search/SearchService';
import { SolutionStore } from '../knowledge/SolutionStore';
import { Solution } from '../models/Solution';

export class SolveDockViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'solvedock.mainView';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _solutionStore?: SolutionStore,
    private readonly _searchService?: SearchService
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage(async (data: { command: string; value?: string; filePath?: string }) => {
      switch (data.command) {
        case 'addSolution': {
          vscode.commands.executeCommand('solvedock.createSolution');
          break;
        }
        case 'searchQuery': {
          this.handleSearchQuery(data.value || '');
          break;
        }
        case 'openSolution': {
          if (data.filePath) {
            this.openSolutionFile(data.filePath);
          }
          break;
        }
        case 'refreshKnowledge': {
          vscode.commands.executeCommand('solvedock.refreshKnowledge');
          break;
        }
      }
    });
  }

  private handleSearchQuery(query: string): void {
    if (!this._view) {
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      this._view.webview.postMessage({
        type: 'searchResults',
        results: null, // resets to empty state
      });
      return;
    }

    const searchResults = this._searchService ? this._searchService.search(trimmed) : [];
    const formatted = searchResults.map((r) => ({
      id: r.solution.id,
      title: r.solution.title,
      technology: r.solution.technology,
      tags: r.solution.tags,
      status: r.solution.status,
      problem: r.solution.problem,
      sourcePath: r.solution.sourcePath,
      score: r.score,
    }));

    this._view.webview.postMessage({
      type: 'searchResults',
      results: formatted,
      query: trimmed,
    });
  }

  public async openSolutionFile(filePath: string): Promise<void> {
    try {
      const doc = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(doc);
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to open solution file: ${err.message || String(err)}`);
    }
  }

  public refreshView(solutions: Solution[]): void {
    if (this._view) {
      this._view.webview.postMessage({
        type: 'knowledgeRefreshed',
        totalCount: solutions.length,
      });
    }
  }

  public getHtmlForWebview(webview: vscode.Webview): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SolveDock</title>
  <style>
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-sideBar-foreground, var(--vscode-foreground));
      background-color: var(--vscode-sideBar-background, var(--vscode-editor-background));
      padding: 12px;
      margin: 0;
      box-sizing: border-box;
      line-height: 1.4;
    }

    * {
      box-sizing: border-box;
    }

    .header {
      margin-bottom: 12px;
    }

    .brand-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--vscode-sideBarSectionHeader-foreground, var(--vscode-descriptionForeground));
      margin: 0;
    }

    .subtitle {
      font-size: 13px;
      font-weight: 600;
      color: var(--vscode-foreground);
      margin: 2px 0 0 0;
    }

    .search-container {
      margin-bottom: 14px;
    }

    .search-input {
      width: 100%;
      padding: 6px 10px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      border: 1px solid var(--vscode-input-border, transparent);
      border-radius: 2px;
      font-size: 12px;
      outline: none;
    }

    .search-input:focus {
      border-color: var(--vscode-focusBorder);
    }

    .action-container {
      margin-bottom: 16px;
    }

    .btn-primary {
      width: 100%;
      background-color: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 2px;
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn-primary:hover {
      background-color: var(--vscode-button-hoverBackground);
    }

    .section {
      margin-bottom: 16px;
    }

    .section-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--vscode-sideBarSectionHeader-foreground, var(--vscode-descriptionForeground));
      margin-bottom: 6px;
      padding-bottom: 2px;
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border, transparent);
    }

    .empty-state {
      padding: 12px 8px;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      background: var(--vscode-sideBar-dropBackground, rgba(128, 128, 128, 0.06));
      border-radius: 4px;
      border-left: 2px solid var(--vscode-activityBar-activeBorder, #007acc);
    }

    .empty-state-title {
      font-weight: 600;
      margin-bottom: 4px;
      color: var(--vscode-foreground);
    }

    .empty-state-text {
      margin: 0;
      font-size: 11.5px;
      opacity: 0.9;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .result-card {
      background: var(--vscode-editor-background);
      border: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.2));
      border-radius: 4px;
      padding: 8px 10px;
      font-size: 12px;
    }

    .result-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }

    .result-title {
      font-weight: 600;
      color: var(--vscode-foreground);
      margin: 0;
      font-size: 12.5px;
    }

    .status-badge {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      padding: 2px 6px;
      border-radius: 3px;
      white-space: nowrap;
    }

    .status-verified {
      background: rgba(46, 160, 67, 0.2);
      color: #3fb950;
      border: 1px solid rgba(46, 160, 67, 0.4);
    }

    .status-reviewed {
      background: rgba(56, 139, 253, 0.2);
      color: #58a6ff;
      border: 1px solid rgba(56, 139, 253, 0.4);
    }

    .status-draft {
      background: rgba(139, 148, 158, 0.2);
      color: #8b949e;
      border: 1px solid rgba(139, 148, 158, 0.4);
    }

    .status-outdated {
      background: rgba(218, 54, 51, 0.2);
      color: #f85149;
      border: 1px solid rgba(218, 54, 51, 0.4);
    }

    .result-tech {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 6px;
    }

    .tech-pill {
      font-size: 10px;
      padding: 1px 5px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 2px;
    }

    .result-problem {
      font-size: 11.5px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 6px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .result-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11px;
      margin-top: 6px;
      padding-top: 4px;
      border-top: 1px solid var(--vscode-widget-border, rgba(128, 128, 128, 0.1));
    }

    .source-name {
      color: var(--vscode-descriptionForeground);
      font-family: var(--vscode-editor-font-family);
      font-size: 10.5px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 140px;
    }

    .btn-open {
      background: transparent;
      border: 1px solid var(--vscode-button-background);
      color: var(--vscode-button-background);
      border-radius: 2px;
      padding: 2px 8px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-open:hover {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand-title">SolveDock</div>
    <div class="subtitle">Developer Knowledge</div>
  </div>

  <div class="search-container">
    <input 
      id="searchInput" 
      class="search-input" 
      type="text" 
      placeholder="Search technical solutions..." 
    />
  </div>

  <div class="action-container">
    <button id="addBtn" class="btn-primary">
      <span>+ Add Solution</span>
    </button>
  </div>

  <div class="section">
    <div class="section-title">SEARCH RESULTS</div>
    <div id="searchResults">
      <div class="empty-state">
        <div class="empty-state-text">Type your query above to search local solutions.</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">RECENT SOLUTIONS</div>
    <div id="recentSolutions" class="empty-state">
      <div class="empty-state-text">No recent solutions accessed yet.</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">SAVED SOLUTIONS</div>
    <div id="savedSolutions" class="empty-state">
      <div class="empty-state-title">No solutions found yet.</div>
      <p class="empty-state-text">Create your first solution to start building your technical knowledge library.</p>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    const searchInput = document.getElementById('searchInput');
    const addBtn = document.getElementById('addBtn');
    const searchResults = document.getElementById('searchResults');

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        vscode.postMessage({ command: 'addSolution' });
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        vscode.postMessage({ 
          command: 'searchQuery', 
          value: e.target.value 
        });
      });
    }

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'searchResults') {
        renderSearchResults(msg.results, msg.query);
      }
    });

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function renderSearchResults(results, query) {
      if (!searchResults) return;

      if (results === null) {
        searchResults.innerHTML = '<div class="empty-state"><div class="empty-state-text">Type your query above to search local solutions.</div></div>';
        return;
      }

      if (!results || results.length === 0) {
        searchResults.innerHTML = '<div class="empty-state"><div class="empty-state-text">No relevant solutions found. Try a different search or record a new solution.</div></div>';
        return;
      }

      let html = '<div class="results-list">';
      for (const item of results) {
        const statusClass = 'status-' + (item.status || 'draft');
        const techPills = (item.technology || [])
          .map(t => '<span class="tech-pill">' + escapeHtml(t) + '</span>')
          .join('');

        const filename = item.sourcePath ? item.sourcePath.split(/[\\\\/]/).pop() : 'solution.md';

        html += '<div class="result-card">';
        html += '  <div class="result-header">';
        html += '    <div class="result-title">' + escapeHtml(item.title) + '</div>';
        html += '    <span class="status-badge ' + statusClass + '">' + escapeHtml(item.status) + '</span>';
        html += '  </div>';

        if (techPills) {
          html += '  <div class="result-tech">' + techPills + '</div>';
        }

        if (item.problem) {
          html += '  <div class="result-problem">' + escapeHtml(item.problem) + '</div>';
        }

        html += '  <div class="result-footer">';
        html += '    <span class="source-name" title="' + escapeHtml(item.sourcePath || '') + '">' + escapeHtml(filename) + '</span>';
        if (item.sourcePath) {
          html += '    <button class="btn-open" data-path="' + escapeHtml(item.sourcePath) + '">[Open Solution]</button>';
        }
        html += '  </div>';
        html += '</div>';
      }
      html += '</div>';

      searchResults.innerHTML = html;

      // Bind click handlers to [Open Solution] buttons
      const openButtons = searchResults.querySelectorAll('.btn-open');
      openButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const path = btn.getAttribute('data-path');
          if (path) {
            vscode.postMessage({ command: 'openSolution', filePath: path });
          }
        });
      });
    }
  </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
