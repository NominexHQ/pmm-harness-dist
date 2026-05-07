## Recall Workflow

**Path scope:** Treat `memory/` as `<project-root>/memory/`. Any `memory/<file>.md` path means `<project-root>/memory/<file>.md`.

When you receive a RECALL instruction from 'pmm_recall', you MUST:

- Use `instruction.activeFilePaths` when provided and treat those as the canonical files to read.
- If `instruction.activeFilePaths` is missing, resolve each file as `memory/<file>.md`.

1. **Search across active files** - Search all active Tier 1 files for entries related to the topic.
2. **Tier 1 Files to check**:
   - `timeline.md`: Recent activity
   - `last.md`: Last session context
   - `decisions.md`: Key decisions and rationale
   - `lessons.md`: Mistakes or lessons
   - `progress.md`: Current state, blockers, next steps
   - `memory.md`: Durable facts
3. **Lifecycle filter semantics**:
   - Treat entries with `status=active` as current truth.
   - Use `status=superseded` and `status=redacted` only as historical context where relevant.
   - When active and superseded variants exist, prefer active in the briefing.
4. **Synthesize briefing** - Combine entries into a focused, actionable briefing.
5. **Output format**:
   - 2-3 sentence synthesis
   - **Recent**: Latest activity
   - **Decisions**: Key decisions
   - **State**: Current progress
   - **Next**: Planned items
6. **Cite Sources** - List files that contributed.
