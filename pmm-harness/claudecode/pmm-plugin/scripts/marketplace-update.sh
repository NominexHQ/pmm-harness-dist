#!/usr/bin/env bash
set -euo pipefail

# marketplace-update.sh
#
# Mechanical Claude marketplace updater for PMM plugin installs:
# 1) list marketplace installs
# 2) match installs by name regex (default: pmm-harness-dist|\bpmm\b)
# 3) for each matched install path, git fetch + pull --ff-only
# 4) if the repo moved, run marketplace update for that plugin id

NAME_REGEX='pmm-harness-dist|\bpmm\b'
DRY_RUN=0
ALLOW_DIRTY=0

usage() {
  cat <<'EOF'
Usage: marketplace-update.sh [options]

Options:
  --name-regex <regex>  Match plugin name/id (default: pmm-harness-dist|\bpmm\b)
  --dry-run             Print actions only
  --allow-dirty         Allow git pull in dirty plugin repos
  -h, --help            Show this help

Notes:
  - Requires `claude` and `git`.
  - Tries `claude plugins marketplace ...` first, then `claude plugin marketplace ...`.
  - Uses JSON listing when available; falls back to parsing text output.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --name-regex)
      NAME_REGEX="${2:-}"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=1
      shift
      ;;
    --allow-dirty)
      ALLOW_DIRTY=1
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 2
      ;;
  esac
done

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: missing required command: $1" >&2
    exit 1
  fi
}

require_cmd claude
require_cmd git
require_cmd python3

BASE_ARGS=()
if claude plugins marketplace list --help >/dev/null 2>&1; then
  BASE_ARGS=(plugins marketplace)
elif claude plugin marketplace list --help >/dev/null 2>&1; then
  BASE_ARGS=(plugin marketplace)
else
  echo "ERROR: could not find a supported 'claude [plugin|plugins] marketplace' command." >&2
  exit 1
fi

echo "Using Claude marketplace command: claude ${BASE_ARGS[*]}"

LIST_OUTPUT=""
if LIST_OUTPUT="$(claude "${BASE_ARGS[@]}" list --json 2>/dev/null)"; then
  :
else
  LIST_OUTPUT="$(claude "${BASE_ARGS[@]}" list)"
fi

if [[ -z "${LIST_OUTPUT// }" ]]; then
  echo "No marketplace entries returned."
  exit 0
fi

TMP_ENTRIES="$(mktemp)"
trap 'rm -f "$TMP_ENTRIES"' EXIT

python3 - "$NAME_REGEX" "$TMP_ENTRIES" <<'PY' <<<"$LIST_OUTPUT"
import json
import re
import sys

name_re = re.compile(sys.argv[1], re.IGNORECASE)
out_path = sys.argv[2]
raw = sys.stdin.read().strip()

def emit(entry_id, name, path):
    if not path:
        return
    label = f"{name} {entry_id}".strip()
    if not name_re.search(label):
        return
    with open(out_path, "a", encoding="utf-8") as f:
        f.write(f"{entry_id}\t{name}\t{path}\n")

def pick(d, *keys):
    for k in keys:
        v = d.get(k)
        if isinstance(v, str) and v.strip():
            return v.strip()
    return ""

try:
    parsed = json.loads(raw)
    if isinstance(parsed, dict):
        if isinstance(parsed.get("plugins"), list):
            parsed = parsed["plugins"]
        elif isinstance(parsed.get("items"), list):
            parsed = parsed["items"]
        else:
            parsed = [parsed]
    if isinstance(parsed, list):
        for item in parsed:
            if not isinstance(item, dict):
                continue
            entry_id = pick(item, "id", "slug", "marketplace", "name")
            name = pick(item, "name", "displayName", "slug", "id")
            path = pick(item, "path", "location", "installPath", "install_path", "directory")
            emit(entry_id, name, path)
        raise SystemExit(0)
except Exception:
    pass

# Text fallback: capture lines with absolute paths.
for line in raw.splitlines():
    if "/" not in line:
        continue
    m = re.search(r"(/[^\t\n\r]+)", line)
    if not m:
        continue
    path = m.group(1).strip()
    tokens = [t for t in re.split(r"\s+", line.strip()) if t]
    entry_id = tokens[0] if tokens else ""
    name = " ".join(tokens[:2]) if len(tokens) >= 2 else entry_id
    emit(entry_id, name, path)
PY

if [[ ! -s "$TMP_ENTRIES" ]]; then
  echo "No matching marketplace entries for regex: $NAME_REGEX"
  exit 0
fi

UPDATED=0
SKIPPED=0
FAILED=0

echo
echo "Matched entries:"
while IFS=$'\t' read -r entry_id name path; do
  echo "- id=${entry_id:-<unknown>} name=${name:-<unknown>} path=$path"
done < "$TMP_ENTRIES"
echo

while IFS=$'\t' read -r entry_id name path; do
  if [[ ! -d "$path" ]]; then
    echo "[skip] missing path: $path"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if ! git -C "$path" rev-parse --git-dir >/dev/null 2>&1; then
    echo "[skip] not a git repo: $path"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [[ "$ALLOW_DIRTY" -ne 1 ]]; then
    if [[ -n "$(git -C "$path" status --porcelain)" ]]; then
      echo "[skip] dirty git tree: $path (use --allow-dirty to override)"
      SKIPPED=$((SKIPPED + 1))
      continue
    fi
  fi

  before="$(git -C "$path" rev-parse HEAD 2>/dev/null || true)"
  echo "[info] fetch: $path"
  if [[ "$DRY_RUN" -ne 1 ]]; then
    if ! git -C "$path" fetch --prune >/dev/null 2>&1; then
      echo "[fail] fetch failed: $path"
      FAILED=$((FAILED + 1))
      continue
    fi
  fi

  echo "[info] pull --ff-only: $path"
  if [[ "$DRY_RUN" -ne 1 ]]; then
    if ! git -C "$path" pull --ff-only >/dev/null 2>&1; then
      echo "[fail] pull --ff-only failed: $path"
      FAILED=$((FAILED + 1))
      continue
    fi
  fi

  after="$before"
  if [[ "$DRY_RUN" -ne 1 ]]; then
    after="$(git -C "$path" rev-parse HEAD 2>/dev/null || true)"
  fi

  if [[ "$before" == "$after" ]]; then
    echo "[ok] already up to date: $path"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [[ -z "$entry_id" ]]; then
    echo "[warn] repo updated but marketplace id missing; cannot run marketplace update: $path"
    UPDATED=$((UPDATED + 1))
    continue
  fi

  echo "[info] marketplace update: $entry_id"
  if [[ "$DRY_RUN" -ne 1 ]]; then
    if ! claude "${BASE_ARGS[@]}" update "$entry_id"; then
      echo "[fail] marketplace update failed for id=$entry_id"
      FAILED=$((FAILED + 1))
      continue
    fi
  fi

  UPDATED=$((UPDATED + 1))
  echo "[ok] updated id=$entry_id path=$path"
done < "$TMP_ENTRIES"

echo
echo "Summary: updated=$UPDATED skipped=$SKIPPED failed=$FAILED"
if [[ "$FAILED" -gt 0 ]]; then
  exit 1
fi
