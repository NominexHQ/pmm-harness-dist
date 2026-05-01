#!/usr/bin/env bash
# Shared memory path resolution for PMM hook scripts.

pmm_trim() {
  local value="$1"
  printf '%s' "$value" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//'
}

pmm_normalize_path_ref() {
  local value
  value="$(pmm_trim "$1")"
  value="${value#\`}"  # drop leading backtick when present
  value="${value%\`}"  # drop trailing backtick when present
  while [[ "$value" == */ && "$value" != "/" ]]; do
    value="${value%/}"
  done
  printf '%s' "$value"
}

pmm_join_path() {
  local base="$1"
  local path_ref="$2"
  if [[ -z "$path_ref" || "$path_ref" == "." ]]; then
    printf '%s' "$base"
    return
  fi
  if [[ "$path_ref" == /* ]]; then
    printf '%s' "$path_ref"
    return
  fi

  local normalized="$path_ref"
  normalized="${normalized#./}"
  if [[ "$base" == */ ]]; then
    printf '%s%s' "$base" "$normalized"
  else
    printf '%s/%s' "$base" "$normalized"
  fi
}

pmm_path_has_config() {
  local dir="$1"
  [[ -f "$dir/config.md" ]]
}

pmm_has_vera_memory_marker() {
  local root="$1"
  [[ -f "$root/agents/vera/memory/config.md" ]]
}

