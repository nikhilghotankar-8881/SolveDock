/**
 * Status of a technical solution record.
 */
export type SolutionStatus = 'draft' | 'reviewed' | 'verified' | 'outdated';

/**
 * Technical solution data model.
 */
export interface Solution {
  id: string;
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

/**
 * Raw YAML frontmatter structure.
 */
export interface SolutionFrontmatter {
  id: string;
  title: string;
  technology?: string[] | string;
  tags?: string[] | string;
  status?: SolutionStatus;
  environment?: string;
  verifiedAt?: string;
}
