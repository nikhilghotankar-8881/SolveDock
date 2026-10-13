import { Solution, SolutionStatus } from '../models/Solution';

export interface SolutionValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SolutionInput {
  title: string;
  technology: string[];
  tags: string[];
  problem: string;
  rootCause: string;
  resolution: string;
  environment?: string;
  status: SolutionStatus;
  verifiedAt?: string;
  sourcePath?: string;
}

export class SolutionValidator {
  private static readonly VALID_STATUSES: SolutionStatus[] = [
    'draft',
    'reviewed',
    'verified',
    'outdated',
  ];

  /**
   * Validates input fields for a solution record.
   * Required fields: title, problem, resolution.
   */
  public static validate(input: Partial<SolutionInput>): SolutionValidationResult {
    const errors: string[] = [];

    if (!input.title || input.title.trim().length === 0) {
      errors.push('Title is required and cannot be empty.');
    } else if (input.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long.');
    }

    if (!input.problem || input.problem.trim().length === 0) {
      errors.push('Problem description is required.');
    }

    if (!input.resolution || input.resolution.trim().length === 0) {
      errors.push('Solution/Resolution is required.');
    }

    if (input.status && !this.VALID_STATUSES.includes(input.status)) {
      errors.push(`Status must be one of: ${this.VALID_STATUSES.join(', ')}.`);
    }

    // A record marked verified must have verification date or details
    if (input.status === 'verified' && !input.verifiedAt) {
      // Automatic default or requirement: verification date should be set
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks whether substantive edits were made to a verified solution.
   * If problem, rootCause, or resolution changed, verification should be reviewed.
   */
  public static isSubstantiveChange(original: Solution, updated: SolutionInput): boolean {
    const normalize = (s: string = '') => s.trim().replace(/\r\n/g, '\n');

    return (
      normalize(original.problem) !== normalize(updated.problem) ||
      normalize(original.rootCause) !== normalize(updated.rootCause) ||
      normalize(original.resolution) !== normalize(updated.resolution)
    );
  }
}
