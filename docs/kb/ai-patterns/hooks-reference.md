# Claude Code Hooks Reference

**Last Updated**: 2026-06-24
**Context**: Complete reference for all 30 Claude Code hook events, their options, and usage patterns for `.claude/settings.json` configuration.

---

## All 30 Hook Events

| # | Hook | Description | Notable Fields |
|:-:|------|-------------|----------------|
| 1 | `PreToolUse` | Fires before every tool call — can block | `tool_use_id` |
| 2 | `PermissionRequest` | Fires when Claude requests user permission | `permission_suggestions` |
| 3 | `PostToolUse` | Fires after a tool call succeeds | `tool_response`, `tool_use_id` |
| 4 | `PostToolUseFailure` | Fires after a tool call fails | `error`, `is_interrupt`, `tool_use_id` |
| 5 | `PostToolBatch` | Fires after a full parallel batch resolves — no matcher support | `tool_calls[]` (name, input, result, succeeded) |
| 6 | `UserPromptSubmit` | Fires when user submits a prompt, before Claude processes it | `prompt` |
| 7 | `UserPromptExpansion` | Fires when a slash command expands — supports `matcher` on `command_name` | `expansion_type`, `command_name`, `command_args`, `prompt` |
| 8 | `Notification` | Fires when Claude sends a notification | `notification_type`, `message`, `title` |
| 9 | `MessageDisplay` | Fires while assistant message is displayed — **cannot block**, can rewrite via `displayContent` — no matcher | `message`, `message_index` |
| 10 | `Stop` | Fires when Claude finishes responding | `stop_reason`, `last_assistant_message`, `stop_hook_active` |
| 11 | `SubagentStart` | Fires when a subagent task starts | `agent_id`, `agent_type` |
| 12 | `SubagentStop` | Fires when a subagent task completes | `agent_id`, `agent_type`, `last_assistant_message`, `agent_transcript_path`, `stop_hook_active` |
| 13 | `PreCompact` | Fires before a compact operation — use `once: true` | `compact_trigger` |
| 14 | `PostCompact` | Fires after a compact operation | `compact_trigger` |
| 15 | `SessionStart` | Fires on new or resumed session — use `once: true` | `agent_type`, `model`, `source` |
| 16 | `SessionEnd` | Fires when session ends — use `once: true` | `reason` |
| 17 | `Setup` | Fires via `--init`, `--init-only`, or `--maintenance` CLI flags | — |
| 18 | `TeammateIdle` | Fires when a teammate agent goes idle (requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) | `teammate_name`, `team_name` |
| 19 | `TaskCreated` | Fires when TaskCreate tool is called (agent teams) | `task_id`, `task_subject`, `task_description`, `teammate_name`, `team_name` |
| 20 | `TaskCompleted` | Fires when a background task completes (agent teams) | `task_id`, `task_subject`, `task_description`, `teammate_name`, `team_name` |
| 21 | `ConfigChange` | Fires when a config file changes mid-session | `file_path`, `config_source` |
| 22 | `WorktreeCreate` | Fires when agent worktree isolation creates a worktree | `worktree_path`, `isolation_reason` |
| 23 | `WorktreeRemove` | Fires when agent worktree isolation removes a worktree | `worktree_path`, `removal_reason` |
| 24 | `InstructionsLoaded` | Fires when `CLAUDE.md` or `.claude/rules/*.md` loads | `file_path`, `memory_type`, `load_reason`, `globs`, `trigger_file_path` |
| 25 | `Elicitation` | Fires when an MCP server requests user input | `server_name`, `tool_name`, `elicitation_schema` |
| 26 | `ElicitationResult` | Fires after user responds to MCP elicitation | `server_name`, `tool_name`, `user_response` |
| 27 | `StopFailure` | Fires when turn ends due to API error (rate limit, auth) | `error_type`, `error_message`, `last_assistant_message` |
| 28 | `CwdChanged` | Fires when working directory changes mid-session | `old_cwd`, `new_cwd` |
| 29 | `FileChanged` | Fires when watched files change — **requires `matcher`** with pipe-separated basenames (e.g. `.envrc\|.env`) | `file_path`, `changed_reason` |
| 30 | `PermissionDenied` | Fires when auto-mode classifier denies a tool call — return `{retry: true}` to let model retry | `tool_name`, `tool_input`, `tool_use_id`, `reason` |

All hooks support: `async: true/false`, `timeout: <ms>` (default 5000, Setup uses 30000).

---

## settings.json Structure

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "your-script.sh",
            "timeout": 5000,
            "async": true
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "notify-done.sh",
            "timeout": 5000,
            "async": true,
            "once": true
          }
        ]
      }
    ]
  }
}
```

- **`matcher`**: Regex matched against tool name (PreToolUse/PostToolUse) or command name (UserPromptExpansion) or file basename (FileChanged). Omit to match all.
- **`once`**: Run only once per session. Useful for SessionStart, SessionEnd, PreCompact.
- **`async`**: If `true`, Claude does not wait for the hook to complete. Use for notifications/side-effects.
- **`statusMessage`**: Short text shown in Claude's status bar while hook runs.

---

## Agent Frontmatter Hooks

Agents can define hooks scoped to their own lifecycle in their `.md` frontmatter. Only **6 hooks** fire in agent sessions:

- `PreToolUse`, `PostToolUse`, `PermissionRequest`, `PostToolUseFailure`, `Stop`, `SubagentStop`

```yaml
---
name: my-agent
hooks:
  PreToolUse:
    - matcher: ".*"
      hooks:
        - type: command
          command: echo "agent used a tool"
          timeout: 5000
          async: true
  Stop:
    - hooks:
        - type: command
          command: echo "agent stopped"
          timeout: 5000
          async: true
---
```

---

## Disable All Hooks (Personal Override)

Add to `.claude/settings.local.json` (git-ignored):

```json
{
  "disableAllHooks": true
}
```

---

## Common Patterns

**Notify on completion (macOS):**
```json
"Stop": [{ "hooks": [{ "type": "command", "command": "osascript -e 'display notification \"Claude is done\" with title \"Claude Code\"'", "async": true }] }]
```

**Block dangerous shell commands:**
```json
"PreToolUse": [{ "matcher": "Bash", "hooks": [{ "type": "command", "command": "check-bash-safety.sh" }] }]
```

**Watch `.env` for changes:**
```json
"FileChanged": [{ "matcher": ".env|.env.local|.envrc", "hooks": [{ "type": "command", "command": "direnv allow", "async": true }] }]
```
