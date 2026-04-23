# Agent Model Configuration

Set, query, or remove an OC agent's model override.

## Handling the payload

- **RESOLVED**: Model has been set. Report the change (previous → new). Tell the user: **OC may need to be restarted for the model change to take effect** (agent instructions are cached).
- **AMBIGUOUS**: Multiple models matched. Present `question` options to the user (favorites marked with ★). Once they pick, call `agentic_model` again with the exact `provider/model` string.
- **UNCONNECTED_PROVIDER**: Model exists but provider may not be connected. Show the warning and ask if user wants to proceed. If yes, call `agentic_model` again with the exact string.
- **NO_MATCH**: No models matched the query. Show the user's favorites and connected models for reference.
- **REMOVED**: Model override cleared. Agent will use session default on next dispatch.
- **OK** (no model arg): Report current model and list available models (favorites first).

## Rules

- Model changes go in `.opencode/agents/<handle>.md` frontmatter (`model:` field) only.
- Never modify `.claude/settings.json` or any CC config file.
- Always use the exact `provider/model` string from the payload — never guess or construct provider names.
