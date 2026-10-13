import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { SolveDockViewProvider } from '../../../src/views/SolveDockViewProvider';

describe('SolveDockViewProvider', () => {
  let provider: SolveDockViewProvider;
  const mockUri = vscode.Uri.file('/fake/extension/path');

  beforeEach(() => {
    provider = new SolveDockViewProvider(mockUri as any);
    vi.clearAllMocks();
  });

  it('initializes with the correct viewType', () => {
    expect(SolveDockViewProvider.viewType).toBe('solvedock.mainView');
  });

  it('generates HTML containing the core UI layout elements', () => {
    const mockWebview = {
      cspSource: 'vscode-webview:',
      asWebviewUri: vi.fn((uri) => uri),
    };

    const html = provider.getHtmlForWebview(mockWebview as any);

    // Header & Brand
    expect(html).toContain('SolveDock');
    expect(html).toContain('Developer Knowledge');

    // Search bar
    expect(html).toContain('Search technical solutions...');

    // Action button
    expect(html).toContain('+ Add Solution');

    // Expected sections
    expect(html).toContain('SEARCH RESULTS');
    expect(html).toContain('RECENT SOLUTIONS');
    expect(html).toContain('SAVED SOLUTIONS');

    // Mandatory empty state text as per PRD
    expect(html).toContain('No solutions found yet.');
    expect(html).toContain('Create your first solution to start building your technical knowledge library.');
  });

  it('resolves WebviewView, sets options, and registers message handler', () => {
    let messageListener: ((data: any) => void) | undefined;

    const mockWebview = {
      options: {},
      html: '',
      cspSource: 'vscode-webview:',
      onDidReceiveMessage: vi.fn((cb) => {
        messageListener = cb;
        return { dispose: vi.fn() };
      }),
    };

    const mockWebviewView = {
      webview: mockWebview,
    };

    provider.resolveWebviewView(mockWebviewView as any, {} as any, {} as any);

    expect(mockWebview.options).toEqual({
      enableScripts: true,
      localResourceRoots: [mockUri],
    });
    expect(mockWebview.html).toContain('SolveDock');
    expect(messageListener).toBeDefined();

    // Trigger addSolution message
    messageListener?.({ command: 'addSolution' });
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith('solvedock.createSolution');

    // Trigger refreshKnowledge message
    messageListener?.({ command: 'refreshKnowledge' });
    expect(vscode.commands.executeCommand).toHaveBeenCalledWith('solvedock.refreshKnowledge');
  });
});
