# vera:plugin-update

Updates local .opencode/ plugins from the agentic-harness-dev distribution artifact.

## Upstream repo
git@github.com:NominexHQ/agentic-harness-dev.git

## Consumer flow
Shallow clone from upstream → diff against local .opencode/ → stash → copy → verify → commit → cleanup clone

The tool does NOT depend on a local agentic-harness-dev/ checkout. It clones fresh
to a temp directory every time, ensuring the source is always the latest upstream.

## Developer flow (reverse — not this tool)
.opencode/ (edit) → make build → agentic-harness-dev/ → push

## Instruction precedence
config/instructions/ (user override) > .opencode/plugins/instructions/ (default)

Instruction files have two portions:
- **Header** (managed): tool contract, triggers, workflow steps, format spec — updated by upstream
- **User-customisable**: custom prompts, local rules, project-specific tweaks — user-owned

This tool updates defaults only. User overrides in config/instructions/ are never touched.
When a default changes and a user override exists, the tool flags a conflict with resolution
options in the payload.

## Conflict resolution

When the payload contains conflicts, present each to the user with these options:
1. **ignore** — keep user override as-is, do nothing
2. **merge** — update the header portion from upstream, preserve user-customised portion (read both files, splice intelligently)
3. **overwrite** — replace user override entirely with new default (destructive — user loses customisations)
4. **review** — show the diff between upstream default and user override, let user decide

The payload includes `upstreamContent`, `overrideContent`, and `previousDefaultContent` for
each conflict — use these to perform the merge or show the diff.

## Safety
- Git stash preserves local .opencode/plugins/ state before overwrite
- Verification checks all copied files exist and are non-empty
- On failure: automatic rollback via git checkout + stash pop
- On success: stash stays (recoverable via git stash list, does not auto-pop)

## After successful update
Commit the changes: `git add .opencode/plugins/ && git commit -m "chore: update .opencode plugins from agentic-harness-dev"`

## When clone is needed
If agentic-harness-dev/ doesn't exist, the tool returns CLONE_REQUIRED.
Ask the user before cloning — they may have a different checkout location.
