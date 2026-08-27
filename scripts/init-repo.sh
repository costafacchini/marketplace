#!/usr/bin/env bash
set -euo pipefail

# AI Dev Framework — Init
# Usage: scripts/init-repo.sh

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "=== AI Dev Framework — Init ==="
echo "Root: $REPO_ROOT"
echo ""

ok()   { echo -e "\033[0;32m[OK]\033[0m $1"; }
skip() { echo -e "\033[1;33m[SKIP]\033[0m $1 (exists)"; }

# --- CLAUDE.md = copy of AGENTS.md ---
if [ -f "$REPO_ROOT/AGENTS.md" ] && [ -f "$REPO_ROOT/CLAUDE.md" ]; then
  if grep -q "Paste full AGENTS.md" "$REPO_ROOT/CLAUDE.md" 2>/dev/null; then
    cp "$REPO_ROOT/AGENTS.md" "$REPO_ROOT/CLAUDE.md"
    ok "CLAUDE.md synced with AGENTS.md"
  else
    skip "CLAUDE.md (already customized)"
  fi
fi

# --- Claude Code symlinks ---
mkdir -p "$REPO_ROOT/.claude/skills" "$REPO_ROOT/.claude/agents"

for skill_dir in "$REPO_ROOT/.agents/skills"/*/; do
  [ -d "$skill_dir" ] || continue
  name=$(basename "$skill_dir")
  target="$REPO_ROOT/.claude/skills/$name"
  if [ ! -e "$target" ]; then
    ln -s "../../.agents/skills/$name" "$target"
    ok "Symlinked .claude/skills/$name"
  fi
done

for agent_file in "$REPO_ROOT/.agents/agents"/*.md; do
  [ -f "$agent_file" ] || continue
  name=$(basename "$agent_file")
  target="$REPO_ROOT/.claude/agents/$name"
  if [ ! -e "$target" ]; then
    ln -s "../../.agents/agents/$name" "$target"
    ok "Symlinked .claude/agents/$name"
  fi
done

# --- .gitignore additions ---
GITIGNORE="$REPO_ROOT/.gitignore"
if [ -f "$GITIGNORE" ]; then
  for entry in "docs/kb/sessions/*.md" "!docs/kb/sessions/.gitkeep" ".claude/settings.local.json"; do
    if ! grep -qF "$entry" "$GITIGNORE" 2>/dev/null; then
      echo "$entry" >> "$GITIGNORE"
      ok "Added to .gitignore: $entry"
    fi
  done
else
  cat > "$GITIGNORE" << 'EOF'
docs/kb/sessions/*.md
!docs/kb/sessions/.gitkeep
.claude/settings.local.json
EOF
  ok "Created .gitignore"
fi

echo ""
echo "=== Done ==="
echo ""
echo "Next:"
echo "  1. Edit AGENTS.md with your project's stack, commands, and constraints"
echo "  2. Run: scripts/sync-shims.sh"
echo "  3. Commit the framework files"
