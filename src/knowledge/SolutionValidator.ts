import { Solution, SolutionStatus, VALID_SOLUTION_STATUSES } from '../models/Solution';

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
  workspaceName?: string;
}

export class SolutionValidator {
  /**
   * Validates input fields for a solution record.
   * Required fields: title, problem, resolution.
   * Performs deep type and element validation on all arrays and fields.
   */
  public static validate(input: Partial<SolutionInput>): SolutionValidationResult {
    const errors: string[] = [];

    // Title validation
    if (!input.title || typeof input.title !== 'string' || input.title.trim().length === 0) {
      errors.push('Title is required and cannot be empty.');
    } else if (input.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long.');
    } else if (input.title.trim().length > 200) {
      errors.push('Title cannot exceed 200 characters.');
    }

    // Problem validation
    if (!input.problem || typeof input.problem !== 'string' || input.problem.trim().length === 0) {
      errors.push('Problem description is required.');
    }

    // Resolution validation
    if (!input.resolution || typeof input.resolution !== 'string' || input.resolution.trim().length === 0) {
      errors.push('Solution/Resolution is required.');
    }

    // Status validation
    if (input.status) {
      if (!VALID_SOLUTION_STATUSES.includes(input.status)) {
        errors.push(`Status must be one of: ${VALID_SOLUTION_STATUSES.join(', ')}.`);
      }
    }

    // Technology deep array validation
    if (input.technology !== undefined) {
      if (!Array.isArray(input.technology)) {
        errors.push('Technology must be an array of strings.');
      } else {
        for (let i = 0; i < input.technology.length; i++) {
          const item = input.technology[i];
          if (typeof item !== 'string' || item.trim().length === 0) {
            errors.push(`Technology item at index ${i} must be a non-empty string.`);
          }
        }
      }
    }

    // Tags deep array validation
    if (input.tags !== undefined) {
      if (!Array.isArray(input.tags)) {
        errors.push('Tags must be an array of strings.');
      } else {
        for (let i = 0; i < input.tags.length; i++) {
          const item = input.tags[i];
          if (typeof item !== 'string' || item.trim().length === 0) {
            errors.push(`Tag item at index ${i} must be a non-empty string.`);
          }
        }
      }
    }

    // Verified date validation
    if (input.verifiedAt !== undefined && input.verifiedAt !== '') {
      if (typeof input.verifiedAt !== 'string' || isNaN(Date.parse(input.verifiedAt))) {
        errors.push('verifiedAt must be a valid date string (e.g. YYYY-MM-DD).');
      }
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
  public static isSubstantiveChange(original: Solution, updated: Partial<SolutionInput>): boolean {
    const normalize = (s: string = '') => s.trim().replace(/\r\n/g, '\n');

    const probChanged = updated.problem !== undefined && normalize(original.problem) !== normalize(updated.problem);
    const causeChanged = updated.rootCause !== undefined && normalize(original.rootCause) !== normalize(updated.rootCause);
    const resChanged = updated.resolution !== undefined && normalize(original.resolution) !== normalize(updated.resolution);

    return probChanged || causeChanged || resChanged;
  }
}
