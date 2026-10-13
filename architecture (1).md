# SolveDock — Architecture

> Place this file at `docs/architecture.md` in the repository.
> Source: SolveDock — Complete Workflow & Phase-Wise Implementation Plan. The structure below is the plan's target and **may change** as implementation develops. Keep this file in sync with the real code (Phase 8).

## Principles

- Separate commands, knowledge management, search, UI, and data models.
- Keep file operations separate from the interface and the search engine so each can be tested.
- Prefer native VS Code views. Use a Webview View only if a richer interface gives a meaningful benefit.
- Everything works locally. No AI, no external API, no backend, no database in v0.1.
- User knowledge lives in the user's project, never in the extension's installed folder.

## Repository structure (target)

```
solvedock/
├── .github/
│   └── workflows/
├── .vscode/
├── src/
│   ├── commands/
│   │   ├── searchKnowledge.ts
│   │   └── createSolution.ts
│   ├── knowledge/
│   │   └── SolutionStore.ts
│   ├── search/
│   │   └── SearchService.ts
│   ├── views/
│   │   └── SolveDockViewProvider.ts
│   ├── models/
│   │   └── Solution.ts
│   └── extension.ts
├── test/
│   ├── unit/
│   └── integration/
├── media/
│   └── icon.png
├── docs/
│   └── architecture.md
├── package.json
├── tsconfig.json
├── README.md
├── CHANGELOG.md
├── LICENSE
└── .gitignore
```

In Phase 1, keep only what the generator produces (`.vscode/`, `src/extension.ts`, `test/`, `package.json`, `tsconfig.json`, `README.md`). Add the other modules in the phase that needs them.

## Modules

| Module | Responsibility | Phase |
|---|---|---|
| `extension.ts` | Extension activation; registers commands and the view | 1–2 |
| `views/SolveDockViewProvider.ts` | Sidebar interface: search field, results, recent/saved solutions, Add Solution | 2 |
| `commands/searchKnowledge.ts` | `SolveDock: Search Solutions` | 2, 4 |
| `commands/createSolution.ts` | `SolveDock: Create Solution` | 2, 5 |
| `models/Solution.ts` | The `Solution` data model | 3 |
| `knowledge/SolutionStore.ts` | All file operations on solution records | 3 |
| `search/SearchService.ts` | Index and search with MiniSearch; ranking; fuzzy matching | 4 |

### SolutionStore responsibilities

- Create the knowledge directory when appropriate
- Read solution files
- Parse Markdown and metadata (gray-matter)
- Save a new solution
- Update an existing record
- Handle invalid or incomplete files (understandable errors, no crash)
- Avoid duplicate identifiers
- Generate safe filenames; never accept arbitrary filesystem paths from user input

### SearchService responsibilities

- Index records and search across title, problem, root cause, resolution, technology, and tags
- Rank results (see ranking rules below)
- Fuzzy matching for varied wording
- Update a record's index entry when it changes; rebuild the index on `SolveDock: Refresh Knowledge`
- Return nothing when nothing is relevant

## Commands (Command Palette)

- `SolveDock: Open`
- `SolveDock: Search Solutions`
- `SolveDock: Create Solution`
- `SolveDock: Refresh Knowledge`

## Sidebar layout (intended)

```
SOLVEDOCK
Developer Knowledge

[ Search technical solutions... ]

SEARCH RESULTS

RECENT SOLUTIONS

SAVED SOLUTIONS

[ + Add Solution ]
```

Empty state text:

> No solutions found yet.
>
> Create your first solution to start building your technical knowledge library.

The UI follows the current VS Code theme.

## Knowledge storage

Location, inside the user's project:

```
your-project/
└── .solvedock/
    └── solutions/
        ├── python-environment.md
        ├── postgres-connection.md
        └── docker-networking.md
```

The actual directory is `.solvedock/solutions/`. Records are ordinary Markdown files, readable without the extension and trackable by Git.

### Record format

