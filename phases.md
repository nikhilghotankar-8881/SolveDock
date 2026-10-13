# SolveDock — phases.md

**Tagline:** Solve it once. Find it anytime.
**Source:** SolveDock — Complete Workflow & Phase-Wise Implementation Plan. This file contains nothing beyond that plan.

---

## The rule

We build **one working phase at a time**, test it, commit it to Git, and only then start the next phase.

Loop for every phase:

**Plan → Implement → Run → Test → Review → Commit**

- If a phase fails, fix it before moving forward.
- Do not ask Antigravity to build every phase in one large request. Give it one phase at a time.
- Antigravity can help write code, understand errors, and implement individual phases. You review and test the results.
- Do not accept "tests passed" unless the tests were actually executed and passed.

---

## Progress tracker

Update this table as you go. Do not start a phase until the one above it is marked done.

| Phase | Name | Main outcome | Status | Commit |
|---|---|---|---|---|
| 0 | Product Planning | Finalized requirements and acceptance criteria | [ ] | — (deliverable: `PRD.md`) |
| 1 | Extension Foundation | A working TypeScript extension | [x] | `chore: initialize SolveDock extension` |
| 2 | SolveDock Interface | Sidebar, search field, and navigation | [x] | `feat: add SolveDock sidebar and commands` |
| 3 | Knowledge Engine | Structured solution storage and parsing | [x] | `feat: add local knowledge storage` |
| 4 | Search Engine | Working local knowledge search | [x] | `feat: implement local solution search` |
| 5 | Solution Management | Create, view, edit, and organize solutions | [x] | `feat: add solution creation and editing` |
| 6 | Product Polish | Better usability and reliability | [x] | `feat: improve SolveDock usability` |
| 7 | Testing and Security | Tested extension with predictable behavior | [x] | `test: add extension reliability and security checks` |
| 8 | Version Control and Documentation | Clean repository and release documentation | [x] | `docs: finalize README, CHANGELOG, LICENSE, and documentation` |
| 9 | Packaging and Distribution | Installable VSIX package | [x] | `chore: configure metadata and package VSIX for distribution` |
| 10 | Marketplace Release | Public extension release | [ ] | not specified in the plan |
| 11 | Future Development | Advanced search, AI assistance, and integrations | [ ] | — |

Phases 1–9 create and prepare the initial product. Phase 10 happens when the extension is ready for distribution.

---

## Antigravity prompt template

Use this for every coding phase. Change the phase number, the phase name, the objective, and the acceptance criteria (copy them from the phase section below).

```
Act as a senior VS Code extension engineer. Help me build SolveDock, a TypeScript-based VS Code extension for searching, saving, and reusing technical solutions.

We are currently implementing Phase {N} only: {PHASE NAME}.

Objective: {OBJECTIVE}
Acceptance criteria: {PHASE COMPLETION CRITERIA}

First inspect the existing project and explain its current structure. Then implement only the changes required for this phase. Keep the code modular, use TypeScript, and follow the official VS Code Extension API.

Do not implement future features, AI, external APIs, a backend, or a database.

After implementation, compile the extension, run the available tests, fix any issues you introduced, and explain how I can verify the result in the Extension Development Host.

Do not claim a test passed unless it was actually executed and passed. Finish by listing the changed files and the exact commands I should run.
```

The Phase 1 version of this prompt, exactly as written in the plan:

```
Act as a senior VS Code extension engineer. Help me build SolveDock, a TypeScript-based VS Code extension for searching, saving, and reusing technical solutions.

We are currently implementing Phase 1 only: the extension foundation.

First inspect the existing project and explain its current structure. Then implement only the changes required for this phase. Keep the code modular, use TypeScript, and follow the official VS Code Extension API.

Do not implement future features, AI, external APIs, a backend, or a database.

After implementation, compile the extension, run the available tests, fix any issues you introduced, and explain how I can verify the result in the Extension Development Host.

Do not claim a test passed unless it was actually executed and passed. Finish by listing the changed files and the exact commands I should run.
```

---

## Phase 0 — Product Planning

**Objective:** Finalize exactly what the first version will do. This prevents continuously changing direction during development.

**Steps**

1. Freeze the MVP scope (the smallest usable version).
2. Define what is excluded from version 0.1.
3. Define the acceptance criteria.

The details of all three are in `PRD.md`.

**Phase deliverable:** A short product requirements document containing the scope, features, architecture, and acceptance criteria → `PRD.md`.

**Done when**

- [ ] MVP scope is frozen
- [ ] Exclusions are written down
- [ ] Acceptance criteria are written down
- [ ] `PRD.md` is reviewed by you

