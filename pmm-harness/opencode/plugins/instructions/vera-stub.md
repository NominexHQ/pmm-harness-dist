# Vera OpenCode Port Status

This file documents the current Vera OpenCode implementation status.

## Tools available

- `vera_dispatch`
- `vera_status`
- `vera_task`
- `vera_plan`
- `vera_sprint`
- `vera_discuss`
- `vera_hydrate`
- `vera_save`
- `vera_recall`
- `vera_memory`
- `vera_brief`
- `vera_btw`
- `vera_agent`
- `vera_bot`
- `vera_project`
- `vera_todo`
- `vera_sandbox`
- `vera_intake`
- `vera_audit`
- `vera_audit_docs`
- `vera_plugin_update`
- `vera_init_local_skills`
- `vera_wwud`
- `vera_plugin_info`

## Behavior

- `vera_btw` is implemented and supports:
	- capture mode: append notes to `memory/btw.md`
	- list mode: return last 10 BTW entries (most recent first)
	- best-effort local git commit of BTW captures
	- OpenCode contract addendum: when user input includes emphasized phrasing to preserve, capture that portion verbatim in the BTW note for clarity
	- If `verbatim` is not explicitly passed, the tool may infer a verbatim segment from quotes/emphasis markers at LLM discretion and store it when useful
- `vera_recall` is implemented for OpenCode with a flexible contract:
	- freeform recall via `query` and optional `topics`
	- optional file scoping via `files`
	- depth support (`shallow`, `standard`, `deep`, `exhaustive`) with inference when omitted
	- presentation modes (`synthesized` default, `bullet`, `timeline`, `raw`)
	- compatibility shortcut for `mode` (`now`/`full`) while preserving OpenCode freeform behavior
- `vera_brief` is implemented for OpenCode with framework + instruction precedence pattern:
	- instruction source precedence: `memory/instructions/vera-brief.md` -> `.opencode/plugins/instructions/vera-brief.md` -> built-in defaults
	- role-specific deltas include concrete observations and role-specific inferences
	- trickle-feed rows include expected memory deltas
	- relevant verbatim quotes are included with source attribution metadata and timestamp when available
- All other Vera tools currently return `STUB_NOT_IMPLEMENTED` payloads.
- Stub payloads echo received args for integration smoke tests.

## Porting target

Replace these stubs with the planned Vera feature set after command and lifecycle mapping is finalized.
