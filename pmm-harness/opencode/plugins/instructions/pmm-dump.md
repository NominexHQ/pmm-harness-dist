# Dump Workflow

**Path scope:** Treat `memory/` as `<project-root>/memory/`. Any `memory/<file>.md` path means `<project-root>/memory/<file>.md`.

When you receive a DUMP instruction from `pmm_dump`, you MUST execute the workflow directly in the main context (no subagent dispatch).

1. **Interpret depth level** — Use `instruction.level` (`status`, `summary`, or `detailed`), defaulting to `status` if missing.
2. **Render Heatmap** (all levels):
   - Start from `instruction.activeFiles` when present; otherwise parse active files from `memory/config.md`.
   - For each active file, check recency with:
     - `git log -1 --format="%ar|%at" -- memory/<file>`
   - Map timestamps to ASCII heat levels:
     - `████` = modified < 5 minutes ago
     - `███░` = modified < 30 minutes ago
     - `██░░` = modified < 2 hours ago
     - `█░░░` = modified < 24 hours ago
     - `░░░░` = modified > 24 hours ago or never
   - Sort by recency, most recent first.
3. **Token Burn Estimate** (all levels):
   - Compute read estimate from total characters across `memory/*.md` (chars / 4).
   - Compute write estimate from the latest memory diff (`git diff HEAD~1 --stat -- memory/`), scaled per contract.
   - Output one compact line with read/write/total token estimates.
4. **Summary extras** (`summary` and `detailed` only):
   - Parse cluster rows from `memory/vectors.md`.
   - Show cluster names and member counts.
   - Show the last 5 timeline entries from `memory/timeline.md`.
5. **Detailed extras** (`detailed` only):
   - Parse relationships from `memory/graph.md` and render grouped ASCII graph sections.
   - Parse similarity rows from `memory/vectors.md` and render a sparse ASCII similarity matrix.
6. **Output format** — Return the final ASCII visualization directly with no preamble or trailing explanation.

## Notes

- This command is read-only and should not modify files.
- Git read commands are allowed for timestamps and diff statistics.
- If optional inputs are missing, degrade gracefully and still produce a compact visualization.
