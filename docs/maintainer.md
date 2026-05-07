# PMM Maintainer Guide

This repository packages a unified PMM layer across two independent runtimes (OpenCode and Claude Code). Both runtimes implement the same commands and memory behavior but use different plugin architectures.

## Repository structure

- `pmm-harness/opencode/` — OpenCode plugin distribution (installable directly into `.opencode/`)
  - `plugins/nominex-pmm.ts` — OpenCode plugin implementation
  - `plugins/instructions/` — OpenCode instruction set
  - `plugins/pmm/` — Template assets (d3 lib, viz template HTML)

- `pmm-harness/claudecode/pmm-plugin/` — Claude Code plugin source (canonical in this repo)
  - Edit directly in this repository
  - Contains plugin structure and marketplace descriptor wiring

- `.claude-plugin/marketplace.json` — Local Claude marketplace descriptor
  - Defines available plugins for `claude plugin` commands
  - Versioning is automated during release builds

## Build and release flow

Workflow from code change to release:

1. Edit plugin source — update workspace `.opencode/` and/or files in `pmm-harness/claudecode/pmm-plugin/`.
2. Build artifacts (no bump) — run `make` from repo root.
3. Release bump and sync — run `make release-patch` (or `make release-minor` / `make release-major`).
4. Validate output — confirm generated files in `pmm-harness/opencode/` and `pmm-harness/claudecode/pmm-plugin/local/`.
5. Commit and push — artifacts are distributed via git.

Build system behavior:

- OpenCode build — copies instructional artifacts from workspace `.opencode/` into `pmm-harness/opencode/`.
- Claude build — generates local Claude skill variants under `pmm-harness/claudecode/pmm-plugin/local/`.
- Version bump and marketplace sync — bumps Claude plugin semver in bundled plugin metadata, then updates `.claude-plugin/marketplace.json`.

## Component sources of truth

| Component | Source | Location | Status |
| --- | --- | --- | --- |
| OpenCode plugin | Workspace `.opencode/` | `pmm-harness/opencode/` | Editable; regenerated on build |
| Claude plugin | This repository | `pmm-harness/claudecode/pmm-plugin/` | Canonical in-repo; edit directly |
| Marketplace | Generated from plugin versions | `.claude-plugin/marketplace.json` | Auto-synced on build |

## Distribution repository

- `pmm-harness-dist` — https://github.com/NominexHQ/pmm-harness-dist
  - Ready-to-use packaging for both runtimes.
