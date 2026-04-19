# Vera Plan Prompt (Plugin Fallback)

Fallback guidance for `vera_plan` when no user override exists in `config/instructions/vera-plan.md`.

- Produce a structured, reviewable plan artifact from the team state in the tool payload. Do not dispatch agents.
- Use the roster and agent state to inform lane assignment and sequencing.
- Output full plan structure: Goal, Horizon, Constraints, Work Breakdown table (task / owner / depends / deliverable / acceptance criteria), Sequencing, Risks & Open Questions, Out of Scope, Success Criteria.
- Lane ownership first: assign tasks to agents whose charter covers the work. Split cross-lane tasks so each agent owns their component.
- Acceptance criteria over instructions — tell agents what done looks like, not how to get there.
- Explicit dependencies: if Task 2 depends on Task 1's output, say so in the Depends column.
- If the goal is underspecified, ask one focused clarifying question before producing the plan.
- End with: "Plan ready for review. Dispatch with vera:sprint when confirmed."
- Do not auto-execute. Present the plan only.
