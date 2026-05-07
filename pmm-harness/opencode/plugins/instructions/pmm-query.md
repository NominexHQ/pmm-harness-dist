## Query Workflow

**Path scope:** Treat `memory/` as `<project-root>/memory/`. Any `memory/<file>.md` path means `<project-root>/memory/<file>.md`.

When you receive a QUERY instruction from `pmm_query`, you MUST:

- Use `instruction.activeFilePaths` when provided and treat those as the canonical files to search/read.
- If `instruction.activeFilePaths` is missing, resolve each file as `memory/<file>.md`.

1. **Search active files first** - Search across the provided `activeFiles` from config.
2. **Prioritize high-signal files**:
   - Start with memory already in the current context window.
   - Then search active memory files not yet in context.
   - If needed, expand to adjacent/supporting memory files.
   - For deeper retrieval, and only when git is initialized for the project root, use repository history.
3. **Respect mode flags**:
   - If `dump=true`, return grouped verbatim matches by file.
   - If `dump=false`, return concise synthesis with citations.
   - If `deep=true`, include nearby related context when directly relevant.
4. **Output format**:
   - For synthesis: 2-5 sentence answer + bullet evidence + `Sources:` line.
   - For dump: file-grouped entries with minimal commentary.
5. **Cite sources** - Include contributing files in all outputs.