pmm_extract_memory_dir_directive() {
  local file_path="$1"
  [[ -f "$file_path" ]] || return 1

  awk '
    {
      lower = tolower($0)
      pos = match(lower, /pmm[_-]memory[_-]dir:[[:space:]]*`?[^`[:space:]]+`?/)
      if (pos > 0) {
        token = substr($0, pos, RLENGTH)
        sub(/.*:[[:space:]]*`?/, "", token)
        sub(/`?$/, "", token)
        print token
        exit
      }
    }
  ' "$file_path"
}

pmm_extract_vp_memory_dir_from_roster() {
  local roster_path="$1"
  [[ -f "$roster_path" ]] || return 1

  awk -F'|' '
    /^[[:space:]]*\|/ {
      handle = $2
      memory_dir = $4
      gsub(/`/, "", handle)
      gsub(/`/, "", memory_dir)
      gsub(/^[ \t]+|[ \t]+$/, "", handle)
      gsub(/^[ \t]+|[ \t]+$/, "", memory_dir)
      if (tolower(handle) == "vera" && memory_dir != "" && tolower(memory_dir) != "memory dir") {
        print memory_dir
        exit
      }
    }
  ' "$roster_path"
}

pmm_find_workspace_root() {
  local start_dir="${1:-$PWD}"

  if command -v git >/dev/null 2>&1; then
    local git_root
    git_root="$(git -C "$start_dir" rev-parse --show-toplevel 2>/dev/null || true)"
    if [[ -n "$git_root" ]]; then
      printf '%s' "$git_root"
      return
    fi
  fi

  local dir="$start_dir"
  while true; do
    if [[ -f "$dir/config/agents.md" || -f "$dir/CLAUDE.md" || -f "$dir/AGENTS.md" || -f "$dir/memory/config.md" ]]; then
      printf '%s' "$dir"
      return
    fi
    local parent
    parent="$(dirname "$dir")"
    if [[ "$parent" == "$dir" ]]; then
      break
    fi
    dir="$parent"
  done

  printf '%s' "$start_dir"
}

pmm_to_workspace_label() {
  local root="$1"
  local abs_path="$2"

  local normalized_root="$root"
  normalized_root="${normalized_root%/}"

  if [[ "$abs_path" == "$normalized_root" ]]; then
    printf '.'
    return
  fi

  local root_prefix="$normalized_root/"
  if [[ "$abs_path" == "$root_prefix"* ]]; then
    printf '%s' "${abs_path#$root_prefix}"
    return
  fi

  printf '%s' "$abs_path"
}

pmm_set_memory_context() {
  local start_dir="${1:-$PWD}"
  local cwd="$PWD"

  PMM_WORKSPACE_ROOT="$(pmm_find_workspace_root "$start_dir")"
  PMM_MEMORY_SOURCE="default"

  local candidate=""
  local resolved=""

  # 1. Environment override (resolved relative to workspace root when relative)
  if [[ -n "${PMM_MEMORY_DIR:-}" ]]; then
    candidate="$(pmm_normalize_path_ref "$PMM_MEMORY_DIR")"
    if [[ -n "$candidate" ]]; then
      resolved="$(pmm_join_path "$PMM_WORKSPACE_ROOT" "$candidate")"
      if pmm_path_has_config "$resolved"; then
        PMM_MEMORY_DIR="$resolved"
        PMM_MEMORY_SOURCE="env"
        PMM_MEMORY_LABEL="$(pmm_to_workspace_label "$PMM_WORKSPACE_ROOT" "$PMM_MEMORY_DIR")"
        return 0
      fi
    fi
  fi

  # 2. CLAUDE/AGENTS directive in current working directory
  local file_path
  for file_path in "$cwd/CLAUDE.md" "$cwd/AGENTS.md"; do
    candidate="$(pmm_extract_memory_dir_directive "$file_path" 2>/dev/null || true)"
    candidate="$(pmm_normalize_path_ref "$candidate")"
    if [[ -n "$candidate" ]]; then
      resolved="$(pmm_join_path "$cwd" "$candidate")"
      if pmm_path_has_config "$resolved"; then
        PMM_MEMORY_DIR="$resolved"
        PMM_MEMORY_SOURCE="cwd-directive"
        PMM_MEMORY_LABEL="$(pmm_to_workspace_label "$PMM_WORKSPACE_ROOT" "$PMM_MEMORY_DIR")"
        return 0
      fi
    fi
  done

  # 3. CLAUDE/AGENTS directive at workspace root
  for file_path in "$PMM_WORKSPACE_ROOT/CLAUDE.md" "$PMM_WORKSPACE_ROOT/AGENTS.md"; do
    candidate="$(pmm_extract_memory_dir_directive "$file_path" 2>/dev/null || true)"
    candidate="$(pmm_normalize_path_ref "$candidate")"
    if [[ -n "$candidate" ]]; then
      resolved="$(pmm_join_path "$PMM_WORKSPACE_ROOT" "$candidate")"
      if pmm_path_has_config "$resolved"; then
        PMM_MEMORY_DIR="$resolved"
        PMM_MEMORY_SOURCE="root-directive"
        PMM_MEMORY_LABEL="$(pmm_to_workspace_label "$PMM_WORKSPACE_ROOT" "$PMM_MEMORY_DIR")"
        return 0
      fi
    fi
  done

  # 4. Coordinator roster fallback (config/agents.md -> Vera row memory dir)
  candidate="$(pmm_extract_vp_memory_dir_from_roster "$PMM_WORKSPACE_ROOT/config/agents.md" 2>/dev/null || true)"
  candidate="$(pmm_normalize_path_ref "$candidate")"
  if [[ -n "$candidate" ]]; then
    resolved="$(pmm_join_path "$PMM_WORKSPACE_ROOT" "$candidate")"
    if pmm_path_has_config "$resolved"; then
      PMM_MEMORY_DIR="$resolved"
      PMM_MEMORY_SOURCE="roster"
      PMM_MEMORY_LABEL="$(pmm_to_workspace_label "$PMM_WORKSPACE_ROOT" "$PMM_MEMORY_DIR")"
      return 0
    fi
  fi

  # 5. Vera coordinator fallback when agents/vera memory marker is present
  if pmm_has_vera_memory_marker "$PMM_WORKSPACE_ROOT"; then
    resolved="$(pmm_join_path "$PMM_WORKSPACE_ROOT" "agents/vera/memory")"
    if pmm_path_has_config "$resolved"; then
      PMM_MEMORY_DIR="$resolved"
      PMM_MEMORY_SOURCE="vera-default"
      PMM_MEMORY_LABEL="$(pmm_to_workspace_label "$PMM_WORKSPACE_ROOT" "$PMM_MEMORY_DIR")"
      return 0
    fi
  fi

  # 6. Safe default
  PMM_MEMORY_DIR="$(pmm_join_path "$PMM_WORKSPACE_ROOT" "memory")"
  PMM_MEMORY_SOURCE="default"
  PMM_MEMORY_LABEL="$(pmm_to_workspace_label "$PMM_WORKSPACE_ROOT" "$PMM_MEMORY_DIR")"
  return 0
}