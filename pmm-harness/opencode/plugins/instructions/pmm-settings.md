# Settings Workflow

**Path scope:** Treat `memory/` as `<project-root>/memory/`. Any `memory/<file>.md` path means `<project-root>/memory/<file>.md`.

When you receive a SETTINGS instruction from `pmm_settings`, you MUST:

1. **Read current config** — Use `instruction.currentSettings` when available, otherwise parse `memory/config.md` directly.
2. **Show current summary first** — Present a concise summary in Claude-style before asking anything:

   > **Current PMM settings:**
   > - Save cadence: [current]
   > - Commit behaviour: [current]
   > - Sliding window: [current]
   > - Verbosity: [current]
   > - Maintain model: [current]
   > - Readonly model: [current]
   > - Maintain strategy: [current]
   > - Session start: [current]
   > - Recall beyond window: [current]
   > - Active files: [count]
   > - Deactivated files: [list or none]
   > - Non-default load strategies: [list or all full]
3. **Present the tabbed dialog** — Use the `question` tool with `[SETTINGS_QUESTIONS]` and present all tabs in one pass.

   Required interaction rules:
   - Preserve the tab structure instead of collapsing into one long prose exchange.
   - Include current values in each tab prompt so the user can compare before changing anything.
   - Preserve `Default` and `Recommended` guidance exactly as shown in the option descriptions.
   - Treat unchanged tabs as intentional keep-current values.
4. **Ask targeted follow-ups only when needed**:
   - If the user selected a custom window mode, ask for exact timeline/summaries values.
   - If the user selected `Configure Manually` for load strategy, ask for per-file values using `full`, `head:N`, `tail:N`, `header`, or `skip`.
   - If the user activated files that are currently missing, note which files will be created from template.
5. **Update config file** — Write the selected values back to `memory/config.md` while preserving the existing section structure and comments.
6. **Hydrate newly activated files** — If new files were activated and do not exist yet, create them from templates and offer hydration from existing memory context.
7. **Commit changes when git is available** — If `instruction.gitStatus.canCommit=true`, stage and commit `memory/config.md` with `memory: update PMM configuration`.
8. **Confirm result** — Report which settings changed, which files were activated or deactivated, and whether any hydration follow-up is still recommended.
