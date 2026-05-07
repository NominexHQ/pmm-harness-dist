[PMM SAVE WORKFLOW]

**Path scope:** Treat `memory/` as `<project-root>/memory/`. Any `memory/<file>.md` path means `<project-root>/memory/<file>.md`.

When you receive a SAVE_TO_MEMORY instruction from 'pmm_save', you MUST:

1. **Analyze Content** — Classify into progress, timeline, last, btw, decisions, lessons, `threads-open`, or `threads-closed`.
2. **Check Active Files** — Only write to files listed in activeFiles.
3. **Read Before Write** — Use the Read tool to examine current state.
4. **Follow Format Conventions** — Respect the template for each file.
5. **Maintain Metadata** — Include ISO 8601 timestamp and current session ID.
6. **Execute Write** — Use Edit tool (Append, Replace, or Update-in-place).
7. **Validate Write** — Confirm content present and correct.
8. **Supersede/Redact Lifecycle Rules** — Apply explicit lifecycle metadata across memory files:
   - Use metadata comment format:
     `<!-- pmm-meta: id=<id> status=<active|superseded|redacted> supersedes=<id|none> superseded_by=<id|none> ts=<ISO8601> -->`
   - When new information replaces old information, do NOT silently overwrite history.
   - Mark replaced entry `status=superseded` and set `superseded_by=<new-id>`.
   - Mark replacement entry `status=active` and set `supersedes=<old-id>`.
   - If sensitive values must be removed, mark entry `status=redacted` and replace value with `[REDACTED:<type>]` while preserving non-sensitive context.
   - Default retrieval semantics: `status=active` is current truth; superseded/redacted entries are historical context.
9. **Thread Routing Rules** — Apply these rules when thread files are active:
   - New or ongoing work items (tasks, blockers, pending questions/decisions) go to `threads-open.md`.
   - Resolved/completed items go to `threads-closed.md`.
   - If an item moves from open to closed, remove or mark closed in `threads-open.md` and append a closure entry to `threads-closed.md`.
   - Avoid duplicate open entries by matching on a stable thread title/id when available.
   - Keep thread metadata concise: `status`, last-updated timestamp, and next step or resolution note.
10. **Git Integration** — If `memory/.pmm-sync-only` exists, skip all git operations (this machine is a sync peer). Otherwise, run 'git add memory/', commit with meaningful message, and push if remote exists.
11. **Report Results** — Inform user of files written and git status.
