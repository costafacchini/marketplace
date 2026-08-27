---
name: doctor
description: >-
  Proactive four-layer health check for the AI framework: memory initialization,
  KB index consistency, skills sync, and hooks configuration. Run at session start
  in a new repo or after pulling framework updates.
auto: false
tags: [health, diagnostics, onboarding]
argument-hint: "[memory | kb | skills | hooks | all]"
---

# Doctor

## Triggers

### Manual
- `/doctor [memory|kb|skills|hooks|all]`
- "run doctor", "health check", "framework health"
- "check if framework is set up", "diagnose", "preflight check"
- "is the framework configured", "check my setup"

Also consider running when:
- Starting work in a repo for the first time
- After running `setup.sh` or `upgrade-framework`
- When skills seem to not be firing correctly

---

Four-layer preflight. Run all layers by default; run a single layer with an arg.

---

## Layer 1: Memory (`memory`)

Check `.agents/memory/`:

- [ ] `project-profile.md` — exists and is not the placeholder template?
  - **If missing or placeholder**: "Memory not initialized. Run `/bootstrap-memory` before starting work."
  - **If present**: read first 5 lines — does the project name match the actual repo?
- [ ] `decisions.md` — exists? If it has 10+ entries, suggest `consolidate-memory`.
- [ ] `preferences.md` — exists? If empty after 10+ sessions (check `log.md` entry count), the AI isn't capturing learnings.
- [ ] `log.md` — exists? Count entries since last `consolidate-memory` event.
- [ ] `context-map.md` — exists? If not, note that adding it improves context loading.

**Verdict for layer**:
- `READY` — project-profile initialized and non-placeholder
- `WARN` — initialized but stale (last updated >90 days, or project name mismatch)
- `FAIL` — missing or placeholder (blocks: run bootstrap-memory first)

---

## Layer 2: KB (`kb`)

```bash
# Count KB docs
find docs/kb -name "*.md" | grep -v README | wc -l

# Check README index exists
[ -f docs/kb/README.md ] && echo "index present" || echo "MISSING"
```

- [ ] `docs/kb/README.md` exists?
- [ ] All `.md` files in `docs/kb/` (excluding README) are listed in the index?
  - If mismatch: "KB index out of sync. Run `/check-kb-index`."
- [ ] `docs/kb/ai-patterns/mistake-log.md` exists? (Critical — session-start reads it)
- [ ] Mistake log has entries? If empty, note that `log-mistake` isn't being used.

**Verdict**: `READY` | `WARN` (index stale) | `FAIL` (missing mistake-log)

---

## Layer 3: Skills (`skills`)

```bash
# Count skill directories
ls .agents/skills/ | wc -l

# Check for dead symlinks in .claude/skills/
find .claude/skills -type l ! -exec test -e {} \; -print 2>/dev/null
```

- [ ] `.agents/skills/` exists with at least 1 skill?
- [ ] `.claude/skills/` symlinks are not broken? (Broken = skill won't fire in Claude Code)
- [ ] Core skills present: `pre-commit-check`, `session-end-checklist`, `log-mistake`, `document-solution`?
- [ ] AGENTS.md skill table matches actual skills in `.agents/skills/`? (Run `check-agent-drift` if unsure)
- [ ] AGENTS.md under 200 lines?

```bash
wc -l AGENTS.md
```

**Verdict**: `READY` | `WARN` (broken symlinks or drift) | `FAIL` (no skills or core skills missing)

---

## Layer 4: Hooks (`hooks`)

```bash
# Check if hooks are registered
cat .claude/settings.json 2>/dev/null | grep -c '"hooks"' || echo "0"

# Check registry
[ -f .claude/hooks/registry.json ] && echo "registry present" || echo "MISSING"
```

- [ ] `.claude/settings.json` has a `hooks` key?
  - If missing: "Hooks not configured. Run `node scripts/hooks-admin.js on` to activate defaults."
- [ ] `.claude/hooks/registry.json` exists?
- [ ] Pre-tool-use security gate active? Check `registry.json` for `security-gate` entry with `enabled: true`.
- [ ] Post-tool-use audit log active? Check for `audit-log` entry.
- [ ] Any hook scripts missing their target file?

```bash
# Verify hook scripts exist
node scripts/hooks-admin.js status 2>/dev/null | grep -E "MISSING|ERROR" || echo "hooks OK"
```

**Verdict**: `READY` | `WARN` (partial — some hooks inactive) | `FAIL` (no hooks at all)

---

## Report Format

```
## Doctor Report — [YYYY-MM-DD]

| Layer  | Status | Issue |
|--------|--------|-------|
| Memory | READY / WARN / FAIL | [description or "—"] |
| KB     | READY / WARN / FAIL | [description or "—"] |
| Skills | READY / WARN / FAIL | [description or "—"] |
| Hooks  | READY / WARN / FAIL | [description or "—"] |

### Actions Required
- [ ] [action if FAIL layers exist]

### Recommended
- [ ] [action if WARN layers exist]

Overall: HEALTHY / DEGRADED / NOT READY
```

**HEALTHY** = all READY
**DEGRADED** = any WARN (work can proceed; fix when convenient)
**NOT READY** = any FAIL (fix before starting work — results will be unreliable)
