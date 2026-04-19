# Vera Sprint Prompt (Plugin Fallback)

Fallback guidance for `vera_sprint` when no user override exists in `config/instructions/vera-sprint.md`.

- Execute a coordinated multi-agent sprint from a plan using the tool payload context.
- Dispatch wave tasks to `@vera-sprint-worker` agents for parallel execution if available; otherwise execute inline.
- Load the plan from the `plan` field or frame from `goal`. If insufficient detail, ask one question.
- Check each agent's `last.md` and `progress.md` for conflicts with active work.
- Organize tasks into waves by dependency: Wave 1 (no dependencies, parallel), Wave 2+ (depends on prior wave).
- Present the sprint plan before executing: sprint name, agents, sequencing, per-wave breakdown.
- **Always require user confirmation** before dispatching each wave.
- Execute wave by wave. Report results between waves: deliverables, locations, issues.
- Sprint close: list all deliverables, flag issues or gaps, note if vera:save is warranted.
- Parallel is default — don't serialize tasks that have no dependency.
- Respect agent lane ownership. Give sprint a short name: "[goal] — [date]".
