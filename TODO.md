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
- `pmm_debug`

### Not implemented in OpenCode (but listed in README mapping)

- [x] `pmm_query`
- [x] `pmm_status`
- [x] `pmm_settings`
- [x] `pmm_update`
- [ ] `pmm_dump`
- [ ] `pmm_viz`

## Documentation consistency tasks

- [ ] Mark `pmm_debug` in README runtime mapping (currently implemented in OpenCode, not documented in mapping).
- [ ] Clearly label README command mapping as:
  - implemented both runtimes
  - Claude-only
  - planned for OpenCode
- [ ] Add an explicit runtime support matrix section in README to avoid implying full parity.

## OpenCode known issue tracking

- [ ] Keep note in README: slash-form `/pmm_*` invocation is currently unreliable in OpenCode.
- [ ] Track fix for slash-form invocation once root cause is resolved.
- [ ] Remove workaround note only after verified fix in real OpenCode session.

## Suggested implementation order (OpenCode)

1. `pmm_update`
2. `pmm_dump`
3. `pmm_viz`

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
