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
    };
    mockSearch = {
      updateSolution: vi.fn(),
    };
    mockContext = { subscriptions: [] };
  });

  it('registers solvedock.createSolution command', () => {
    registerCreateSolutionCommand(mockContext, mockStore, mockSearch);
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'solvedock.createSolution',
      expect.any(Function)
    );
  });

  it('runs complete create workflow when user provides valid input', async () => {
    let handler: Function | undefined;
    vi.mocked(vscode.commands.registerCommand).mockImplementation((_name, fn) => {
      handler = fn;
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

    await handler!();

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
    let handler: Function | undefined;
    vi.mocked(vscode.commands.registerCommand).mockImplementation((_name, fn) => {
      handler = fn;
      return { dispose: vi.fn() };
    });

    registerCreateSolutionCommand(mockContext, mockStore, mockSearch);

    // User cancels title input
    vi.mocked(vscode.window.showInputBox).mockResolvedValueOnce(undefined as any);

    await handler!();

    expect(mockStore.saveSolution).not.toHaveBeenCalled();
    expect(mockSearch.updateSolution).not.toHaveBeenCalled();
  });
});
