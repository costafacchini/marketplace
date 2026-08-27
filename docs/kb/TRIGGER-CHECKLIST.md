# Trigger Checklist (Quick Reference)

Use this checklist to verify you're triggering skills correctly. These are MANDATORY behaviors.

**Context**: trigger checklist, skill triggers, when to run skills, automation

---

## At Session Start

- [ ] Read `AGENTS.md`
- [ ] Check `docs/kb/README.md` for relevant docs
- [ ] Review `docs/kb/ai-patterns/mistake-log.md` for patterns to avoid
- [ ] Check for active session files in `docs/kb/sessions/`

---

## During Session — Mandatory Auto-Triggers

### MUST Trigger: `pre-commit-check`

When user says ANY of:
- "commit", "git commit", "create commit"
- "stage", "git add", "add these files"
- "prepare for commit", "ready to commit"
- "create a PR", "open a pull request"

**Action**: Run `pre-commit-check` BEFORE the git operation, not after.

---

### MUST Trigger: `log-mistake`

When user says ANY of:
- "that's wrong", "that's not right", "that's incorrect"
- "no, it should be...", "actually...", "not quite..."
- "you forgot to...", "you missed...", "you need to..."
- "we already discussed...", "I told you earlier..."
- Provides a fix or correction to your output
- Points out a convention/pattern you violated

**Action**: Run `log-mistake` immediately. Do NOT wait for "please log this".

---

### MUST Trigger: `document-solution`

When ALL of these are true:
1. You checked KB for relevant docs
2. No relevant doc existed
3. You searched code/investigated to solve
4. You successfully solved the problem

Also when:
- Bug fix required reading 3+ files
- Solution used a non-obvious pattern
- 5+ back-and-forth exchanges to resolve
- User says "document this"

**Action**: Run `document-solution` then `check-kb-index`.

---

### MUST Trigger: `check-kb-index`

When you:
- Created any file in `docs/kb/`
- Modified any file in `docs/kb/`
- Ran `document-solution`

**Action**: Run `check-kb-index` to update the index.

---

### MUST Trigger: `session-end-checklist`

When user says ANY of:
- "done", "done for now", "that's all", "that's it"
- "thanks", "thank you", "bye", "talk later"
- "ending session", "wrapping up", "stopping here"

**Action**: Run `session-end-checklist`. This is the safety net — it verifies all other triggers fired correctly.

---

### Offer Proactively: `save-session`

When:
- Session reaches 20+ turns with in-progress work
- User says "let's pause", "continue later", "stop for now"

**Action**: Offer to run `save-session`.

---

## Manual Skills

| Skill | Invoke When |
|-------|-------------|
| `create-plan` | "create a plan", "plan this feature", feature needs 3+ files |
| `execute-task` | "work on task-01", "pick up the next task" |
| `execute-plan` | "run the plan", "execute remaining tasks" |
| `code-review` | "review my changes", "prepare for PR" |
| `investigate-bug` | "this is broken", "getting an error", "debug [issue]" |
| `scaffold-feature` | "scaffold [feature]", "bootstrap [feature]" |
| `dependency-audit` | "audit deps", "check for vulnerabilities" |
| `changelog-update` | "update changelog", "what changed since last release?" |
| `dev-environment` | "start dev", "spin up", "dockerize" |
| `evolve-framework` | "evolve", "health check", "improve framework" |
| `setup-tests` | "setup tests", "add tests", "configure testing" |
| `list-skills` | "what skills?", "what can you do?" |

---

## Self-Check After Any Non-Trivial Task

1. **Did I check KB first?** If not, I should have.
2. **Did KB have what I needed?** If no — need to document solution.
3. **Was I corrected by the user?** If yes — need to log mistake.
4. **Did I modify KB files?** If yes — need to update index.
5. **Is the user committing code?** If yes — need pre-commit check.
6. **Is the session getting long (20+ turns)?** If yes — offer save-session.
7. **Is the user ending the session?** If yes — run session-end-checklist.

---

## Skill Locations

| Skill | Path |
|-------|------|
| `pre-commit-check` | `.agents/skills/pre-commit-check/SKILL.md` |
| `log-mistake` | `.agents/skills/log-mistake/SKILL.md` |
| `document-solution` | `.agents/skills/document-solution/SKILL.md` |
| `check-kb-index` | `.agents/skills/check-kb-index/SKILL.md` |
| `session-end-checklist` | `.agents/skills/session-end-checklist/SKILL.md` |
| `save-session` | `.agents/skills/save-session/SKILL.md` |
| `create-plan` | `.agents/skills/create-plan/SKILL.md` |
| `execute-task` | `.agents/skills/execute-task/SKILL.md` |
| `execute-plan` | `.agents/skills/execute-plan/SKILL.md` |
| `code-review` | `.agents/skills/code-review/SKILL.md` |
| `investigate-bug` | `.agents/skills/investigate-bug/SKILL.md` |
| `scaffold-feature` | `.agents/skills/scaffold-feature/SKILL.md` |
| `dependency-audit` | `.agents/skills/dependency-audit/SKILL.md` |
| `changelog-update` | `.agents/skills/changelog-update/SKILL.md` |
| `dev-environment` | `.agents/skills/dev-environment/SKILL.md` |
| `evolve-framework` | `.agents/skills/evolve-framework/SKILL.md` |
| `setup-tests` | `.agents/skills/setup-tests/SKILL.md` |
| `list-skills` | `.agents/skills/list-skills/SKILL.md` |
