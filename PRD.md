# SolveDock — Product Requirements Document (PRD)

**Phase 0 deliverable.** Scope, features, architecture, and acceptance criteria for version 0.1.
Source: SolveDock — Complete Workflow & Phase-Wise Implementation Plan.

---

## 1. Product definition

| Item | Value |
|---|---|
| Product name | SolveDock |
| Tagline | Solve it once. Find it anytime. |
| Category | Developer Productivity |
| Platform | VS Code Extension |
| Primary users | Engineering students, individual developers, and software development teams |

## 2. Problem statement

Developers frequently run into recurring programming errors, environment configuration problems, dependency conflicts, database issues, and other technical challenges.

Solutions are scattered across documentation, personal notes, repositories, and team conversations. Developers waste time repeating investigations because earlier solutions are hard to find or lack information about their causes, environments, and verification.

## 3. Proposed solution

SolveDock gives developers a searchable, organized collection of technical solutions directly inside the coding environment. It lets developers:

- Search previously documented technical problems and solutions
- Read the cause, resolution, and relevant environment information
- Open the original documentation
- Save newly discovered solutions
- Distinguish between unreviewed and verified solutions
- Share approved solutions through Git-managed project files

The initial version works locally, with no AI API, no remote server, and no account.

## 4. MVP scope (version 0.1 — must have)

1. A SolveDock icon in the VS Code Activity Bar
2. A working sidebar
3. A search field
4. Search results from local knowledge files
5. A way to inspect complete solution records
6. An option to create new solutions
7. An option to edit existing solutions
8. Verification status and environment information
9. A way to open the original Markdown source
10. Persistence across editor restarts

## 5. Explicitly excluded from version 0.1

- AI-generated answers
- An external API
- User accounts
- Cloud synchronization
- A company-wide knowledge backend
- Slack, Jira, or Confluence integrations
- Automatic command execution
- Continuous monitoring of source code or terminal output

These can be considered later.

## 6. Acceptance criteria

The MVP is complete only when:

- [ ] The extension activates successfully
- [ ] The sidebar opens correctly
- [ ] Search returns relevant saved solutions
- [ ] Selecting a result displays the complete record
- [ ] Creating a solution writes a valid Markdown file
- [ ] Editing a solution preserves its metadata
- [ ] Saved records remain available after restarting VS Code
- [ ] An invalid record does not crash the entire extension
- [ ] The extension works without an external service or AI key
- [ ] The extension can be packaged and installed in a clean VS Code environment

## 7. Technology stack (fixed — do not change without a clear reason)

| Component | Technology | Purpose |
|---|---|---|
| Extension development | TypeScript | Main programming language |
| Extension framework | VS Code Extension API | Integrates SolveDock into the editor |
| Runtime | Node.js | Executes the extension code |
| UI | VS Code native views and commands | Initial extension interface |
| Rich UI, if required | Webview View | More advanced sidebar interfaces |
| Knowledge storage | Markdown files | Stores technical solutions |
| Solution metadata | YAML frontmatter | Titles, tags, status, and other fields |
| Metadata parser | gray-matter | Reads structured Markdown records |
| Search engine | MiniSearch | Local full-text and fuzzy search |
| Unit testing | Vitest | Tests search, parsing, and knowledge logic |
| Extension testing | @vscode/test-electron | Tests behavior inside VS Code |
| Code quality | ESLint and Prettier | Consistent code quality |
| Version control | Git and GitHub | Tracks changes and supports collaboration |
| Packaging | @vscode/vsce | Packages the extension for distribution |

Native interfaces are preferred. The Webview is used only if a richer interface gives a meaningful benefit, because it needs extra care around security and resource usage.

**Why no AI, FastAPI, or PostgreSQL yet:** the first goal is a useful VS Code extension, not a large distributed application. Searching, saving, editing, and sharing knowledge all work through local Markdown files. That keeps version 0.1 simpler, reduces deployment requirements, and lets the real problem be validated before investing in more infrastructure.

## 8. Architecture summary

