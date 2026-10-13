import MiniSearch, { SearchResult as MiniSearchResult } from 'minisearch';
import { Solution } from '../models/Solution';

export interface SearchResultItem {
  solution: Solution;
  score: number;
  match: Record<string, string[]>;
}

export interface SearchOptions {
  fuzzy?: boolean | number;
  prefix?: boolean;
}

export class SearchService {
  private _miniSearch: MiniSearch<Solution>;
  private _solutionsById: Map<string, Solution> = new Map();

  constructor() {
    this._miniSearch = this.createMiniSearchInstance();
  }

  private createMiniSearchInstance(): MiniSearch<Solution> {
    return new MiniSearch<Solution>({
      idField: 'id',
      fields: ['title', 'problem', 'rootCause', 'resolution', 'technologyString', 'tagsString'],
      storeFields: ['id'],
      extractField: (document: any, fieldName: string) => {
        if (fieldName === 'technologyString') {
          return Array.isArray(document.technology) ? document.technology.join(' ') : '';
        }
        if (fieldName === 'tagsString') {
          return Array.isArray(document.tags) ? document.tags.join(' ') : '';
        }
        return document[fieldName] || '';
      },
      searchOptions: {
        boost: {
          title: 4.0,           // Exact title match: Very high
          technologyString: 3.0, // Technology match: High
          problem: 2.5,          // Problem description: High
          rootCause: 2.0,        // Root-cause: Medium to high
          resolution: 1.5,       // Solution-text: Medium
          tagsString: 1.2,       // Tag match: Medium
        },
        fuzzy: 0.2,             // Tolerant of typos / variations
        prefix: true,           // Prefix matching
      },
    });
  }

  /**
   * Clears and indexes a collection of solutions.
   */
  public indexSolutions(solutions: Solution[]): void {
    this._miniSearch.removeAll();
    this._solutionsById.clear();

    for (const sol of solutions) {
      this._solutionsById.set(sol.id, sol);
    }

    if (solutions.length > 0) {
      this._miniSearch.addAll(solutions);
    }
  }

  /**
   * Adds or updates a single solution in the search index.
   */
  public updateSolution(solution: Solution): void {
    if (this._solutionsById.has(solution.id)) {
      this._miniSearch.discard(solution.id);
    }
    this._solutionsById.set(solution.id, solution);
    this._miniSearch.add(solution);
  }

  /**
   * Removes a solution from the index by ID.
   */
  public removeSolution(id: string): void {
    if (this._solutionsById.has(id)) {
      this._miniSearch.discard(id);
      this._solutionsById.delete(id);
    }
  }

  /**
   * Searches indexed solutions.
   * Empty query returns an empty list.
   */
  public search(query: string, options?: SearchOptions): SearchResultItem[] {
    const trimmed = query.trim();
    if (!trimmed) {
      return [];
    }

    const searchOpts: any = {
      fuzzy: options?.fuzzy !== undefined ? options.fuzzy : 0.2,
      prefix: options?.prefix !== undefined ? options.prefix : true,
      combineWith: 'OR',
    };

    const rawResults: MiniSearchResult[] = this._miniSearch.search(trimmed, searchOpts);

    const results: SearchResultItem[] = [];
    for (const res of rawResults) {
      const solution = this._solutionsById.get(res.id);
      if (solution) {
        results.push({
          solution,
          score: res.score,
          match: res.match,
        });
      }
    }

    return results;
  }

  /**
   * Returns count of indexed documents.
   */
  public get documentCount(): number {
    return this._solutionsById.size;
  }
}
