import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { registerCreateSolutionCommand } from '../../../src/commands/createSolution';
import { SolutionStore } from '../../../src/knowledge/SolutionStore';
import { SearchService } from '../../../src/search/SearchService';

describe('createSolution Command', () => {
  let mockStore: any;
  let mockSearch: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStore = {
      saveSolution: vi.fn().mockResolvedValue('/mock/workspace/.solvedock/solutions/test-sol.md'),
      sanitizeFilename: vi.fn((id: string) => `${id}.md`),
      ensureDirectory: vi.fn().mockResolvedValue(undefined),
      solutionsDir: '/mock/workspace/.solvedock/solutions',
    };
    mockSearch = {
      updateSolution: vi.fn(),
    };
    mockContext = { subscriptions: [] };
  });

  it('registers solvedock.createSolution and template commands', () => {
    registerCreateSolutionCommand(mockContext, mockStore, mockSearch);
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'solvedock.createSolution',
      expect.any(Function)
    );
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'solvedock.createSolutionFromTemplate',
      expect.any(Function)
    );
  });

  it('runs complete create workflow when user provides valid input', async () => {
    const handlers: Record<string, Function> = {};
    vi.mocked(vscode.commands.registerCommand).mockImplementation((name, fn) => {
      handlers[name] = fn;
      return { dispose: vi.fn() };
    });

    const onCreated = vi.fn();
    registerCreateSolutionCommand(mockContext, mockStore, mockSearch, onCreated);

    // Mock sequential showInputBox responses
    vi.mocked(vscode.window.showInputBox)
      .mockResolvedValueOnce('Fix Docker Container Port') // title
      .mockResolvedValueOnce('Docker, Linux')             // technology
      .mockResolvedValueOnce('networking, ports')         // tags
      .mockResolvedValueOnce('Cannot bind port 8080')      // problem
      .mockResolvedValueOnce('Port in use by another app') // rootCause
      .mockResolvedValueOnce('Kill previous process on port') // resolution
      .mockResolvedValueOnce('Ubuntu 22.04');             // environment

    // Mock showQuickPick for status
    vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce({
      label: 'verified',
    } as any);

    vi.mocked(vscode.window.showInformationMessage).mockResolvedValueOnce('Open File' as any);
    vi.mocked(vscode.workspace.openTextDocument).mockResolvedValueOnce({} as any);

    await handlers['solvedock.createSolution']();

    expect(mockStore.saveSolution).toHaveBeenCalled();
    expect(mockSearch.updateSolution).toHaveBeenCalled();
    expect(onCreated).toHaveBeenCalled();
    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      expect.stringContaining('Fix Docker Container Port'),
      'Open File'
    );
    expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(
      '/mock/workspace/.solvedock/solutions/test-sol.md'
    );
  });

  it('aborts gracefully if user cancels any step', async () => {
    const handlers: Record<string, Function> = {};
    vi.mocked(vscode.commands.registerCommand).mockImplementation((name, fn) => {
      handlers[name] = fn;
      return { dispose: vi.fn() };
    });

    registerCreateSolutionCommand(mockContext, mockStore, mockSearch);

    // User cancels title input
    vi.mocked(vscode.window.showInputBox).mockResolvedValueOnce(undefined as any);

    await handlers['solvedock.createSolution']();

    expect(mockStore.saveSolution).not.toHaveBeenCalled();
    expect(mockSearch.updateSolution).not.toHaveBeenCalled();
  });
});
