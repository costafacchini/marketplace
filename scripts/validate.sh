#!/usr/bin/env bash
set -euo pipefail

# Validate framework installation
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ERRORS=0; WARNINGS=0

check() {
  if [ -e "$REPO_ROOT/$2" ]; then echo "[OK]   $1"
  else echo "[FAIL] $1 ($2)"; ERRORS=$((ERRORS + 1)); fi
}
warn() {
  if [ -e "$REPO_ROOT/$2" ]; then echo "[OK]   $1"
  else echo "[WARN] $1 ($2)"; WARNINGS=$((WARNINGS + 1)); fi
}

check_setup_shell_safety() {
  if grep -Eq '^set -e([[:space:]]|$)|^set -[^[:space:]]*e[^[:space:]]*([[:space:]]|$)' "$REPO_ROOT/scripts/setup.sh"; then
    echo "[FAIL] setup.sh must not use set -e"
    ERRORS=$((ERRORS + 1))
  else
    echo "[OK]   setup.sh avoids set -e"
  fi
}

check_agents_doc_compatibility() {
  local bytes lines
  bytes=$(wc -c < "$REPO_ROOT/AGENTS.md" | tr -d ' ')
  lines=$(wc -l < "$REPO_ROOT/AGENTS.md" | tr -d ' ')

  if [ "$bytes" -le 32768 ]; then
    echo "[OK]   AGENTS.md fits Codex default size limit (${bytes} bytes)"
  else
    echo "[WARN] AGENTS.md exceeds Codex default size limit (${bytes} > 32768 bytes)"
    WARNINGS=$((WARNINGS + 1))
  fi

  if [ "$lines" -le 200 ]; then
    echo "[OK]   AGENTS.md stays under 200 lines (${lines})"
  else
    echo "[WARN] AGENTS.md exceeds 200-line guidance (${lines})"
    WARNINGS=$((WARNINGS + 1))
  fi
}

echo "=== Framework Validation ==="
echo ""

echo "--- Core ---"
check "AGENTS.md" "AGENTS.md"
check "CLAUDE.md" "CLAUDE.md"
warn  "GEMINI.md" "GEMINI.md"
warn  ".aiignore" ".aiignore"

echo ""
echo "--- Shims ---"
warn "Cursor" ".cursor/rules/agents.mdc"
warn "Antigravity" ".agent/rules/agent.md"
warn "Copilot" ".github/copilot-instructions.md"

echo ""
echo "--- Skills ---"
check "pre-commit-check"   ".agents/skills/pre-commit-check/SKILL.md"
check "document-solution"   ".agents/skills/document-solution/SKILL.md"
check "log-mistake"         ".agents/skills/log-mistake/SKILL.md"
check "save-session"        ".agents/skills/save-session/SKILL.md"
check "session-end-checklist" ".agents/skills/session-end-checklist/SKILL.md"
check "check-kb-index"      ".agents/skills/check-kb-index/SKILL.md"
check "create-plan"         ".agents/skills/create-plan/SKILL.md"
check "code-review"         ".agents/skills/code-review/SKILL.md"
check "dependency-audit"    ".agents/skills/dependency-audit/SKILL.md"
check "changelog-update"    ".agents/skills/changelog-update/SKILL.md"
check "scaffold-feature"    ".agents/skills/scaffold-feature/SKILL.md"
check "investigate-bug"     ".agents/skills/investigate-bug/SKILL.md"
check "dev-environment"    ".agents/skills/dev-environment/SKILL.md"
check "evolve-framework"   ".agents/skills/evolve-framework/SKILL.md"

echo ""
echo "--- Agents ---"
for a in orchestrator planner implementer reviewer researcher tester test-writer documenter; do
  check "$a" ".agents/agents/$a.md"
done
for a in orchestrator planner implementer reviewer researcher tester test-writer documenter; do
  check "codex-$a" ".codex/agents/$a.toml"
done
for a in orchestrator planner implementer reviewer researcher tester test-writer documenter reliability-hunter; do
  warn "opencode-$a" ".opencode/agents/$a.md"
done

echo ""
echo "--- KB ---"
check "KB index"     "docs/kb/README.md"
check "Mistake log"  "docs/kb/ai-patterns/mistake-log.md"

echo ""
echo "--- Sync ---"
if [ -f "$REPO_ROOT/AGENTS.md" ] && [ -f "$REPO_ROOT/CLAUDE.md" ]; then
  if diff -q "$REPO_ROOT/AGENTS.md" "$REPO_ROOT/CLAUDE.md" > /dev/null 2>&1; then
    echo "[OK]   AGENTS.md = CLAUDE.md"
  else
    echo "[WARN] AGENTS.md and CLAUDE.md out of sync — run scripts/sync-shims.sh"
    WARNINGS=$((WARNINGS + 1))
  fi
fi

echo ""
echo "--- Script Safety ---"
check_setup_shell_safety

echo ""
echo "--- Instruction Files ---"
check_agents_doc_compatibility

echo ""
echo "Errors: $ERRORS | Warnings: $WARNINGS"
[ $ERRORS -eq 0 ] && echo "PASSED" || { echo "FAILED"; exit 1; }
