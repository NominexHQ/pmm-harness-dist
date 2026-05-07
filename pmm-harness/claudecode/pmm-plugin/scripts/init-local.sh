#!/usr/bin/env bash
# init-local.sh — Install local skill variants into a project's .claude/skills/.
# Generic: works for any plugin that ships a local/ directory.
#
# Usage: init-local.sh [--force] [--refresh] [--mode symlink|copy|auto] <plugin-root> <target-skills-dir>
#
#   plugin-root       Path to the plugin installation (must contain local/)
#   target-skills-dir Path to .claude/skills/ in the project
#   --force           Overwrite standalone copies / wrong-target symlinks
#   --refresh         Refresh existing installs in place
#   --mode            Install mode (default: auto)

set -euo pipefail

# --- Parse args ---
FORCE=0
REFRESH=0
MODE="auto"
POSITIONAL=()

while [ "$#" -gt 0 ]; do
  case "$1" in
    --force)
      FORCE=1
      shift
      ;;
    --refresh)
      REFRESH=1
      shift
      ;;
    --mode)
      MODE="${2:-}"
      if [ -z "$MODE" ]; then
        echo "Missing value for --mode (expected: symlink|copy|auto)" >&2
        exit 1
      fi
      shift 2
      ;;
    --mode=*)
      MODE="${1#*=}"
      shift
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done

if [ "$MODE" != "symlink" ] && [ "$MODE" != "copy" ] && [ "$MODE" != "auto" ]; then
  echo "Invalid --mode '$MODE' (expected: symlink|copy|auto)" >&2
  exit 1
fi

if [ "${#POSITIONAL[@]}" -lt 2 ]; then
  echo "Usage: init-local.sh [--force] [--refresh] [--mode symlink|copy|auto] <plugin-root> <target-skills-dir>" >&2
  exit 1
fi

PLUGIN_ROOT="${POSITIONAL[0]}"
TARGET_DIR="${POSITIONAL[1]}"

# --- Validate ---
LOCAL_DIR="$PLUGIN_ROOT/local"

if [ ! -d "$LOCAL_DIR" ]; then
  echo "No local/ directory found at $PLUGIN_ROOT. Nothing to do."
  exit 0
fi

