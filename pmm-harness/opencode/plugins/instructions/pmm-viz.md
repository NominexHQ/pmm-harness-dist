# Viz Workflow

**Path scope:** Treat `memory/` as `<project-root>/memory/`. Any `memory/<file>.md` path means `<project-root>/memory/<file>.md`.

When you receive a VIZ instruction from `pmm_viz`, execute the workflow directly in the main context (no subagent dispatch).

## Inputs

Use the tool payload:

- `instruction.scope` (`full`, `graph`, `clusters`, `timeline`; default `full`)
- `instruction.projectRoot`
- `instruction.memoryDir`
- `instruction.cachePath`
- `instruction.templatePath`
- `instruction.d3Path`

## Step 0 — Warn and confirm

Before doing any work, display this warning and ask the user to confirm:

> **Warning:** `pmm_viz` reads all memory files, samples up to 50 git commits, reads a D3 bundle and an HTML template, then writes a cache file. This can consume a significant number of tokens, especially in large projects.
>
> Scope requested: `{instruction.scope}`. Proceed?

Use the `question` tool (or equivalent confirmation mechanism) to present a Yes / No prompt.

- If the user answers **No** (or equivalent): stop immediately, return `pmm_viz cancelled.`, do not proceed.
- If the user answers **Yes** (or equivalent): continue to Step 1.

## Step 1 — Cache check

1. Compute the current memory tree hash:

```bash
git -C "{instruction.projectRoot}" rev-parse HEAD:memory 2>/dev/null
```

2. Scan for existing cache files matching `{instruction.projectRoot}/pmm/viz-*.html`. Sort lexicographically descending (newest timestamp first) and take the first match.

3. If a candidate exists, read its first line and check for:

```text
<!-- pmm-cache: HASH SCOPE -->
```

4. If hash and scope both match, open that existing file and return:

```text
Opened cached visualization ({filename}).
```

5. Otherwise proceed to Step 2. `instruction.cachePath` (the timestamped path supplied by the tool) is the write target for the new file.

## Step 2 — Parse HEAD memory data

Read all available `*.md` files under `instruction.memoryDir`. Skip missing or empty files.

Parse with these rules:

- `graph.md`: lines `[[A]] → relationship → [[B]]` become directed relationship edges; both sides are nodes.
- `vectors.md`:
  - `[[A]] ↔ [[B]] | score: X.XX | ...` become similarity edges (`weight=score`, type `similarity`).
  - `Cluster: name → [...] | theme: ...` populate cluster objects and member nodes.
- `assets.md`: first-column rows under People/Tools/Organisations tables become nodes (`person` or `tool`).
- `timeline.md`: dated entries become `event` nodes.
- `decisions.md`: decision entries become `concept` nodes.
- `processes.md`: `##` headings become `process` nodes.
- `lessons.md` and `standinginstructions.md`: entries become `concept` nodes.

Type priority if a node appears in multiple places:

1. People table → `person`
1. Tools/Organisations table → `tool`
1. Name ends in `.md` → `file`
1. decisions.md → `concept`
1. processes.md → `process`
1. timeline.md → `event`
1. fallback → `concept`

Deduplicate nodes by canonical ID.

## Step 3 — Reconstruct timeline from git history

1. Collect commits touching memory:

```bash
git -C "{instruction.projectRoot}" log --format="%H %at %s" -- memory/
```

1. Order oldest-first.
1. If more than 100 commits, sample down to about 50 while always keeping first and last.
1. For each commit, use lightweight parsing from `git show <hash>:memory/<file>` to collect node IDs and edge keys only.
1. Compute `firstSeen` and `lastSeen` for nodes and edges.
1. Build timeline entries:

```json
{"hash":"...","timestamp":1773650133,"message":"...","nodeCount":5,"edgeCount":3}
```

## Step 4 — Apply scope

- `full`: include everything.
- `graph`: only graph.md relationship edges and referenced nodes.
- `clusters`: only cluster members + similarity edges.
- `timeline`: only timeline event nodes + decision concept nodes + connecting edges.

## Step 5 — Build visualization JSON

Assemble:

```json
{
  "nodes": [],
  "edges": [],
  "clusters": [],
  "timeline": [],
  "metadata": {
    "generated": "ISO date",
    "treeHash": "HASH",
    "scope": "full|graph|clusters|timeline",
    "nodeCount": 0,
    "edgeCount": 0
  }
}
```

Populate `firstSeen` and `lastSeen` when available.

## Step 6 — Assemble HTML

1. Read `instruction.templatePath` and `instruction.d3Path`.
1. Replace `/*D3_PLACEHOLDER*/` with the D3 source.
1. Replace JSON placeholder block with the built visualization JSON.
1. Set first line cache marker:

```text
<!-- pmm-cache: {treeHash} {scope} -->
```

1. Write result to `instruction.cachePath`.

## Step 7 — Open and report

Open generated cache file by platform:

- macOS: `open`
- Linux: `xdg-open`
- Windows (Git Bash / native): `cmd.exe /c start "" "<absolute-path>"`
- WSL: `wslview` (or `cmd.exe /c start` fallback)

If auto-open fails, still return the absolute output path so the user can open it manually.

Return a concise summary:

```text
Generated PMM graph: X nodes, Y edges, Z commits in timeline.
Opened in browser: {instruction.cachePath}
If it did not open automatically, open this file manually: {instruction.cachePath}
```

## Guardrails

- Do not modify anything under `memory/`.
- Read-only git operations only (`rev-parse`, `log`, `show`).
- Write only `pmm/viz-cache.html`.
- If template or D3 source is missing, return a clear error and stop.
