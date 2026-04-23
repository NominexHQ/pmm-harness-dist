# Vera OpenCode Port Status

This file documents the current Vera OpenCode implementation status.

## Live tools (13)

- `vera_btw` — conversational capture/list, best-effort git commit, verbatim support
- `vera_recall` — intent-aware recall, file/topic scoping, inferred depth
- `vera_brief` — role-aware deltas, trickle-feed plans, attributed verbatim quotes
- `vera_status` — team dashboard, reads all agent memory
- `vera_todo` — cross-cutting todo list
- `vera_plan` — goal → plan artifact
- `vera_wwud` — user persona model + decision proxy
- `vera_save` — end-of-session memory save
- `vera_task` — single-agent dispatch
- `vera_discuss` — multi-agent deliberation
- `vera_sprint` — coordinated multi-agent dispatch
- `vera_audit` — retroactive timeline audit
- `vera_plugin_update` — consumer update from agentic-harness-dev upstream
- `vera_hydrate` — agent hydration, trickle-feed sessions, voice-matched delta push

## Stubbed tools (8)

- `vera_dispatch`
- `vera_memory`
- `vera_agent`
- `vera_bot`
- `vera_project`
- `vera_sandbox`
- `vera_intake`
- `vera_audit_docs`

All stubbed tools return `STUB_NOT_IMPLEMENTED` payloads and echo received args for integration smoke tests.

## Not porting

- `vera_init_local_skills` — CC-only (Cowork concept, no OC equivalent)

## Behavior notes

- `vera_btw` supports:
	- capture mode: append notes to `memory/btw.md`
	- list mode: return last 10 BTW entries (most recent first)
	- best-effort local git commit of BTW captures
	- OpenCode contract addendum: when user input includes emphasized phrasing to preserve, capture that portion verbatim in the BTW note for clarity
	- If `verbatim` is not explicitly passed, the tool may infer a verbatim segment from quotes/emphasis markers at LLM discretion and store it when useful
- `vera_recall` supports:
	- freeform recall via `query` and optional `topics`
	- optional file scoping via `files`
	- depth support (`shallow`, `standard`, `deep`, `exhaustive`) with inference when omitted
	- presentation modes (`synthesized` default, `bullet`, `timeline`, `raw`)
	- compatibility shortcut for `mode` (`now`/`full`) while preserving OpenCode freeform behavior
- `vera_brief` supports:
	- instruction source precedence: `config/instructions/vera-brief.md` -> `.opencode/plugins/instructions/vera-brief.md` -> built-in defaults
	- role-specific deltas include concrete observations and role-specific inferences
	- trickle-feed rows include expected memory deltas
	- relevant verbatim quotes are included with source attribution metadata and timestamp when available

## Porting target

Replace remaining stubs with the planned Vera feature set after command and lifecycle mapping is finalized.