Markdown with YAML frontmatter. Illustrative example (not a universal troubleshooting result):

```markdown
---
id: python-dotenv-001
title: Python dotenv Module Not Found
technology:
  - Python
tags:
  - imports
  - dependencies
status: verified
environment: Windows, Python virtual environment
verifiedAt: 2026-10-13
---

## Problem

The Python application cannot import dotenv.

## Root Cause

The required dependency was missing from
the Python environment used to run the application.

## Solution

Check the active interpreter and confirm that
python-dotenv is installed in that environment.

## Verification

The import was tested successfully in the
documented environment.

## Limitations

This record describes the documented
environment and may not cover every setup.
```

### Data model (`Solution`)

| Field | Notes |
|---|---|
| `id` | Unique; duplicates must be prevented |
| `title` | Required; must not be empty |
| `technology` | List |
| `tags` | List |
| `problem` | Body section "Problem" |
| `rootCause` | Body section "Root Cause" |
| `resolution` | Body section "Solution" |
| `environment` | Frontmatter |
| `status` | `draft`, `reviewed`, `verified`, or `outdated` |
| `verifiedAt` | Date, frontmatter |
| `sourcePath` | Path of the Markdown file the record was read from |

More fields can be added when required.

### Status rules

| Status | Meaning |
|---|---|
| Draft | Incomplete or still being documented |
| Reviewed | Someone has reviewed the record |
| Verified | Explicit verification claim with supporting details |
| Outdated | May no longer apply; needs review |

- Saving never sets a record to verified automatically.
- Verification is documented by the user; the extension does not run tests or certify anything.
- Substantively editing a verified solution requires its verification to be reviewed again.

## Search

Starting ranking rules (adjust with realistic queries):

| Match | Importance |
|---|---|
| Exact title match | Very high |
| Exact technical error match | High |
| Technology match | High |
| Problem-description match | High |
| Root-cause match | Medium to high |
| Solution-text match | Medium |
| Tag match | Medium |

Result display: title, technology, status (read from the stored record), problem summary, source filename, `[Open Solution]`.

No-result message: `No relevant solutions found. Try a different search or record a new solution.` Never show unrelated results to fill the list.

Development target (not a real-world accuracy claim): with ~15–20 sample records and 10 representative queries, the expected record appears in the top three for at least 8 of 10 queries.

## Data flows

**Create:** form input → validate → generate id and safe filename → write Markdown file in `.solvedock/solutions/` → refresh search index → success message → record is immediately searchable.

**Edit:** open saved record → edit → save → refresh that record's index entry. If a verified record changed substantively, require verification review.

**Refresh:** `SolveDock: Refresh Knowledge` reloads all files from the knowledge directory (for example after a `git pull`).

**Share:** the user runs the normal Git commands on `.solvedock/solutions/`. SolveDock never commits or pushes by itself.

## Security rules (v0.1)

- No unnecessary network access; workspace content never sent to a remote service
- Does not read environment files, API keys, or unrelated project files
- Does not execute suggested solutions or commands
- Reads and writes limited to the knowledge directory; filenames validated
- Webview (if used): Markdown and workspace data treated as untrusted; HTML escaping, restrictive Content Security Policy, limited resource access
- Malformed records are handled without crashing the extension

## Testing layers

| Layer | Tool | Location | Covers |
|---|---|---|---|
| Unit | Vitest | `test/unit/` | Parsing, `SolutionStore`, search behavior |
| Integration | @vscode/test-electron | `test/integration/` | Behavior inside VS Code |
| Quality | ESLint, Prettier | — | Consistent code |

## Not in version 0.1

AI answers, external APIs, user accounts, cloud sync, a company knowledge backend, Slack/Jira/Confluence integrations, automatic command execution, and continuous monitoring of code or terminal output. Later possibilities (FastAPI, PostgreSQL, pgvector, authentication, teams) are described in `PRD.md` and `phases.md` (Phase 11).
