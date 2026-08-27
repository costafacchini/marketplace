#!/usr/bin/env bash
set -euo pipefail

# Sync CLAUDE.md with AGENTS.md
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ ! -f "$REPO_ROOT/AGENTS.md" ]; then
  echo "ERROR: AGENTS.md not found" && exit 1
fi

cp "$REPO_ROOT/AGENTS.md" "$REPO_ROOT/CLAUDE.md"
echo "[OK] CLAUDE.md synced with AGENTS.md"