---

## Phase 1 — Create the Extension Foundation

**Objective:** Make SolveDock run inside VS Code before implementing any significant functionality. This is the first coding phase.

**Steps**

1. **Prepare the environment.** You need Visual Studio Code, Node.js and npm, Git, TypeScript development dependencies, and the VS Code Extension API types. Check:
   ```
   node --version
   npm --version
   git --version
   ```
   If any command does not return a version number, install the missing tool before proceeding.

2. **Generate the scaffold** with the Yeoman extension generator:
   ```
   npx --package yo --package generator-code -- yo code
   ```
   Choose the TypeScript extension option. Use:

   | Setting | Value |
   |---|---|
   | Product name | SolveDock |
   | Description | Search, save, and reuse technical solutions inside VS Code |
   | Language | TypeScript |
   | Project type | New Extension |
   | Initial identifier | `solvedock` or another available identifier |

   The publisher identifier can be finalized when preparing for publication. Check name and identifier availability before publishing; do not assume they are available.

3. **Understand the generated project.** Expect: `.vscode/`, `src/extension.ts`, `test/`, `package.json`, `tsconfig.json`, `README.md`. Keep the generated structure working. Do not add every planned module yet.

4. **Run the extension.** Open the project in VS Code and press `F5`. This launches a separate Extension Development Host window. Run the initial command from the generator. Confirm the extension activates and the command works.

5. **Initialize Git** inside the project folder:
   ```
   git init
   git add .
   git commit -m "chore: initialize SolveDock extension"
   ```
   Create a GitHub repository later if you have not already.

**Done when**

- [ ] The project compiles
- [ ] The generated extension activates
- [ ] The initial command works
- [ ] Git is initialized
- [ ] The first commit exists

Do not start Phase 2 until this foundation works.

---

## Phase 2 — Build the SolveDock Interface

**Objective:** Make SolveDock visible and usable inside the editor.

**Steps**

1. **Add the SolveDock Activity Bar icon** using VS Code's custom Activity Bar container and view contributions. Use VS Code's familiar styling rather than trying to look like a separate website.

2. **Implement the main interface.** Intended layout (some sections may start empty or show onboarding messages):
   ```
   SOLVEDOCK
   Developer Knowledge

   [ Search technical solutions... ]

   SEARCH RESULTS

   RECENT SOLUTIONS

   SAVED SOLUTIONS

   [ + Add Solution ]
   ```

3. **Choose the view implementation.** Use a native sidebar view for the first implementation where it meets the needs. A custom Webview View can come later if the interface needs richer forms or search-result cards. Avoid unnecessary UI complexity either way.

4. **Register Command Palette commands:**
   - `SolveDock: Open`
   - `SolveDock: Search Solutions`
   - `SolveDock: Create Solution`
   - `SolveDock: Refresh Knowledge`

5. **Add useful empty states.** When the knowledge base is empty, display:
   > No solutions found yet.
   >
   > Create your first solution to start building your technical knowledge library.

**Done when**

- [ ] SolveDock appears in the Activity Bar
- [ ] Clicking the icon opens the interface
- [ ] The interface adapts to the current VS Code theme
- [ ] Commands are registered
- [ ] Empty states display correctly
- [ ] The extension stays stable when switching between editor panels

**Commit**
```
git add .
git commit -m "feat: add SolveDock sidebar and commands"
```

---

## Phase 3 — Build the Knowledge Engine

**Objective:** Define how SolveDock stores, reads, and updates technical solutions. Search quality depends on consistent data.

**Steps**

1. **Define the knowledge directory:** `.solvedock/solutions/` inside the user's project. User solutions are never stored inside the installed extension folder. (The `.team-other-files/` directory shown in the plan's diagram is illustrative and not required.)

2. **Define the solution format:** Markdown with YAML frontmatter. Full example and field list are in `architecture.md`.

3. **Define the status rules.** Four statuses:

   | Status | Meaning |
   |---|---|
   | Draft | The solution is incomplete or still being documented. |
   | Reviewed | Someone has reviewed the record. |
   | Verified | The record includes an explicit verification claim and supporting details. |
   | Outdated | The information may no longer apply and needs review. |

   A record must not automatically become verified when saved. In v0.1, verification is documented by the user. The extension does not execute tests or certify solutions.

4. **Create the data model.** TypeScript `Solution` model with: `id`, `title`, `technology`, `tags`, `problem`, `rootCause`, `resolution`, `environment`, `status`, `verifiedAt`, `sourcePath`. More fields can be added when required.

