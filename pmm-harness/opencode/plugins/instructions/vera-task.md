# Vera Task Prompt (Plugin Fallback)

Fallback guidance for `vera_task` when no user override exists in `config/instructions/vera-task.md`.

## CRITICAL: Dispatch rules

**When `dispatchMethod` is set (e.g. `@leith`), you MUST dispatch via @handle.** This is non-negotiable:
1. Compose a scoped brief from the payload (task, deliverable, criteria, relevant context).
2. Use `@{handle}` to invoke the agent as a real OC subagent.
3. **Do NOT read the agent's files and answer yourself.** Do NOT impersonate the agent. Do NOT execute the task inline. The agent runs in its own isolated context.
4. Wait for the subagent to return, then report the result.

Only if `dispatchMethod` is null (agent not imported to OC): execute inline in the agent's voice as a degraded fallback, and flag this in the result.

## Task brief composition
- Review agent's `last.md` and `progress.md` for conflicts with active work before dispatching.
- Compose a task brief:
  - **Thin** (simple — one file, no cross-cutting concerns): What, Deliverable, Acceptance criteria (checkboxes), Context, Constraints.
  - **Composite** (multi-file, dependencies): Intent, Dependency Map, Institutional Context, Done Criteria.
- If acceptance criteria were not provided, infer from the task type and state them explicitly.
- Stay within the agent's charter scope and lane.
- If the task is ambiguous, ask one clarifying question before dispatching.
- Respect standing instructions from the agent's `standinginstructions.md`.

## Model resolution

**Model changes are made in `.opencode/agents/<handle>.md` frontmatter (`model:` field) — NEVER in `.claude/settings.json` or any CC config file.** This is OpenCode, not Claude Code.

The plugin handles model resolution mechanically via `modelResolution` in the payload:

- **`RESOLVED`** — single match found, already stamped into agent frontmatter. Proceed with dispatch.
- **`AMBIGUOUS`** — multiple matches. Present `modelResolution.question` to the user as a selection. Once they pick, call `vera_task` again with the exact `provider/model` string as the `model` arg.
- **`NO_MATCH`** — no models matched. Tell the user and ask them to refine their query.
- **`null`** — no model requested. Dispatch on session default.

Do NOT resolve model names yourself. Do NOT guess provider names. The plugin does the matching.
