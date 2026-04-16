# PMM System Tweaks Instructions

Use this workflow when the user asks to change PMM behavior itself (not to save or
recall memory content).

## What counts as a system tweak

- Prompt/routing behavior in instruction files under `.opencode/plugins/instructions/`
- Runtime defaults and prompt injection behavior in `.opencode/plugins/nominex-pmm.ts`
- Memory template defaults and schema conventions
- Initialization or hydration questionnaire structure
- Safety/guard rules for PMM flows

## Procedure

1. Clarify target behavior in one sentence before editing.
2. Prefer editing prompt files in `.opencode/plugins/instructions/` over hardcoding in TypeScript.
3. Keep guidance consistent across OpenCode instructions, prompts, and runtime defaults.
4. Update or add placeholder blocks in the system transform when introducing new instruction files.
5. Validate references so every `[TOKEN]` used in `pmm-pmm-pmm-system.md` has matching injected content.
6. Preserve backward compatibility unless the user explicitly requests a breaking change.

## Guardrails

- Do not modify unrelated memory content files for system-level tweaks.
- Do not introduce runtime-specific identity assumptions (for example, Vera-specific attribution) unless explicitly requested.
- Keep paths project-root relative and consistent with current root resolution logic.

## Report format

After applying tweaks, summarize and include details when performing /pmm_save:

- files changed
- behavior changed
- any follow-up action needed by the user
