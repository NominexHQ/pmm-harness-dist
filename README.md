# PMM Dual-Runtime Starter Repo
## Poor Man's Memory (Programmable Memory Management)


Clone-and-go PMM runtime bundle for unified memory across OpenCode and Claude Code.

## What this is

This repository gives you one PMM setup that can be used across both runtimes:

- OpenCode plugin bundle
- Claude Code plugin via local private marketplace

Use this when you want shared PMM memory behavior across tools without wiring everything manually.

Within each runtime environment, PMM is already capable of cross and multi-session work. Your memory files remain with the project (but your harnesses and runtimes can change).

## Prerequisites

- Git
- Claude Code CLI (for Claude install path)
- OpenCode project with a `.opencode` directory (for OpenCode install path)

## Clone

```bash
mkdir -p <new_project_directory>
cd <new_project_directory>
git clone https://github.com/NominexHQ/pmm-harness-dist.git
```

From your `<new_project_directory>` containing `pmm-harness-dist` cloned repo:

## Install for OpenCode

Copy the bundled OpenCode artifacts into your target project's `.opencode` directory:

```bash
mkdir -p ./.opencode/
cp -R pmm-harness-dist/pmm-harness/opencode/. ./.opencode/
```

launch opencode

OpenCode note:

- There is a known bug where slash-form commands like `/pmm_*` do not execute reliably.
- Workaround: invoke commands semantically by typing the underscore command directly, for example `pmm_init` or `pmm_save`.

## Install for Claude Code

```bash
claude plugin marketplace add ./pmm-harness-dist
claude plugin install pmm@nominex-pmm-harness-marketplace
claude plugin reload
```

### Installation scopes

Claude Code supports installation scope. Pick one that matches how broadly you want PMM available:

```bash
# current project only (recommended default)
claude plugin install pmm@nominex-pmm-harness-marketplace --scope project

# all projects for your user
claude plugin install pmm@nominex-pmm-harness-marketplace --scope user

# current local working context only
claude plugin install pmm@nominex-pmm-harness-marketplace --scope local
```

Scope differences:

- `project`: Installed for the current repository/project only. Best for trying PMM safely without affecting other projects.
- `user`: Installed globally for your user account across projects. Best when PMM is part of your standard setup.
- `local`: Installed for the current local working context only. Best for temporary or isolated testing.

If you are not in the parent directory, use an absolute path for marketplace registration:

```bash
claude plugin marketplace add /absolute/path/to/pmm-harness-dist
claude plugin install pmm@nominex-pmm-harness-marketplace
claude plugin reload
```

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
| Core PMM commands (`init/save/hydrate/recall/query/status/settings/update/dump/viz`) | Implemented | Implemented except `viz` |
| Runtime-specific diagnostics (`debug`) | Not available | `pmm_debug` implemented |
| Claude extras (`onboard`, `init-local-skills`) | Implemented | Not available |

### Planned for OpenCode

- `pmm_viz` (interactive visualization parity)

### Claude-only extras

- `pmm:onboard`
- `pmm:init-local-skills`

## Developer notes

Build/versioning workflow and release internals are documented in `DEVELOPMENT.md`.

