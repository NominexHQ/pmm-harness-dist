<nominex-memory>
[PMM INIT WORKFLOW]
- 'pmm_init' returns a JSON payload with a `mode` field (`"INSTALL"` or `"MANAGE"`), plus `projectRoot`, `memoryDir`, `initRequiresQuestionnaire`, `initQuestionSet`, `instructionsOverrideDir`, `defaultInstructionsDir`, `assetsSourceDir`, and `assetsTargetDir`.
- If `mode` is `'INSTALL'`, you MUST guide the user through the initialization process using the 'question' tool with the following JSON. You MUST present all tabs and get the user's answers before proceeding. After the user confirms, you MUST follow the '[PMM_POST_INIT_INSTRUCTIONS]'.
- HARD GATE FOR INSTALL: Do not create or modify `memory/`, `memory/config.md`, memory markdown files, root runtime files, or instruction overrides until all INIT_QUESTIONS tabs are answered and the user has confirmed.
- If any required answer is missing (especially Core Memory, Sliding Window, or Custom File Selection when Core Memory is Custom), ask follow-up questions first and only then continue.
- If `mode` is `'MANAGE'`, PMM is already initialized. You should acknowledge this and offer to manage settings, perform save/recall/hydrate, or run an instruction sync/update flow via '[PMM_POST_INIT_INSTRUCTIONS]'.

[PMM HYDRATE WORKFLOW]
When the user runs 'pmm_hydrate', you MUST guide them through the process using the 'question' tool with the following JSON. You MUST present all tabs and get the user's answers before proceeding. After the user confirms, you MUST follow the '[PMM_POST_HYDRATE_INSTRUCTIONS]'.

[PMM DEBUG WORKFLOW]
If PMM reports a state that doesn't match reality (e.g. says uninitialized when directory exists), run 'pmm_debug' to see the environment state and report it.

[PMM SAVE WORKFLOW]
When you receive a SAVE_TO_MEMORY instruction from 'pmm_save', you MUST follow the steps in [PMM_SAVE_WORKFLOW_INSTRUCTIONS].

[PMM RECALL WORKFLOW]
When you receive a RECALL instruction from 'pmm_recall', you MUST follow the steps in [PMM_RECALL_WORKFLOW_INSTRUCTIONS].

[PMM QUERY WORKFLOW]
When you receive a QUERY instruction from 'pmm_query', you MUST follow the steps in [PMM_QUERY_WORKFLOW_INSTRUCTIONS].

[PMM STATUS WORKFLOW]
When you receive a STATUS instruction from 'pmm_status', you MUST follow the steps in [PMM_STATUS_WORKFLOW_INSTRUCTIONS].

[PMM DUMP WORKFLOW]
When you receive a DUMP instruction from 'pmm_dump', you MUST follow the steps in [PMM_DUMP_WORKFLOW_INSTRUCTIONS].

[PMM SETTINGS WORKFLOW]
When you receive a SETTINGS instruction from 'pmm_settings', you MUST follow the steps in [PMM_SETTINGS_WORKFLOW_INSTRUCTIONS] and use the tabbed question schema in [SETTINGS_QUESTIONS].

[PMM UPDATE WORKFLOW]
When you receive an UPDATE instruction from 'pmm_update', you MUST follow the steps in [PMM_UPDATE_WORKFLOW_INSTRUCTIONS].

[PMM DIRECTORY SETUP]

- PMM memory markdown files belong in `memoryDir` (project-root `memory/` by default), not in `pmm/`.
- The `pmm/` directory is only for PMM assets/cache artifacts (for example: viz HTML cache files, `pmm-viz-template.html`, `d3.v7.min.js`, and version/cache metadata).
- Before any workflow that writes to the `pmm/` directory (e.g. pmm_viz cache files), ensure the directory exists at `{projectRoot}/pmm/`. Create it if absent — do this silently without prompting the user.

[PMM VIZ WORKFLOW]
When you receive a VIZ instruction from 'pmm_viz', you MUST follow the steps in [PMM_VIZ_WORKFLOW_INSTRUCTIONS].

[PMM SYSTEM TWEAKS WORKFLOW]
When the user requests PMM system-level tweaks (rules, prompts, templates, routing, or policy behavior), you MUST follow [PMM_SYSTEM_TWEAKS_INSTRUCTIONS].
</nominex-memory>
