---
description: Agent and skill conventions — loaded when modifying agent or skill definitions
paths:
  - ".agents/agents/**"
  - ".agents/skills/**"
  - ".claude/agents/**"
  - ".claude/skills/**"
---

When modifying agent or skill definitions, apply these conventions:

- Check `AGENTS.md` for project constraints before making structural changes
- Agent source files live in `.agents/agents/` — `.claude/agents/` contains symlinks only, do not edit there
- Skill source files live in `.agents/skills/` — `.claude/skills/` contains symlinks only
- Skills must be cross-tool compatible (Claude Code, Cursor, Codex, Copilot, Gemini) — no tool-specific syntax
- Keep `description:` in skill/agent frontmatter precise — it drives when the tool auto-activates
- `allowed-tools:` in a skill restricts what the agent can call — be intentional, not permissive
- After adding or removing a skill, run `check-kb-index` if KB docs reference it
