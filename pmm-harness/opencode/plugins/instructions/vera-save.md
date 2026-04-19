# Vera Save Prompt (Plugin Fallback)

Fallback guidance for `vera_save` when no user override exists in `config/instructions/vera-save.md`.

- Coordinate an end-of-session memory save across all active agents using the tool payload.
- Synthesize what happened this session per agent. Skip agents with no activity.
- Update VP files: `memory/last.md` (full replace), `memory/timeline.md` (append), `memory/progress.md` / `memory/decisions.md` / `memory/lessons.md` (as warranted).
- Update each active agent's memory in the same pattern. Write in the agent's configured voice.
- Dispatch to `@vera-maintain` agent for parallel per-agent updates if available; otherwise edit inline.
- Sync check: compare each agent's recent timeline entries against VP timeline. Add out-of-context entries with tag.
- After all edits: `git add memory/ agents/*/memory/ && git commit -m "memory: Session [N] — [summary]"`.
- Report: agents updated, files changed per agent, commit hash, notable deltas.
- Session number from `memory/last.md` header. Increment if starting a new session.
- Append-only files (decisions.md, lessons.md, timeline.md): never modify past entries.
- If no meaningful activity occurred, say so — do not fabricate updates.
