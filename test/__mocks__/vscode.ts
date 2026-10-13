import { vi } from 'vitest';

export const commands = {
  registerCommand: vi.fn(),
  executeCommand: vi.fn(),
};

export const window = {
  showInformationMessage: vi.fn(),
  registerWebviewViewProvider: vi.fn().mockReturnValue({ dispose: vi.fn() }),
};

export const Uri = {
  file: (path: string) => ({ fsPath: path, path, scheme: 'file' }),
  parse: (uri: string) => ({ fsPath: uri, path: uri, scheme: 'file' }),
};
