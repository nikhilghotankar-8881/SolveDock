function run() {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('SolveDock Integration Test Suite: Initializing in VS Code Extension Host');
      const { runIntegrationTests } = require('./extension.test.js');
      await runIntegrationTests();
      console.log('SolveDock Integration Test Suite: All integration assertions passed.');
      resolve();
    } catch (err) {
      console.error('SolveDock Integration Test Suite Error:', err);
      reject(err);
    }
  });
}

module.exports = { run };
