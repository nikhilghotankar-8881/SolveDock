"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
/**
 * Phase 1 smoke test — verifies the module structure is in place.
 * Actual functionality tests come in later phases.
 */
(0, vitest_1.describe)('SolveDock Extension Foundation', () => {
    (0, vitest_1.it)('extension module exports activate and deactivate', async () => {
        // Dynamic import to avoid needing the vscode runtime in unit tests
        // We verify the module shape, not its runtime behavior
        const mod = await import('../../src/extension');
        (0, vitest_1.expect)(typeof mod.activate).toBe('function');
        (0, vitest_1.expect)(typeof mod.deactivate).toBe('function');
    });
});
//# sourceMappingURL=extension.test.js.map