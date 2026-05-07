# Update Workflow

**Path scope:** Treat `memory/` as `<project-root>/memory/`. Any `memory/<file>.md` path means `<project-root>/memory/<file>.md`.

Check the deployed PMM harness repository for updates and apply them safely. The canonical source is the installed `pmm-harness-dist` git clone itself and its configured remote. System files are updated; user memory content is never touched.

> **Canonical source rule:** In end-user deployment, `pmm-harness-dist/` is the product and its git remote is the upstream source of truth. Do not clone `poor-man-memory` or any other external repo to perform update checks. Use the git repository that contains the deployed harness directory.

When you receive an UPDATE instruction from `pmm_update`, route on `instruction.action`:

- `"check"` (default) — run **Phase 1**, then **Phase 2** (show report and confirm; if confirmed, call `pmm_update` with `action: "apply"`)
- `"apply"` — run **Phase 1** (ref resolution only), then skip directly to **Phase 3** and **Phase 4**

## Phase 1 — Fetch and resolve upstream ref

Always runs regardless of action. Inputs available from the tool payload:

- `instruction.projectRoot`
- `instruction.gitRepoRoot`
- `instruction.localVersion`
- `instruction.localVersionPath` (plugin metadata path, typically `.claude-plugin/marketplace.json`)

First resolve the canonical repository root.

- Use `instruction.gitRepoRoot` when present.
- This should be the directory that contains the `.git` metadata for the deployed `pmm-harness-dist` clone.
- If no git repo is available, return exactly:

```text
ERROR: PMM update requires a git clone of pmm-harness-dist with a configured remote.
```

Fetch the configured upstream from the canonical repo:

```bash
git -C "{instruction.gitRepoRoot}" fetch --prune
```

If fetch fails, return exactly:

```text
ERROR: Could not fetch updates from the pmm-harness-dist remote. Check the repository remote and your network connection.
```

Determine the upstream tracking ref for the current branch.

- Prefer `@{upstream}` when configured.
- Otherwise fall back to `origin/main`.
- If neither exists, return exactly:

```text
ERROR: Could not determine an upstream tracking branch for pmm-harness-dist.
```

Read plugin metadata version from the fetched upstream ref using `git show .claude-plugin/marketplace.json` and compare to `instruction.localVersion`.

**If `instruction.action === "check"`:**

If versions match, return exactly:

```text
PMM is up to date (v{version})
```

Otherwise build the full change report using the upstream `files.system` list:

- local exists and differs: `M`
- missing locally: `A`
- present locally but removed upstream: `D`
- unchanged: skip and count under `=`

For merge files, inspect without applying:

- `.opencode/settings.json` if present upstream or locally: count additive permission or hook entries
- `AGENT.md`: treat as managed-section merge, never full overwrite
- `CLAUDE.md`: treat as managed-section merge, never full overwrite

Continue to Phase 2.

**If `instruction.action === "apply"`:**

Skip the report and confirmation. Resolve the upstream ref and continue directly to Phase 3.

## Phase 2 — Show report and confirm (check only)

If the result is `PMM is up to date` or `ERROR`, return that message and stop.

If updates are available, present a Claude-style summary:

```text
PMM Update Available: v{local} -> v{upstream}
==============================================

Changed files:
  M  .opencode/plugins/nominex-pmm.ts
  A  .opencode/plugins/instructions/pmm-update.md
  D  .opencode/plugins/instructions/old-file.md

Merge (additive only):
  ~  .opencode/settings.json (+2 permissions)
  ~  AGENT.md (managed section)
  ~  CLAUDE.md (managed section)

Unchanged: 8 files
Memory files: untouched (as always)
Overrides in config/instructions/: untouched
```

Use the `question` tool to ask:

- `yes` — apply all changes
- `no` — cancel
- `show diffs` — show diffs, then ask again

If the user answers `yes`, call `pmm_update` with `action: "apply"` and stop here.

If the user answers `no`, stop. Do not call apply.

If the user answers `show diffs`, show unified diffs for changed files using `git diff <upstreamRef> -- <path>`, then ask again.

## Phase 3 — Apply updates (apply only)

Dispatch a write-capable subagent. It must not run git commands.

Provide it:

- upstream ref
- project root
- overwrite list (`M` and `A` files)
- delete list (`D` files)
- merge list (`~` files)

Merge rules:

- `.opencode/settings.json`: merge `permissions.allow` entries and `hooks` object additively; never remove user entries
- `AGENT.md`: update only the section between `<!-- PMM_SYSTEM_START -->` and `<!-- PMM_SYSTEM_END -->`; preserve all user content
- `CLAUDE.md`: update only the section between `<!-- PMM_SYSTEM_START -->` and `<!-- PMM_SYSTEM_END -->`; preserve all user content

Never touch:

- any file in `memory/`
- any file in `config/instructions/`
- `pmm/viz-cache.html`
- any local-only settings file if present

The subagent should:

1. read added or modified files from the fetched upstream ref and overwrite local system files
1. delete removed system files and prune empty parent directories where safe
1. apply additive merges for merge files
1. return a concise action summary

## Phase 4 — Post-update (apply only)

After apply completes:

1. **Check for new memory file types** — If upstream templates introduce new memory file types and `instruction.memoryInitialized=true`, create the new files from templates and recommend hydration from existing context.
1. **Refresh hooks if present** — If `pmm/hooks/pre-commit` exists after the update and the repo is git-initialized, reinstall it into `.git/hooks/pre-commit`.
1. **Commit if git is available** — If `instruction.gitStatus.canCommit=true`, stage the updated system files and commit with:

```bash
git add .opencode/ AGENT.md CLAUDE.md pmm/ README.md .gitignore
git commit -m "pmm: update to v{new_version}"
```

1. **Clean up generated state** — Remove `pmm/viz-cache.html` if present so viz regenerates against the updated templates.
1. **Report** — Summarize version change, changed files, merges, and any recommended hydrate follow-up.

## Notes

- Never touch `memory/` content during update except to add new file types introduced by the update.
- Never overwrite `config/instructions/` because those are user-managed overrides.
- Merge, do not replace, managed files and settings files.
- Pre-version installs are valid: missing plugin metadata version means `0.0.0` and full sync can be offered.
- File moves and renames should appear as delete + add via `files.system`.
- The canonical update source is the fetched remote state of the deployed `pmm-harness-dist` clone, not a separate upstream checkout.
