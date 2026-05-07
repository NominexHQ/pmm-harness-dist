# PMM Initialization Plan

**Path scope:** Treat `memory/` as `<project-root>/memory/`. Any `memory/<file>.md` path means `<project-root>/memory/<file>.md`. Do not place PMM memory markdown files under `pmm/`.

## Immediate Action Required: Execute Initialization Plan

Preflight gate:

- First, run `pmm_init` (or use its latest result if already available).
- If result is `INSTALL`: run **INSTALL mode** below.
- If result is `MANAGE`: run **UPDATE mode** only when the user asks to install/update/sync PMM instructions. Otherwise stop and offer management actions.

You MUST act as a single orchestrator using one of these modes:

### INSTALL mode

1. **Resolve Init Profile:** Determine init profile in this order:
   - If `instruction.requestedProfile` is one of `lite|balanced|power`, use it.
   - Otherwise ask the user with `question` tool using a single tab:
     - header: `Profile`
     - question: `Choose your PMM initialization profile.`
     - options:
       - `lite` — smallest context and model footprint
       - `balanced` — daily-use default
       - `power` — full pre-set profile
       - `power-user-wizard` — interactive full configuration flow
   - Do NOT run `[INIT_QUESTIONS]` unless `power-user-wizard` is selected.
2. **Read Templates:** Read the markdown file at `[MEMORY_TEMPLATES_PATH_DEFAULT]` to get content for memory files.
3. **Scaffold Directories:** Create `memory/` and `config/instructions/` in the project root.
4. **Write Config:** Create `memory/config.md`:
   - If profile is `lite|balanced|power`, copy from `.opencode/plugins/instructions/pmm-config-<profile>.md`.
   - If profile is `power-user-wizard`, map questionnaire answers to config format.
5. **Create Memory Files:** For each active file, write its content using the templates.
   - Always ensure `threads-open.md` and `threads-closed.md` are created.
6. **Seed Instruction Overrides:** Copy default PMM instruction files from `.opencode/plugins/instructions/` into `config/instructions/`.
7. **Initialize Root Runtime Files:** Ensure both `AGENTS.md` and `CLAUDE.md` exist at project root using `pmm-template-agent.md` and `pmm-template-claude.md` from the active instruction source.
   - If file does not exist: create from template.
   - If file exists: update only the managed system section between `<!-- PMM_SYSTEM_START -->` and `<!-- PMM_SYSTEM_END -->`.
   - If file exists but has no managed markers: prepend the managed system section from template to the top of file and preserve existing content as custom/user section.
8. **Copy PMM Assets:** Create `{instruction.assetsTargetDir}` if it does not exist. Copy all files from `{instruction.assetsSourceDir}` into it (specifically `pmm-viz-template.html` and `d3.v7.min.js`). Do not overwrite files that already exist.
9. **Git Integration:** Stage and commit the new/updated `memory/` and root instruction files.
10. **Success:** Tell the user PMM is ready and include which profile was applied.

### UPDATE mode (MANAGE)

1. **Ensure Override Directory:** Ensure `config/instructions/` exists.
2. **Update Non-User Instruction Files:** Refresh these files in `config/instructions/` from `.opencode/plugins/instructions/`:
   - `pmm-system.md`
   - `pmm-init.md`
   - `pmm-hydrate.md`
   - `pmm-save.md`
   - `pmm-recall.md`
   - `pmm-query.md`
   - `pmm-status.md`
   - `pmm-dump.md`
   - `pmm-settings.md`
   - `pmm-update.md`
   - `pmm-viz.md`
   - `pmm-system-tweaks.md`
   - `pmm-init-questions.json`
   - `pmm-hydrate-questions.json`
   - `pmm-settings-questions.json`
   - `pmm-template-agent.md`
   - `pmm-template-claude.md`
3. **Update Root Runtime Files:** For project-root `AGENTS.md` and `CLAUDE.md`, refresh the managed system section.
   - If file exists with PMM markers: replace only the managed section.
   - If file exists without PMM markers: prepend managed system section.
   - If file is missing: create from template.
4. **Copy PMM Assets:** Create `{instruction.assetsTargetDir}` if it does not exist. Copy any missing files from `{instruction.assetsSourceDir}` into it (specifically `pmm-viz-template.html` and `d3.v7.min.js`). Do not overwrite files that already exist.
5. **Preserve User Memory Content:** Do not regenerate user memory content files unless explicitly requested.
6. **Git Integration:** Stage and commit only files changed by the update.
7. **Success:** Tell the user instruction defaults were synced into `config/instructions/` and root runtime headers were updated.
