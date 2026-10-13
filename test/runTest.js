const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index.js');
    console.log('Running VS Code extension integration tests via @vscode/test-electron...');
    await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    version: '1.141.0',
});
    console.log('VS Code integration tests finished successfully.');
  } catch (err) {
    console.error('Failed to run integration tests:', err);
    process.exit(1);
  }
}

main();
