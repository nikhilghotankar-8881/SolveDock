# Changelog

All user-visible changes to SolveDock are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-13

### Added
- **Activity Bar & Sidebar UI:** Dedicated SolveDock container with custom anchor icon and interactive sidebar (`SolveDockViewProvider`).
- **Local Knowledge Engine:** Structured file persistence in `.solvedock/solutions/` supporting YAML frontmatter and standard markdown sections (`## Problem`, `## Root Cause`, `## Solution`).
- **Full-Text & Fuzzy Search:** Integrated MiniSearch service with tailored ranking weights across titles, error messages, technologies, and tags.
- **Interactive Solution Creation:** Command `SolveDock: Create Solution` with guided validation prompts, safe deterministic filename generation, and duplicate ID prevention.
- **Sidebar Usability Polish:**
  - Clear search query button and `Esc` key shortcut.
  - Recent search query chips (persisted locally, max 5).
  - Favorites bookmarking (`★` toggle) persisted across editor sessions.
  - Technology and Status dropdown filters.
  - Inline solution preview cards with `[Open]` and `[Edit]` actions.
- **Commands Registered in Command Palette:**
  - `SolveDock: Open`
  - `SolveDock: Search Solutions`
  - `SolveDock: Create Solution`
  - `SolveDock: Refresh Knowledge`
- **Security & Integrity:** Strict Content Security Policy, zero external network access, directory sandboxing, and malformed markdown resilience.
