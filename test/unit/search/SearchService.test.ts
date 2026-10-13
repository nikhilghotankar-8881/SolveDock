import { describe, it, expect, beforeEach } from 'vitest';
import { SearchService } from '../../../src/search/SearchService';
import { SAMPLE_SOLUTIONS } from '../../fixtures/sampleSolutions';
import { Solution } from '../../../src/models/Solution';

describe('SearchService', () => {
  let searchService: SearchService;

  beforeEach(() => {
    searchService = new SearchService();
    searchService.indexSolutions(SAMPLE_SOLUTIONS);
  });

  it('indexes all sample solutions', () => {
    expect(searchService.documentCount).toBe(16);
  });

  it('returns empty array when query is empty or whitespace', () => {
    expect(searchService.search('')).toEqual([]);
    expect(searchService.search('   ')).toEqual([]);
  });

  it('finds records when query matches problem description', () => {
    // "No such file or directory" is in problem description of postgres-conn-001
    const results = searchService.search('socket 5432 failed No such file');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].solution.id).toBe('postgres-conn-001');
  });

  it('ranks exact title matches higher', () => {
    const results = searchService.search('Python dotenv Module Not Found');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].solution.id).toBe('python-dotenv-001');
  });

  it('supports fuzzy search for varied wording or typos', () => {
    // Varied wording: Postgres instead of PostgreSQL, and connection failure
    const results = searchService.search('Postgres connection failure 5432');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].solution.id).toBe('postgres-conn-001');
  });

  it('returns empty array for totally unrelated queries without returning false positives', () => {
    const results = searchService.search('quantum supersonic astrophysics teleportation');
    expect(results.length).toBe(0);
  });

  it('dynamically updates index when solutions are added, updated, or removed', () => {
    const newSolution: Solution = {
      id: 'rust-borrow-001',
      title: 'cannot borrow as mutable more than once at a time',
      technology: ['Rust'],
      tags: ['borrow-checker', 'lifetimes'],
      problem: 'error[E0499]: cannot borrow `x` as mutable more than once at a time',
      rootCause: 'Violating Rust aliasing rules by holding two mutable references simultaneously.',
      resolution: 'Refactor code to limit scope of the first mutable borrow using blocks.',
      status: 'verified',
    };

    searchService.updateSolution(newSolution);
    expect(searchService.documentCount).toBe(17);

    const found = searchService.search('Rust borrow mutable');
    expect(found.length).toBeGreaterThan(0);
    expect(found[0].solution.id).toBe('rust-borrow-001');

    searchService.removeSolution('rust-borrow-001');
    expect(searchService.documentCount).toBe(16);
    expect(searchService.search('Rust borrow mutable')).toHaveLength(0);
  });

  /**
   * Phase 4 Requirement 6:
   * "Prepare 10 representative queries with known expected matches.
   * Internal target: the expected solution appears in the first three results for at least 8 of 10 queries."
   */
  describe('Phase 4: Realistic query benchmark (target: >= 8 of 10 in top 3)', () => {
    const testCases: Array<{ query: string; expectedId: string; description: string }> = [
      {
        query: 'PostgreSQL connection refused',
        expectedId: 'postgres-conn-001',
        description: 'Postgres connection error',
      },
      {
        query: 'No module named dotenv',
        expectedId: 'python-dotenv-001',
        description: 'Python dotenv missing',
      },
      {
        query: 'Cannot connect to docker daemon socket',
        expectedId: 'docker-daemon-001',
        description: 'Docker daemon permission',
      },
      {
        query: 'detached HEAD state',
        expectedId: 'git-detached-head-001',
        description: 'Git detached head',
      },
      {
        query: 'CORS policy blocked Access-Control-Allow-Origin',
        expectedId: 'js-cors-001',
        description: 'Browser CORS issue',
      },
      {
        query: 'JavaScript heap out of memory allocation failed',
        expectedId: 'node-heap-001',
        description: 'Node OOM heap memory',
      },
      {
        query: 'Text content does not match server-rendered HTML hydration',
        expectedId: 'react-hydration-001',
        description: 'Next.js React hydration failure',
      },
      {
        query: 'Automatic merge failed fix conflicts and then commit',
        expectedId: 'git-merge-conflict-001',
        description: 'Git merge conflict',
      },
      {
        query: 'No space left on device docker',
        expectedId: 'docker-no-space-001',
        description: 'Docker build out of space',
      },
      {
        query: 'Permission denied publickey git github',
        expectedId: 'git-permission-denied-001',
        description: 'SSH public key auth failure',
      },
    ];

    it('achieves >= 80% accuracy in top 3 results', () => {
      let top3Hits = 0;

      for (const tc of testCases) {
        const results = searchService.search(tc.query);
        const top3Ids = results.slice(0, 3).map((r) => r.solution.id);
        const hit = top3Ids.includes(tc.expectedId);

        if (hit) {
          top3Hits++;
        }
      }

      const score = (top3Hits / testCases.length) * 100;
      expect(score).toBeGreaterThanOrEqual(80);
      expect(top3Hits).toBeGreaterThanOrEqual(8);
    });
  });
});
