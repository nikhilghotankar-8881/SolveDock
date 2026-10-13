import { vi } from 'vitest';

export const commands = {
  registerCommand: vi.fn(),
  executeCommand: vi.fn(),
};

export const window = {
  showInformationMessage: vi.fn(),
};
