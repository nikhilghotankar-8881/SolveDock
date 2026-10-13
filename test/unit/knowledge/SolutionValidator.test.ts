import { describe, it, expect } from 'vitest';
import { SolutionValidator } from '../../../src/knowledge/SolutionValidator';
import { Solution } from '../../../src/models/Solution';

describe('SolutionValidator', () => {
  it('validates a complete, well-formed solution', () => {
    const valid = SolutionValidator.validate({
      title: 'Valid PostgreSQL Fix',
      problem: 'Postgres connection error',
      resolution: 'Restart service with systemctl',
      status: 'verified',
    });

    expect(valid.valid).toBe(true);
    expect(valid.errors).toHaveLength(0);
  });

  it('rejects empty or excessively short titles', () => {
    const emptyTitle = SolutionValidator.validate({
      title: '  ',
      problem: 'Error occurred',
      resolution: 'Fixed it',
    });
    expect(emptyTitle.valid).toBe(false);
    expect(emptyTitle.errors.some((e) => e.includes('Title'))).toBe(true);

    const shortTitle = SolutionValidator.validate({
      title: 'ab',
      problem: 'Error occurred',
      resolution: 'Fixed it',
    });
    expect(shortTitle.valid).toBe(false);
  });

  it('rejects missing problem description or resolution', () => {
    const noProblem = SolutionValidator.validate({
      title: 'Valid Title Here',
      problem: '',
      resolution: 'Fixed it',
    });
    expect(noProblem.valid).toBe(false);

    const noResolution = SolutionValidator.validate({
      title: 'Valid Title Here',
      problem: 'Error details',
      resolution: '   ',
    });
    expect(noResolution.valid).toBe(false);
  });

  it('detects substantive changes on verified records', () => {
    const original: Solution = {
      id: 'sol-001',
      title: 'Original Title',
      technology: ['Docker'],
      tags: ['port'],
      problem: 'Original problem statement',
      rootCause: 'Original root cause',
      resolution: 'Original solution',
      status: 'verified',
    };

    // Minor non-substantive change (whitespace only)
    expect(
      SolutionValidator.isSubstantiveChange(original, {
        ...original,
        problem: '  Original problem statement  \n',
      })
    ).toBe(false);

    // Substantive change to resolution
    expect(
      SolutionValidator.isSubstantiveChange(original, {
        ...original,
        resolution: 'Different resolution entirely',
      })
    ).toBe(true);
  });
});