- Solutions are Markdown files with YAML frontmatter, stored in `.solvedock/solutions/` inside the user's project.
- User knowledge is never stored inside the installed extension folder.
- `SolutionStore` handles file reading, parsing, saving, and updating.
- `SearchService` handles indexing and searching with MiniSearch.
- `SolveDockViewProvider` handles the sidebar.
- Commands are registered in the Command Palette.
- File operations, search, and UI are kept separate so each can be tested.

Full detail: `architecture.md`.

## 9. Status rules

| Status | Meaning |
|---|---|
| Draft | The solution is incomplete or still being documented |
| Reviewed | Someone has reviewed the record |
| Verified | The record includes an explicit verification claim and supporting details |
| Outdated | The information may no longer apply and needs review |

- A record does not become verified automatically when saved.
- In v0.1 verification is documented by the user. The extension does not run tests or certify solutions.
- A previously verified solution that is substantively edited must have its verification reviewed again.

## 10. Security and privacy rules (v0.1)

- No unnecessary network access; no workspace content sent to a remote service
- No automatic reading of environment files, API keys, or unrelated project files
- No automatic execution of suggested solutions or commands
- Reads and writes restricted to the knowledge directory; generated filenames validated
- Webview content (if used) treated as untrusted: HTML escaping, restrictive Content Security Policy, limited resource access
- No automatic Git commit or push; only on explicit user action
- No telemetry introduced just to implement features such as recent searches

## 11. Planned releases (milestones, not delivery dates)

| Release | Intended scope |
|---|---|
| 0.1.0 | Initial local search and solution management |
| 0.2.0 | Improved search, filters, and usability |
| 0.3.0 | Optional AI-assisted knowledge search |
| 0.4.0 | First selected knowledge-source integration |
| 1.0.0 | A mature release after sufficient testing and feedback |

## 12. Open items in the source plan (decide before they bite)

These are inconsistencies in the plan text itself. Resolve them when you reach the phase mentioned.

1. **Scope vs. later phases.** The MVP list in section 4 does not include filters, favorites, or recent searches, but Phase 5 builds filters and Phase 6 builds favorites and recent searches. Decide whether they are in 0.1 or not.
2. **Duplicate features.** Favorites and recent searches appear in Phase 6 (before 0.1.0) and again under version 0.2 in Phase 11. Pick one place.
3. **Clean-install testing order.** Phase 7 requires a clean install of the packaged extension, but packaging is Phase 9. Build a trial VSIX in Phase 7 or defer the clean-install check to Phase 9.
4. **Interface sections.** Phase 2 shows "RECENT SOLUTIONS" and "SAVED SOLUTIONS" sections, but the plan never defines what "recent" means (recently opened? recently created?). Define it in Phase 2.
5. **Required fields.** Phase 5 says required fields are "a title and enough information to identify the problem and its solution" without naming them. Fix the exact list in Phase 5.

## 13. Final completion checklist (ready for initial public release)

| Requirement | Target | Done |
|---|---|---|
| Product identity | SolveDock name and description finalized | [x] |
| Extension foundation | TypeScript project builds and activates | [x] |
| Interface | Sidebar and commands work | [x] |
| Knowledge format | Markdown records parse correctly | [x] |
| Search | Relevant solutions are retrieved | [x] |
| Source navigation | Users can open original records | [x] |
| Solution management | Create and edit workflows work | [x] |
| Persistence | Solutions survive editor restarts | [x] |
| Git compatibility | Knowledge files can be shared through a repository | [x] |
| Testing | Core unit and integration tests pass | [x] |
| Error handling | Invalid or inaccessible files are handled gracefully | [x] |
| Privacy | MVP works without transmitting knowledge to a remote service | [x] |
| Security | File access and UI input are handled safely | [x] |
| Documentation | README, CHANGELOG, and LICENSE are ready | [x] |
| Packaging | A VSIX can be installed successfully | [x] |
| Clean installation | Core workflows work in a separate environment | [x] |
| Release preparation | Publisher identity and Marketplace metadata are ready | [x] |
