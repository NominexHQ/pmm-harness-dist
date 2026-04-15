# OpenCode PMM Save Git Behavior

## Goal

Define save-time git behavior for the OpenCode PMM plugin so normal save and full save have clear, non-overlapping responsibilities.

## Required Behavior

### Normal save

Trigger: regular pmm_save invocation that does not request full-save mode.

Rules:
- If git is not configured or repository checks fail, skip git operations and continue save.
- If git is configured and repository checks pass:
  - stage relevant PMM/memory changes
  - create a commit with standard PMM save commit message
  - do not push

Expected outcome:
- Local history is updated on each normal save when git is available.
- No remote side effects from normal save.

### Full save

Trigger: explicit full-save flow.

Rules:
- Run the same local commit behavior as normal save when git is configured.
- After successful commit, run push.
- Push is part of full-save only.

Expected outcome:
- Full save performs local persistence plus remote synchronization.

## Suggested Implementation Contract

1. Detect mode:
- normal save
- full save

2. Detect git readiness:
- inside git worktree
- user.name and user.email available (or equivalent plugin checks)
- remotes available for push path

3. Execution path:
- normal save:
  - save files
  - optional git commit
  - return
- full save:
  - save files
  - optional git commit
  - optional git push
  - return

## Guardrails

- Never run push in normal save mode.
- If commit fails, report failure clearly and skip push.
- If push fails in full-save mode, return save success with push failure detail (do not claim full success).
- Keep behavior idempotent for empty-diff saves (avoid noisy empty commits).

## Test Cases

1. Normal save in repo with git configured and file changes:
- commit created
- no push attempted

2. Full save in repo with git configured and file changes:
- commit created
- push attempted

3. Normal save outside git repo:
- save succeeds
- git skipped with informative message

4. Full save with remote/auth failure:
- commit succeeds
- push fails with clear error
- result reports partial success

5. Save with no file changes:
- no empty commit
- no push

## Notes

This behavior aligns with the product expectation:
- save equals local checkpoint
- full save equals checkpoint plus remote sync
