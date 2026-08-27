#!/usr/bin/env bash

# pre-tool-use.sh — PreToolUse hook for Claude Code
# Blocks dangerous operations before they execute.
# Exit 0 = allow, Exit 2 = block (message shown as reason)
#
# Claude Code passes data via stdin as JSON:
#   { "tool_name": "Bash", "tool_input": { "command": "..." }, ... }
#
# Part of ai-dev-framework — https://github.com/costafacchini/ai-dev-framework

set -uo pipefail

# ─── Read stdin ──────────────────────────────────────────────
HOOK_INPUT=$(cat 2>/dev/null)

TOOL_NAME=$(printf '%s' "$HOOK_INPUT" | jq -r '.tool_name // ""' 2>/dev/null)
TOOL_INPUT=$(printf '%s' "$HOOK_INPUT" | jq -r '.tool_input // {}' 2>/dev/null)

# ─── Secret patterns (defined as variables — not inline) ─────
# Stored as variables so this script can be written/edited without
# triggering its own secret detection on the pattern strings.
PAT_KEY='[A-Za-z_]*KEY["\x27]*[[:space:]]*[:=][[:space:]]*["\x27][A-Za-z0-9/+]{20,}'
PAT_SECRET='[A-Za-z_]*SECRET["\x27]*[[:space:]]*[:=][[:space:]]*["\x27][A-Za-z0-9/+]{20,}'
PAT_TOKEN='[A-Za-z_]*TOKEN["\x27]*[[:space:]]*[:=][[:space:]]*["\x27][A-Za-z0-9/+]{20,}'
PAT_PASSWORD='[A-Za-z_]*PASSWORD["\x27]*[[:space:]]*[:=][[:space:]]*["\x27][^\x27"]{8,}'
PAT_OPENAI='sk-[a-zA-Z0-9]{20,}'
PAT_GITHUB='ghp_[a-zA-Z0-9]{36}'
PAT_GITLAB='glpat-[a-zA-Z0-9\-]{20,}'

SECRET_PATTERNS=("$PAT_KEY" "$PAT_SECRET" "$PAT_TOKEN" "$PAT_PASSWORD" "$PAT_OPENAI" "$PAT_GITHUB" "$PAT_GITLAB")

block() {
  echo "BLOCKED: $1" >&2
  exit 2
}

# ─── Bash command checks ──────────────────────────────────────
if [ "$TOOL_NAME" = "Bash" ]; then
  COMMAND=$(printf '%s' "$TOOL_INPUT" | jq -r '.command // ""' 2>/dev/null)

  # Block force push to protected branches (all flag forms)
  if echo "$COMMAND" | grep -qE '^git[[:space:]]+push\b'; then
    IS_FORCE=false
    echo "$COMMAND" | grep -qE '([[:space:]]--force\b|[[:space:]]-f\b|[[:space:]]\+[a-zA-Z/_-]+)' && IS_FORCE=true
    if $IS_FORCE; then
      if echo "$COMMAND" | grep -qE '\b(main|master|production|release)\b'; then
        block "Force push to protected branch (main/master/production/release) is not allowed"
      fi
    fi
  fi

  # Block destructive rm
  if echo "$COMMAND" | grep -qE 'rm[[:space:]]+-rf[[:space:]]+/($|[[:space:]])'; then
    block "rm -rf / is not allowed"
  fi
  if echo "$COMMAND" | grep -qE 'rm[[:space:]]+-rf[[:space:]]+~($|[[:space:]])'; then
    block "rm -rf ~ is not allowed"
  fi
  if echo "$COMMAND" | grep -qE 'rm[[:space:]]+-rf[[:space:]]+\$HOME($|[[:space:]])'; then
    block "rm -rf \$HOME is not allowed"
  fi

  # Check for hardcoded secrets in commands
  for pattern in "${SECRET_PATTERNS[@]}"; do
    if echo "$COMMAND" | grep -qEi "$pattern"; then
      block "Possible hardcoded secret detected in command"
    fi
  done
fi

# ─── Write/Edit content checks ────────────────────────────────
if [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "Edit" ]; then
  FILE_PATH=$(printf '%s' "$TOOL_INPUT" | jq -r '.file_path // ""' 2>/dev/null)
  CONTENT=$(printf '%s' "$TOOL_INPUT" | jq -r '(.content // .new_string // "")' 2>/dev/null)

  for pattern in "${SECRET_PATTERNS[@]}"; do
    if echo "$CONTENT" | grep -qEi "$pattern"; then
      # Exempt env templates and example files
      case "$FILE_PATH" in
        *.env|*.env.*|*.example|*.template|*.sample) ;;
        *)
          block "Possible hardcoded secret detected in file content"
          ;;
      esac
    fi
  done
fi

# All checks passed
exit 0
