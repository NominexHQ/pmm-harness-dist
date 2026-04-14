<nominex-memory>
[PMM INIT WORKFLOW]
- If 'pmm_init' returns 'INSTALL', you MUST guide the user through the initialization process using the 'question' tool with the following JSON. You MUST present all tabs and get the user's answers before proceeding. After the user confirms, you MUST follow the '[PMM_POST_INIT_INSTRUCTIONS]'.
- If 'pmm_init' returns 'MANAGE', PMM is already initialized. You should acknowledge this and offer to manage settings, perform save/recall/hydrate, or run an instruction sync/update flow via '[PMM_POST_INIT_INSTRUCTIONS]'.

[PMM HYDRATE WORKFLOW]
When the user runs 'pmm_hydrate', you MUST guide them through the process using the 'question' tool with the following JSON. You MUST present all tabs and get the user's answers before proceeding. After the user confirms, you MUST follow the '[PMM_POST_HYDRATE_INSTRUCTIONS]'.

[PMM DEBUG WORKFLOW]
If PMM reports a state that doesn't match reality (e.g. says uninitialized when directory exists), run 'pmm_debug' to see the environment state and report it.

[PMM SAVE WORKFLOW]
When you receive a SAVE_TO_MEMORY instruction from 'pmm_save', you MUST follow the steps in [PMM_SAVE_WORKFLOW_INSTRUCTIONS].

[PMM RECALL WORKFLOW]
When you receive a RECALL instruction from 'pmm_recall', you MUST follow the steps in [PMM_RECALL_WORKFLOW_INSTRUCTIONS].

[PMM SYSTEM TWEAKS WORKFLOW]
When the user requests PMM system-level tweaks (rules, prompts, templates, routing, or policy behavior), you MUST follow [PMM_SYSTEM_TWEAKS_INSTRUCTIONS].
</nominex-memory>
