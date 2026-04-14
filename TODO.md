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

- [ ] `pmm_query`
- [ ] `pmm_status`
- [ ] `pmm_settings`
- [ ] `pmm_update`
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

1. `pmm_query` (highest day-to-day value)
2. `pmm_status`
3. `pmm_settings`
4. `pmm_update`
5. `pmm_dump`
6. `pmm_viz`
