# CHANGEFILE

Canonical development progress log for `pmm-harness-dist`.

## 2026-04-14

### Repository structure and distribution setup

- Introduced dedicated distribution folder and finalized naming as `pmm-harness-dist`.
- Established this repository as clone-and-go starter surface for unified PMM usage across OpenCode and Claude Code.
- Split user-facing and developer-facing documentation concerns.

### Build and packaging automation

- Added top-level `Makefile` orchestration for:
  - building OpenCode and Claude harness outputs
  - bumping marketplace semver (`--major`, `--minor`, `--patch`; default patch)
  - syncing plugin version in marketplace from built Claude plugin metadata
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
