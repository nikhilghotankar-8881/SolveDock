import * as vscode from 'vscode';

export class SolveDockViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'solvedock.mainView';
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

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

    webviewView.webview.onDidReceiveMessage((data: { command: string; value?: string }) => {
      switch (data.command) {
        case 'addSolution': {
          vscode.commands.executeCommand('solvedock.createSolution');
          break;
        }
        case 'searchQuery': {
          // Will be integrated with SearchService in Phase 4
          break;
        }
        case 'refreshKnowledge': {
          vscode.commands.executeCommand('solvedock.refreshKnowledge');
          break;
        }
      }
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
    <div id="searchResults" class="empty-state">
      <div class="empty-state-text">No active search query.</div>
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
