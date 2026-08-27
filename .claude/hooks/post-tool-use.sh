#!/usr/bin/env bash

# post-tool-use.sh — PostToolUse hook for Claude Code
# 1. Logs file writes/edits to an append-only audit trail.
# 2. Tracks tool call count and suggests /strategic-compact when pressure is high.
# Always exits 0 (audit-only, never blocks).
#
# Part of ai-dev-framework — https://github.com/costafacchini/ai-dev-framework

set -uo pipefail

TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$(dirname "$SCRIPT_DIR")")"
AUDIT_DIR="$ROOT_DIR/.ai-memory/audit"

mkdir -p "$AUDIT_DIR"

TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
LOG_FILE="$AUDIT_DIR/writes-$(date +%Y-%m-%d).log"

# Symlink-clobber protection: refuse writes if audit dir or log file is a symlink.
# A local attacker could replace these predictable paths with symlinks to clobber
# other files (e.g. append credentials into ~/.ssh/authorized_keys).
[ -L "$AUDIT_DIR" ] && exit 0
[ -L "$LOG_FILE" ] && exit 0

# ─── Log Write/Edit operations ───────────────────────────────
if [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "Edit" ]; then
  FILE_PATH=$(printf '%s' "$TOOL_INPUT" | jq -r '.file_path // ""' 2>/dev/null)
  if [ -n "$FILE_PATH" ]; then
    echo "$TIMESTAMP  $TOOL_NAME  $FILE_PATH  pid:$$" >> "$LOG_FILE"
  fi
fi

# ─── Log notable Bash operations ─────────────────────────────
if [ "$TOOL_NAME" = "Bash" ]; then
  COMMAND=$(printf '%s' "$TOOL_INPUT" | jq -r '.command // ""' 2>/dev/null)
  if echo "$COMMAND" | grep -qE '(git push|git reset|rm -r|rm -f|chmod |chown )'; then
    echo "$TIMESTAMP  Bash  $COMMAND  pid:$$" >> "$LOG_FILE"
  fi
fi

# ─── Context pressure tracking ───────────────────────────────
# Counts tool calls per hour-block. Suggests /strategic-compact when
# pressure exceeds THRESHOLD, then reminds every REMIND_EVERY calls after.
COUNTER_FILE="$ROOT_DIR/.ai-memory/context-counter"
THRESHOLD=50
REMIND_EVERY=10

# Symlink-clobber protection for counter file
[ -L "$COUNTER_FILE" ] && exit 0

# Session key = current hour (YYYY-MM-DD-HH). Auto-resets after an idle hour.
SESSION_KEY="$(date +%Y-%m-%d-%H)"
STORED_KEY=""
COUNT=0
LAST_NOTIFIED=0

if [ -f "$COUNTER_FILE" ]; then
  STORED_KEY=$(sed -n '1p' "$COUNTER_FILE" 2>/dev/null || true)
  COUNT=$(sed -n '2p' "$COUNTER_FILE" 2>/dev/null || echo 0)
  LAST_NOTIFIED=$(sed -n '3p' "$COUNTER_FILE" 2>/dev/null || echo 0)
fi

# Reset if session key changed (new hour)
if [ "$STORED_KEY" != "$SESSION_KEY" ]; then
  COUNT=0
  LAST_NOTIFIED=0
fi

COUNT=$((COUNT + 1))

# Check if we should notify
NOTIFY=false
if [ "$COUNT" -ge "$THRESHOLD" ]; then
  if [ "$LAST_NOTIFIED" -eq 0 ]; then
    NOTIFY=true
  elif [ $((COUNT - LAST_NOTIFIED)) -ge "$REMIND_EVERY" ]; then
    NOTIFY=true
  fi
fi

if $NOTIFY; then
  LAST_NOTIFIED=$COUNT
  printf '%s\n%s\n%s\n' "$SESSION_KEY" "$COUNT" "$LAST_NOTIFIED" > "$COUNTER_FILE"
  echo "Context pressure: $COUNT tool calls this session. Consider /strategic-compact at the next phase boundary." >&2
else
  printf '%s\n%s\n%s\n' "$SESSION_KEY" "$COUNT" "$LAST_NOTIFIED" > "$COUNTER_FILE"
fi

exit 0
