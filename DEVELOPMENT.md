# Development

Developer and release notes for the PMM dual-runtime starter repository.

## Architecture at a glance

- Top-level orchestration: `pmm-harness-dist/Makefile`
- Runtime packaging targets: `pmm-harness-dist/pmm-harness/Makefile`
- Local Claude marketplace: `pmm-harness-dist/.claude-plugin/marketplace.json`
- Generated OpenCode bundle: `pmm-harness-dist/pmm-harness/opencode/`
- Generated Claude bundle: `pmm-harness-dist/pmm-harness/claudecode/pmm-plugin/`

## Makefile targets

### Top-level targets

```bash
make -C pmm-harness-dist
make -C pmm-harness-dist -- --patch
make -C pmm-harness-dist -- --minor
make -C pmm-harness-dist -- --major
make -C pmm-harness-dist help
```

Behavior:

1. Runs both runtime builds in `pmm-harness/`.
2. Reads Claude plugin name/version from `pmm-harness/claudecode/pmm-plugin/.claude-plugin/plugin.json`.
3. Updates the matching plugin entry in `.claude-plugin/marketplace.json`.
4. Bumps marketplace semver.

Semver bump rules:

- Default: patch
- `--patch`: `x.y.z -> x.y.(z+1)`
- `--minor`: `x.y.z -> x.(y+1).0`
- `--major`: `x.y.z -> (x+1).0.0`

### Harness-level targets

```bash
make -C pmm-harness-dist/pmm-harness build-opencode
make -C pmm-harness-dist/pmm-harness build-claudecode
make -C pmm-harness-dist/pmm-harness build-opencode-bash
make -C pmm-harness-dist/pmm-harness build-claudecode-bash
make -C pmm-harness-dist/pmm-harness clean-opencode
make -C pmm-harness-dist/pmm-harness clean-claudecode
make -C pmm-harness-dist/pmm-harness show-opencode-files
```

## Plugin change workflow

### OpenCode plugin changes

Source of truth is the workspace `.opencode` content, then copied into generated output.

Workflow:

1. Edit OpenCode plugin source in `.opencode/`.
2. Test end-to-end
3. Rebuild: `make -C pmm-harness-dist`.
4. Validate generated OpenCode output in `pmm-harness-dist/pmm-harness/opencode/`.

### Claude plugin changes

Do not hand-edit generated files under `pmm-harness-dist/pmm-harness/claudecode/pmm-plugin/`.

Source of truth is canonical upstream:

- `https://github.com/NominexHQ/pmm-plugin`

Workflow:

1. Make and merge Claude plugin changes in upstream `NominexHQ/pmm-plugin`.
2. Rebuild here: `make -C pmm-harness-dist`.
3. Confirm the local snapshot was refreshed and `.git` was stripped.

## Release workflow

1. Run build with desired bump:
   - `make -C pmm-harness-dist -- --patch` (or minor/major)
2. Verify marketplace plugin/version sync in `.claude-plugin/marketplace.json`.
3. Verify both runtime outputs were regenerated.
4. Commit and push.

## Gotchas we learned

- **If this repo is embedded as a subdirectory inside a larger parent repo (no own `.git`), push with care.**
  A remote configured on the parent will push the entire parent history. Use `git subtree split` or a dedicated worktree to isolate this directory before pushing to the public remote.

- Marketplace path format matters:
  - `plugins[].source` must be `./...` relative path in local marketplace mode.
  - Example: `./pmm-harness/claudecode/pmm-plugin`
- Scope flags require explicit install command usage:
  - `--scope project|user|local`
- Top-level make flags require the separator syntax:
  - `make -C pmm-harness-dist -- --minor`
- zsh and `gh api` URLs:
  - Quote URLs that contain `?` to avoid glob expansion.
- Empty GitHub repositories cannot receive PRs directly:
  - Seed `main` first (initial commit), then open PRs.
- Forking can be disabled on org repos:
  - If fork flow fails with 403, push a branch to the target repo with a write-enabled account.
- Keep `.DS_Store` out of history:
  - Ensure `.gitignore` includes `.DS_Store`.
  - Remove tracked instances with `git rm`.
- Path rename regressions are easy to miss:
  - After folder renames, scan Makefiles and docs for stale path strings.

## Hygiene checklist

- No `.DS_Store` tracked files.
- No stale path references after renames.
- Marketplace source path remains relative (`./...`).
- Generated Claude snapshot is not manually edited.
