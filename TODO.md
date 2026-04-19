# TODO

Canonical implementation gap tracker for `pmm-harness-dist`.

## Runtime parity audit (README vs implementation)

Audit source:

- README command mapping and primer
- OpenCode plugin implementation: `pmm-harness/opencode/plugins/nominex-pmm.ts`
- Claude plugin skills directory: `pmm-harness/claudecode/pmm-plugin/skills/`

### Confirmed implemented (Claude Code)

- `pmm:init`
- `pmm:hydrate`
- `pmm:save`
- `pmm:recall`
- `pmm:query`
- `pmm:status`
- `pmm:settings`
- `pmm:update`
- `pmm:dump`
- `pmm:viz`

Also present (Claude-only extras):

- `pmm:onboard`
- `pmm:init-local-skills`

### Confirmed implemented (OpenCode)

- `pmm_init`
- `pmm_hydrate`
- `pmm_save`
- `pmm_recall`
- `pmm_query`
- `pmm_status`
- `pmm_settings`
- `pmm_update`
- `pmm_dump`
- `pmm_viz`
- `pmm_debug`

### Not implemented in OpenCode (but listed in README mapping)

- [x] `pmm_query`
- [x] `pmm_status`
- [x] `pmm_settings`
- [x] `pmm_update`
- [x] `pmm_dump`
- [x] `pmm_viz`

## Documentation consistency tasks

- [x] Mark `pmm_debug` in README runtime mapping.
- [x] Clearly label README command mapping as:
  - implemented both runtimes
  - Claude-only
  - planned for OpenCode
- [x] Add an explicit runtime support matrix section in README to avoid implying full parity.

## OpenCode known issue tracking

- [x] Keep note in README: slash-form `/pmm_*` invocation is currently unreliable in OpenCode.
- [ ] Track fix for slash-form invocation once root cause is resolved.
- [ ] Remove workaround note only after verified fix in real OpenCode session.

## Repo hygiene (Codex cold-read gaps, S153)

- [ ] Add LICENSE file (MIT per manifest, but no LICENSE file exists in repo)
- [ ] Fix manifest repo URL — `.claude-plugin/plugin.json` references `NominexHQ/poor-man-memory`, actual repo is `NominexHQ/pmm-plugin`
- [ ] Add CI workflow (`.github/workflows/`) — currently only a PR template exists
- [ ] Fix stale/brittle tests — `test-load-strategies.sh` passes 6/22, `test-hook-loading.sh` passes 13/44 in clean clone
- [ ] `pmm:update` references `pmm/version.json` (only `pmm/.gitkeep` exists) and clones `NominexHQ/poor-man-memory` instead of current repo name

## Viz template known bugs

- [ ] **Session list overflow** — the sessions panel in `pmm-viz-template.html` is taller than its container's vertical height with no scroll. Fix: add `overflow-y: auto` (or `scroll`) to the sessions list container CSS.

## Suggested implementation order (OpenCode)

1. Runtime command parity complete.

## Backlog — OpenCode save/git behavior

- [ ] Update `pmm_save` behavior: when git is configured, run `git commit` on normal save; only run `git push` as part of the full-save flow after commit. Spec: `dev-notes/opencode-pmm-save-git-behavior.md`.

## Recent completion notes

- `pmm_query` implemented in OpenCode with instruction-driven query workflow.
- `pmm_status` implemented in OpenCode with instruction-driven status workflow.
- `pmm_settings` implemented in OpenCode with a Claude-style current-settings summary and tabbed settings dialog.
- Settings flow now uses dedicated `settings-questions.json` tabs and preserves `Default` / `Recommended` guidance in option descriptions.
- Status contract now requires an all-memory activity-sorted heatmap table with session-recency buckets:
  - modified this session
  - modified 1-3 sessions ago
  - modified 4-5 sessions ago
  - stale older than 5 sessions
- `pmm_update` implemented in OpenCode with `action: "check" | "apply"` parameter (default `"check"`). Check phase fetches, diffs, presents report, asks confirmation via `question` tool, then calls apply. Apply phase resolves upstream ref and writes files. Canonical update source is the deployed `pmm-harness-dist` git clone's own remote (not an external clone). Contract mirrors the Claude Code four-phase model.
- `pmm_dump` contract aligned to Claude precedence model and adapted for OpenCode main-context execution (no subagent dispatch). Added override copy at `memory/instructions/dump.md` so user-owned instruction precedence remains authoritative over plugin defaults.
- `pmm_viz` implemented in OpenCode with richer instruction payload (`projectRoot`, `memoryDir`, `cachePath`, `templatePath`, `d3Path`) and full workflow contract mirrored in `memory/instructions/viz.md` for precedence override behavior.
