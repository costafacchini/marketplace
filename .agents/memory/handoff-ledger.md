---
tier: episodic
slot_kind: state
description: Brownfield handoff ledger. Records what has been delivered, accepted, and by whom. Use on projects with an existing codebase being handed off to this AI agent, or when tracking formal delivery milestones.
---

# Handoff Ledger

Append-only record of brownfield deliverables. Each entry is a scope item:
what was committed to, what was delivered, what was verified, and who accepted.

**When to use**: Projects where you are taking over an existing codebase, delivering
against a fixed scope, or need an auditable trail of what the AI has and hasn't done.

**Format**: One entry per deliverable. Never edit past entries — append corrections as new entries.

---

<!-- Entries appended during delivery. Format:

## [YYYY-MM-DD] [scope item title]

**Committed**: [what was promised — from spec or brief]
**Delivered**: [what was actually built — link to PR or commit]
**Machine evidence**: [test output sha / CI run / coverage report]
**Accepted by**: [operator name, or "auto" if verified by completion panel]
**Status**: DELIVERED | PARTIAL | BLOCKED | DEFERRED

Notes: [optional — what changed from the original commitment, and why]

---

## [YYYY-MM-DD] [correction / amendment title]

**Amends**: [date of the entry this corrects]
**What changed**: [description]
**Reason**: [why the original commitment changed]

-->

---

## Index

| Date | Scope Item | Status | Evidence |
|------|-----------|--------|----------|
| — | *(no entries yet)* | — | — |
