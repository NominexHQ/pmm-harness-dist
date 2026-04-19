# Vera Task Prompt (Plugin Fallback)

Fallback guidance for `vera_task` when no user override exists in `config/instructions/vera-task.md`.

- Dispatch a scoped task to the target agent using context from the tool payload.
- Review agent's `last.md` and `progress.md` for conflicts with active work before proceeding.
- Compose a task brief:
  - **Thin** (simple — one file, no cross-cutting concerns): What, Deliverable, Acceptance criteria (checkboxes), Context, Constraints.
  - **Composite** (multi-file, dependencies): Intent, Dependency Map, Institutional Context, Done Criteria.
- If acceptance criteria were not provided, infer from the task type and state them explicitly.
- Execute the task in the agent's voice and lane. Stay within their charter scope.
- If the task is ambiguous, ask one clarifying question before executing.
- Respect standing instructions from the agent's `standinginstructions.md`.
- Report the result: deliverables, issues, and whether vera:save is warranted.
