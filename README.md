# pmm-harness-dist

Distribution harness for PMM plugin packaging across both runtimes:

- OpenCode plugin bundle (from `.opencode`)
- Claude Code plugin bundle (from `NominexHQ/pmm-plugin`)

This directory is the release/staging surface used to produce shippable artifacts and update the local Claude marketplace manifest.

## Directory layout

- `.claude-plugin/marketplace.json` - Local/private marketplace manifest for Claude Code.
- `Makefile` - Top-level orchestrator build.
- `pmm-harness/Makefile` - Runtime-specific build targets.
- `pmm-harness/opencode/` - Generated OpenCode plugin distribution output.
- `pmm-harness/claudecode/pmm-plugin/` - Generated Claude plugin snapshot output.

## Quick start

From the repository root:

```bash
make -C pmm-harness-dist
```

Default behavior:

1. Builds OpenCode harness artifacts.
2. Builds Claude Code harness artifacts.
3. Reads plugin version from `pmm-harness/claudecode/pmm-plugin/.claude-plugin/plugin.json`.
4. Updates matching plugin version in `.claude-plugin/marketplace.json`.
5. Bumps marketplace version using patch semantics.

## Version bump modes

Use one flag at a time:

```bash
make -C pmm-harness-dist -- --patch
make -C pmm-harness-dist -- --minor
make -C pmm-harness-dist -- --major
```

Rules:

- No flag => patch bump.
- `--patch` => `x.y.z -> x.y.(z+1)`
- `--minor` => `x.y.z -> x.(y+1).0`
- `--major` => `x.y.z -> (x+1).0.0`

## Runtime-specific targets

You can run harness targets directly:

```bash
make -C pmm-harness-dist/pmm-harness build-opencode
make -C pmm-harness-dist/pmm-harness build-claudecode
make -C pmm-harness-dist/pmm-harness clean-opencode
make -C pmm-harness-dist/pmm-harness clean-claudecode
```

## Notes

- Claude bundle is cloned from the canonical upstream repo and `.git` is stripped in the generated output.
- `.DS_Store` files should remain ignored; keep `.gitignore` entries in place.
- If marketplace updates fail, check that `pmm-harness/claudecode/pmm-plugin/.claude-plugin/plugin.json` exists after build.
