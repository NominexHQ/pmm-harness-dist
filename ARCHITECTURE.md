# PMM Dual-Runtime Architecture

## Overview

PMM (Poor Man's Memory) is a programmable memory management system designed to work consistently across two distinct runtime environments: OpenCode and Claude Code. This document describes the architecture, design decisions, and component organization.

## Dual-runtime model

### Why two runtimes?

PMM supports two environments that serve different workflows:

- **OpenCode** — Browser-based, real-time REPL, immediate feedback for interactive memory work
- **Claude Code** — CLI-based, file-focused, integration with Claude's larger context windows and reasoning

Both runtimes manage the same memory files in the same project structure. Memory persists independently of runtime selection.

### Runtime parity

Each runtime implements:

- Core command set (`init`, `save`, `hydrate`, `recall`, `query`, `status`, `settings`, `update`, `dump`, `viz`)
- Identical memory file organization (`memory/`, `.opencode/`, etc.)
- Shared procedural logic for memory operations

Runtime-specific differences are minimized:

- **OpenCode** — TypeScript plugin, real-time browser UI
- **Claude Code** — Async CLI tool, Claude-native integrations

## Component organization

### Workspace-centric design

All PMM data lives in the workspace project directory:

```
<project_root>/
  memory/                          # PMM memory files (source of truth)
    ├── agents.md
    ├── decisions.md
    ├── progress.md
    ├── ... (user-maintained memory files)
  .opencode/                       # OpenCode runtime plugin
    ├── plugins/
    │   ├── nominex-pmm.ts        # Plugin entrypoint
    │   ├── instructions/         # Instruction set
    │   └── pmm/                  # Assets (d3, viz template)
    ├── plugins.json
    └── opencode.json
```

### Harness distribution structure

This repository packages validated runtime implementations:

```
pmm-harness-dist/
  ├── pmm-harness/                           # Dual-runtime harness
  │   ├── opencode/                         # OpenCode distribution
  │   │   ├── plugins/nominex-pmm.ts
  │   │   ├── plugins/instructions/
  │   │   ├── plugins/pmm/
  │   │   ├── package.json
  │   │   └── opencode.json
  │   │
  │   └── claudecode/pmm-plugin/            # Claude plugin snapshot
  │       ├── .claude-plugin/
  │       │   ├── plugin.json               # Plugin descriptor
  │       │   └── marketplace.json
  │       ├── src/
  │       ├── instructions/
  │       └── ... (vendor-neutral structure)
  │
  ├── .claude-plugin/marketplace.json       # Local marketplace
  ├── Makefile
  ├── bump_version.py
  ├── README.md
  └── DEVELOPMENT.md
```

### Installation paths

**For OpenCode projects:**

1. User clones `pmm-harness-dist`
2. Copies `pmm-harness/opencode/*` → `.opencode/` in target project
3. Launches OpenCode with plugin available

**For Claude Code projects:**

1. User clones `pmm-harness-dist`
2. Registers local marketplace: `claude plugin marketplace add ./pmm-harness-dist`
3. Installs plugin: `claude plugin install pmm@nominex-pmm-harness-marketplace`
4. Plugin accesses `pmm-harness/claudecode/pmm-plugin/` snapshots

## Build-release pipeline

### Source of truth policy

| Component | Source | Status | Workflow |
| --- | --- | --- | --- |
| OpenCode plugin | Workspace `.opencode/` | Live development | Edit `.opencode/` → test → rebuild on release |
| Claude plugin | GitHub upstream `pmm-plugin` | Snapshot only | Change in upstream → rebuild snapshot on release |
| Marketplace | Generated from plugin metadata | Auto-synced | Version bumps auto-update marketplace |

### Build phases (makefile-driven)

**Phase 1: Clean state**
- Remove previously generated outputs
- Ensure consistent starting condition

**Phase 2: OpenCode build**
```bash
make -C pmm-harness build-opencode
```
- Copy `.opencode/` into `pmm-harness/opencode/`
- Validate shipping allowlist (plugins/, package.json, opencode.json)
- Result: clean OpenCode distribution ready to copy to projects

**Phase 3: Claude build**
```bash
make -C pmm-harness build-claudecode
```
- Clone `https://github.com/NominexHQ/pmm-plugin` (depth=1 for speed)
- Strip git metadata (no `.git` in distribution)
- Result: versionless plugin snapshot in `pmm-harness/claudecode/pmm-plugin/`

**Phase 4: Marketplace sync**
```bash
python3 bump_version.py <marketplace_file> <plugin_descriptor> <bump_type>
```
- Read Claude plugin version from `.claude-plugin/plugin.json`
- Update matching entry in `.claude-plugin/marketplace.json`
- Bump marketplace semver (patch/minor/major)
- Result: marketplace version matches latest Claude plugin version

### Release workflow

```bash
# Patch bump (default)
make

# Minor version bump
make -- --minor

# Major version bump
make -- --major
```

All four phases execute in sequence. Result is publishable state (all generated files current, versioning synced).

## Design patterns

### Snapshot distribution

Generated Claude plugin snapshots contain no git history (`.git` stripped). This:
- Reduces distribution size
- Avoids nested git confusion
- Makes snapshot usage simpler for end-users
- Preserves upstream reference via Makefile URLs

### Marketplace as versioning authority

The `.claude-plugin/marketplace.json` is the single source of truth for public plugin versions. It:
- Lists all available plugins
- Pins each plugin to a specific version
- Enables atomic marketplace updates
- Decouples runtime version from filesystem snapshots

### Instruction set separation

Instruction files are modular and copyable:
- `plugins/instructions/` organized by command
- Each instruction is a standalone markdown file
- Instructions can be overridden at runtime by placement order
- Makes it easy for users to customize behavior

## Key decisions

### Why snapshot-based distribution?

**Alternative:** Git submodule dependencies  
**Decision:** Full snapshot clone with `.git` stripped

**Rationale:**
- Easier for end-users (no git submodule commands)
- Smaller distribution size
- Cleaner for marketplace distribution
- Upstream reference maintained via Makefile

### Why separate marketplaces (local vs. public)?

**Alternative:** Single marketplace used for both  
**Decision:** Local `.claude-plugin/marketplace.json` for development; public marketplace for production

**Rationale:**
- Local marketplace enables quick iteration
- Users can test harness before publishing
- Production marketplace remains authoritative
- No risk of test entries polluting public space

### Why dual-Makefile hierarchy (top-level + harness)?

**Alternative:** Single monolithic Makefile  
**Decision:** Top-level (orchestration) + harness-level (build)

**Rationale:**
- Top-level handles versioning and marketplace (project-wide concerns)
- Harness-level handles runtime builds (runtime-specific concerns)
- Clear separation of concerns
- Easier to reuse harness-level targets independently

## Deployment scenarios

### Scenario 1: Single-runtime development

**User goal:** Use PMM only with OpenCode

**Workflow:**
1. Clone `pmm-harness-dist`
2. Copy `pmm-harness/opencode/` → `.opencode/` in project
3. `opencode <project>`

**Artifacts:** Only OpenCode plugin; Claude artifacts can be ignored.

### Scenario 2: Dual-runtime development

**User goal:** Use same PMM memory in both OpenCode and Claude Code

**Workflow:**
1. Clone `pmm-harness-dist`
2. Copy `pmm-harness/opencode/` → `.opencode/` in project
3. `claude plugin marketplace add ./pmm-harness-dist`
4. `claude plugin install pmm@nominex-pmm-harness-marketplace --scope project`
5. Both runtimes now access same `memory/` files

**Artifacts:** Both OpenCode and Claude snapshots used; marketplace descriptor active.

### Scenario 3: Distribution/publication

**User goal:** Publish PMM as part of a larger tool distribution

**Workflow:**
1. Fork or clone `pmm-harness-dist`
2. Customize `.opencode/` and/or upstream `pmm-plugin` as needed
3. `make` to build validated snapshots
4. Distribute as package/harness/etc.

**Artifacts:** All generated files current; versioning synced; ready for end-users.

## Testing considerations

### Unit test scope

- Individual instruction execution (save, recall, etc.)
- Memory file parsing and validation
- Command argument parsing

### Integration test scope

- Full workflow: init → save → recall → query
- Cross-runtime behavior (OpenCode → Claude on same memory)
- Marketplace installation and plugin loading

### Manual verification checklist

- [ ] OpenCode plugin loads and responds to all commands
- [ ] Claude Code plugin installs and can be invoked
- [ ] Memory files readable/writable by both runtimes
- [ ] Marketplace plugin version matches actual snapshot
- [ ] Build artifacts contain no git metadata
- [ ] Generated files do not blur source-of-truth
