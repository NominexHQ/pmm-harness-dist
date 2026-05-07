## timeline.md
### Timeline
Chronological record of key events
Format: append

Lifecycle metadata convention (applies across memory files):
- `<!-- pmm-meta: id=<id> status=<active|superseded|redacted> supersedes=<id|none> superseded_by=<id|none> ts=<ISO8601> -->`
- Replacements are explicit: prior entry becomes `superseded`, replacement entry is `active` and points back via `supersedes`
- Redactions are explicit: use `status=redacted` and mask sensitive values as `[REDACTED:<type>]`

## progress.md
### Progress
Current state and milestones
Format: update-in-place

## last.md
### Last Session
Recent actions
Format: replace

## decisions.md
### Decisions
Committed decisions
Format: append

Conventions:
- Include lifecycle metadata for each decision entry
- Reversal entries should explicitly set `supersedes=<prior-id>`

## lessons.md
### Lessons
Mistakes learned
Format: append

## threads-open.md
### Threads Open
Active threads: tasks, blockers, pending questions, and unresolved decisions
Format: update-in-place

Conventions:
- Prefer one entry per thread with a stable title/id
- Track: status (open/blocked), last-updated, next-step

## threads-closed.md
### Threads Closed
Resolved threads and completion records
Format: append

Conventions:
- Append when a thread is closed
- Include closure timestamp and short resolution outcome
