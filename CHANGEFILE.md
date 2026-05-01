# CHANGEFILE

Canonical development progress log for `pmm-harness-dist`.

## 2026-05-01

### Claude/OpenCode instruction parity hardening (pmm 2.10.0, marketplace 1.1.0)

This pass focused on reducing false negatives and path ambiguity in Claude PMM skill prompts.

**Instruction reliability updates (Claude plugin):**
- Added explicit path-scope guidance across Claude PMM skills and local mirrors:
  - `memory/` is treated as `<project-root>/memory/`
  - `memory/<file>.md` always means `<project-root>/memory/<file>.md`
- Replaced brittle plugin-detection guidance in `pmm:status`/`pmm-status`:
  - old pattern: check filesystem path `.claude/plugins/pmm/`
  - new pattern: run `claude plugins list` and validate at least one enabled `pmm@...` entry
  - this avoids false warnings in environments where plugin resolution is marketplace/cache-based
- Removed Claude-plugin-space prompt dependencies in updated skills (for example `${CLAUDE_PLUGIN_ROOT}` and `references/*.md` lookups) in favor of project-local memory-file workflows.

**Parity note (OpenCode):**
- Canonical OpenCode PMM instructions now include explicit path-scope guidance (`memory/` resolves to `<project-root>/memory/`) to match Claude-side clarity.
- OpenCode settings guidance and question schema now include `head:N` in load-strategy options for parity with Claude settings behavior.
- OpenCode still does not use Claude plugin-manager installation checks, so the `claude plugins list` status probe remains Claude-specific and is intentionally not ported.

**Release bump:**
- Minor bump applied in this pass:
  - Claude plugin `pmm`: `2.9.4` -> `2.10.0`
  - Marketplace version: `1.0.18` -> `1.1.0`

### Post-release bugfix: OpenCode false INSTALL mode detection

Addressed a regression where OpenCode PMM could incorrectly report `INSTALL` mode even when PMM was initialized.

**Root cause:**
- `resolvePmmMemoryDir` can return an absolute path (for example from `pmm_memory_dir` in cwd-scoped `CLAUDE.md`/`AGENTS.md`).
- Callers then re-prefixed that value with `root` via `join(root, ...)`, yielding malformed paths and missed `memory/config.md` checks.

**Fix shipped:**
- Added normalized memory-dir path helper using `isAbsolute` guard.
- Updated PMM tool handlers to use normalized path resolution.
- Tightened init-mode detection to check `memory/config.md` presence directly (`MANAGE` only when config exists).

**Validation:**
- OpenCode harness build smoke passed (`make -C pmm-harness-dist/pmm-harness build-opencode`).
- Claude plugin test suites were re-run and currently fail in this workspace context:
  - `tests/test-hook-loading.sh`
  - `tests/test-load-strategies.sh`
- OpenCode still has no dedicated automated test suite in this repo; current validation is build smoke + runtime-targeted bugfix verification.

## 2026-04-30

### Session Management — threads and indexed timeline (2.9.0, Claude plugin only)

