import { describe, it, expect } from 'vitest';

/**
 * Phase 1 smoke test — verifies the module structure is in place.
 * Actual functionality tests come in later phases.
 */
describe('SolveDock Extension Foundation', () => {
  it('extension module exports activate and deactivate', async () => {
    // Dynamic import to avoid needing the vscode runtime in unit tests
    // We verify the module shape, not its runtime behavior
    const mod = await import('../../src/extension');
    expect(typeof mod.activate).toBe('function');
    expect(typeof mod.deactivate).toBe('function');
  });
});
