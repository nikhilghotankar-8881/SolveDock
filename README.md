# SolveDock

**Solve it once. Find it anytime.**

Search, save, and reuse technical solutions inside VS Code.

SolveDock provides a searchable, organized knowledge base for technical solutions directly in your editor. No AI API keys, no external servers, and no user accounts required. All knowledge stays 100% local in your repository.

---

## Features

- **Local Instant Search:** Fast full-text and fuzzy search across solution titles, problems, root causes, resolutions, technologies, and tags powered by MiniSearch.
- **Structured Knowledge Format:** Solutions are stored as human-readable Markdown with standard YAML frontmatter inside `.solvedock/solutions/`.
- **Inline Previews & Direct Editing:** Read problems, root causes, solutions, and environment metadata without opening files, or click `[Edit]` to modify files directly in the editor.
- **Verification Tracking:** Track whether a solution is `draft`, `reviewed`, `verified`, or `outdated`. Modifications to verified solutions trigger re-review prompts.
- **Technology & Status Filters:** Quickly filter saved solutions by technology or status directly from the sidebar.
- **Git-Native Sharing:** Solution records are ordinary project files that commit and push alongside your code.
- **Privacy & Security First:** Zero network calls, zero telemetry, safe sanitized filenames, and strict Content Security Policy.

---

## Installation

### From VSIX Package
1. Download or package the `.vsix` release file.
2. Open VS Code.
3. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`).
4. Run `Extensions: Install from VSIX...`.
5. Select `solvedock-0.1.0.vsix`.

---

## Usage Guide

### 1. Searching for Solutions
- Click the **SolveDock** anchor icon in the Activity Bar, or run `SolveDock: Open` from the Command Palette.
- Type your technical problem in the search field (e.g., `PostgreSQL connection refused`).
- Matching solutions appear immediately as rich result cards with tags, status badges, and inline previews.
- Press **`Esc`** or click **`✕`** to clear the active query.
- Click **`★`** to bookmark solutions as favorites.
- You can also run `SolveDock: Search Solutions` from the Command Palette for quick keyboard search.

### 2. Creating a New Solution
1. Click **+ Add Solution** in the sidebar, or run `SolveDock: Create Solution`.
2. Follow the interactive step-by-step prompts:
   - Title
   - Technologies
   - Tags
   - Problem description / exact error message
   - Root cause
   - Step-by-step resolution
   - Verification status (`draft`, `reviewed`, `verified`) and environment details
3. SolveDock creates the Markdown file in `.solvedock/solutions/` and indexes it immediately.

### 3. Sharing via Git
Knowledge files live in `.solvedock/solutions/` in your workspace. Share them using standard Git workflows:
```bash
git add .solvedock/solutions/
git commit -m "docs: add PostgreSQL connection resolution"
git push
```
When teammates pull new solutions, running `SolveDock: Refresh Knowledge` or relying on the automatic workspace watcher updates the index immediately.

---

## Storage & Privacy

- **Where files are stored:** In your project under `.solvedock/solutions/`.
- **Zero Remote Telemetry:** No workspace data or queries are transmitted externally. Everything runs locally.
- **Safe Execution:** SolveDock never executes code or shell commands on your system.

---

## License

This project is licensed under the [MIT License](LICENSE).
