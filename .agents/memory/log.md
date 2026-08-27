---
tier: working
slot_kind: working
description: Append-only audit ledger for memory events. Human-readable. Survives /clear.
---

# Memory Audit Log

Append-only event ledger. One line per significant memory event.
Used by consolidate-memory and session analytics to understand memory evolution.

**Format**: `## [ISO8601] event_type | title`

**Event types**: `session_start`, `session_end`, `decision_captured`, `preference_learned`,
`mistake_logged`, `kb_doc_created`, `consolidation_run`, `bootstrap_run`, `handoff_created`

---

<!-- Events appended automatically by skills. Example:

## [2026-06-17T09:10:00Z] session_start | Auth migration work
## [2026-06-17T09:45:00Z] decision_captured | Switched to Postgres for writes
## [2026-06-17T10:20:00Z] preference_learned | Prefers early returns
## [2026-06-17T14:23:00Z] session_end | Auth migration — phase 1 complete
## [2026-06-18T09:00:00Z] consolidation_run | Merged 3 sessions into decisions.md

-->