# --- Collect skills ---
SKILLS=()
for dir in "$LOCAL_DIR"/*/; do
  [ -f "${dir}SKILL.md" ] && SKILLS+=("$(basename "$dir")")
done

if [ ${#SKILLS[@]} -eq 0 ]; then
  echo "No skills with SKILL.md found in $LOCAL_DIR. Nothing to do."
  exit 0
fi

# --- Helpers ---
copy_item() {
  local src_item="$1"
  local tgt_item="$2"

  rm -rf "$tgt_item"
  mkdir -p "$(dirname "$tgt_item")"
  if [ -d "$src_item" ]; then
    cp -R "$src_item" "$tgt_item"
  else
    cp "$src_item" "$tgt_item"
  fi
}

link_item() {
  local rel_path="$1"
  local tgt_item="$2"

  rm -rf "$tgt_item"
  mkdir -p "$(dirname "$tgt_item")"
  ln -s "$rel_path" "$tgt_item"
}

ensure_item() {
  local src_item="$1"
  local tgt_item="$2"
  local rel_path="$3"
  local mode="$4"
  local has_existing="$5"
  local is_symlink="$6"
  local existing_link="$7"

  if [ "$mode" = "copy" ]; then
    if [ "$has_existing" = "1" ] && [ "$REFRESH" -ne 1 ] && [ "$FORCE" -ne 1 ]; then
      echo "warn"
      return
    fi
    copy_item "$src_item" "$tgt_item"
    if [ "$has_existing" = "1" ]; then
      echo "refreshed"
    else
      echo "copied"
    fi
    return
  fi

  if [ "$mode" = "symlink" ]; then
    if [ "$is_symlink" = "1" ] && [ "$existing_link" = "$rel_path" ]; then
      echo "skipped"
      return
    fi
    if [ "$has_existing" = "1" ] && [ "$REFRESH" -ne 1 ] && [ "$FORCE" -ne 1 ]; then
      echo "warn"
      return
    fi
    link_item "$rel_path" "$tgt_item"
    if [ "$has_existing" = "1" ]; then
      echo "overwritten"
    else
      echo "linked"
    fi
    return
  fi

  # auto mode
  if [ "$is_symlink" = "1" ] && [ "$existing_link" = "$rel_path" ]; then
    echo "skipped"
    return
  fi

  if [ "$has_existing" = "1" ] && [ "$is_symlink" = "0" ]; then
    if [ "$REFRESH" -eq 1 ] || [ "$FORCE" -eq 1 ]; then
      copy_item "$src_item" "$tgt_item"
      echo "refreshed"
      return
    fi
    echo "warn"
    return
  fi

  if [ "$has_existing" = "1" ] && [ "$REFRESH" -ne 1 ] && [ "$FORCE" -ne 1 ]; then
    echo "warn"
    return
  fi

  mkdir -p "$(dirname "$tgt_item")"
  rm -rf "$tgt_item"
  if ln -s "$rel_path" "$tgt_item" 2>/dev/null; then
    if [ "$has_existing" = "1" ]; then
      echo "overwritten"
    else
      echo "linked"
    fi
  else
    copy_item "$src_item" "$tgt_item"
    if [ "$has_existing" = "1" ]; then
      echo "refreshed"
    else
      echo "copied"
    fi
  fi
}

# --- Process each skill ---
LINKED=()
COPIED=()
REFRESHED=()
SKIPPED=()
OVERWRITTEN=()
WARNED=()

for skill in "${SKILLS[@]}"; do
  src_dir="$LOCAL_DIR/$skill"
  tgt_dir="$TARGET_DIR/$skill"

  # Collect all linkable items: SKILL.md + any asset dirs/files
  ITEMS=()
  [ -f "$src_dir/SKILL.md" ] && ITEMS+=("SKILL.md")
  for item in "$src_dir"/*/; do
    [ -d "$item" ] && ITEMS+=("$(basename "$item")")
  done
  # Also catch non-directory files other than SKILL.md
  for item in "$src_dir"/*; do
    [ -f "$item" ] && [ "$(basename "$item")" != "SKILL.md" ] && ITEMS+=("$(basename "$item")")
  done

  did_link=0
  did_copy=0
  did_refresh=0
  did_skip=0
  did_overwrite=0
  did_warn=0

  for item in "${ITEMS[@]}"; do
    src_item="$src_dir/$item"
    tgt_item="$tgt_dir/$item"

    # Compute relative path from target to source
    rel_path=$(python3 -c "import os.path; print(os.path.relpath('$src_item', '$tgt_dir'))")

    has_existing=0
    is_symlink=0
    existing=""
    if [ -e "$tgt_item" ] || [ -L "$tgt_item" ]; then
      has_existing=1
      if [ -L "$tgt_item" ]; then
        is_symlink=1
        existing=$(readlink "$tgt_item")
      fi
    fi

    result=$(ensure_item "$src_item" "$tgt_item" "$rel_path" "$MODE" "$has_existing" "$is_symlink" "$existing")
    case "$result" in
      linked) did_link=1 ;;
      copied) did_copy=1 ;;
      refreshed) did_refresh=1 ;;
      overwritten) did_overwrite=1 ;;
      skipped) did_skip=1 ;;
      warn) did_warn=1 ;;
    esac
  done

  # Categorise skill by worst-case item outcome
  if [ "$did_warn" -eq 1 ]; then
    WARNED+=("$skill")
  elif [ "$did_overwrite" -eq 1 ]; then
    OVERWRITTEN+=("$skill")
  elif [ "$did_refresh" -eq 1 ]; then
    REFRESHED+=("$skill")
  elif [ "$did_copy" -eq 1 ]; then
    COPIED+=("$skill")
  elif [ "$did_link" -eq 1 ]; then
    LINKED+=("$skill")
  else
    SKIPPED+=("$skill")
  fi
done

# --- Report ---
echo "init-local — done"
echo ""
echo "  mode:                 $MODE"
echo "  refresh:              $REFRESH"

join_arr() { local out="$1"; shift; for x in "$@"; do out="$out, $x"; done; echo "$out"; }

[ ${#LINKED[@]} -gt 0 ]      && echo "  linked:               $(join_arr "${LINKED[@]}")"
[ ${#COPIED[@]} -gt 0 ]      && echo "  copied:               $(join_arr "${COPIED[@]}")"
[ ${#REFRESHED[@]} -gt 0 ]   && echo "  refreshed:            $(join_arr "${REFRESHED[@]}")"
[ ${#SKIPPED[@]} -gt 0 ]     && echo "  already installed:    $(join_arr "${SKIPPED[@]}")"
[ ${#OVERWRITTEN[@]} -gt 0 ] && echo "  overwritten:          $(join_arr "${OVERWRITTEN[@]}")"
[ ${#WARNED[@]} -gt 0 ]      && echo "  skipped (standalone): $(join_arr "${WARNED[@]}") (use --force)"

TOTAL=$(( ${#LINKED[@]} + ${#COPIED[@]} + ${#REFRESHED[@]} + ${#SKIPPED[@]} + ${#OVERWRITTEN[@]} + ${#WARNED[@]} ))
echo ""
echo "  Total: $TOTAL skills processed"
