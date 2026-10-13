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
  openTextDocument: vi.fn(),
};

export const Uri = {
  file: (path: string) => ({ fsPath: path, path, scheme: 'file' }),
  parse: (uri: string) => ({ fsPath: uri, path: uri, scheme: 'file' }),
};
