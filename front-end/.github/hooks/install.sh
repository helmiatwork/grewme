#!/usr/bin/env bash
# Install GrewMe frontend pre-push hook
# Usage: bash front-end/.github/hooks/install.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOK_TARGET="$REPO_ROOT/.git/hooks/pre-push"

# ---------------------------------------------------------------------------
# If a pre-push hook already exists, chain it
# ---------------------------------------------------------------------------
if [ -f "$HOOK_TARGET" ] && [ ! -L "$HOOK_TARGET" ]; then
  echo "[install] Existing pre-push hook found — backing up to pre-push.bak"
  cp "$HOOK_TARGET" "$HOOK_TARGET.bak"
fi

# ---------------------------------------------------------------------------
# Create a dispatcher hook that calls both backend and front-end hooks
# ---------------------------------------------------------------------------
cat > "$HOOK_TARGET" <<'HOOK'
#!/usr/bin/env bash
# GrewMe pre-push dispatcher — runs project-specific hooks
set -uo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"

# Run backend hook
if [ -x "$REPO_ROOT/backend/.github/hooks/pre-push" ]; then
  echo "=== Backend codemap check ==="
  bash "$REPO_ROOT/backend/.github/hooks/pre-push" "$@"
fi

# Run front-end hook
if [ -x "$REPO_ROOT/front-end/.github/hooks/pre-push" ]; then
  echo "=== Frontend codemap check ==="
  bash "$REPO_ROOT/front-end/.github/hooks/pre-push" "$@"
fi

exit 0
HOOK

chmod +x "$HOOK_TARGET"
chmod +x "$SCRIPT_DIR/pre-push"
chmod +x "$SCRIPT_DIR/update-codemap.sh"

echo "[install] Pre-push hook installed at $HOOK_TARGET"
echo "[install] Frontend hook: $SCRIPT_DIR/pre-push"
echo ""
echo "To test: git push --dry-run"
