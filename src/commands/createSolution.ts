import * as vscode from 'vscode';
import { SolutionStore } from '../knowledge/SolutionStore';
import { SearchService } from '../search/SearchService';
import { SolutionValidator, SolutionInput } from '../knowledge/SolutionValidator';
import { Solution, SolutionStatus } from '../models/Solution';

export function registerCreateSolutionCommand(
  context: vscode.ExtensionContext,
  solutionStore: SolutionStore,
  searchService: SearchService,
  onSolutionCreated?: (solution: Solution) => void
): vscode.Disposable {
  return vscode.commands.registerCommand('solvedock.createSolution', async () => {
    // 1. Prompt for Title
    const title = await vscode.window.showInputBox({
      title: 'SolveDock: Create New Solution (1/7)',
      prompt: 'Enter a clear title for the technical solution',
      placeHolder: 'e.g. PostgreSQL connection refused on port 5432',
      validateInput: (value) => {
        if (!value || value.trim().length < 3) {
          return 'Title must be at least 3 characters long.';
        }
        return null;
      },
    });
    if (title === undefined) return; // User cancelled

    // 2. Prompt for Technology
    const techInput = await vscode.window.showInputBox({
      title: 'SolveDock: Create New Solution (2/7)',
      prompt: 'Comma-separated technologies',
      placeHolder: 'e.g. PostgreSQL, Docker, Linux',
    });
    if (techInput === undefined) return;
    const technology = techInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // 3. Prompt for Tags
    const tagsInput = await vscode.window.showInputBox({
      title: 'SolveDock: Create New Solution (3/7)',
      prompt: 'Comma-separated tags or keywords',
      placeHolder: 'e.g. connection, socket, port-5432',
    });
    if (tagsInput === undefined) return;
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    // 4. Prompt for Problem Description
    const problem = await vscode.window.showInputBox({
      title: 'SolveDock: Create New Solution (4/7)',
      prompt: 'Describe the problem or paste the exact error message',
      placeHolder: 'e.g. psql: error: connection to server on socket failed...',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Problem description is required.';
        }
        return null;
      },
    });
    if (problem === undefined) return;

    // 5. Prompt for Root Cause (Optional)
    const rootCause = await vscode.window.showInputBox({
      title: 'SolveDock: Create New Solution (5/7)',
      prompt: 'What was the underlying root cause? (Optional)',
      placeHolder: 'e.g. PostgreSQL daemon was not started after reboot.',
    });
    if (rootCause === undefined) return;

    // 6. Prompt for Solution / Resolution
    const resolution = await vscode.window.showInputBox({
      title: 'SolveDock: Create New Solution (6/7)',
      prompt: 'How to resolve the problem step by step',
      placeHolder: 'e.g. Run sudo systemctl start postgresql and verify port...',
      validateInput: (value) => {
        if (!value || value.trim().length === 0) {
          return 'Resolution is required.';
        }
        return null;
      },
    });
    if (resolution === undefined) return;

    // 7. Choose Initial Status
    const statusPick = await vscode.window.showQuickPick(
      [
        { label: 'draft', description: 'Incomplete or work in progress' },
        { label: 'reviewed', description: 'Reviewed by developer' },
        { label: 'verified', description: 'Explicitly verified in tested environment' },
      ],
      {
        title: 'SolveDock: Create New Solution (7/7)',
        placeHolder: 'Select initial verification status (default: draft)',
      }
    );
    if (statusPick === undefined) return;
    const status = (statusPick.label as SolutionStatus) || 'draft';

    // Environment info
    const environment = await vscode.window.showInputBox({
      title: 'SolveDock: Environment Details (Optional)',
      prompt: 'Specify the tested environment (OS, runtime, versions)',
      placeHolder: 'e.g. Windows 11, Node 20.x, PostgreSQL 15',
    });
    if (environment === undefined) return;

    // Generate safe deterministic ID
    const baseSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    const id = `${baseSlug || 'solution'}-${Date.now().toString().slice(-4)}`;

    const newSolution: Solution = {
      id,
      title: title.trim(),
      technology,
      tags,
      problem: problem.trim(),
      rootCause: (rootCause || '').trim(),
      resolution: resolution.trim(),
      environment: environment ? environment.trim() : undefined,
      status,
      verifiedAt: status === 'verified' ? new Date().toISOString().split('T')[0] : undefined,
    };

    // Validate using SolutionValidator
    const validation = SolutionValidator.validate(newSolution);
    if (!validation.valid) {
      vscode.window.showErrorMessage(`Validation failed: ${validation.errors.join(' ')}`);
      return;
    }

    try {
      const savedPath = await solutionStore.saveSolution(newSolution);
      newSolution.sourcePath = savedPath;
      searchService.updateSolution(newSolution);

      if (onSolutionCreated) {
        onSolutionCreated(newSolution);
      }

      const openAction = 'Open File';
      const msg = await vscode.window.showInformationMessage(
        `SolveDock: Solution "${newSolution.title}" saved successfully!`,
        openAction
      );

      if (msg === openAction) {
        const doc = await vscode.workspace.openTextDocument(savedPath);
        await vscode.window.showTextDocument(doc);
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`Failed to save solution: ${err.message || String(err)}`);
    }
  });
}
