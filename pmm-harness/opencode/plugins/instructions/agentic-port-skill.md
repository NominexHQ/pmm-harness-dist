# Agentic Port Skill

You have received an `INSTRUCTION_READY` payload from `agentic_port_skill`.
Your job is to translate a Claude Code skill into an equivalent OpenCode plugin
command, then build it. Two phases: understand first, build second.

## Phase 1: Understand the Skill

Develop a thorough understanding of the skill before designing its equivalent.
Use the audit dimensions — focused on "what does it do" rather than bug hunting:

1. **Purpose & intent** — what problem does this solve? who uses it?
2. **Contract** — args, invocation modes, triggers, preconditions, outcomes
3. **Communication style** — tone, verbosity, format
4. **Response patterns** — what it returns, error handling, edge cases
5. **End-to-end process** — step-by-step workflow
6. **Instruction content** — what the SKILL.md says, gaps, ambiguities
7. **Dependencies** — other skills, memory files, tools, external services
8. **Lifecycle** — session vs. one-shot, hook bindings (`hooksJson`)
9. **Skill interactions** — what it calls, what calls it (see `siblingSkillNames`)
10. **Resources & files** — reads, writes, side effects
11. **Settings & configuration** — what's configurable
12. **Permissions** — access requirements, security-relevant operations

Ask the user when something cannot be determined from the content alone.

Summarise your understanding before proceeding to Phase 2 — confirm with the user
that you have the skill right before you start designing its OpenCode equivalent.

## Phase 2: Choose Target & Translate

Start Phase 2 by choosing the OpenCode target for this skill. Three options:

**A. OpenCode Skill** — if the skill is primarily instruction text, invoked
on-demand by the main agent, and needs no context gathering at call time. No
TypeScript, no plugin required. Format:

```markdown
---
name: skill-name          # required: use existing dir name (from payload skill key)
description: One-sentence summary — 1–1024 chars.
---

<instruction content here>
```

Place at `.opencode/skills/<name>/SKILL.md`. The agent discovers it automatically
from `.opencode/skills/` (or global equivalents) and loads it via the native
`skill` tool. Check `existingSkills` in the payload for name conflicts.

**B. OpenCode Agent** — if the skill defines a persona, a distinct role, or
different tool permissions; or should run as a subagent invokable via `@mention`
or the Task tool. Format:

```markdown
---
description: What this agent does and when to invoke it.
mode: subagent             # primary | subagent | all
model: claude-sonnet-4-5  # optional — override per-agent
tools:                     # optional — allowlist
  - read
  - edit
permissions:               # optional — fine-grained
  internal: deny
  bash:
    allow: []
    deny: []
---

<agent system prompt here>
```

Place at `.opencode/agents/<name>.md`. Subagents are called by other agents;
primary agents are the main interface. Check `existingAgents` in the payload
for name conflicts.

**C. Plugin Command** — if the skill needs to read files, gather structured
context, or build a payload before the LLM acts. This is the standard path for
skills with meaningful `execute()` logic.

Confirm the target type with the user before designing the port.

---

Map the skill to the chosen target. For plugin commands, decide element by element:

- **Invocation** — Claude Code skills are CLI slash-commands (`pmm:save`). The
  OpenCode equivalent is a tool (`pmm_save`). What args does it take?
- **Instruction content** — SKILL.md content becomes the paired instruction file at
  `.opencode/plugins/instructions/{plugin}-{command}.md`
- **Context & references** — inform the instruction file and system context snippet;
  surface any key reference material the LLM will need at runtime
- **Hooks** — `hooksJson` may have equivalents via `experimental.chat.system.transform`
  or other hooks. Identify what carries over and what doesn't.
- **Dependencies** — skills that invoke sibling skills may require those to exist
  first in OpenCode. Surface as a dependency note, not a blocker.
- **Side effects** — decide what stays in `execute()` (thin: gather context only)
  vs. what the LLM handles. The OpenCode execute() should not perform writes.

## Agent & Bot Skills

If the skill uses agent dispatch, bot stamping, or subagent coordination — detect
this from the skill content before designing anything. Signals:
`vera:bot`, `vera:task`, `vera:sprint`, `@agent`, `run_in_background`,
bot YAML front-matter, template variables like `{{memory_root}}`.

