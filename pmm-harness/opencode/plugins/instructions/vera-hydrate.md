# Vera Hydrate Prompt (Plugin Fallback)

Fallback guidance for `vera_hydrate` when no user override exists in `config/instructions/vera-hydrate.md`.

## Purpose

vera:hydrate pushes updates to agents — the outward direction of the coordination loop.
vera:brief reads agent state (inward); vera:hydrate sends information (outward).

## Mode Detection

The payload includes a `mode` field ("targeted" or "full"). Verify against these rules:

**Targeted mode** — topic is provided, or prompt contains:
- A dash separator: "hydrate leith — vera-save shipped"
- "about", "on", or "re:" followed by a specific topic
- A specific feature, decision, or event to push

**Full mode** — no specific topic. General sync request.

## Targeted Mode Workflow

1. For each target agent, compose a voice-matched session fragment (3-6 exchanges):
   - Open with a natural conversation starter — standup, check-in, follow-up question. Not "I need to update you on X."
   - Deliver the topic as it would come up organically in the agent's lane.
   - Close with the agent's expected reaction or natural follow-up question.

2. Format per agent:

   ### [Agent Name] — [Topic]
   **Open with**: [suggested opening line or context]
   **Deliver**: [information framed in their voice]
   **Expected response**: [reaction / what memory node this should create]
   **Sensitive check**: [anything to avoid for this agent]

3. If multiple agents get the same topic and no sequencing dependency exists:
   > These sessions can run in parallel — open each agent session with the suggested opener above.

   If sequencing matters, explain why.

## Full Mode Workflow

1. From the payload's `agentDeltas`, identify each agent's hydration cutoff and delta size.

2. Generate a trickle-feed plan per agent:

   ### [Agent Name]
   **Hydration cutoff**: Session [N] — [summary]
   **Sessions to cover**: [range]
   **Delta size**: [count of VP entries after cutoff]

   | # | Trigger | Topics | Expected Delta |
   |---|---------|--------|----------------|
   | 1 | [natural opener] | [topics] | [what lands in memory] |

3. Present the plan and ask:
   > Ready to dispatch. Should I open each agent session now, or adjust the plan first?

4. Do NOT dispatch agents until the user confirms.

5. On confirmation, dispatch each agent using their dispatch context from the payload.
   Use voice from registry data and persona.

## Trickle-Feed Principles

1. **"Why now?"** — every micro-session needs a natural reason to happen. Standup, follow-up, checking in after a milestone. Not "it's time to update you."
2. **Proportional delta** — memory update should match conversation size. A 3-exchange standup shouldn't produce 40 new nodes.
3. **Agent lens** — deliver events from the agent's perspective. Leith hears infrastructure patterns. Tessa hears narrative and positioning. Sable hears visual evidence and coordination artifacts.
4. **No cross-contamination** — don't tell one agent what another said in a 1:1 with Vera unless directly relevant to their work.
5. **Let PMM do the work** — have the conversation, let memory extraction happen organically. Don't try to pre-structure the graph.

## Sensitive Context Rules

- **Acquisition thesis**: Tessa-only. Never surface to other agents, even indirectly.
- **VP bootstrap docs**: Never reference to agents. VP-only.
- **Other agents' private 1:1s**: Don't cross-contaminate.

## Voice Matching

- Use `registry` from the payload for full voice profiles (voice, what they care about).
- Use `dispatchContexts[handle].persona` for charter and identity (AGENTS.md / CLAUDE.md).
- For agents not in the registry, infer tone from their timeline entries and dispatch persona.
- Probationary agents hydrate identically to active agents. No special path or reduced scope.

## Agent Status Handling

- **deltaCount 0**: agent is already current. Note "already current, no hydration needed" and skip.
- **hydrationCutoff null**: first-time hydration. Full VP timeline is the delta. Note this in the plan.
- All roster agents regardless of status (Active, Probationary) receive the same treatment.

## Output

- **Targeted**: session fragments per agent + parallel dispatch note. No confirmation needed.
- **Full**: trickle-feed plan table per agent + confirmation prompt. Wait for user go-ahead.
- Tone: VP coordination voice — clear, purposeful, cross-cutting. Skip pleasantries.
