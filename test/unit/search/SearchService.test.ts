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
    expect(searchService.documentCount).toBe(20);
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
    expect(searchService.documentCount).toBe(21);

    const found = searchService.search('Rust borrow mutable');
    expect(found.length).toBeGreaterThan(0);
    expect(found[0].solution.id).toBe('rust-borrow-001');

    searchService.removeSolution('rust-borrow-001');
    expect(searchService.documentCount).toBe(20);
    expect(searchService.search('Rust borrow mutable')).toHaveLength(0);
  });

  /**
   * Phase 7 Requirement:
   * 20 representative queries covering Python, JavaScript, TypeScript,
   * databases, Git, Docker, dependencies, and configuration.
   * Measurable target: At least 80% of representative queries must return
   * the expected record within the top 3 results.
   */
  describe('Phase 7: Realistic query benchmark (target: >= 80% in top 3 across 20 queries)', () => {
    const testCases: Array<{ query: string; expectedId: string; description: string }> = [
      {
        query: 'PostgreSQL connection refused 5432',
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
        query: 'ERR max number of clients reached Redis',
        expectedId: 'redis-maxclients-001',
        description: 'Redis client limit',
      },
      {
        query: 'ERESOLVE unable to resolve dependency tree npm install',
        expectedId: 'npm-peer-dep-001',
        description: 'NPM peer dependency conflict',
      },
      {
        query: 'No space left on device docker build',
        expectedId: 'docker-no-space-001',
        description: 'Docker build out of space',
      },
      {
        query: 'Cannot find name document or window tsconfig DOM',
        expectedId: 'typescript-cannot-find-name-001',
        description: 'TypeScript DOM types missing',
      },
      {
        query: 'SSLCertVerificationError certificate verify failed requests',
        expectedId: 'python-ssl-cert-001',
        description: 'Python requests SSL verification',
      },
      {
        query: 'MongoServerError Authentication failed authSource admin',
        expectedId: 'mongodb-auth-001',
        description: 'MongoDB authSource error',
      },
      {
        query: 'Can not resolve crypto webpack 5 polyfill',
        expectedId: 'webpack-crypto-001',
        description: 'Webpack 5 Node polyfills',
      },
      {
        query: 'Permission denied publickey git github',
        expectedId: 'git-permission-denied-001',
        description: 'SSH public key auth failure',
      },
      {
        query: 'Object is possibly null or undefined TS2531 strictNullChecks',
        expectedId: 'ts-strict-null-001',
        description: 'TypeScript strict null check',
      },
      {
        query: 'Redis connection timeout ECONNREFUSED 6379',
        expectedId: 'redis-conn-timeout-001',
        description: 'Redis server port connection timeout',
      },
      {
        query: 'Nginx 502 Bad Gateway upstream socket connection refused',
        expectedId: 'nginx-502-bad-gateway-001',
        description: 'Nginx upstream socket 502',
      },
      {
        query: 'pip install SSL CERTIFICATE_VERIFY_FAILED certificate verify failed',
        expectedId: 'pip-ssl-cert-verify-001',
        description: 'pip SSL certificate verify failed',
      },
    ];

    it('achieves >= 80% accuracy in top 3 results on 20 representative queries', () => {
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
      expect(testCases.length).toBe(20);
      expect(score).toBeGreaterThanOrEqual(80);
      expect(top3Hits).toBeGreaterThanOrEqual(16);
    });
  });
});
