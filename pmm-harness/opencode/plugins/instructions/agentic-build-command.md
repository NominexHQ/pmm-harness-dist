# Agentic Build Command

You have received an `INSTRUCTION_READY` payload from `agentic_build_command`.
Your job is to collaborate with the user to design and build a well-specified
OpenCode plugin command.

## Collaboration Philosophy

This is a human-LLM collaboration — not an automated pipeline. Read the user and
adapt. Tone, pacing, depth, and question style should match what they bring in.
Someone with a half-formed idea needs space to think; someone with a detailed brief
needs focused confirmation. Own the conversational choices throughout. No mechanical
checklists, no robotic step-by-step narration. Move when you have enough; ask when
it matters.

## Understand the Runtime First

Before designing anything, develop a working understanding of the OpenCode plugin
system in the context of this project:

- Read the existing plugin files listed in the payload (`existingPlugins`) to
  understand the patterns already in use: hook types, tool factory usage, Zod arg
  schemas, INSTRUCTION_READY response shape, system context injection.
- Refer to https://opencode.ai/docs/plugins/ for the canonical hook and tool API.
- If the command involves integrating with an external service, domain pattern, or
  technology you are not certain about, use a web search to close that gap.

This groundwork informs the whole design. Don't skip it.

## Spec Process

Gather what you need to design the command well:

- **Purpose**: what problem does this solve? When would the user invoke it?
- **Arguments**: what does the user pass in? What is optional vs. required?
- **Expected output**: what does the tool return? What does the LLM do with it?
- **Edge cases**: what can go wrong? What should be returned when it does?
- **Expected invocation results**: concrete happy-path experience; concrete error-path.

Use judgment on how to elicit this. If the requirements payload has enough, confirm
and proceed. If not, ask — keep it focused. One well-aimed question beats a form.

## File Placement Decision

As part of spec, decide where the new command lives. The default is a new plugin
file — clean, well-scoped, no risk of affecting existing commands.

If the user wants to add to an existing plugin file, read and fully understand that
plugin's surface area first: all commands, helpers, shared state, hooks, and any
coupling between them. Only then propose where the command fits and surface any
integration concerns.

## Refactor Guard

If adding to an existing plugin file requires refactoring it, that requires
explicit, informed user consent. Before any refactor proceeds, tell the user:

- Why the refactor is needed
- Which other commands in that file are affected
- What the risks are (behavior changes, regressions, load-order effects)

Raise this in both the spec phase and again if it resurfaces during implementation.
Minimum viable change only — no opportunistic improvements.

## Spec Confirmation

Before writing any code, surface what you understood and what you plan to build.
This is a natural check-in, not a formal gate. The form is your call — paragraph,
short list, whatever fits the conversation. The user corrects or confirms; then you
proceed.

## Smoke Test

Define at least one concrete invocation scenario before calling the command done:

- Inputs (args passed to the tool)
- Expected output JSON from `execute()`
- What the LLM should do with that output

Validate the command logic against this scenario. How you frame it is your call.

## Plugin Conventions for This Project

- **Tool factory**: `tool({ description, args, execute })` from `@opencode-ai/plugin`
- **Args**: Zod schema via `z.string()`, `z.enum()`, `.optional()`, `.describe()`
- **execute() is thin**: gather context, return an INSTRUCTION_READY JSON payload —
  the LLM handles the substantive work, not the function
- **Instruction file pairing**: every non-trivial command has a paired instruction
  file at `.opencode/plugins/instructions/{plugin}-{command}.md`
- **Override system**: `config/instructions/` → `.opencode/plugins/instructions/`
  → hardcoded DEFAULT_* string in the plugin file
- **Tool naming**: `{plugin}_{command}` (e.g. `agentic_build_command`, `vera_btw`)
- **Instruction file naming**: `{plugin}-{command}.md`
- **System context injection**: new commands should be surfaced in the plugin's
  `experimental.chat.system.transform` hook so the LLM knows they exist
- **No filesystem writes in execute()** unless strictly necessary to surface context
  (reading files to populate the payload is fine)

## Output Deliverables

When spec is confirmed and the design is solid:

1. TypeScript tool definition — ready to insert into the target plugin file
2. Paired instruction `.md` file — complete and ready to write to
   `.opencode/plugins/instructions/`
3. System context snippet — describing the new tool and its invocation trigger,
   to be added to `agentic-system.md` (or the relevant plugin's system file)
4. Optionally: a stub entry for a `plugin_info` tool if the target plugin has one

Present these clearly so the user can review before anything is written to disk.
