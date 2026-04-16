# Crew OpenCode Stub

This file documents the temporary Crew stub surface in OpenCode.

## Tools available

- `crew_identity`
- `crew_capabilities`
- `crew_intake`
- `crew_query`
- `crew_note`
- `crew_log`
- `crew_progress`
- `crew_skill_request`
- `crew_directory_sync`
- `crew_plugin_info`

## Behavior

- All tools currently return `STUB_NOT_IMPLEMENTED` payloads.
- The payload echoes received args for integration smoke tests.
- No filesystem writes or external side effects occur.

## Porting target

Replace these stubs with full implementations after identity model and capability schema mapping is finalized.
