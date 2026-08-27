---
tier: episodic
slot_kind: state
description: Architectural decisions log. Check before making architectural choices. Consolidate-memory can rewrite this.
---

# Architectural Decisions

Append-only log of significant decisions made during development.
AI agents should check this before making architectural choices.

**Format**: Each entry records what was decided, why, and what was rejected.
**Supersession**: When a decision is overturned, mark the old entry `[SUPERSEDED by: YYYY-MM-DD]` and add a new entry.
**Evidence**: High-impact decisions should include an Evidence section — benchmark results, failure data, or a reference to what broke without this decision. Decisions with evidence are harder to accidentally reverse.

---

<!-- Entries appended by AI during sessions. Example:

## [2026-03-29] Use JWT for authentication instead of session cookies

**Context**: Needed stateless auth for the API
**Decision**: JWT tokens in httpOnly cookies
**Rejected**: Server-side sessions (didn't want Redis dependency)
**Consequences**: Need token refresh logic, 24h expiry
**Evidence**: —

## [2026-04-15] Switch to session cookies [SUPERSEDES: 2026-03-29]

**Context**: JWT refresh logic became a maintenance burden; 3 incidents in 2 weeks from stale tokens
**Decision**: Server-side sessions with Redis
**Rejected**: JWT (too complex for our scale)
**Consequences**: Requires Redis in the stack
**Evidence**: 3 production incidents (INCs #42, #51, #67) traced to JWT refresh edge cases

## [2026-05-01] Cross-family review — auth middleware refactor

**Author family**: Claude/Anthropic
**Critic family**: GPT-4o
**Verdict**: CONCERNS
**Bug findings**: 1 critical — token rotation window allowed replay within 30s
**Action taken**: Fixed rotation logic; added replay prevention with nonce store
**Confidence**: High

Note: The 2026-03-29 JWT entry is now [SUPERSEDED by: 2026-04-15]

-->
