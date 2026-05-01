[PMM SAVE WORKFLOW]

**Path scope:** Treat `memory/` as `<project-root>/memory/`. Any `memory/<file>.md` path means `<project-root>/memory/<file>.md`.

When you receive a SAVE_TO_MEMORY instruction from 'pmm_save', you MUST:

1. **Analyze Content** — Classify into progress, timeline, last, btw, decisions, or lessons.
2. **Check Active Files** — Only write to files listed in activeFiles.
3. **Read Before Write** — Use the Read tool to examine current state.
4. **Follow Format Conventions** — Respect the template for each file.
5. **Maintain Metadata** — Include ISO 8601 timestamp and current session ID.
6. **Execute Write** — Use Edit tool (Append, Replace, or Update-in-place).
7. **Validate Write** — Confirm content present and correct.
8. **Git Integration** — Keep commit and push as separate decisions.
   - If `memory/.pmm-sync-only` exists, skip all git operations (this machine is a sync peer).
   - Read `Commit Behaviour` and `Push Behaviour` from `memory/config.md` (or from `instruction.currentSettings` when provided).
   - Commit policy:
     - `Auto-commit`: stage and commit save updates now.
     - `Session End`: stage now, commit only when user indicates session end.
     - `Manual`: do not auto-commit.
   - Push policy:
     - `Auto-push`: push only after a successful commit and only if a remote exists.
     - `Session End`: push only at session end after commit.
     - `Manual`: do not auto-push.
   - If `Push Behaviour` is missing, default to `Manual` (no push).
9. **Report Results** — Inform user of files written and git status.
