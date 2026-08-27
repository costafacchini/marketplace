#!/usr/bin/env bash

# pre-commit-gate.sh — PreToolUse hook (opt-in)
# Scans staged files for debug artifacts before git commit.
# Enable with: node scripts/hooks-admin.js on pre-commit-gate
# Part of ai-dev-framework — https://github.com/costafacchini/ai-dev-framework

set -uo pipefail

HOOK_INPUT=$(cat 2>/dev/null)
TOOL_NAME=$(printf '%s' "$HOOK_INPUT" | jq -r '.tool_name // ""' 2>/dev/null)

[ "$TOOL_NAME" != "Bash" ] && exit 0

COMMAND=$(printf '%s' "$HOOK_INPUT" | jq -r '.tool_input.command // ""' 2>/dev/null)
echo "$COMMAND" | grep -qE '^git[[:space:]]+commit\b' || exit 0

DEBUG_HITS=$(git diff --cached --unified=0 2>/dev/null | grep '^+' | grep -v '^+++' | \
  grep -iE '(console\.log|debugger|binding\.pry|byebug|pry\.start|TODO:[[:space:]]+remove|FIXME:[[:space:]]+remove)' || true)

if [ -n "$DEBUG_HITS" ]; then
  echo "BLOCKED: Debug artifacts found in staged changes:" >&2
  echo "$DEBUG_HITS" | head -5 >&2
  echo "Remove debug statements before committing." >&2
  exit 2
fi

exit 0
