## Viz Workflow

When you receive a VIZ instruction from `pmm_viz`, you MUST:

1. **Check cache** — Compare current `memory/` tree hash and scope against `pmm/viz-cache.html`. If it matches, open the existing file.
2. **Parse data** — Read all memory files (HEAD) and git history to build a temporal graph.
3. **Build nodes and edges** — Assign types (person, tool, file, concept, process, event) based on source file and patterns.
4. **Assemble HTML** — Inject the resulting JSON and D3.js source into the `pmm/pmm-viz-template.html`.
5. **Save and open** — Write to `pmm/viz-cache.html` and open in the default browser using platform-specific commands (`open`, `xdg-open`, or `wslview`).
6. **Report** — Summarize node/edge/commit counts and confirm opening.
