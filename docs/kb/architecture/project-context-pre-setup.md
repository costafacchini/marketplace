# Project Context (Pre-Setup)

> Migrated from `AGENTS.md` before framework setup on 2026-08-27.
> Review this file and move relevant sections into appropriate KB docs.

---

# AGENTS.md

<!-- CACHE EFFICIENCY: Keep stable content (project description, constraints, conventions)
     at the TOP of this file. Claude Code auto-caches the system prompt — volatile content
     (current task, PR links, sprint state) here causes a cache miss every session.
     Volatile state belongs in .agents/memory/, not here. -->

---

## Quick Triggers

**Session Start**: Check `docs/kb/ai-patterns/mistake-log.md` for patterns to avoid. First session in a new repo → run `/doctor` to verify memory, KB, and hooks are initialized.

**During Session**:
- User says "commit/stage" -> run `pre-commit-check`
- You get corrected -> run `log-mistake`
- KB lookup fails -> after solving, run `document-solution`
- You modify KB files -> run `check-kb-index`

**Session End** (user says "done/thanks/bye"): Run `session-end-checklist`

---

## Project Context

**Project**: template

| Aspect | Value |
|--------|-------|
| Language/Framework |  |
| Architecture | Single-purpose |
| Main branch | `main` |
| Deployment | Unknown |
| Database | — |
| Package manager |  |

**Key commands**:
```bash
# [test command]       # Run tests
# [lint command]       # Lint
# [dev command]        # Dev server
```

---

## Knowledge Base

Index: `docs/kb/README.md`

Load ONLY relevant docs. Do not load entire KB.

### KB-First Rule

Before exploring code: check `docs/kb/README.md` for a matching doc. If found,
read it before any grep/read. If not found, explore code, then run
`document-solution` if non-trivial.

---

## Memory

Memory files use a four-tier model. Load by priority:

| File | Tier | `slot_kind` | When to load |
|------|------|-------------|--------------|
| `project-profile.md` | semantic | invariant | Always — never rewrite |
| `decisions.md` | episodic | state | Before architectural choices |
| `preferences.md` | episodic | state | Session start |
| `context-map.md` | procedural | state | When touching code areas |
| `log.md` | working | working | Append-only audit trail |

**Supersession**: When a decision is overturned, mark old entry `[SUPERSEDED by: DATE]` and add a new entry `[SUPERSEDES: DATE]`.
**Consolidation**: After 5+ sessions accumulate, run `consolidate-memory` to merge learnings into `decisions.md` / `preferences.md`.
**Bootstrap**: On a fresh install of an existing project, run `/bootstrap-memory` to seed memory from git history.

---

## Critical Constraints

1. **No magic strings** - Use constants, enums, or config values
2. **No N+1 queries** - Use eager loading where applicable
3. **Sanitize inputs** - Validate at system boundaries
4. **Parameterized queries** - Never interpolate user input into queries

---

## Things to Avoid

1. Over-engineering - only make directly requested changes
2. Breaking existing tests - run tests before committing
3. Adding dependencies without evaluating alternatives
4. Large PRs - prefer small, focused changesets
5. **Claiming a task is done without machine evidence** — "it should work" is not done. Done means tests pass, CI is green, or the output is verified. Self-report without proof is assumed incomplete.

---

## Code Quality

**Style**: Functions 4–20 lines; files <500 lines. Split by responsibility (SRP). Names: specific, <5 grep hits — avoid `data`, `handler`, `Manager`. Explicit types — no `any`, no untyped functions. No duplication — extract shared logic. Early returns; max 2 indent levels. Exception messages must include the offending value and expected shape.

**Comments**: Write WHY not WHAT. Docstrings on public functions: intent + one usage example. Reference issue/SHA when a line exists because of a specific bug or upstream constraint. Never strip comments on refactor — they carry intent.

**Tests**: Every new function gets a test; bug fixes get a regression test. Mock external I/O (API, DB, filesystem) with named fake classes, not inline stubs. Tests must be F.I.R.S.T: fast, independent, repeatable, self-validating, timely.

**Dependencies**: Inject through constructor/parameter, not global/import. Wrap third-party libs behind a thin interface owned by this project.

**Formatting**: Use the project's default formatter (e.g. `prettier`, `rubocop`). No style debates.

**Logging**: Structured JSON for debug/observability. Plain text for user-facing CLI output.

---

## Auto-Triggers

These MUST fire automatically. Full phrase lists: `docs/kb/TRIGGER-CHECKLIST.md`


| Trigger | Action |
|---------|--------|
| User says "commit", "stage", "push" | `pre-commit-check` |
| KB lookup fails -> solved via code | `document-solution` |
| User corrects you | `log-mistake` |
| Modified KB files | `check-kb-index` |
| User ending session | `session-end-checklist` |
| 5+ sessions accumulated | `consolidate-memory` |

---

## Skills

| Skill | When |
|-------|------|
| `pre-commit-check` | Before commit/staging |
| `code-review` | Self-review before PR |
| `dependency-audit` | Check for vulnerable/outdated deps |
| `document-solution` | Complex problem solved or KB miss |
| `log-mistake` | User corrects you |
| `check-kb-index` | After KB file changes |
| `session-end-checklist` | Session ending |
| `framework` | Framework meta — evolve, upgrade, memory, hooks, session, list, drift, cleanup |
| `create-plan` | Starting a multi-step feature |
| `execute-task` | Working on a plan task |
| `execute-plan` | Running remaining plan tasks |
| `scaffold-feature` | Bootstrapping a new feature |
| `investigate-bug` | Bug — investigate, root cause, fix, document |
| `dev-environment` | Start/stop/reset/doctor local dev (AI-configured during init) |
| `changelog-update` | Updating CHANGELOG.md from commits |
| `verification-loop` | Full pre-PR check: build, types, lint, tests, security scan, diff review |
| `tdd-workflow` | Red-green-refactor TDD cycle — write tests first, implement, verify coverage |
| `security-review` | OWASP checklist: auth, input validation, secrets, SQL injection, XSS, CSRF |
| `secrets-hygiene` | Scan staged files, git history, session context for leaked credentials |
| `cross-family-review` | Get a critic from a different model family before merging high-risk changes |
| `doctor` | Four-layer health check: memory, KB, skills, hooks — run on new repos or after updates |
| `eval-harness` | Define pass/fail criteria before coding, track pass@k |
| `strategic-compact` | Compact context at logical task boundaries, not mid-task |
| `add-defect` | Log a defect/bug as a tracked task with severity and reproduction steps |
| `consolidate-memory` | Merge session learnings into decisions.md / preferences.md |
| `promptcraft` | Craft, save, and reuse high-quality prompts for recurring tasks |

Use `/framework <subcommand>` for framework management. Pin sub-commands as shortcuts via `/framework pin`.

---

## Agents

`.agents/agents/`: Claude/tool-agnostic role specs.
`.codex/agents/`: Codex-native custom agents with the same roles.

---

## REMEMBER

Before responding, check:
1. **Am I being corrected?** -> `log-mistake`
2. **Is user committing?** -> `pre-commit-check`
3. **Is user ending session?** -> `session-end-checklist`
4. **Did I solve something complex without KB?** -> `document-solution`
