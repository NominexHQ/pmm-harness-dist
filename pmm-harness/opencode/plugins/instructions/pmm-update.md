# Update Workflow

**Path scope:** Treat `memory/` as `<project-root>/memory/`. Any `memory/<file>.md` path means `<project-root>/memory/<file>.md`.

Check for PMM updates by comparing the local OpenCode install against a fresh upstream fetch in a temporary git directory. System files are updated; user memory content is never touched.

Update contract (OpenCode):
1. Compare installed version from `.opencode/plugins/pmm/version.json` to upstream.
2. Diff local `./.opencode/` against upstream `pmm-harness-dist/pmm-harness/opencode/`.
3. Apply system diffs.
4. Run semantic updates for `config/` and `memory/`.

> **Canonical source rule:** Use the official PMM harness upstream (`instruction.upstreamRepoUrl`) fetched into a temporary directory for every check/apply cycle. Do not depend on a pre-existing local `pmm-harness-dist` clone.

When you receive an UPDATE instruction from `pmm_update`, route on `instruction.action`:

- `"check"` (default) — run **Phase 1**, then **Phase 2** (show report and confirm; if confirmed, call `pmm_update` with `action: "apply"`)
- `"apply"` — run **Phase 1** (ref resolution only), then skip directly to **Phase 3** and **Phase 4**

## Phase 1 — Fetch and resolve upstream ref

Always runs regardless of action. Inputs available from the tool payload:

- `instruction.projectRoot`
- `instruction.gitRepoRoot` (optional local context only; not required for update source)
- `instruction.localVersion`
- `instruction.localVersionPath`
- `instruction.localOpencodeDir`
- `instruction.upstreamOpencodeDir` (relative path inside upstream checkout)
- `instruction.upstreamRepoUrl`
- `instruction.configDir`
- `instruction.memoryDir`

Create a temporary upstream checkout and fetch latest:

```bash
tmpdir=$(mktemp -d)
git clone --depth 1 "{instruction.upstreamRepoUrl}" "$tmpdir"
```

If clone/fetch fails, return exactly:

```text
ERROR: Could not fetch updates from the PMM harness upstream. Check your network connection.
```

Read upstream version from:

`$tmpdir/pmm-harness/opencode/plugins/pmm/version.json`

and compare to `instruction.localVersion`.

**If `instruction.action === "check"`:**

If versions match, return exactly:

```text
PMM is up to date (v{version})
```

Otherwise build the full change report by diffing OpenCode system trees:

- local tree: `instruction.localOpencodeDir`
- upstream tree: `$tmpdir/{instruction.upstreamOpencodeDir}`

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

Dispatch a write-capable subagent. It may read from the temp upstream checkout and write local files.

Provide it:

- temp upstream checkout path
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

1. read added or modified files from the temp upstream checkout and overwrite local system files
1. delete removed system files and prune empty parent directories where safe
1. apply additive merges for merge files
1. return a concise action summary

## Phase 4 — Post-update (apply only)

After apply completes:

1. **Semantic config updates** — Apply schema/default migrations to `instruction.configDir` while preserving user values.
1. **Semantic memory updates** — If upstream templates introduce new memory file types and `instruction.memoryInitialized=true`, create missing files in `instruction.memoryDir` from templates and recommend hydration from existing context.
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
- Pre-version installs are valid: missing `.opencode/plugins/pmm/version.json` means `0.0.0` and full sync can be offered.
- File moves and renames should appear as delete + add via `files.system`.
- The canonical update source is a fresh temporary checkout of `instruction.upstreamRepoUrl` for each run.
