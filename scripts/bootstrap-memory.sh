#!/usr/bin/env bash
# Do not enable `set -e`: grep/find returning 1 for "not found" is expected.
set -o pipefail

# Collects project history context for the bootstrap-memory skill.
# Output: .agents/memory/_bootstrap-context.md
# Usage: scripts/bootstrap-memory.sh [--output <path>]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT="${REPO_ROOT}/.agents/memory/_bootstrap-context.md"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output) OUTPUT="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

mkdir -p "$(dirname "$OUTPUT")"

{
  echo "# Bootstrap Context"
  echo "# Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
  echo ""

  echo "## Git Log (last 60 commits)"
  git -C "$REPO_ROOT" log --oneline -60 2>/dev/null || echo "(no git history)"
  echo ""

  echo "## README"
  if [ -f "$REPO_ROOT/README.md" ]; then
    head -100 "$REPO_ROOT/README.md"
  else
    echo "(no README.md)"
  fi
  echo ""

  echo "## Key Docs (first 40 lines each)"
  find "$REPO_ROOT/docs" -maxdepth 2 -name "*.md" ! -name "README.md" 2>/dev/null | sort | head -10 | while read -r f; do
    echo "### $f"
    head -40 "$f"
    echo ""
  done

  echo "## Project Structure (depth 3)"
  find "$REPO_ROOT" -maxdepth 3 \
    ! -path "*/.git/*" \
    ! -path "*/node_modules/*" \
    ! -path "*/.agents/*" \
    ! -path "*/vendor/*" \
    ! -path "*/__pycache__/*" \
    -type f | sed "s|$REPO_ROOT/||" | sort | head -80
  echo ""

  echo "## Dependencies"
  for manifest in package.json Gemfile requirements.txt pyproject.toml go.mod; do
    if [ -f "$REPO_ROOT/$manifest" ]; then
      echo "### $manifest"
      head -50 "$REPO_ROOT/$manifest"
      echo ""
    fi
  done

} > "$OUTPUT"

echo "[bootstrap-memory] Context written to: $OUTPUT"
echo "[bootstrap-memory] Now run /bootstrap-memory skill to seed memory files."
