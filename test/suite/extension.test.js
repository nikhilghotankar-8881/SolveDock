const assert = require('assert');
const vscode = require('vscode');

async function runIntegrationTests() {
  console.log('[INTEGRATION] Step 1: Locating SolveDock extension in VS Code registry...');
  const extension = vscode.extensions.all.find(
    (ext) => ext.id.toLowerCase().includes('solvedock') || ext.packageJSON.name === 'solvedock'
  );

  assert.ok(extension, 'SolveDock extension must be present in vscode.extensions registry');
  console.log(`[INTEGRATION] Found extension: ${extension.id} (version: ${extension.packageJSON.version})`);

  console.log('[INTEGRATION] Step 2: Activating SolveDock extension...');
  if (!extension.isActive) {
    await extension.activate();
  }
  assert.strictEqual(extension.isActive, true, 'SolveDock extension must be active');
  console.log('[INTEGRATION] Extension activated successfully.');

  console.log('[INTEGRATION] Step 3: Verifying registered commands...');
  const commands = await vscode.commands.getCommands(true);

  const requiredCommands = [
    'solvedock.open',
    'solvedock.searchSolutions',
    'solvedock.createSolution',
    'solvedock.createSolutionFromTemplate',
    'solvedock.refreshKnowledge',
  ];

  for (const cmd of requiredCommands) {
    assert.ok(
      commands.includes(cmd),
      `Required command "${cmd}" must be registered in the VS Code command system`
    );
    console.log(`[INTEGRATION] Verified command: ${cmd}`);
  }

  console.log('[INTEGRATION] Step 4: Executing solvedock.refreshKnowledge...');
  await vscode.commands.executeCommand('solvedock.refreshKnowledge');
  console.log('[INTEGRATION] refreshKnowledge executed successfully.');

  console.log('[INTEGRATION] Step 5: Validating workspace state...');
  const workspaceFolders = vscode.workspace.workspaceFolders;
  console.log(
    `[INTEGRATION] Current workspaceFolders count: ${workspaceFolders ? workspaceFolders.length : 0}`
  );

  console.log('[INTEGRATION] Complete: All 5 integration test steps passed successfully.');
}

module.exports = { runIntegrationTests };
