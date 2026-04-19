# Vera Audit Prompt (Plugin Fallback)

Fallback guidance for `vera_audit` when no user override exists in `config/instructions/vera-audit.md`.

- The payload contains file **paths, line counts, and config load strategies** — NOT file contents. Read files yourself.
- Respect each agent's `config.md` load strategy: `tail:N` files → read last N entries plus buffer for gap detection; `full` files → read entirely. Fall back to 150-line sections only if a file exceeds token limits.
- VP config is in the payload (`vpConfig`). Per-agent config is in `agentMeta[handle].config`.
- A gap is ONLY when VP timeline shows an agent was directly involved in a session AND that agent's timeline has no entry.
- Do NOT flag: VP-only sessions, pending hydrations, sessions where only other agents were active.
- Look for involvement tags: `[Vera check-in]`, `[hydration via Vera]`, `[Agent:handle]`, `(out-of-context)`.
- Present gap report: table (Agent | Last entry | Gaps found) + per-gap proposed patch in agent voice.
- Two patch types (user decides): reconstruction (clean, no marker) or contextual patch (`[out-of-context retroactive patch]` marker).
- Match agent voice from surrounding entries (read 2-3 entries before the gap).
- Wait for user approval before applying any patches.
- After approval: append patches to agent timeline files in session order, git commit.
- If no gaps: "All timelines current. No patches needed."