Then look at `vera.ts` in `existingPlugins` — it contains `loadAgentDispatchContext()`,
the canonical OpenCode pattern for this. Study it before designing the port.

When the bot/agent is a stable persona with its own role and permissions that should
be reusable, prefer **target B (OpenCode Agent)**. When the bot is assembled
dynamically at call time from a runtime-resolved context, prefer **target C
(Plugin Command)** with `execute()` that reads the agent context.

Apply these translation mappings:

- **Bot stamping / agent dispatch** — `execute()` reads the target agent's `AGENTS.md`
  or `CLAUDE.md` (persona) plus session instructions, returns both in the payload.
  The main LLM executes inline, impersonating the agent using that context. No
  subagent is spawned. If the skill references named agents, check the payload's
  `contextFiles` and `references` for any roster or config included in the plugin
  itself — do not assume a project-specific memory structure.

- **Bot template variables** (`{{memory_root}}`, `{{model}}`, `{{git_author}}`) —
  resolve at `execute()` call time from available context (worktree, env, memory
  files), inject as concrete values in the payload.

- **Background/parallel execution** (`run_in_background: true`, multi-wave sprints)
  — OpenCode runs sequentially; the main LLM orchestrates what Claude Code would
  parallelise. Note the serialisation in the instruction file. Ask the user whether
  execution order matters for correctness.

- **Bot model selection** (`--model haiku`) — no direct OpenCode equivalent in
  `execute()`. Note it in translation notes as informational; the instruction file
  can mention it as a hint but it does not affect tool design.

Firm non-translatables — flag these explicitly and agree with the user before proceeding:
- **Isolated context per agent** — OpenCode has no context scoping between agents;
  all reads happen in the shared session. Skills that depend on context isolation
  (e.g., keeping agent A unaware of agent B's state) cannot be replicated.
- **Per-agent compaction** — each Claude Code agent maintains separate context across
  compaction boundaries. No equivalent in OpenCode.
- **True async background** — bots that run and return results asynchronously after
  the main conversation continues. Not possible; the tool call blocks.

- **What else doesn't translate** — any other Claude Code behaviours with no OpenCode
  equivalent (CLI-only flows, missing hook types). Flag and agree on skip/adapt/defer.

Present the translation plan before writing any code. Give the user a chance to
adjust scope, skip non-translatable parts, or change the design.

## Phase 3: Build

Once the translation plan is confirmed, follow the appropriate build workflow based
on the chosen target:

**Target A (OpenCode Skill):** Write the SKILL.md with valid frontmatter. No
TypeScript or plugin file needed. The `name` field must match the directory name
exactly. No system context snippet required — skills are instruction-only.

**Target B (OpenCode Agent):** Write the `.opencode/agents/<name>.md` with valid
frontmatter. Set `mode: subagent` unless it replaces the main interface. Add any
tool restrictions or model overrides only if clearly needed. No TypeScript required.
Include a system context snippet if this agent should appear in the parent plugin's
system file as a callable resource.

**Target C (Plugin Command):** Invoke `agentic_build_command` with the translation
plan as the `requirements` argument. Hand off the full design — tool name, args,
execute() context-gathering logic, instruction file content, and system context
snippet — as the requirements text. `agentic_build_command` will run its own
iterative spec-and-build workflow from there.

## Output Deliverables

One of three output variants depending on the chosen target:

**A — OpenCode Skill:**
1. `SKILL.md` — complete, ready to write to `.opencode/skills/<name>/SKILL.md`
2. Translation notes — what didn't map, deferred items, anything the user should know

**B — OpenCode Agent:**
1. Agent `.md` file — complete, ready to write to `.opencode/agents/<name>.md`
2. System context snippet — if the agent should appear in a parent plugin's system file
3. Translation notes — non-translatable parts, permissions rationale, model choice

**C — Plugin Command:**
1. TypeScript tool definition — ready to insert into the target plugin file
2. Paired instruction `.md` file — complete, ready to write
3. System context snippet — for the relevant plugin's system file
4. Translation notes — non-translatable parts, deferred dependencies, renamed
   concepts, anything the user should know before shipping
