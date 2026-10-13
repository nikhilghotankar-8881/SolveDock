import { describe, it, expect, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { SolutionStore } from '../../../src/knowledge/SolutionStore';
import { SolveDockViewProvider } from '../../../src/views/SolveDockViewProvider';
import * as vscode from 'vscode';

describe('Phase 7: Security & Boundary Invariants', () => {
  it('SEC-1: Never connects to external networks or telemetry in core modules', () => {
    // Inspect source files to ensure no http/https or telemetry fetch calls exist
    const filesToAudit = [
      'src/knowledge/SolutionStore.ts',
      'src/search/SearchService.ts',
      'src/knowledge/SolutionValidator.ts',
      'src/views/SolveDockViewProvider.ts',
    ];

    for (const relativePath of filesToAudit) {
      const fullPath = path.resolve(__dirname, '../../../', relativePath);
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Check absence of network requests
      expect(content).not.toMatch(/fetch\s*\(/);
      expect(content).not.toMatch(/axios/);
      expect(content).not.toMatch(/http\.request/);
      expect(content).not.toMatch(/https\.request/);
      expect(content).not.toMatch(/telemetry/i);
    }
  });

  it('SEC-2: Restricts storage operations to .solvedock/solutions/ and generates safe filenames', () => {
    const store = new SolutionStore('/workspace/root');

    // Directory boundary check
    expect(store.getSolutionsDir()).toBe(
      path.join('/workspace/root', '.solvedock', 'solutions')
    );

    // Filename traversal prevention
    const maliciousInput = '../../../etc/passwd';
    const sanitized = store.sanitizeFilename(maliciousInput);
    expect(sanitized).toBe('etc-passwd.md');
    expect(sanitized).not.toContain('..');
    expect(sanitized).not.toContain('/');
    expect(sanitized).not.toContain('\\');

    const injectionInput = 'solution; rm -rf /;';
    const sanitizedInjection = store.sanitizeFilename(injectionInput);
    expect(sanitizedInjection).toBe('solution-rm-rf.md');
  });

  it('SEC-3: Webview HTML specifies strict Content Security Policy (CSP)', () => {
    const provider = new SolveDockViewProvider(vscode.Uri.file('/mock') as any);
    const mockWebview = {
      cspSource: 'vscode-webview:',
      asWebviewUri: (u: any) => u,
    };

    const html = provider.getHtmlForWebview(mockWebview as any);

    // Must restrict default-src to 'none'
    expect(html).toContain("default-src 'none'");
    // Must use nonce for scripts
    expect(html).toContain("script-src 'nonce-");
    // Must not allow unsafe-eval
    expect(html).not.toContain("'unsafe-eval'");
  });

  it('SEC-4: assertPathInSolutionsDir throws on path traversal attempts', () => {
    const store = new SolutionStore('/workspace/root');
    const validPath = path.join('/workspace/root', '.solvedock', 'solutions', 'my-sol.md');
    expect(() => store.assertPathInSolutionsDir(validPath)).not.toThrow();

    const escapePath1 = path.join('/workspace/root', '.solvedock', 'solutions', '..', '..', 'secret.txt');
    expect(() => store.assertPathInSolutionsDir(escapePath1)).toThrow(/outside knowledge directory/);

    const escapePath2 = '/etc/passwd';
    expect(() => store.assertPathInSolutionsDir(escapePath2)).toThrow(/outside knowledge directory/);
  });

  it('SEC-5: Webview message handler rejects malicious or unrecognized payloads', () => {
    const provider = new SolveDockViewProvider(vscode.Uri.file('/mock') as any);
    let messageListener: ((data: any) => void) | undefined;
    const mockWebview = {
      options: {},
      html: '',
      cspSource: 'vscode-webview:',
      postMessage: vi.fn(),
      onDidReceiveMessage: vi.fn((cb) => {
        messageListener = cb;
        return { dispose: vi.fn() };
      }),
    };

    provider.resolveWebviewView({ webview: mockWebview } as any, {} as any, {} as any);

    // 1. Completely invalid message object
    messageListener?.(null);
    messageListener?.('string-payload');
    messageListener?.({ command: 'maliciousCommand' });

    // 2. Traversal or invalid solutionId
    messageListener?.({ command: 'openSolution', solutionId: '../../etc/passwd' });
    messageListener?.({ command: 'editSolution', solutionId: '' });

    // Should not crash and should not execute unauthorized commands
    expect(vscode.commands.executeCommand).not.toHaveBeenCalledWith('maliciousCommand');
  });
});
