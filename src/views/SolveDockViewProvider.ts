import * as vscode from 'vscode';
import { SearchService } from '../search/SearchService';
import { SolutionStore } from '../knowledge/SolutionStore';
import { Solution, SolutionStatus } from '../models/Solution';
import { SolutionValidator } from '../knowledge/SolutionValidator';

export class SolveDockViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'solvedock.mainView';
  private _view?: vscode.WebviewView;
  private _cachedSolutions: Solution[] = [];
  private _filterTechnology: string = '';
  private _filterStatus: string = '';

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

    webviewView.webview.onDidReceiveMessage(
      async (data: {
        command: string;
        value?: string;
        filePath?: string;
        solutionId?: string;
        techFilter?: string;
        statusFilter?: string;
      }) => {
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
          case 'editSolution': {
            if (data.filePath) {
              this.openSolutionFile(data.filePath);
            }
            break;
          }
          case 'filterChange': {
            this._filterTechnology = data.techFilter || '';
            this._filterStatus = data.statusFilter || '';
            this.sendSavedSolutionsToView();
            break;
          }
          case 'refreshKnowledge': {
            vscode.commands.executeCommand('solvedock.refreshKnowledge');
            break;
          }
        }
      }
    );

    // Initial populate of saved solutions
    this.sendSavedSolutionsToView();
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

  public setSolutions(solutions: Solution[]): void {
    this._cachedSolutions = solutions;
    this.sendSavedSolutionsToView();
  }

  public refreshView(solutions: Solution[]): void {
    this._cachedSolutions = solutions;
    this.sendSavedSolutionsToView();
  }

  private sendSavedSolutionsToView(): void {
    if (!this._view) {
      return;
    }

    // Apply filters
    let filtered = this._cachedSolutions;
    if (this._filterTechnology) {
      filtered = filtered.filter((s) =>
        s.technology.some((t) => t.toLowerCase() === this._filterTechnology.toLowerCase())
      );
    }
    if (this._filterStatus) {
      filtered = filtered.filter((s) => s.status === this._filterStatus);
    }

    // Collect available unique technologies for filter dropdown
    const availableTechs = Array.from(
      new Set(this._cachedSolutions.flatMap((s) => s.technology))
    ).sort();

    this._view.webview.postMessage({
      type: 'savedSolutions',
      solutions: filtered,
      totalCount: this._cachedSolutions.length,
      availableTechs,
      currentTech: this._filterTechnology,
      currentStatus: this._filterStatus,
    });
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
      margin-bottom: 12px;
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
      margin-bottom: 14px;
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

    .filter-bar {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
    }

    .filter-select {
      flex: 1;
      background: var(--vscode-dropdown-background);
      color: var(--vscode-dropdown-foreground);
      border: 1px solid var(--vscode-dropdown-border, transparent);
      border-radius: 2px;
      padding: 4px;
      font-size: 11px;
      outline: none;
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
      display: flex;
      justify-content: space-between;
      align-items: center;
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

    .card-actions {
      display: flex;
      gap: 4px;
    }

    .btn-action {
      background: transparent;
      border: 1px solid var(--vscode-button-background);
      color: var(--vscode-button-background);
      border-radius: 2px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 500;
      cursor: pointer;
    }

    .btn-action:hover {
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

  <div class="filter-bar">
    <select id="techSelect" class="filter-select">
      <option value="">All Technologies</option>
    </select>
    <select id="statusSelect" class="filter-select">
      <option value="">All Statuses</option>
      <option value="verified">Verified</option>
      <option value="reviewed">Reviewed</option>
      <option value="draft">Draft</option>
      <option value="outdated">Outdated</option>
    </select>
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
    <div class="section-title">
      <span>SAVED SOLUTIONS</span>
      <span id="savedCount" style="font-size: 10px; opacity: 0.8;"></span>
    </div>
    <div id="savedSolutions">
      <div class="empty-state">
        <div class="empty-state-title">No solutions found yet.</div>
        <p class="empty-state-text">Create your first solution to start building your technical knowledge library.</p>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    const searchInput = document.getElementById('searchInput');
    const addBtn = document.getElementById('addBtn');
    const searchResults = document.getElementById('searchResults');
    const savedSolutions = document.getElementById('savedSolutions');
    const techSelect = document.getElementById('techSelect');
    const statusSelect = document.getElementById('statusSelect');
    const savedCount = document.getElementById('savedCount');

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

    function dispatchFilterChange() {
      vscode.postMessage({
        command: 'filterChange',
        techFilter: techSelect ? techSelect.value : '',
        statusFilter: statusSelect ? statusSelect.value : ''
      });
    }

    if (techSelect) {
      techSelect.addEventListener('change', dispatchFilterChange);
    }
    if (statusSelect) {
      statusSelect.addEventListener('change', dispatchFilterChange);
    }

    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (msg.type === 'searchResults') {
        renderSearchResults(msg.results, msg.query);
      } else if (msg.type === 'savedSolutions') {
        renderSavedSolutions(msg.solutions, msg.totalCount, msg.availableTechs, msg.currentTech, msg.currentStatus);
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

    function renderCards(solutions) {
      let html = '<div class="results-list">';
      for (const item of solutions) {
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
        html += '    <div class="card-actions">';
        if (item.sourcePath) {
          html += '      <button class="btn-action btn-open" data-path="' + escapeHtml(item.sourcePath) + '">[Open]</button>';
          html += '      <button class="btn-action btn-edit" data-path="' + escapeHtml(item.sourcePath) + '">[Edit]</button>';
        }
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
      }
      html += '</div>';
      return html;
    }

    function bindCardButtons(container) {
      const openButtons = container.querySelectorAll('.btn-open');
      openButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const path = btn.getAttribute('data-path');
          if (path) {
            vscode.postMessage({ command: 'openSolution', filePath: path });
          }
        });
      });

      const editButtons = container.querySelectorAll('.btn-edit');
      editButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const path = btn.getAttribute('data-path');
          if (path) {
            vscode.postMessage({ command: 'editSolution', filePath: path });
          }
        });
      });
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

      searchResults.innerHTML = renderCards(results);
      bindCardButtons(searchResults);
    }

    function renderSavedSolutions(solutions, totalCount, availableTechs, currentTech, currentStatus) {
      if (!savedSolutions) return;

      if (savedCount) {
        savedCount.textContent = totalCount ? '(' + solutions.length + ' of ' + totalCount + ')' : '';
      }

      // Update tech filter options dynamically
      if (techSelect && availableTechs) {
        let optionsHtml = '<option value="">All Technologies</option>';
        availableTechs.forEach(t => {
          const selected = t === currentTech ? ' selected' : '';
          optionsHtml += '<option value="' + escapeHtml(t) + '"' + selected + '>' + escapeHtml(t) + '</option>';
        });
        techSelect.innerHTML = optionsHtml;
      }

      if (statusSelect && currentStatus) {
        statusSelect.value = currentStatus;
      }

      if (!solutions || solutions.length === 0) {
        savedSolutions.innerHTML = '<div class="empty-state"><div class="empty-state-title">No solutions found yet.</div><p class="empty-state-text">Create your first solution to start building your technical knowledge library.</p></div>';
        return;
      }

      savedSolutions.innerHTML = renderCards(solutions);
      bindCardButtons(savedSolutions);
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
