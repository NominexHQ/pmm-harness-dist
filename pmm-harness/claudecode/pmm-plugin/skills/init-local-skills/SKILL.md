---
name: pmm:init-local-skills
description: >
  Install local skill variants for Cowork compatibility. Uses auto mode:
  symlink when supported, copy fallback when symlinks are unavailable.
  Run once per project and after plugin updates. Idempotent.
argument-hint: "[--force to overwrite conflicts]"
---

# pmm:init-local-skills

Installs pre-built local skill variants into `.claude/skills/` so PMM skills work in Cowork (no private marketplace plugin support there).

**When to run:** Once per project and after plugin updates. Safe to re-run — idempotent.

---

## Instructions

1. Resolve the plugin root. This skill file lives at `<plugin-root>/skills/init-local-skills/SKILL.md` — the plugin root is two directories up.

2. Resolve the project's `.claude/skills/` directory (the project root that contains `.claude/`).

3. Run the init-local script:

```bash
"<plugin-root>/scripts/init-local.sh" --mode auto <plugin-root> <project-root>/.claude/skills
```

If the user passed `--force` in `$ARGUMENTS`, include the flag:

```bash
"<plugin-root>/scripts/init-local.sh" --mode auto --force <plugin-root> <project-root>/.claude/skills
```

If local skills already exist and you want to refresh them in place (for example after plugin update), include `--refresh`:

```bash
"<plugin-root>/scripts/init-local.sh" --mode auto --refresh <plugin-root> <project-root>/.claude/skills
```

4. Report the script output to the user.

---

## Rules

- Default mode is `auto`: symlink when possible, copy fallback when symlinks are unavailable.
- Never modify files in `local/`. Read-only source.
- Never modify existing plugin skills in `skills/`.
- Idempotent. Running twice with no changes produces all skips.
- `--refresh` updates existing local installs in place.
- `--force` resolves conflicts for wrong-target links or standalone content.
