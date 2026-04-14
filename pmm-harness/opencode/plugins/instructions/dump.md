## Dump Workflow

When you receive a DUMP instruction from `pmm_dump`, you MUST:

1. **Interpret depth level** — Use the provided `level` (`status`, `summary`, or `detailed`).
2. **Generate Heatmap** (All levels):
   - For each active file: `git log -1 --format="%ar|%at" -- memory/<file>`
   - Map timestamps to ASCII blocks: `████` (<5m), `███░` (<30m), `██░░` (<2h), `█░░░` (<24h), `░░░░` (>24h).
3. **Token Burn Estimate** (All levels) — Single-line compact estimate of read/write/total tokens per save.
4. **Clusters + Timeline** (Summary and Detailed only):
   - Parse clusters from `vectors.md`.
   - Show last 5 entries from `timeline.md`.
5. **Graph Map + Similarity Matrix** (Detailed only):
   - Parse `graph.md` for ASCII node/edge representation.
   - Parse `vectors.md` for similarity matrix (sparse ASCII table).
6. **Output format** — Return the ASCII visualization directly without preamble.
