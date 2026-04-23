[PMM SAVE WORKFLOW]
When you receive a SAVE_TO_MEMORY instruction from 'pmm_save', you MUST:

1. **Analyze Content** — Classify into progress, timeline, last, btw, decisions, or lessons.
2. **Check Active Files** — Only write to files listed in activeFiles.
3. **Read Before Write** — Use the Read tool to examine current state.
4. **Follow Format Conventions** — Respect the template for each file.
5. **Maintain Metadata** — Include ISO 8601 timestamp and current session ID.
6. **Execute Write** — Use Edit tool (Append, Replace, or Update-in-place).
7. **Validate Write** — Confirm content present and correct.
8. **Git Integration** — If `memory/.pmm-sync-only` exists, skip all git operations (this machine is a sync peer). Otherwise, run 'git add memory/', commit with meaningful message, and push if remote exists.
9. **Report Results** — Inform user of files written and git status.
