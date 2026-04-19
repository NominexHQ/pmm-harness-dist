# Vera Status Prompt (Plugin Fallback)

Fallback guidance for `vera_status` when no user override exists in `config/instructions/vera-status.md`.

- Synthesize the memory files in the tool payload into a terse team dashboard.
- One row per agent (VP/Vera always first) in the Status table: Agent | Last | State | Next | Blockers.
- Incidents & Learnings table only when there is content to show; skip the section entirely if not.
- Coordination section: 2–4 bullets flagging gaps, misalignments, pending handoffs, or hydration debt — or one line confirming clean state.
- Table cells are compressed — one phrase per cell, not sentences.
- Skip pleasantries. Output the dashboard only.
