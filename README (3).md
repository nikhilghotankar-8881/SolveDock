# SolveDock

**Solve it once. Find it anytime.**

Search, save, and reuse technical solutions inside VS Code.

> **Status:** in development. This README describes the intended behavior of version 0.1.0. Before each release, check every statement against the built extension. Anything marked `TODO` is not decided or built yet.

## What SolveDock does

SolveDock gives you a searchable, organized collection of technical solutions directly in your editor. You can:

- Search previously documented problems and solutions
- Read the cause, resolution, and environment of each solution
- Open the original Markdown source file
- Save newly discovered solutions
- See whether a solution is draft, reviewed, verified, or outdated
- Share solutions with your team through Git

Version 0.1 works locally. It needs no AI key, no remote server, and no account.

## The problem it solves

Developers keep running into recurring errors, environment problems, dependency conflicts, and database issues. The solutions end up scattered across documentation, personal notes, repositories, and team chats, and people repeat investigations because earlier solutions are hard to find or don't say what caused the problem, in which environment, or how it was verified.

## Install

`TODO` — fill in once the extension is packaged and published.

- **From a VSIX file** (after Phase 9): open the Command Palette → `Extensions: Install from VSIX...` → choose the `.vsix` file.
- **From the Marketplace** (after Phase 10): `TODO — extension identifier and link`.

## How to search for solutions

1. Click the SolveDock icon in the Activity Bar, or run `SolveDock: Open` from the Command Palette.
2. Type your problem in the search field, for example `PostgreSQL connection refused`.
3. Select a result to see the full record: problem, root cause, resolution, environment, verification status, and source.
4. Use `[Open Solution]` to open the original Markdown file.

You can also run `SolveDock: Search Solutions` from the Command Palette. Search is tolerant of different wording, so `Postgres connection refused` and `PostgreSQL connection failure` can find the same record. If nothing relevant exists, SolveDock says so instead of showing unrelated results.

## How to create a solution

1. Click **+ Add Solution** in the sidebar, or run `SolveDock: Create Solution`.
2. Fill in the form: title, technology, tags, problem, root cause, resolution, environment, verification details, and status.
3. Save. SolveDock writes a Markdown file and the solution is searchable immediately.

A solution is never marked **verified** automatically. You document the verification yourself. SolveDock does not run tests or certify solutions. If you substantively edit a verified solution, SolveDock asks you to review its verification again.

If you add or change files outside SolveDock (for example after a `git pull`), run `SolveDock: Refresh Knowledge`.

## Where knowledge files are stored

In your project, in:

```
.solvedock/solutions/
```

Each solution is an ordinary Markdown file with YAML frontmatter. You can read and edit them without the extension. SolveDock does not store your solutions inside its own installed extension folder.

Example record:

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
...
```

## Sharing with your team through Git

The knowledge files are normal files, so your team shares them with your normal Git workflow:

```
git add .solvedock/solutions/
git commit -m "docs: add PostgreSQL troubleshooting solution"
git push
```

Teammates pull the changes and run `SolveDock: Refresh Knowledge`. SolveDock never commits or pushes anything on its own.

## What data SolveDock accesses

- It reads and writes only files in `.solvedock/solutions/`.
- It does not read your environment files, API keys, or unrelated project files.
- It does not send your workspace content to any remote service. Search and storage work without network access.
- It does not run suggested solutions or commands.
- Recent searches, if provided, are remembered locally only.

## Known limitations

- Verification status is whatever the author wrote. SolveDock does not independently check it.
- No AI-generated answers in version 0.1.
- No accounts, no cloud sync, and no company-wide knowledge backend.
- No integrations with Slack, Jira, or Confluence.
- Search works on your local records only. It finds what you or your team have saved.
- `TODO` — add real limitations found during testing.

## Reporting bugs

`TODO` — add the GitHub repository issues link once the repository exists.

## Changelog

See `CHANGELOG.md`.

## License

`TODO` — choose a license intentionally and add a `LICENSE` file before publication.
