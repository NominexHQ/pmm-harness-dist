# Vera Audit Docs

You have received an `INSTRUCTION_READY` payload for the `vera_audit_docs` tool.
This workflow detects and repairs documentation drift — places where docs have fallen
behind the actual state of the project.

## Inputs

- `instruction.dryRun`: Controls apply behaviour. Infer if not set:
  1. Explicit `instruction.dryRun` — use it.
  2. Invocation contains `--dry-run` — treat as true.
  3. Default: **true** (safe by default).
- `instruction.projectRoot`: The root of the project.

## Workflow

### Step 1 — Resolve VP memory dir

Read `config/agents.md`. Find the vera row, extract `memoryDir`. Fall back to `"memory"` if
not found. All memory-dir references below use this resolved path.

Assets file: `{vpMemoryDir}/assets.md`

### Step 2 — Run checks

Run all checks. Collect findings before triaging.

#### 2a. assets.md coverage

1. Read `{vpMemoryDir}/assets.md`.
2. Scan these directories for entities that should appear in the asset tables:
   - `agents/` — agent subdirectories (one per handle)
   - `.opencode/plugins/` — OC plugin files (`.ts`, `.js`)
   - `scripts/` — shell scripts and utilities
3. For each entity found, check whether it appears (by name) in any assets.md table row.
4. Flag missing entries with their table category (Repos/Tools, Systems, People, or Other).

#### 2b. README freshness

1. Identify key READMEs: root `README.md`, and — if `agentic-harness-dev/` exists —
   `agentic-harness-dev/agentic-harness/claudecode/vera-plugin/` and other recently-active dirs.
2. For each: run `git log --oneline -10 -- <dir>` via bash to see recent changes.
3. Read the README. Check whether skill counts, feature lists, or version references
   are inconsistent with what the git log implies has changed.
4. Flag stale sections by file and description of drift.

#### 2c. Session drift

1. Read `{vpMemoryDir}/last.md`. Extract the current session number N (header: "Session N —").
2. Check `bootstrap/` for any session-number references. If found, compare against N.
3. Flag if drift > 5 sessions. This is report-only — no auto-fix.

#### 2d. OC test harness and coverage (developer only)

**Skip silently if `agentic-harness-dev/` does not exist.**

1. Check whether `agentic-harness-dev/agentic-harness/opencode/` contains a `tests/`
   directory or any test harness file.
2. If no OC test harness is found: flag as a finding — add a todo item (Step 6) to design
   and implement one. Stop here; coverage check requires a harness to exist.
3. If an OC test harness exists: scan `agentic-harness-dev/agentic-harness/opencode/` for
   covered tool names, then compare against `vera_*` tools defined in `.opencode/plugins/vera.ts`.
   Flag any `vera_*` tools with no test coverage as a finding — add a todo item (Step 6).

### Step 3 — Triage

If all checks are clean: report **"Docs health clean — nothing to fix."** and stop.

Otherwise, present findings as:
- **Fixable via todo**: OC test harness missing or coverage gaps (2d)
- **Fixable via edit**: assets.md gaps (2a), README staleness (2b)
- **Report-only**: session drift (2c)

### Step 4 — Draft fixes

For each fixable finding, draft the exact edit:

- **assets.md**: One new row per missing entity, appended to the correct table section.
  Match the existing row format exactly. Never modify existing rows.
- **README**: Surgical edit to the stale section only (e.g. update skill count from X to Y).
  Never rewrite the full README.
- **todo.md (2d — no harness)**: If no OC test harness was found, one new item in the Open section:
  `- [ ] Design and implement OC test harness — define basic structure and test patterns (ref: CC test-harness.sh as prior art) before OC plugin test coverage can be tracked — task a planning agent or available defined agent`
- **todo.md (2d — coverage gaps)**: If untested `vera_*` tools were found, one new item in the Open section:
  `- [ ] Audit untested OC tools ([vera_tool_name, ...]) — review each to determine what test cases are appropriate and add to the OC test harness — task a planning agent or available defined agent`

Present the draft clearly so the user can review before any changes are applied.

### Step 5 — Gate

- **dryRun=true**: Present the draft as a preview. Stop here — do not apply anything.
- **dryRun=false**: Use the `question` tool to present the proposed fixes and ask for
  explicit consent before proceeding.

### Step 6 — Apply (post-consent, dryRun=false only)

1. Execute the drafted edits using the `edit` tool.
2. Run `git add <modified files>` via bash.
3. Report:

```
vera-audit-docs complete.
  Fixed: N issue(s)
  - assets.md: added M rows ([entity names])
  - [README path]: updated [what changed]
  - todo.md: added item — design OC test harness (or: audit untested OC tools [vera_x, ...])
  Remaining (manual):
  - Session drift: S[N] vs bootstrap docs at S[M] — run vera:save or update bootstrap.

Stage: git add [files...]
```

Omit lines that don't apply.

Do **not** commit. Stage and report only.

## Constraints

- On-demand only — never auto-runs
- Append-only for assets.md — never modify existing rows
- Surgical edits only — never rewrite entire files
- Only writes to two memory files: assets.md (append rows) and todo.md (append open item)
- No git commits — stage and report only

## Tone

Operational. Report what was found, what was fixed, what remains. No ceremony.