Inspired by [FiSimply](https://github.com/FiSimply) and community discussions on [Clief Notes](https://www.skool.com/quantum-quill-lyceum-1116), this release addresses session continuity gaps when working in Claude Cowork and across context windows.

**Threads support:**
- Added `threads-open.md` (Tier 1, living doc) — tracks active issues, projects, and tasks across sessions
- Added `threads-closed.md` (Tier 2, append-only archive) — permanent record of completed threads
- `session-start.sh`: emits `threads-open.md` at session start
- `session-instructions.md`: loads `threads-closed.md` on demand
- `templates.md`: full templates for both files, including 4-type Resources block (paths, URLs, git refs, memory cross-refs)
- `references/README.md`: inventory, tier counts, routing, and per-file operational rules for threads
- `init/SKILL.md`, `settings/SKILL.md`: threads files in wizard options and tier counts

**Maintain agent — file + thread tracking:**
- `save/SKILL.md` Step 4 synthesis now explicitly prompts for: files created or modified, thread lifecycle events (opened/updated/closed)
- `save/SKILL.md` `threads-open.md` rule changed from passive to active: agent reads it every save, not only when explicitly triggered
- `timeline.md` trigger updated to cover files created/modified and threads opened/closed

**Indexed timeline entries:**
- `save/SKILL.md`: `timeline.md` maintain rule now instructs the agent to write a structured session index entry (Worked on / Files / Decisions / Threads sub-items) instead of a flat one-liner
- `templates.md` `timeline.md` format section: documents two patterns — indexed (session saves) vs flat (single-fact in-session milestones)

_OpenCode plugin update to follow in a subsequent release._



### Licensing and hygiene (S157)

- Git history rewritten via `git filter-repo`: unified all author emails to GitHub noreply address.
- Added PolyForm Noncommercial 1.0.0 license (`LICENSE.md`). Free for personal/non-commercial use; commercial production requires separate license from NominexHQ.
- Updated README: license section, pmm-plugin archive notice.
- Upstream `NominexHQ/pmm-plugin` archived with redirect to this repo.

## 2026-04-14

### Repository structure and distribution setup

- Introduced dedicated distribution folder and finalized naming as `pmm-harness-dist`.
- Established this repository as clone-and-go starter surface for unified PMM usage across OpenCode and Claude Code.
- Split user-facing and developer-facing documentation concerns.

### Build and packaging automation

- Added top-level `Makefile` orchestration for:
  - building OpenCode and Claude harness outputs
  - bumping Claude PMM plugin semver (`--major`, `--minor`, `--patch`; default patch)
  - bumping marketplace semver and syncing marketplace plugin version from bundled Claude plugin metadata
- Added/maintained harness-level targets in `pmm-harness/Makefile`:
  - `build-opencode`
  - `build-opencode-bash`
  - `build-claudecode`
  - `build-claudecode-bash`
  - `clean-opencode`
  - `clean-claudecode`
  - `show-opencode-files`
- Hardened macOS portability in shell/make behavior (no `install -D` dependency).

### Marketplace implementation

- Added local private marketplace descriptor:
  - `.claude-plugin/marketplace.json`
- Corrected marketplace schema/format usage and validated field shape.
- Fixed local source path format for Claude parser compatibility:
  - `plugins[].source` uses relative `./...` form.
- Aligned marketplace plugin name/version with bundled plugin metadata.

### Runtime templates and instruction architecture

- Added runtime template files for managed root docs:
  - `template-agent.md`
  - `template-claude.md`
- Introduced instruction source precedence model:
  - override: `memory/instructions/`
  - fallback: `.opencode/plugins/instructions/`
- Added system tweaks instruction flow support.

### Memory-maintainer generalization

- Imported template tree into memory templates area.
- Created runtime-agnostic memory-maintainer spec under `agents/memory-maintainer/`.
- Added entrypoint docs for dual runtime alignment (`AGENT.md`, `CLAUDE.md` in maintainer area).

### pmm-dist to pmm-harness-dist transition

- Renamed distribution directory from `pmm-dist` to `pmm-harness-dist`.
- Updated path references in Makefiles and related docs.

### GitHub workflow and repository operations

- Created `NominexHQ/pmm-harness-dist` repository.
- Initialized base branch and completed first import via PR workflow.
- Merged initial import PR and cleaned temporary branches.
- Published subsequent doc and config updates directly to `main`.

### Hygiene and metadata cleanup

- Removed tracked `.DS_Store` files from both active and distribution repositories.
- Added/restored `.gitignore` protection for `.DS_Store`.
- Verified remote repos no longer track `.DS_Store` artifacts.

### Documentation updates

- Reworked top-level `README.md` into starter-focused onboarding:
  - what this repo is
  - OpenCode and Claude local install flows
  - Claude installation scope options (`project`, `user`, `local`)
  - first-time user primer
  - command mapping by runtime
- Added OpenCode known issue note:
  - slash-form `/pmm_*` execution is unreliable
  - semantic underscore invocation fallback (`pmm_init`, `pmm_save`, etc.)
- Added and expanded `DEVELOPMENT.md` with:
  - build orchestration
  - target reference
  - release workflow
  - implementation gotchas and hygiene checklist

### Identity and attribution notes

- Validated GitHub auth/account context across `raffi-ismail`, `leith-dev`, and `tessacodes`.
- Investigated author attribution mismatch (`Mahni9`) and traced to noreply email/user ID mapping.

### OpenCode status parity refinement

- Updated OpenCode status workflow contract to require an activity-sorted heatmap table across all `memory/*.md` files.
- Added explicit session-distance recency buckets for status output:
  - modified this session
  - modified 1-3 sessions ago
  - modified 4-5 sessions ago
  - stale older than 5 sessions
- Standardized shaded activity scale for status rendering (`█`, `▓`, `▒`, `░`).
- Synced the same status contract in both default instruction source and `memory/instructions` override source.
- Rebuilt harness OpenCode distribution so packaged status instructions reflect the updated contract.

### OpenCode settings parity refinement

- Implemented `pmm_settings` in the OpenCode plugin using the same high-level Claude pattern: current-settings summary first, then a tabbed settings wizard.
- Added a dedicated `settings-questions.json` schema for OpenCode so settings changes use structured tabs instead of a loose prose exchange.
- Added default and recommended guidance directly in settings option descriptions.
- Extended `pmm_settings` tool payload to include parsed current settings plus git availability, allowing prompts to be prefilled from `memory/config.md`.
- Synced settings workflow and settings question schema into `memory/instructions` override paths.
- Fixed override routing drift by bringing `memory/instructions/system.md` up to parity with the newer query/status/settings/update/viz workflow sections.
- Rebuilt harness OpenCode distribution so packaged settings instructions and question schema reflect the updated Claude-style flow.
