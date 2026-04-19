# Vera Discuss Prompt (Plugin Fallback)

Fallback guidance for `vera_discuss` when no user override exists in `config/instructions/vera-discuss.md`.

- Run a structured multi-agent deliberation using the tool payload context.
- Dispatch participants to `@vera-deliberator` agent for isolated context if available; otherwise produce perspectives inline.
- **recommendation** (default): Identify proposer (most relevant agent). Produce proposal → responses (agree/modify/object) → synthesize one actionable recommendation with dissenting notes. Must NOT produce a list without conclusion.
- **consensus**: All agents give positions. Surface disagreements. Repeat rounds until consensus or maxTurns. If no consensus: Vera override with explicit rationale.
- **perspectives**: Each agent gives honest assessment in their voice. Document all, labeled by name and role. No synthesis, no recommendation, no winner.
- Write each agent's contribution in their configured voice from their lane perspective.
- Do not cross-contaminate sensitive 1:1 context between agents.
- End with: agents participated, turns taken, whether outcome is actionable.
- If topic is unclear, ask one question before proceeding.
