---
name: session-end-checklist
description: End-of-session safety net
---

# Session End Checklist

## Context Required
LOW-CONTEXT: AGENTS.md only

## Setup

1. Load `.agents/memory/project-profile.md` (always)
2. Load `.agents/memory/decisions.md` if this skill touches architecture
3. Check `docs/kb/README.md`; read any matching doc before grepping code
4. Explore codebase patterns only after steps 1–3

Skip steps not relevant to this skill's scope.

## Triggers

### Automatic

Trigger when user says ANY of:
- "done", "done for now", "that's all", "that's it"
- "thanks", "thank you", "bye", "talk later"
- "ending session", "wrapping up", "stopping here"
- Any indication the session is ending

### Manual
- `/session-end-checklist`
- "run end-of-session check"
- "wrap up"
- "session complete"

---

## Checklist

1. **Uncommitted changes?** — `git status`. Offer to commit (run pre-commit-check first)
2. **Complex solution undocumented?** — 3+ files or 5+ exchanges? Offer `document-solution`
3. **Corrections logged?** — Any missed corrections? Run `log-mistake`
4. **KB files modified?** — Run `check-kb-index`
5. **Long session?** — 20+ turns mid-task? Offer `save-session`
6. **Execute-and-prove gate** — For every task claimed "done" this session:
   - Tests pass (run them now if not confirmed)?
   - CI green, or at minimum lint/type-check clean?
   - If neither is verifiable: mark as "assumed complete — unverified" in the audit log, not "done".
   - Self-report without machine evidence = incomplete.
7. **Knowledge writeback** — Did you learn anything new about this codebase? If yes, this step is not optional:
   - New gotcha → append to `.agents/memory/decisions.md` or a KB doc
   - New pattern → `document-solution` if non-trivial
8. **Audit log** — Append `session_end` event to `.agents/memory/log.md`:
   `## [ISO8601] session_end | [one-line session summary]`
9. **5+ sessions accumulated?** — Offer `consolidate-memory`

```
## Session End Checklist
- [x] No uncommitted changes
- [x] Solutions documented
- [x] Corrections logged
- [x] KB index current
- [x] Machine evidence for completed tasks (tests run, not self-reported)
- [x] Knowledge written back (gotchas, decisions, patterns)
- [x] Audit log updated
```
