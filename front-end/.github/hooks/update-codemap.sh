#!/usr/bin/env bash
# GrewMe Frontend — Codemap updater
# Usage: update-codemap.sh <repo_root> <dir1> [dir2] ...
#
# Strategies (in priority order):
#   1. Claude CLI (AI-powered regeneration)
#   2. Timestamp marker (fallback)
set -euo pipefail

REPO_ROOT="$1"
shift
DIRS=("$@")

# ---------------------------------------------------------------------------
# Detect available strategy
# ---------------------------------------------------------------------------
CLAUDE_BIN=$(command -v claude 2>/dev/null || true)
STRATEGY="timestamp"

if [ -n "$CLAUDE_BIN" ]; then
  STRATEGY="claude"
fi

# Allow override: CODEMAP_STRATEGY=timestamp|claude
if [ -n "${CODEMAP_STRATEGY:-}" ]; then
  STRATEGY="$CODEMAP_STRATEGY"
fi

echo "[codemap] Update strategy: $STRATEGY"

# ---------------------------------------------------------------------------
# Strategy: Claude CLI
# ---------------------------------------------------------------------------
update_with_claude() {
  local dir="$1"
  local abs_dir="$REPO_ROOT/$dir"
  local codemap_path

  if [ "$dir" = "." ]; then
    codemap_path="$REPO_ROOT/CODEMAP.md"
    abs_dir="$REPO_ROOT"
  else
    codemap_path="$REPO_ROOT/$dir/CODEMAP.md"
  fi

  # Collect file list (exclude tests, node_modules, codemap itself)
  local files
  files=$(find "$abs_dir" -maxdepth 1 -type f \
    ! -name "CODEMAP*" ! -name "codemap*" ! -name "*.md" \
    ! -name "*.test.*" ! -name "*.spec.*" ! -name ".DS_Store" \
    2>/dev/null | head -20 | sed "s|$REPO_ROOT/||")

  if [ -z "$files" ]; then
    echo "  [skip] $dir — no source files"
    return 0
  fi

  # Read current codemap for context
  local current_codemap
  current_codemap=$(cat "$codemap_path" 2>/dev/null || echo "")

  local prompt
  prompt=$(cat <<PROMPT
You are updating a CODEMAP.md file for the directory "$dir" in a SvelteKit frontend (GrewMe project — kids learning radar app, Svelte 5 + Tailwind + Paraglide i18n + GraphQL).

Current codemap content:
---
$current_codemap
---

Files in this directory:
$files

Instructions:
1. Read the files listed above in the directory "$dir"
2. Update the CODEMAP.md with accurate documentation following this format:
   - ## Responsibility — what this directory does
   - ## Design — patterns, component architecture, key decisions
   - ## Flow — how data flows (GraphQL → stores → components)
   - ## Integration — how it connects to other parts
3. Keep it concise and technical. Use precise software engineering terminology.
4. Write ONLY the codemap content (markdown), nothing else.
5. Do NOT include any preamble or explanation outside the markdown.

Write the updated codemap to: $codemap_path
PROMPT
  )

  echo "  [claude] Updating $dir/CODEMAP.md ..."
  echo "$prompt" | "$CLAUDE_BIN" --print --no-input 2>/dev/null | \
    sed '/^$/N;/^\n$/d' > "${codemap_path}.tmp" 2>/dev/null

  # Only replace if claude produced output
  if [ -s "${codemap_path}.tmp" ]; then
    mv "${codemap_path}.tmp" "$codemap_path"
    echo "  [done]  $dir/CODEMAP.md updated"
  else
    rm -f "${codemap_path}.tmp"
    echo "  [warn]  Claude produced no output for $dir — keeping existing"
    update_with_timestamp "$dir"
  fi
}

# ---------------------------------------------------------------------------
# Strategy: Timestamp marker (fallback)
# ---------------------------------------------------------------------------
update_with_timestamp() {
  local dir="$1"
  local codemap_path
  if [ "$dir" = "." ]; then
    codemap_path="$REPO_ROOT/CODEMAP.md"
  else
    codemap_path="$REPO_ROOT/$dir/CODEMAP.md"
  fi

  local timestamp
  timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  # Get changed files in this directory
  local changed
  changed=$(git diff --name-only HEAD~1..HEAD -- "$REPO_ROOT/$dir" 2>/dev/null | sed "s|^front-end/||" | head -10 || true)

  if [ -z "$changed" ]; then
    changed="(unable to determine — run git diff manually)"
  fi

  # Read existing content
  local existing
  existing=$(cat "$codemap_path")

  # Remove any previous staleness notice
  local cleaned
  cleaned=$(echo "$existing" | sed '/^<!-- CODEMAP_STALE/,/^<!-- \/CODEMAP_STALE/d')

  # Prepend staleness notice
  cat > "$codemap_path" <<EOF
<!-- CODEMAP_STALE
  Last checked: $timestamp
  Changed files:
$(echo "$changed" | sed 's/^/    /')
  Action: Run 'CODEMAP_STRATEGY=claude .github/hooks/update-codemap.sh $REPO_ROOT $dir' to regenerate
-->

$cleaned
EOF

  echo "  [stamp] $dir/CODEMAP.md marked as stale ($timestamp)"
}

# ---------------------------------------------------------------------------
# Process each directory
# ---------------------------------------------------------------------------
updated=0
for dir in "${DIRS[@]}"; do
  case "$STRATEGY" in
    claude)   update_with_claude "$dir" ;;
    *)        update_with_timestamp "$dir" ;;
  esac
  ((updated++))
done

echo ""
echo "[codemap] Updated $updated codemap(s)."

# ---------------------------------------------------------------------------
# Auto-stage updated codemaps so they're included in the push
# ---------------------------------------------------------------------------
if [ $updated -gt 0 ]; then
  for dir in "${DIRS[@]}"; do
    if [ "$dir" = "." ]; then
      codemap_file="front-end/CODEMAP.md"
    else
      codemap_file="front-end/$dir/CODEMAP.md"
    fi
    git add "$codemap_file" 2>/dev/null || true
  done

  # Check if there are staged changes
  if ! git diff --cached --quiet 2>/dev/null; then
    echo "[codemap] Auto-committing updated codemaps..."
    git commit -m "docs: auto-update stale frontend codemaps [pre-push]" --no-verify 2>/dev/null || true
    echo "[codemap] Committed. Push will include codemap updates."
  fi
fi