5. **Implement storage operations** in a `SolutionStore` module:
   - Create the knowledge directory when appropriate
   - Read solution files
   - Parse Markdown and metadata
   - Save a new solution
   - Update an existing record
   - Handle invalid or incomplete files
   - Avoid duplicate identifiers

   Keep file operations separate from the interface and the search engine so they are easier to test.

**Done when**

- [ ] Solution records follow one consistent format
- [ ] Metadata can be parsed correctly
- [ ] Solutions can be saved and loaded
- [ ] Invalid records produce understandable errors
- [ ] User data is stored separately from extension code
- [ ] Existing knowledge is not overwritten accidentally

**Commit**
```
git add .
git commit -m "feat: add local knowledge storage"
```

---

## Phase 4 — Implement the Search Engine

**Objective:** Allow users to find relevant solutions using ordinary technical queries. This is the feature that makes SolveDock useful.

**Steps**

1. **Build basic search** (keyword search) across: title, problem description, root cause, resolution, technology, tags. Example: searching `PostgreSQL connection refused` should find a record even if the phrase appears in the problem description rather than the title.

2. **Add ranked results.** Starting rules (to be adjusted using realistic search examples):

   | Match | Suggested importance |
   |---|---|
   | Exact title match | Very high |
   | Exact technical error match | High |
   | Technology match | High |
   | Problem-description match | High |
   | Root-cause match | Medium to high |
   | Solution-text match | Medium |
   | Tag match | Medium |

3. **Add fuzzy search.** `Postgres connection refused` and `PostgreSQL connection failure` should both try to retrieve relevant records. MiniSearch is the chosen local library.

4. **Display results.** Each result shows title, technology, status, problem, source file, and an `[Open Solution]` action. The status must be read from the stored record.

5. **No-result behavior.** Display: `No relevant solutions found. Try a different search or record a new solution.` Never return unrelated results just to fill the interface.

6. **Test realistic queries.** Build a sample collection of about 15–20 records across Python, Git, Docker, JavaScript, and databases. Prepare 10 representative queries with known expected matches. Internal target: the expected solution appears in the first three results for at least 8 of 10 queries. This is a development target, not a claim about real-world accuracy.

**Done when**

- [ ] Search works against local knowledge
- [ ] Results are ranked
- [ ] Relevant records can be found using varied wording
- [ ] Status and source are displayed
- [ ] Empty searches and no-result states work correctly
- [ ] Unit tests cover the search behavior

**Commit**
```
git add .
git commit -m "feat: implement local solution search"
```

---

## Phase 5 — Build Solution Creation and Management

**Objective:** Allow developers to build their own searchable knowledge collection.

**Steps**

1. **Create-solution workflow.** Clicking Add Solution opens an input form collecting: Title, Technology, Tags, Problem, Root Cause, Resolution, Environment, Verification Details, Status. Keep it as short as practical. Required fields include a title and enough information to identify the problem and its solution. Verification and review fields have appropriate defaults and clear validation rules.

2. **Validate input.** Prevent: empty titles, duplicate solution identifiers, invalid status values, missing required fields, incorrect metadata types, invalid or unsafe filenames. Generate filenames safely; never accept arbitrary filesystem paths from user input.

3. **Save the record.** On save: validate → generate identifier and filename → create the Markdown file → refresh the search index → show a success message. The new solution is immediately searchable.

4. **Add editing.** Users can open a saved record and edit it. Content changes refresh that record's search index entry. If a previously verified solution is substantively changed, SolveDock requires its verification status to be reviewed again instead of silently keeping an unsupported verified label.

5. **Add filters.** Filter by technology, status, and tags. Simple filters are enough for the MVP. No advanced dashboards or analytics.

6. **Git-managed sharing.** Records are ordinary files in `.solvedock/solutions/`. Teams share them through the normal Git workflow:
   ```
   git add .solvedock/solutions/
   git commit -m "docs: add PostgreSQL troubleshooting solution"
   git push
   ```
   SolveDock never commits or pushes automatically. Only an explicit user action does.

**Done when**

- [ ] Users can create solutions
- [ ] Users can edit saved solutions
- [ ] New records are searchable immediately
- [ ] Filters work correctly
- [ ] Files remain readable without the extension
- [ ] Git can track changes to the knowledge files

**Commit**
```
git add .
git commit -m "feat: add solution creation and editing"
```

---

## Phase 6 — Polish the Product Experience

**Objective:** Make SolveDock feel like a useful developer tool rather than a prototype. Do this after the core functionality is stable.

