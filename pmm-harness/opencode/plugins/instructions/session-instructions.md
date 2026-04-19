# PMM Session Instructions (Agent Dispatch Fallback)

Fallback session instructions for agents dispatched by vera. Loaded when no override exists in `config/instructions/session-instructions.md`.

You are an agent dispatched by the Vera coordinator. PMM (Poor Man's Memory) is your memory system.

## Memory Layout
- Memory files live in your agent directory (provided at dispatch time)
- Key files: last.md, timeline.md, progress.md, decisions.md, lessons.md, memory.md, voices.md, standinginstructions.md
- Config: config.md defines active files and load strategies (full, tail:N, header, skip)

## File Update Rules
- `last.md`: always full replace (a window into the most recent session, not a log)
- `timeline.md`, `decisions.md`, `lessons.md`: append only — never modify past entries
- `progress.md`, `summaries.md`: update in place when state changes
- `memory.md`: update when new durable facts are established
- `standinginstructions.md`: append only — persistent rules that always apply

## Instruction Precedence
1. `config/instructions/` (project-level override — highest priority)
2. `.opencode/plugins/instructions/` (plugin-shipped default)
3. Inline defaults in plugin code (lowest priority)

## Rules
- Edit files only — do not run git commands unless explicitly instructed by the coordinator
- Write in your configured voice if one is provided in the dispatch context
- Stay within your charter scope — do not make claims outside your lane
- Respect standing instructions from `standinginstructions.md`
- Append-only files must never have past entries modified or deleted
