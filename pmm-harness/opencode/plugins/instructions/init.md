# PMM Initialization Plan

## Immediate Action Required: Execute Initialization Plan

Preflight gate:

- First, run `pmm_init` (or use its latest result if already available).
- If result is `INSTALL`: run **INSTALL mode** below.
- If result is `MANAGE`: run **UPDATE mode** only when the user asks to install/update/sync PMM instructions. Otherwise stop and offer management actions.

You MUST act as a single orchestrator using one of these modes:

### INSTALL mode

1. **Read Templates:** Read the markdown file at `[MEMORY_TEMPLATES_PATH_DEFAULT]` to get content for memory files.
2. **Scaffold Directories:** Create `memory/` and `memory/instructions/` in the project root.
3. **Write Config:** Create `memory/config.md`. Map the user's choices to the config format.
4. **Create Memory Files:** For each active file, write its content using the templates.
5. **Seed Instruction Overrides:** Copy default PMM instruction files from `.opencode/plugins/instructions/` into `memory/instructions/`.
6. **Initialize Root Runtime Files:** Ensure both `AGENT.md` and `CLAUDE.md` exist at project root using `template-agent.md` and `template-claude.md` from the active instruction source.
   - If file does not exist: create from template.
   - If file exists: update only the managed system section between `<!-- PMM_SYSTEM_START -->` and `<!-- PMM_SYSTEM_END -->`.
   - If file exists but has no managed markers: prepend the managed system section from template to the top of file and preserve existing content as custom/user section.
7. **Copy PMM Assets:** Create `{instruction.assetsTargetDir}` if it does not exist. Copy all files from `{instruction.assetsSourceDir}` into it (specifically `pmm-viz-template.html` and `d3.v7.min.js`). Do not overwrite files that already exist.
8. **Git Integration:** Stage and commit the new/updated `memory/` and root instruction files.
9. **Success:** Tell the user PMM is ready.

### UPDATE mode (MANAGE)

1. **Ensure Override Directory:** Ensure `memory/instructions/` exists.
2. **Update Non-User Instruction Files:** Refresh these files in `memory/instructions/` from `.opencode/plugins/instructions/`:
   - `system.md`
   - `init.md`
   - `hydrate.md`
   - `save.md`
   - `recall.md`
   - `query.md`
   - `status.md`
   - `dump.md`
   - `settings.md`
   - `update.md`
   - `viz.md`
   - `system-tweaks.md`
   - `init-questions.json`
   - `hydrate-questions.json`
   - `settings-questions.json`
   - `template-agent.md`
   - `template-claude.md`
3. **Update Root Runtime Files:** For project-root `AGENT.md` and `CLAUDE.md`, refresh the managed system section.
   - If file exists with PMM markers: replace only the managed section.
   - If file exists without PMM markers: prepend managed system section.
   - If file is missing: create from template.
3. **Copy PMM Assets:** Create `{instruction.assetsTargetDir}` if it does not exist. Copy any missing files from `{instruction.assetsSourceDir}` into it (specifically `pmm-viz-template.html` and `d3.v7.min.js`). Do not overwrite files that already exist.
4. **Preserve User Memory Content:** Do not regenerate user memory content files unless explicitly requested.
5. **Git Integration:** Stage and commit only files changed by the update.
6. **Success:** Tell the user instruction defaults were synced into `memory/instructions/` and root runtime headers were updated.
