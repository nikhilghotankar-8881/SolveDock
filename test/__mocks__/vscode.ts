import { vi } from 'vitest';

export const commands = {
  registerCommand: vi.fn(),
  executeCommand: vi.fn(),
};

export const window = {
  showInformationMessage: vi.fn(),
  showWarningMessage: vi.fn(),
  showErrorMessage: vi.fn(),
  showInputBox: vi.fn(),
  showQuickPick: vi.fn(),
  showTextDocument: vi.fn(),
  registerWebviewViewProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
};

export const workspace = {
  workspaceFolders: [
    {
      uri: { fsPath: '/test/workspace' },
      name: 'test-workspace',
      index: 0,
    },
  ],
  onDidChangeWorkspaceFolders: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  openTextDocument: vi.fn(),
  createFileSystemWatcher: vi.fn().mockReturnValue({
    onDidChange: vi.fn(),
    onDidCreate: vi.fn(),
    onDidDelete: vi.fn(),
    dispose: vi.fn(),
  }),
  fs: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
};

export class RelativePattern {
  constructor(public base: any, public pattern: string) {}
}

export const Uri = {
  file: (path: string) => ({ fsPath: path, path, scheme: 'file' }),
  parse: (uri: string) => ({ fsPath: uri, path: uri, scheme: 'file' }),
};