**Improvements**

- **Better search interface:** a clear-search button, a keyboard-friendly workflow, and an action to clear the current query.
- **Solution preview:** show problem, resolution, environment, verification status, and source without forcing the user to open the whole Markdown file.
- **Recent searches:** remember recent queries locally if it gives a useful workflow. No telemetry just to implement this.
- **Favorites:** bookmark frequently used solutions.
- **Refresh knowledge:** a command to reload files from the knowledge directory (useful after Git pulls).
- **Error messages:** replace raw technical exceptions with clear messages. Example instead of a raw filesystem error: `SolveDock couldn't read this solution file. Check whether the file is accessible and its metadata is valid.`
- **Keyboard accessibility:** important commands reachable through the Command Palette; main workflows usable without relying only on the mouse.

**Done when**

- [ ] The extension uses consistent styling
- [ ] Loading, empty, and error states are clear
- [ ] Keyboard navigation works
- [ ] Source files open reliably
- [ ] Search and solution creation work in a normal development session

**Commit**
```
git add .
git commit -m "feat: improve SolveDock usability"
```

---

## Phase 7 — Testing and Security

**Objective:** Confirm the extension works reliably and handles local project data safely. Testing happens throughout development; this phase consolidates it. VS Code supports ordinary unit tests and integration tests running inside the Extension Development Host.

### A. Functional testing

| Test case | Expected behavior |
|---|---|
| Search an existing solution | Relevant record appears |
| Search with different wording | Fuzzy search may retrieve the record |
| Search for an unknown error | Helpful no-result message appears |
| Create a solution | Markdown file is created |
| Edit a solution | Changes persist |
| Reopen VS Code | Saved solutions are still available |
| Load an invalid Markdown file | Error is handled without crashing the extension |
| Open a source document | Correct file opens |
| Filter by technology | Only matching records appear |
| Change a record's status | Correct status is displayed |
| Refresh the index | External file changes become searchable |
| Open an empty workspace | Setup guidance appears |
| Open a read-only workspace | A helpful save error is displayed |

### B. Search testing

Use the sample knowledge collection to test: exact technical error messages, partial phrases, abbreviated technology names, different word order, misspelled terms, and queries with no useful matches. Use the results to improve ranking and relevance.

### C. Data security (v0.1 rules)

- **No unnecessary network access.** Search and storage work without sending workspace content to a remote service.
- **No secret collection.** Do not automatically read environment files, API keys, or unrelated project files.
- **No automatic command execution.** The extension does not execute suggested solutions or commands.
- **Safe file handling.** Restrict reads and writes to the intended knowledge directory and validate generated filenames.
- **Safe UI rendering.** If a Webview is used, treat Markdown content and other workspace data as untrusted input: HTML escaping, a restrictive Content Security Policy, and limited resource access.

### D. Clean-install testing

Install the packaged extension in a clean VS Code environment or profile. Open a test project and confirm it works without relying on files or dependencies that exist only in your development workspace.

> **Ordering problem in the plan:** D needs a packaged extension (a VSIX), but packaging is Phase 9. Either build a trial VSIX with `npx vsce package` during this phase, or treat the clean-install item as pending until Phase 9. Do not mark Phase 7 fully done without a real clean-install result.

**Done when**

- [ ] All core workflows pass their tests
- [ ] No known high-severity defects remain
- [ ] The extension handles malformed knowledge records gracefully
- [ ] The extension does not need a remote service for MVP functionality
- [ ] A clean installation works (see the ordering note above)
- [ ] README instructions are sufficient for another developer to try it

**Commit**
```
git add .
git commit -m "test: add extension reliability and security checks"
```

---

## Phase 8 — GitHub, Version Control, and Documentation

**Objective:** Make SolveDock maintainable and prepare it for collaborative development.

**Branch strategy**

`main` is the stable branch. Create a separate branch for each substantial feature. Examples (create them as the project progresses, not all at once): `feature/sidebar`, `feature/knowledge-store`, `feature/search`, `feature/solution-editor`, `feature/testing`.

**Commit naming**

```
chore: initialize SolveDock extension
feat: add SolveDock sidebar
feat: implement local knowledge search
feat: add solution creation workflow
fix: handle malformed solution metadata
test: add knowledge parser tests
docs: improve installation instructions
```

Small, understandable commits make regressions easier to find and bad changes easier to revert.

**Development loop for every new feature**

1. Create a feature branch
2. Implement one coherent piece of functionality
3. Run the relevant tests
4. Review the Git diff
5. Commit the changes
6. Merge into `main` when the feature works

