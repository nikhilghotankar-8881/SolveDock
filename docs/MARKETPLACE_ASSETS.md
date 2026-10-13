# SolveDock — Visual Identity & Marketplace Screenshots

This document captures the visual layout, branding assets, and screenshots of SolveDock in action for the Visual Studio Marketplace and GitHub repository.

---

## 1. Extension Icon

The official SolveDock logo features an anchor and search glass motif representing repository stability and fast solution discovery.

- **Format:** 128x128 PNG (lossless)
- **Path:** `media/icon.png`
- **Activity Bar Icon:** `media/solvedock-icon.svg`

---

## 2. Core User Interface Screenshots

### Screen 1: The SolveDock Activity Bar & Sidebar
```
+-----------------------------------------------------------+
| [⚓] SOLVEDOCK                                             |
|     Developer Knowledge                                   |
|                                                           |
|     +-----------------------------------------------+     |
|     | Search solutions... (Esc to clear)        [✕] |     |
|     +-----------------------------------------------+     |
|                                                           |
|     [PostgreSQL] [Docker] [Git] [Node.js]                 |
|                                                           |
|     +-----------------------------------------------+     |
|     |                + Add Solution                 |     |
|     +-----------------------------------------------+     |
|                                                           |
|     [ All Technologies v ]     [ All Statuses v ]         |
|                                                           |
|  v  SAVED SOLUTIONS (3 of 3)                              |
|     +-----------------------------------------------+     |
|     | PostgreSQL connection refused            [★]  |     |
|     | [VERIFIED]                                    |     |
|     | [PostgreSQL] [Database]                       |     |
|     | Problem: connection to socket failed on 5432  |     |
|     | Resolution: sudo systemctl start postgresql   |     |
|     | postgres-conn-001.md      [Open]  [Edit]      |     |
|     +-----------------------------------------------+     |
+-----------------------------------------------------------+
```

### Screen 2: Interactive Solution Creation Form
Prompted via Command Palette (`Ctrl+Shift+P` -> `SolveDock: Create Solution`):
1. Title (`e.g. Docker OOM heap memory crash`)
2. Technologies (`Docker, Node.js`)
3. Tags (`memory, heap, limit`)
4. Problem description / Error text
5. Root cause explanation
6. Step-by-step resolution
7. Status selection (`draft`, `reviewed`, `verified`) & Environment

Resulting in a clean, human-readable markdown file in `.solvedock/solutions/`.

---

## 3. Marketplace Tags & Categories

- **Categories:** `Other`, `Programming Languages`, `Snippets`
- **Keywords:** `knowledge base`, `solutions`, `search`, `developer productivity`, `troubleshooting`, `debugging`, `offline`, `git`
- **Repository:** https://github.com/nikhilghotankar-8881/SolveDock
