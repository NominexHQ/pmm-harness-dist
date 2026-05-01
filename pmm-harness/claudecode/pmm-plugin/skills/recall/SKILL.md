---
name: pmm:recall
description: Context-switching recall — synthesizes a focused briefing on a topic from across all memory files. Use when switching workstreams or coming back to a topic.
argument-hint: "[topic]"
---

# pmm:recall

**Path scope:** Treat `memory/` as `<project-root>/memory/`. Any `memory/<file>.md` path means `<project-root>/memory/<file>.md`.

Context-switching primitive. When you're jumping between workstreams or coming back to a topic, `pmm:recall` reads across memory files and synthesizes a focused briefing — not raw search results, but working context you can act on immediately.

**Topic:** $ARGUMENTS

---

## Routing

### No arguments — session resume

If `$ARGUMENTS` is empty, produce a quick resume card:

1. Read `memory/last.md` and `memory/progress.md`
2. Synthesize a "where were we?" card:

```
## Session Resume

**Last**: [1-sentence summary from last.md — what happened most recently]
**State**: [current state from progress.md — active work, blockers]
**Next**: [top 2-3 items from progress.md next section]
```

Keep it under 10 lines. Ready to work from, not to read.

### With topic — focused recall

If `$ARGUMENTS` contains a topic, synthesize a focused briefing across all relevant files.

---

## Execution (topic mode)

### Step 1 — Read config

Read `memory/config.md`. Extract:
- `Session Start` → `Mode` and `bootstrap_wired`
- `Active Files` — which files are currently active

### Step 2 — Context-first routing

**If `Mode: lazy` AND `bootstrap_wired: true`** — memory files are already in context. Execute Steps 3–4 directly in the main context window without dispatching any agent.

Treat `Active Files` in `memory/config.md` as the source of truth for which files are in scope. Respect each file's load strategy (`full`, `head:N`, `tail:N`, `header`, `skip`):
- `skip`, `head:0`, and `tail:0` are deactivated for session-start recall scope
- `head:N`, `tail:N`, or `header` may require a targeted Read if deeper detail is needed for synthesis

Tier 2 files are loaded on demand based on topic needs (relationships, entities, classifications, archived thread detail), and only when relevant.

**If `Mode: eager` OR `bootstrap_wired: false`** — fall through to Agent Dispatch at the end of this document.

### Step 3 — Search across active files

Search config-active files for entries related to the topic (case-insensitive keyword match):

1. Build the search set from `Active Files` in `memory/config.md`:
   - Include files marked active
   - Exclude files with strategy `skip`, `head:0`, or `tail:0`
2. Search all included files already in context
3. If needed for better synthesis, use targeted Reads for files loaded as `head:N`, `tail:N`, or `header`
4. Load Tier 2 files only when topic signals indicate they are relevant

Use this role map to guide extraction quality (non-exhaustive, not a hardcoded scope list):

| File | What to look for |
|------|-----------------|
| `timeline.md` | Recent activity on this topic |
| `last.md` | Whether this topic was part of the last session |
| `decisions.md` | Key decisions made about this topic, with rationale |
| `lessons.md` | Mistakes or lessons related to this topic |
| `progress.md` | Current state, blockers, next steps for this area |
| `processes.md` | Active workflows or procedures for this topic |
| `standinginstructions.md` | Standing rules that apply to this topic |
| `memory.md` | Durable facts and context |
| `preferences.md` | User preferences relevant to this area |
| `voices.md` | Tone or reasoning lenses relevant to this area |
| `summaries.md` | Past session summaries mentioning this topic |
| `threads-open.md` | Active issues, projects, and task status on this topic |
| `threads-closed.md` | Archived outcomes and closure context on this topic |

For any other active file not listed above, still search it and extract relevant entries.

### Step 4 — Synthesize briefing

Combine all collected entries into a focused, actionable briefing. This is synthesis, not concatenation — weave information from multiple files into a coherent picture.

**Output format:**

```
## Recall: [topic]

[2-3 sentence synthesis — what you need to know to start working on this topic right now]

**Recent**: [latest activity from timeline.md and/or last.md]
**Decisions**: [key decisions with rationale, from decisions.md]
**Lessons**: [relevant lessons, if any, from lessons.md]
**State**: [current progress on this area, from progress.md]
**Next**: [what was planned or pending]

Sources: decisions.md, timeline.md, progress.md [list only files that contributed]
```

**Rules:**
- Keep output under 20 lines total
- Omit sections that have nothing relevant (e.g., skip **Lessons** if no lessons found for this topic)
- Cite source files inline in the `Sources:` footer
- Synthesize, don't dump — answer "catch me up on X" not "here are all mentions of X"
- If nothing found across any file: `No memory found for "[topic]". Try pmm:query [topic] for a deeper search with filters and traversal.`

---

## Agent Dispatch (eager mode / bootstrap not wired)

**Used only when `Mode: eager` OR `bootstrap_wired: false`.**

Dispatch a `general-purpose` agent using the `Readonly Agent Model` from `memory/config.md` (default: `haiku`). Replace `<project-root>` with the actual project root path and `<topic>` with `$ARGUMENTS`.

> Recall memory for a topic briefing. This is a READ-ONLY task — do not edit any files.
>
> **Project root:** `<project-root>`
> **Topic:** `<topic>` (empty = session resume)
>
> ### If topic is empty — Session Resume
>
> Read `<project-root>/memory/last.md` and `<project-root>/memory/progress.md`.
>
> Return:
> ```
> ## Session Resume
>
> **Last**: [1-sentence from last.md]
> **State**: [current state from progress.md]
> **Next**: [top 2-3 items]
> ```
>
> ### If topic is provided — Focused Recall
>
> 1. Read `<project-root>/memory/config.md` to get active files
> 2. Build scope from `Active Files` in config (include active, exclude `skip`, `head:0`, and `tail:0`)
> 3. Read files in scope; for `head:N`, `tail:N`, or `header`, do targeted reads if deeper detail is required
> 4. Read Tier 2 files only when topic signals indicate relationship/entity/classification/archive relevance
> 5. Search all read files for entries related to the topic (case-insensitive)
> 6. Synthesize a focused briefing:
>
> ```
> ## Recall: [topic]
>
> [2-3 sentence synthesis]
>
> **Recent**: [from timeline.md, last.md]
> **Decisions**: [from decisions.md]
> **Lessons**: [from lessons.md, if any]
> **State**: [from progress.md]
> **Next**: [what was planned]
>
> Sources: [files that contributed]
> ```
>
> Keep output under 20 lines for topic recall, under 10 for resume.
> Omit sections with no relevant entries.
> If nothing found: `No memory found for "[topic]". Try pmm:query [topic] for a deeper search with filters and traversal.`
>
> Return the formatted output as a string. Do not write to any file.

Output the agent's return value verbatim.

---

## Notes

- **Differentiation from pmm:query**: query is search (find specific things, filters, attribution, dump mode). recall is briefing (synthesize working context for a topic, actionable output). query answers "what did we decide about X?" — recall answers "catch me up on X so I can start working."
- Context-first path is the default when `session_start: lazy` and `bootstrap_wired: true`. This eliminates agent dispatch for in-window recall.
- Agent dispatch is the fallback for eager mode or unwired sessions — file reads happen inside the agent.
- Model selection follows `Readonly Agent Model` in `memory/config.md` (default: `haiku`). No reasoning required for read-only synthesis.
- For the full memory file reference, see `references/README.md`.