Before merging, inspect changes for unexpected file deletions, unrelated modifications, exposed credentials, and generated files that should not be committed.

**Repository structure:** see `architecture.md`. It may change as implementation develops. The principle is to separate commands, knowledge management, search, UI, and data models.

**Documentation to finish**

- `README.md` — what it does, the problem it solves, how to install, how to search, how to create a solution, where knowledge files are stored, how teams share records through Git, what data the extension accesses, known limitations, how to report bugs.
- `CHANGELOG.md` — user-visible changes between releases.
- `LICENSE` — chosen intentionally, not copied from another project, and in place before publication.

**Done when**

- [ ] Repository is clean and follows the branch/commit conventions
- [ ] `README.md`, `CHANGELOG.md`, and `LICENSE` are ready
- [ ] `docs/architecture.md` matches the actual code

---

## Phase 9 — Package the Extension

**Objective:** Create an installable extension package (VSIX).

**Steps**

1. **Review `package.json`** for: extension identifier and publisher, display name and description, version number, commands, Activity Bar container and views, activation configuration, runtime and engine requirements, required dependencies. Avoid unnecessary dependencies.

2. **Build and test.** Run the project's build and test commands. The plan's example (use the real script names from `package.json`):
   ```
   npm run compile
   npm test
   ```
   Fix errors before packaging.

3. **Package.**
   ```
   npx vsce package
   ```
   This generates a `.vsix` if the manifest and packaging configuration are valid.

4. **Install the VSIX.** Command Palette → `Extensions: Install from VSIX...` → choose the file. Test SolveDock as an installed extension, not only inside the Extension Development Host.

5. **Test a real workflow.** Open a separate test project, create or add knowledge files, search for a problem, open a result, create a new solution, restart VS Code, and confirm the solution is still available.

**Done when**

- [ ] Build and tests pass
- [ ] A `.vsix` is generated
- [ ] The VSIX installs successfully
- [ ] The full workflow works from a clean installation

Only proceed when the full workflow works from a clean installation.

---

## Phase 10 — Publish to the Marketplace

**Objective:** Make the extension available to other developers.

**Steps**

1. Finalize the extension name and unique identifier
2. Prepare a recognizable icon
3. Write a clear Marketplace description
4. Capture screenshots of the working extension
5. Review dependencies and packaged files
6. Include installation and privacy documentation
7. Create and configure the publisher identity
8. Follow Microsoft's currently supported publishing authentication procedure
9. Publish the extension
10. Install it from the Marketplace and test it again

Do not publish just because it compiles. Before the first public release, the extension must meet all core acceptance criteria, have understandable documentation, and work in a clean environment.

**Planned version numbers** (milestones, not delivery dates)

| Release | Intended scope |
|---|---|
| 0.1.0 | Initial local search and solution management |
| 0.2.0 | Improved search, filters, and usability |
| 0.3.0 | Optional AI-assisted knowledge search |
| 0.4.0 | First selected knowledge-source integration |
| 1.0.0 | A mature release after sufficient testing and feedback |

**Done when**

- [ ] Final checklist in `PRD.md` (section 13) is fully complete
- [ ] Extension is published
- [ ] Marketplace install tested

---

## Phase 11 — Advanced Development After the MVP

Begin only after the initial extension has demonstrated value. Not part of version 0.1.

- **0.2 — Smarter local search:** better ranking, more robust fuzzy matching, favorites, recent searches, improved error-message search, knowledge freshness indicators.
- **0.3 — AI-assisted knowledge search:** optional; natural-language questions answered from retrieved records. The AI must cite the supporting records and say clearly when it cannot find sufficient evidence. Consider API costs, provider selection, data disclosure, and privacy controls.
- **0.4 — Connected knowledge sources:** integrate one external source based on actual user demand (GitHub documentation and issues is a reasonable candidate). A connector must handle authentication, synchronization, source links, API limits, and user permissions.
- **1.0 — Shared knowledge platform:** only if developers show demand for a centralized service. Evaluate: Python FastAPI backend, PostgreSQL, semantic search with pgvector, user authentication, organizations and teams, permission-aware retrieval, shared review workflows, administrative controls, additional company integrations.

---

## How to start each new phase (checklist)

- [ ] Previous phase is marked done in the tracker above and committed
- [ ] Copy the phase's objective and completion criteria into the Antigravity prompt template
- [ ] Give Antigravity this phase only
- [ ] Run the compile and test commands yourself
- [ ] Review the Git diff
- [ ] Commit with the phase's commit message
- [ ] Mark the phase done in the tracker
