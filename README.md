# PMM — Poor Man's Memory

**Structured, git-backed memory for AI coding sessions.**

By Monday you're re-explaining choices you made on Thursday. PMM fixes that. Every session, the AI loads what it already knows — decisions, lessons, preferences, open threads — then adds to it. Flat files. Git-backed. No database, no setup.

- **Decisions tracked with rationale** — not just what, but why
- **Open threads** — active issues and tasks that persist across context resets
- **Indexed session timeline** — what changed, what was decided, which files were touched
- **Lessons and preferences** — mistakes noted, patterns observed, working style remembered
- **`git log` is your audit trail** — memory that compounds, not rots

Threads feature concept credited to [FiSimply](https://github.com/FiSimply) via [Clief Notes](https://www.skool.com/quantum-quill-lyceum-1116).

---

## What this repo is

Clone-and-go PMM runtime bundle for unified memory across **OpenCode** and **Claude Code**.

- OpenCode plugin bundle
- Claude Code plugin via local private marketplace

Use this when you want shared PMM memory behavior across tools without wiring everything manually.

Within each runtime, PMM supports cross and multi-session work. Your memory files stay with the project — runtimes and harnesses can change.

## Prerequisites

- Git
- Claude Code CLI (for Claude install path)
- OpenCode project with a `.opencode` directory (for OpenCode install path)

## User Guide

### 1) Clone

```bash
mkdir -p <new_project_directory>
cd <new_project_directory>
git clone https://github.com/NominexHQ/pmm-harness-dist.git
```

From your `<new_project_directory>` containing `pmm-harness-dist` cloned repo:

### 2) Install for OpenCode

Copy the bundled OpenCode artifacts into your target project's `.opencode` directory:

```bash
mkdir -p ./.opencode/
cp -R pmm-harness-dist/pmm-harness/opencode/. ./.opencode/
```

launch opencode

OpenCode note:

- There is a known bug where slash-form commands like `/pmm_*` do not execute reliably.
- Workaround: invoke commands semantically by typing the underscore command directly, for example `pmm_init` or `pmm_save`.

### 3) Install for Claude Code

```bash
claude plugin marketplace add ./pmm-harness-dist
claude plugin install pmm@nominex-pmm-harness-marketplace --scope project
claude plugin reload
```

Scope options:

- `project`: installed for the current repository only (recommended).
- `user`: installed globally across your projects.
- `local`: installed only for the current local working context.

Examples:

```bash
# all projects for your user (CLI default)
claude plugin install pmm@nominex-pmm-harness-marketplace --scope user

# current local working context only — temporary/isolated testing
claude plugin install pmm@nominex-pmm-harness-marketplace --scope local
```

If you are not in the parent directory, use an absolute path for marketplace registration:

```bash
claude plugin marketplace add /absolute/path/to/pmm-harness-dist
claude plugin install pmm@nominex-pmm-harness-marketplace --scope project
claude plugin reload
```

### 4) Update existing install

When a new version is published, pull latest changes:

```bash
cd pmm-harness-dist && git pull
```

Then in Claude Code:

```
/reload-plugins
/pmm:settings
```

For OpenCode users, restart OpenCode after pulling updates.

Run `/pmm:settings` (or `pmm_settings` in OpenCode Cowork) after any update that adds new memory file types — it will prompt you to activate constructs like `threads-open.md` and `threads-closed.md`.

## First-time user primer

This is the fastest path from fresh install to useful memory.

Command style used in this section:

- Runtime-agnostic notation uses a space form like `pmm save`.
- Exact runtime forms are listed in the command mapping section below.

### 1) Initialize PMM

Run:

`pmm init`

What it does:

- creates your `memory/` files
- writes initial PMM config
- sets up defaults for save/recall behavior

### 2) Hydrate if this is not a brand-new project

Run:

`pmm hydrate --all`

Use this when the project already has history. It bootstraps memory files from existing context so you are not starting with empty templates.

### 3) Save at milestones

Run whenever you make a meaningful decision, finish a chunk of work, or learn something important:

`pmm save <optional notes>`

Examples:

- `pmm save chose postgres over sqlite for multitenancy`
- `pmm save completed auth refactor and added token rotation`

### 4) Use recall to resume quickly

Run when you context-switch or start a new day:

`pmm recall` and `pmm recall auth`

Use `pmm recall` for a briefing and `pmm recall <topic>` for focused catch-up.

### 5) Use query for specific retrieval

Run when you need exact facts with filters:

`pmm query why did we choose postgres?` and `pmm query auth changes since 2026-03-01 deep`

Use query for searching; use recall for working-context briefings.

### 6) Check health and tune behavior

Run periodically:

`pmm status` and `pmm settings`

- `pmm status` shows file health, save freshness, and warnings
- `pmm settings` lets you tune cadence, models, active files, and other defaults

### 7) Keep plugin/system files current

Run when you want latest PMM updates:

`pmm update`

This updates system/plugin assets while preserving your project memory files.

### Skill quick reference

- `pmm init` - bootstrap PMM for a project
- `pmm hydrate` - fill empty/template files from existing context
- `pmm save` - persist decisions, lessons, and progress
- `pmm recall` - fast context briefing
- `pmm query` - targeted, filterable retrieval
- `pmm status` - diagnostics and health checks
- `pmm settings` - configure PMM behavior
- `pmm update` - update PMM system/plugin files
- `pmm dump` - compact ASCII memory overview in terminal
- `pmm viz` - interactive graph visualization
- `pmm debug` - OpenCode environment diagnostics

### Command mapping by runtime (implemented in both runtimes)

Use this mapping when switching between Claude Code and OpenCode.

| Capability | Claude Code | OpenCode |
| --- | --- | --- |
| Initialize | `pmm:init` | `pmm_init` |
| Save memory | `pmm:save` | `pmm_save` |
| Hydrate memory | `pmm:hydrate` | `pmm_hydrate` |
| Query memory | `pmm:query` | `pmm_query` |
| Recall context | `pmm:recall` | `pmm_recall` |
| Status/diagnostics | `pmm:status` | `pmm_status` |
| Settings | `pmm:settings` | `pmm_settings` |
| Update PMM | `pmm:update` | `pmm_update` |
| Memory dump (text) | `pmm:dump` | `pmm_dump` |
| Memory visualization | `pmm:viz` | `pmm_viz` |

### Runtime support matrix

This matrix is the source of truth for runtime parity status.

| Capability group | Claude Code | OpenCode |
| --- | --- | --- |
| Core PMM commands (`init/save/hydrate/recall/query/status/settings/update/dump/viz`) | Implemented | Implemented |
| Runtime-specific diagnostics (`debug`) | Not available | `pmm_debug` implemented |
| Claude extras (`onboard`, `init-local-skills`) | Implemented | Not available |

### Planned for OpenCode

- Runtime command parity complete.

### Claude-only extras

- `pmm:onboard`
- `pmm:init-local-skills`

## Memory files

PMM maintains a `memory/` directory in your project. Each file has a specific role.

`config.md` and `secrets.md` are always active. All others are opt-in via `pmm:settings`.

| File | Purpose |
| --- | --- |
| `config.md` | PMM settings — save cadence, model, verbosity, active files, etc. |
| `secrets.md` | Local-only credentials. Never committed to git. |
| `memory.md` | Long-term facts about the project — what it is, key context, durable facts |
| `decisions.md` | Committed decisions with rationale. Append-only. |
| `lessons.md` | Mistakes and lessons learned. Append-only. |
| `progress.md` | Current state, completed work, what's in-progress, blockers, next actions |
| `last.md` | Detail from the last session — replaced each save, not appended |
| `timeline.md` | Chronological record of sessions and milestones. Sliding window. |
| `summaries.md` | Periodic rollups of past work. Sliding window. |
| `threads-open.md` | Active issues and tasks with full detail — status, objectives, checklists |
| `threads-closed.md` | Archive of completed threads. Append-only. |
| `assets.md` | Key entities — people, tools, systems, organisations |
| `processes.md` | Workflows and processes established during the project |
| `preferences.md` | User-specific style, working habits, and communication preferences |
| `standinginstructions.md` | Persistent rules that always apply. Append-only. |
| `voices.md` | Tone profiles and reasoning lenses |
| `user.md` | Operative user identity — how the user thinks and works. Seeded by `pmm:onboard`. |
| `graph.md` | Typed relationships between concepts, decisions, entities (Tier 2) |
| `taxonomies.md` | Classification systems and naming conventions (Tier 2, on-demand) |
| `vectors.md` | Semantic clusters and embedding registry (Tier 2, on-demand) |

Tier 2 files (`graph.md`, `vectors.md`, `taxonomies.md`, `assets.md`) are loaded on demand rather than injected at session start.

Run `pmm:settings` to configure which files are active and how they load (`full`, `head:N`, `tail:N`, `header`, or `skip`).

## Known issues

- **OpenCode slash-form invocation** — `/pmm_*` slash-form commands do not execute reliably in OpenCode. Workaround: invoke by typing the tool name directly, e.g. `pmm_viz`.
- **Viz template: session list overflow** — the sessions panel in `pmm-viz-template.html` overflows its container height with no scroll. Workaround: resize the browser window. Fix pending (add `overflow-y: auto` to sessions container CSS).

## Maintainers

Maintainer-oriented architecture, repository layout, and release workflow are documented in `docs/maintainer.md`.

## License

PolyForm Noncommercial 1.0.0. Free for personal and non-commercial use. Commercial production use requires a separate license from NominexHQ. See [LICENSE.md](LICENSE.md).

## Developer notes

Build/versioning workflow and release internals are documented in [DEVELOPMENT.md](DEVELOPMENT.md). Component architecture and design patterns are in [ARCHITECTURE.md](ARCHITECTURE.md).
