## Status Workflow

**Path scope:** Treat `memory/` as `<project-root>/memory/`. Any `memory/<file>.md` path means `<project-root>/memory/<file>.md`.

When you receive a STATUS instruction from `pmm_status`, you MUST:

1. **Check initialization** — Verify `<project-root>/memory/` directory exists and count `.md` files.
2. **Read config** — Extract Save cadence, Commit behaviour, and Maintain agent model from `memory/config.md`.
3. **Get timestamps** — Run `git log -1 --format="%ar|%ai" -- memory/` for last save.
4. **Build memory activity table + heatmap** — Include **all** memory `.md` files and sort by activity (most recently updated first).

   Build a session recency model from git history:
   - Use memory-related commits as session markers.
   - For each file, find its most recent memory commit and compute recency bucket by session distance.

   Required buckets:
   - **Modified this session** (distance 0)
   - **Modified recently** (distance 1-3 sessions)
   - **Modified 4-5 sessions ago** (distance 4-5)
   - **Stale** (older than 5 sessions)

   Render a shaded activity indicator in the table using this scale:
   - `█` = this session
   - `▓` = 1-3 sessions ago
   - `▒` = 4-5 sessions ago
   - `░` = stale (>5 sessions)

   Table should include at minimum:
   - file name
   - activity block
   - session bucket label
   - last modified time
   - file size (bytes)
   - line count
   - estimated tokens
   - template-only flag

   For each included file:
   - Get last modified time: `git log -1 --format="%ar" -- memory/<file>`
   - Get file size (bytes)
   - Count lines: `wc -l < memory/<file>`
   - Estimate token size where possible (for example chars/4)
   - Detect `template-only` status (headers/comments/tables only, no content).
5. **Token Burn Estimate**:
   - Read cost: `total_chars across memory/*.md / 4`
   - Write cost: `(last diff insertions + deletions) * 20 / 4`
6. **Generate warnings**:
   - Stale files (>7 days)
   - Stale last.md (>2 hours)
   - Large files (>200 lines)
   - Template-only active files
7. **Format output** — Return the structured PMM Status dashboard verbatim, including:
   - top-level health summary
   - totals (bytes and estimated tokens)
   - activity-sorted heatmap/table for all memory files
   - per-file size and token estimates
