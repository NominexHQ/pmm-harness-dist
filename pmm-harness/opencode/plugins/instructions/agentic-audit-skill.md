# Agentic Audit Skill

You have received a payload from `agentic_audit_skill`. Act on it based on
its `status` field:

## PLUGIN_DISCOVERY

No plugin could be inferred from context. The payload contains `availablePlugins` —
a list of all plugins findable from this project (harness + global cache), each with
a `name`, `source` (`harness` or `cache`), and `version`. Present the list to the
user and ask which plugin they want to audit. Once they answer, call
`agentic_audit_skill` again with `plugin` set to their choice.

## INSTRUCTION_READY

You have received the full content of a Claude Code plugin. Produce a
comprehensive audit covering all 12 dimensions below. If `skillFilter` is set
in the payload, focus on that skill — but keep the whole-plugin context in mind.

1. **Purpose & intent** — What problem does this plugin/skill solve? Who uses it?
   When is it invoked? What is it trying to accomplish?

2. **Contract** — Arguments, invocation modes, triggers, preconditions, expected
   outcomes. What must be true before it runs? What must be true when it's done?

3. **Communication style** — How does it talk to the user? Tone, verbosity, format,
   use of headers and sections. Does it match what the stated audience would expect?

4. **Response patterns** — What it returns, in what format, under which conditions.
   How does it handle errors, empty states, ambiguous inputs, or missing data?

5. **End-to-end process** — Step-by-step workflow from invocation to completion.
   Are the steps ordered correctly? Are any steps missing or unreachable?

6. **Instruction content** — What the SKILL.md says. Are the instructions clear?
   Complete? Internally consistent? Are there gaps the LLM would have to guess at?

7. **Dependencies** — Other skills invoked, memory files read or written, git
   operations, external tools or services, shell scripts. Are these explicit or
   implicit? Are there undocumented assumptions about what must exist?

8. **Lifecycle** — When is this invoked? Is it session-persistent or one-shot?
   How does it relate to hook bindings (`hooksJson`)? What triggers it — user intent,
   another skill, a hook event?

9. **Skill interactions** — What does it call? What calls it? Reference sibling
   skills from `siblingSkillNames` where relevant. Do not recursively audit sibling
   skills unless the user explicitly asks.

10. **Resources & files** — What it reads, writes, creates, or deletes. Side effects
    on the filesystem, memory store, or external state. Are side effects documented?

11. **Settings & configuration** — What is configurable? What uses hardcoded defaults?
    Are defaults reasonable? Is the configuration surface documented?

12. **Permissions model** — What access does it require? Any security-relevant
    operations? Does it validate inputs before using them in commands or file paths?

## Bug & Flaw Surfacing

For each issue found, assign a severity:

- **CRITICAL** — Makes the skill non-functional in its stated purpose. Examples:
  broken preconditions, missing required steps, unreachable states, instructions
  that contradict themselves fatally.

- **WARNING** — Ambiguous instructions, edge case risk, missing validation, implicit
  assumptions that could break under realistic conditions, gaps that require the LLM
  to guess.

- **NOTE** — Style issues, inconsistent terminology, incomplete coverage of minor
  paths, things that could be clearer without affecting correctness.

Do not propose fixes unless the user explicitly asks. For each issue: state it,
explain the concern, and cite the specific content that causes it.

## Clarification Questions

When something cannot be determined from the content alone — intended behavior for
an ambiguous path, an undocumented dependency, an implicit assumption — ask the
user. Keep questions purposeful and grouped. One well-aimed set of questions beats
ten scattered ones.

## Cross-Skill Depth

If a skill invokes other skills, note the dependency and what you observe about the
interaction. Do not recurse into sibling skill content unless the user asks.
Reference them by name from `siblingSkillNames`.

## Spec Deliverable

When all audit dimensions are covered and issues have been surfaced: produce a
structured narrative spec document. Choose a form that fits the plugin's complexity
and the user's evident needs — don't force a rigid template onto a simple skill.

At the end of the audit, explicitly seek user concurrence:
- Confirm the audit is complete
- Flag anything left unresolvable without further information
- Ask whether they want fixes or changes proposed
