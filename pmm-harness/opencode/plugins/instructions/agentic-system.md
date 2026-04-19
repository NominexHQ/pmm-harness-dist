<agentic-plugin>
[AGENTIC PLUGIN]
The `agentic` plugin provides tooling for building OpenCode-specific assets —
commands, plugins, and agents — for this project.

[AGENTIC BUILD COMMAND WORKFLOW]
Call `agentic_build_command` whenever the user's intent points toward building or
extending something in the OpenCode plugin stack — regardless of exact wording.

Trigger on explicit invocations (`agentic_build_command`, "build a command", "create
a tool") but also on intent signals like:
- "I want to add X to the plugin"
- "can we make a command that does Y"
- "how would I build Z in OpenCode"
- describing a workflow gap that a new command would fill
- asking what it would take to automate something in OpenCode

When in doubt, call the tool — it is cheap and the payload gives you everything
needed to start the conversation. Do not ask the user to rephrase or use the exact
tool name. It returns an `INSTRUCTION_READY` payload. When you receive it, follow
[AGENTIC_BUILD_COMMAND_INSTRUCTIONS].

[AGENTIC AUDIT SKILL WORKFLOW]
Call `agentic_audit_skill` whenever the user's intent points toward understanding,
reviewing, or debugging a Claude Code plugin or skill — regardless of exact wording.

Trigger on explicit invocations (`agentic_audit_skill`, "audit this plugin",
"review the save skill") but also on intent signals like:
- "what does {skill} actually do"
- "something seems off with {plugin}:{skill}"
- "look at the pmm plugin"
- "can you check if this skill is correct"
- "I think there's a bug in {skill}"
- "walk me through how {skill} works"

Before calling the tool, infer the plugin and skill from context — recent mentions,
file paths, plugin names in the conversation, or what the user is clearly referring
to. Pass whatever you can determine as `plugin` and `skill` args. Only omit `plugin`
(triggering discovery) when it is genuinely ambiguous and cannot be inferred.

When in doubt, call the tool — call it without args to discover available plugins,
or with a plugin name to load its content. It returns a payload. When you receive
it, follow [AGENTIC_AUDIT_SKILL_INSTRUCTIONS].

[AGENTIC PORT SKILL WORKFLOW]
Call `agentic_port_skill` whenever the user's intent is to bring a Claude Code skill
or its equivalent behaviour into the OpenCode plugin stack.

Trigger on explicit invocations (`agentic_port_skill`, "port X skill") but also on
intent signals like:
- "make an OpenCode version of {skill}"
- "I want OpenCode to do what {plugin}:{skill} does"
- "convert the {skill} command to OpenCode"
- "add {skill} to the OpenCode plugin"
- "we have this in Claude Code, can we get it in OpenCode?"

Infer `plugin` and `skill` from context before calling. Both are required — if
either cannot be determined, ask the user before calling. It returns a payload.
When you receive it, follow [AGENTIC_PORT_SKILL_INSTRUCTIONS].
</agentic-plugin>
