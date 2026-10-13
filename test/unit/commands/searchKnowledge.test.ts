import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { registerSearchKnowledgeCommand } from '../../../src/commands/searchKnowledge';
import { SearchService } from '../../../src/search/SearchService';
import { SAMPLE_SOLUTIONS } from '../../fixtures/sampleSolutions';

describe('searchKnowledge Command', () => {
  let searchService: SearchService;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    searchService = new SearchService();
    searchService.indexSolutions(SAMPLE_SOLUTIONS);
    mockContext = { subscriptions: [] };
  });

  it('registers the solvedock.searchSolutions command', () => {
    registerSearchKnowledgeCommand(mockContext, searchService);
    expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
      'solvedock.searchSolutions',
      expect.any(Function)
    );
  });

  it('prompts user with inputBox and shows quickPick results when matches exist', async () => {
    let commandHandler: Function | undefined;
    vi.mocked(vscode.commands.registerCommand).mockImplementation((_name, handler) => {
      commandHandler = handler;
      return { dispose: vi.fn() };
    });

    registerSearchKnowledgeCommand(mockContext, searchService);
    expect(commandHandler).toBeDefined();

    // User types query
    vi.mocked(vscode.window.showInputBox).mockResolvedValue('PostgreSQL connection refused' as any);
    vi.mocked(vscode.window.showQuickPick).mockResolvedValue({
      label: 'PostgreSQL connection refused on localhost port 5432',
      filePath: '/mock/path/postgres-conn-001.md',
    } as any);
    vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue({} as any);

    await commandHandler!();

    expect(vscode.commands.executeCommand).toHaveBeenCalledWith('workbench.view.extension.solvedock');
    expect(vscode.window.showQuickPick).toHaveBeenCalled();
    expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith('/mock/path/postgres-conn-001.md');
    expect(vscode.window.showTextDocument).toHaveBeenCalled();
  });

  it('displays standard no-result message when nothing relevant is found', async () => {
    let commandHandler: Function | undefined;
    vi.mocked(vscode.commands.registerCommand).mockImplementation((_name, handler) => {
      commandHandler = handler;
      return { dispose: vi.fn() };
    });

    registerSearchKnowledgeCommand(mockContext, searchService);

    vi.mocked(vscode.window.showInputBox).mockResolvedValue('quantum teleportation warp speed' as any);

    await commandHandler!();

    expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
      'No relevant solutions found. Try a different search or record a new solution.'
    );
  });
});
