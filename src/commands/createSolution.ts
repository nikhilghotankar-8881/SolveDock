import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SolutionStore } from '../knowledge/SolutionStore';
import { SearchService } from '../search/SearchService';
import { SolutionValidator } from '../knowledge/SolutionValidator';
import { Solution, SolutionStatus } from '../models/Solution';
import { WorkspaceManager } from '../knowledge/WorkspaceManager';

/**
 * Generates an initial Markdown template for detailed in-editor authoring.
 */
export function generateSolutionTemplate(id: string, title: string = 'New Technical Solution'): string {
  const today = new Date().toISOString().split('T')[0];
  return `---
id: ${id}
title: ${title}
createdAt: ${today}
technology:
  - 
tags:
  - 
status: draft
environment: 
verifiedAt: 
---

## Problem
<!-- Describe the problem or paste the exact error message and symptoms here -->


## Root Cause
<!-- Explain why this error occurs (e.g. missing dependency, port conflict, configuration) -->


## Solution
<!-- Provide step-by-step resolution instructions and code snippets -->


## Verification
<!-- Document how this solution was tested and verified in your environment -->
`;
}

function getTargetStores(managerOrStore: WorkspaceManager | SolutionStore): SolutionStore[] {
  if (managerOrStore && typeof (managerOrStore as any).getStores === 'function') {
    return (managerOrStore as WorkspaceManager).getStores();
  }
  return managerOrStore ? [managerOrStore as SolutionStore] : [];
}

export function registerCreateSolutionCommand(
  context: vscode.ExtensionContext,
  workspaceManager: WorkspaceManager | SolutionStore,
  searchService: SearchService,
  onSolutionCreated?: (solution: Solution) => void
): vscode.Disposable[] {
  // 1. Interactive Step-by-Step Quick Entry
  const quickEntryCmd = vscode.commands.registerCommand('solvedock.createSolution', async () => {
    const stores = getTargetStores(workspaceManager);
    if (stores.length === 0) {
      vscode.window.showInformationMessage('SolveDock: Open a project folder to create solutions.');
      return;
    }

    // Select target workspace folder if multi-root
    let targetStore = stores[0];
    if (stores.length > 1) {
      const picks = stores.map((s) => ({
        label: s.workspaceName || path.basename(s.workspaceRoot || ''),
        description: s.workspaceRoot,
        store: s,
      }));
      const selected = await vscode.window.showQuickPick(picks, {
        title: 'SolveDock: Select Workspace Folder',
        placeHolder: 'Select where to save this solution',
      });
      if (!selected) return;
      targetStore = selected.store;
    }

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
      workspaceName: targetStore.workspaceName,
    };

    // Validate using SolutionValidator
    const validation = SolutionValidator.validate(newSolution);
    if (!validation.valid) {
      vscode.window.showErrorMessage(`Validation failed: ${validation.errors.join(' ')}`);
      return;
    }

    try {
      const savedPath = await targetStore.saveSolution(newSolution);
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

  // 2. Comfortable Markdown Template in Editor (Phase 4 requirement)
  const templateCmd = vscode.commands.registerCommand('solvedock.createSolutionFromTemplate', async () => {
    const stores = getTargetStores(workspaceManager);
    if (stores.length === 0) {
      vscode.window.showInformationMessage('SolveDock: Open a project folder to create solutions.');
      return;
    }

    let targetStore = stores[0];
    if (stores.length > 1) {
      const picks = stores.map((s) => ({
        label: s.workspaceName || path.basename(s.workspaceRoot || ''),
        description: s.workspaceRoot,
        store: s,
      }));
      const selected = await vscode.window.showQuickPick(picks, {
        title: 'SolveDock: Select Workspace Folder',
        placeHolder: 'Select where to create the solution template',
      });
      if (!selected) return;
      targetStore = selected.store;
    }

    const titleInput = await vscode.window.showInputBox({
      title: 'SolveDock: New Solution Template',
      prompt: 'Enter solution title or filename slug',
      placeHolder: 'e.g. Docker Container Memory Limit',
    });
    if (!titleInput) return;

    const baseSlug = titleInput
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
    const id = `${baseSlug || 'solution'}-${Date.now().toString().slice(-4)}`;
    const filename = targetStore.sanitizeFilename(id);

    await targetStore.ensureDirectory();
    const filePath = path.join(targetStore.getSolutionsDir(), filename);

    if (fs.existsSync(filePath)) {
      vscode.window.showErrorMessage(`A solution file named "${filename}" already exists.`);
      return;
    }

    const templateContent = generateSolutionTemplate(id, titleInput.trim());
    await fs.promises.writeFile(filePath, templateContent, 'utf-8');

    const doc = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage(
      `SolveDock: Created template in ${filename}. Edit and save to index.`
    );
  });

  return [quickEntryCmd, templateCmd];
}
