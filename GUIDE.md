# Usage Guide

How to use the AI Dev Framework in your daily workflow.

---

## 1. Setup (Once Per Project)

### Quick Setup

**Option A — copy the template into your project, then run from there:**
```bash
cp -r ai-dev-framework/template/ /path/to/your/project/
cd /path/to/your/project
scripts/setup.sh
```

**Option B — keep ai-dev-framework inside your project and use `--target`:**
```bash
# From inside your project (ai-dev-framework/ copied here)
ai-dev-framework/template/scripts/setup.sh --profile standard --target .
```

### Profiles

| Profile | What's installed | Best for |
|---------|-----------------|----------|
| **minimal** | AGENTS.md, shims, .aiignore | Quick scripts, prototypes |
| **lite** | + pre-commit-check, code-review, dependency-audit | Small projects |
| **standard** | + KB, knowledge skills, sessions, dev skills, memory | **Most projects** |
| **full** | + planning, agents, CI, evolve-framework | Serious projects |

```bash
# Use a profile directly (skip interactive)
scripts/setup.sh --profile standard

# Install into a specific directory (Option B workflow)
scripts/setup.sh --profile standard --target /path/to/your/project

# Or pick specific components
scripts/setup.sh --components core,kb,agents,skills-quality
```

### What setup.sh does

1. **Detects** your language, framework, package manager, test runner, linter, DB, CI
2. **Generates** a customized AGENTS.md with real commands (not placeholders)
3. **Installs** only the components your profile includes
4. **Injects** knowledge packs for your detected stack (Rails, React, Go, etc.)
5. **Creates** tool shims, Codex agent configs, .gitignore entries, and memory profile

### Adding/removing components later

```bash
# See what's installed and what's available
scripts/setup.sh --list

# Add a component (dependencies auto-resolve)
scripts/setup.sh --add plans              # installs .plans/ system
scripts/setup.sh --add skills-planning    # auto-installs plans + core too

# Remove a component
scripts/setup.sh --remove ci

# Preview without writing
scripts/setup.sh --dry-run --profile full
```

### 12 Components

| Component | Contains | Requires |
|-----------|---------|----------|
| **core** | AGENTS.md, shims, .aiignore, detection | — |
| **skills-quality** | pre-commit-check, code-review, dep-audit | core |
| **skills-knowledge** | document-solution, log-mistake, check-kb-index | core, kb |
| **skills-session** | save-session, session-end-checklist | core, kb |
| **skills-planning** | create-plan, execute-task, execute-plan | core, plans |
| **skills-dev** | scaffold-feature, investigate-bug, changelog-update, dev-environment, setup-tests | core, kb |
| **skills-meta** | list-skills, evolve-framework | core, kb, memory |
| **kb** | docs/kb/ structure + knowledge packs | core |
| **plans** | .plans/ system | core |
| **agents** | 8 agent definitions + Codex custom agents | core |
| **memory** | project profile, decisions, preferences, context map | core |
| **ci** | GitHub Actions KB health check | core, kb |

After setup, every AI tool that opens this project will automatically read
the conventions and follow them.

---

## 2. Daily Workflow

### What happens automatically (you don't need to do anything)

| You do this... | The AI does this... |
|----------------|---------------------|
| Say "let's commit" | Runs `pre-commit-check` before the git operation |
| Get corrected ("that's wrong...") | Runs `log-mistake` to record the pattern |
| Solve a complex problem (3+ files) | Offers to run `document-solution` |
| Modify a KB doc | Runs `check-kb-index` to update the index |
| Say "thanks, done" | Runs `session-end-checklist` |

### What you invoke when needed

```
# Before creating a PR
run code-review

# Something is broken
run investigate-bug <description>

# Starting a big feature
run create-plan

# Check for security issues
run dependency-audit

# New feature boilerplate
run scaffold-feature user-authentication

# Update changelog before release
run changelog-update

# Pausing work mid-task
run save-session

# See all skills
run list-skills
```

You can invoke skills with `run skill-name` or natural language
("check if my deps have vulnerabilities"). Slash forms depend on the tool.
Codex automatically discovers repo-scoped skills from `.agents/skills`.

---

## 3. Skills Reference

### Auto-Triggered (fire without asking)

| Skill | Trigger | What It Does |
|-------|---------|--------------|
| `pre-commit-check` | commit / stage / push | Runs linter, tests, convention scan. Reports BLOCK/WARN/INFO. |
| `log-mistake` | AI gets corrected | Appends to mistake-log.md. Escalates to AGENTS.md at 3+ repeats. |
| `document-solution` | KB miss + solved | Creates a KB doc from the solution, updates index. |
| `check-kb-index` | KB files changed | Syncs docs/kb/README.md with actual files. |
| `session-end-checklist` | Session ending | Checks: uncommitted changes? undocumented solutions? tests passing? |

### Manual (invoke when needed)

| Skill | What It Does |
|-------|--------------|
| `code-review` | 5-category review (conventions, quality, testing, security, architecture). Use before PRs. |
| `verification-loop` | Full pre-PR check: build, types, lint, tests, security scan, diff review. Produces a structured report. |
| `tdd-workflow` | Red-green-refactor TDD cycle. Write failing tests first, implement to pass, refactor, verify coverage. |
| `security-review` | OWASP checklist for auth, input validation, secrets, SQL injection, XSS, CSRF, rate limiting. |
| `investigate-bug` | Full bug lifecycle: reproduce, root cause, fix, regression test, document. |
| `dependency-audit` | Detects package manager, runs security audit + outdated check. Multi-language. |
| `scaffold-feature` | Detects project patterns, generates boilerplate files + tests for a new feature. |
| `dev-environment` | Project-specific: AI initializes local dev containers and concrete commands on first run. |
| `changelog-update` | Reads git history since last tag, categorizes commits, updates CHANGELOG.md. |
| `save-session` | Creates a handoff doc with decisions, files changed, and next steps. |
| `create-plan` | Creates a `.plans/` directory with overview, task table, file ownership. |
| `execute-task` | Runs a specific task from a plan with pre-flight checks. |
| `execute-plan` | Runs all remaining plan tasks in dependency order with phase gates. |
| `setup-tests` | Guides through selecting and scaffolding a test runner for repos with no tests configured. |
| `eval-harness` | Eval-driven development: define pass/fail criteria before coding, track reliability with pass@k. |
| `strategic-compact` | Compact context at logical task boundaries to preserve what matters before auto-compaction fires. |
| `evolve-framework` | Self-audit, research updates, suggest and apply improvements to the framework. |
| `list-skills` | Shows all available skills with triggers. |

---

## 4. Agents Reference

Agents are specialized roles the AI can assume. Claude Code can wire them
through its Agent tool. Codex installs matching custom agents under
`.codex/agents/*.toml`; other tools can still use the Markdown specs as role
definitions.

| Agent | Model Tier | What It Does | Can Modify Files? |
|-------|------------|--------------|-------------------|
| **orchestrator** | opus | Breaks complex tasks into subtask DAGs, delegates to other agents | No (coordination only) |
| **planner** | opus | Analyzes requirements, creates implementation plans | No (read-only) |
| **implementer** | sonnet | Writes code following project conventions | Yes |
| **reviewer** | sonnet | Reviews code for bugs, conventions, security | No (read-only) |
| **researcher** | sonnet | Searches KB, codebase, and web for context | No (read-only) |
| **tester** | haiku | Runs tests, identifies coverage gaps | No (runs commands only) |
| **test-writer** | sonnet | Generates test files from coverage gaps | Yes |
| **documenter** | haiku | Maintains KB docs, session handoffs, mistake log | Yes |

**Model tiers**: opus = complex reasoning, sonnet = balanced speed/quality, haiku = fast/cheap.

**Least privilege**: Reviewers and researchers can't modify files. This prevents
accidental changes during exploration.

---

## 5. Knowledge Base Workflow

The KB lives in `docs/kb/` and is the AI's first stop before exploring code.

### How it grows

```
You encounter a pattern    -->  AI searches KB
KB has a doc               -->  AI reads it (saves tokens, avoids mistakes)
KB doesn't have a doc      -->  AI explores code, solves the problem
Solution was complex       -->  AI runs document-solution, creates KB doc
                                Future sessions find it in KB instead of re-exploring
```

### KB categories

| Folder | What goes here |
|--------|----------------|
| `architecture/` | System design, data flows, infrastructure patterns |
| `features/` | Feature-specific implementation details |
| `integrations/` | Third-party service integrations |
| `api/` | API documentation and contracts |
| `bugfixes/` | Root cause analyses worth preserving |
| `ai-patterns/` | Mistake log, trigger log, agent learnings |
| `sessions/` | Session handoff documents |

### Maintaining the KB

- After any KB change, `check-kb-index` auto-fires to update the index
- Weekly CI workflow (`ai-kb-check.yml`) flags stale docs (90+ days)
- You don't need to manually maintain `docs/kb/README.md` — the AI does it

### Adding a doc manually

If you want to pre-seed the KB with project knowledge:

```markdown
# docs/kb/architecture/authentication.md

# Authentication

**Last Updated**: 2026-03-29
**Context**: When working on auth, sessions, login, or tokens

## Overview
We use JWT tokens stored in httpOnly cookies...

## Key Files
- `app/services/auth_service.rb:45` — token generation
- `app/middleware/auth.rb:12` — token validation

## Common Pitfalls
- Tokens expire after 24h — don't cache them longer
```

Then run `check-kb-index` (or the AI will do it automatically).

---

## 6. Plans Workflow

Plans are for features that span 3+ files or multiple sessions. The framework uses a **spec-driven** approach: before breaking work into tasks, the AI generates a feature spec with user stories and acceptance scenarios that drive both task design and test generation.

### Creating a plan

```
run create-plan
```

The AI will:
1. Ask about requirements and constraints
2. Research the codebase and detect your test framework
3. **Generate `spec.md`** — user stories (P1/P2/P3), Given/When/Then acceptance scenarios, functional requirements (FR-XXX), and success criteria (SC-XXX). You review and approve the spec before tasks are created.
4. Break work into dependency-ordered tasks, each referencing its spec stories
5. **Generate test stubs** from acceptance scenarios in your test framework (RSpec, pytest, Jest, etc.)
6. Present the full plan for your approval

### Plan structure

```
.plans/user-authentication/
+-- spec.md              ← user stories, acceptance scenarios, FR-XXX, SC-XXX
+-- overview.md          ← phases, task table, spec link
+-- phase-1/
|   +-- task-01-user-model/
|       +-- task.md      ← spec refs: Story 1 (P1), FR-001
|       +-- status.md
+-- phase-2/
    +-- task-02-auth-service/
        +-- task.md      ← spec refs: Story 1+2, FR-002..003
        +-- status.md
```

Test stubs are generated alongside the plan:
```
spec/models/user_spec.rb        ← 2 pending scenarios from Story 1
spec/services/auth_spec.rb      ← 3 pending scenarios from Stories 1+2
```

### Executing

```
# Work on a specific task
run execute-task phase-1/task-01-user-model

# Or run all remaining tasks in order
run execute-plan
```

The AI respects file ownership — task 2 won't touch files owned by task 3.

**Phase gates** check that all acceptance scenario stubs for completed tasks are passing before advancing to the next wave. **Plan completion** verifies every SC-XXX success criterion from the spec.

---

## 7. Bug Workflow

When something is broken:

```
run investigate-bug Users can't log in after password reset
```

The AI follows 4 phases:

### Phase 1: Reproduce
- Gets the facts (expected vs actual, error messages)
- Searches KB for similar past bugs
- Tries to reproduce

### Phase 2: Root Cause
- Traces from symptom to source (file:line)
- Checks `git log` for recent changes
- Documents root cause before touching anything

### Phase 3: Fix
- Simple (1-2 files): fixes directly
- Complex (3+ files): creates a plan first
- Writes a regression test that fails without the fix

### Phase 4: Document
- Non-trivial bugs get a `docs/kb/bugfixes/` entry
- Trivial fixes (typos, obvious mistakes) skip documentation
- Runs `pre-commit-check` before committing

---

## 8. Session Management

### Saving a session

When you need to stop mid-task:

```
run save-session
```

Creates `docs/kb/sessions/2026-03-29_feature-name.md` with:
- What you were working on
- Decisions made
- Files changed
- Next steps
- Resume command

### Resuming a session

In your next AI session:

```
Continue from docs/kb/sessions/2026-03-29_feature-name.md
```

The AI reads the handoff doc and picks up where you left off.

### Session end

When you're done for the day, say "done" or "thanks" and the AI runs
`session-end-checklist` automatically — checking for uncommitted changes,
undocumented solutions, and untested code.

---

## 9. Monorepo Setup

For projects with distinct subsystems, use nested AGENTS.md files:

```
my-project/
|-- AGENTS.md              # Global rules (always loaded)
|-- frontend/
|   +-- AGENTS.md          # Frontend-specific (React, Vite, etc.)
|-- backend/
|   +-- AGENTS.md          # Backend-specific (Go, Python, etc.)
+-- infra/
    +-- AGENTS.md          # Infra-specific (Terraform, CDK, etc.)
```

**How it works**: When the AI works on a file in `frontend/`, it reads both
the root AGENTS.md and `frontend/AGENTS.md`. The closer file takes precedence.

**What to put where**:
- Root AGENTS.md: Shared conventions, KB pointers, auto-triggers
- Subdirectory AGENTS.md: Stack-specific commands, constraints, patterns

See `docs/kb/architecture/nested-agents-md.md` for detailed examples.

---

## 10. Customizing AGENTS.md

The only file you must edit. Look for `<!-- CUSTOMIZE -->` comments:

1. **Project Context** — Your stack, branch, deployment, commands
2. **KB keyword mappings** — Map task keywords to KB docs as you create them
3. **Critical Constraints** — Your hard rules (timeouts, security, multi-tenancy)
4. **Things to Avoid** — Anti-patterns specific to your project

Keep it under 200 lines. If you need more detail, put it in a KB doc
and reference it from AGENTS.md.

After editing, sync the shim:

```bash
scripts/sync-shims.sh
```

---

## 11. Memory System

The framework maintains persistent memory across sessions in `.agents/memory/`:

| File | Purpose | When It's Used |
|------|---------|----------------|
| `project-profile.md` | Auto-detected stack, structure, commands | Session start — loaded for project context |
| `decisions.md` | Architectural decisions log (append-only) | Before making architectural choices |
| `preferences.md` | How you like to work (learned from corrections) | Session start — avoid repeating unwanted behaviors |
| `context-map.md` | Maps code areas to KB docs | When touching code — find relevant KB doc fast |

### How memory grows

- **project-profile.md**: Generated by `setup.sh`, updated manually if detection was wrong
- **decisions.md**: AI appends entries when significant architectural decisions are made
- **preferences.md**: Updated by `log-mistake` when patterns emerge from corrections
- **context-map.md**: Updated by `document-solution` and `check-kb-index` as KB docs are created

### Memory vs KB vs Session

| Type | Location | Lifespan | Purpose |
|------|----------|----------|---------|
| Memory | `.agents/memory/` | Permanent | How to work in this project |
| KB | `docs/kb/` | Permanent | What patterns exist in this codebase |
| Session | `docs/kb/sessions/` | Temporary | Where you left off mid-task |

---

## 12. Docker & Dev Environment

### How it works (two phases)

The `dev-environment` skill uses the **AI itself** to analyze your project —
not a bash template. This means it works with any language, any framework,
any set of dependencies.

**Phase 1 — Init (first run):**
```
run dev-environment init
```
The AI will:
1. Read your actual dependency files (Gemfile, package.json, go.mod, etc.)
2. Identify system packages each dependency needs (e.g., `pg` gem → `libpq-dev`)
3. Detect external services (PostgreSQL, Redis, workers, etc.)
4. Ask you about anything ambiguous
5. Generate Dockerfile, docker-compose.yml, .env.example
6. Update the skill itself with concrete commands for YOUR project

**Phase 2 — Daily use (after init):**
```
run dev-environment start    # Build, start, install deps, migrate, verify
run dev-environment stop     # Graceful shutdown (keeps data)
run dev-environment reset    # Tear down + rebuild from scratch (asks first)
run dev-environment status   # Show running services and health
run dev-environment doctor   # Diagnose common problems
```

### Why the AI generates, not a script

A bash script can detect "this is Rails + PostgreSQL" but can't know that:
- Your `mini_magick` gem needs `imagemagick` installed in the container
- Your `wkhtmltopdf` usage needs a 300MB binary
- Your `.env.example` references a custom internal service
- Your specific PostgreSQL version is 14, not 16

The AI reads the actual files and understands these nuances.

### Regenerating

If your dependencies change significantly:
```
run dev-environment regenerate
```

---

## 13. Framework Self-Evolution

The framework improves itself over time. Run periodically or when things feel stale:

```
run evolve-framework
```

### What it does (4 phases)

**Phase 1 — Audit**: Reads mistake-log, trigger-log, KB coverage, skill usage,
memory health, and AGENTS.md drift. Produces a health score (A-F) and findings.

**Phase 2 — Research**: Web searches for AGENTS.md spec updates, popular new
community skills, knowledge pack freshness (new framework versions), and tool
updates (Claude Code, Codex, Cursor, etc.).

**Phase 3 — Suggest**: Combines audit + research into ranked proposals (P0-P3)
with concrete changes, evidence, and effort estimates. Presents for approval.

**Phase 4 — Apply**: Executes approved changes, runs validation, logs to
decisions.md for traceability.

### Run specific phases

```
run evolve-framework audit      # Just the diagnostic
run evolve-framework research   # Just external research
run evolve-framework suggest    # Audit + research + proposals
run evolve-framework apply      # Apply previously approved proposals
```

### The self-improvement flywheel

```
mistakes → rules → fewer mistakes
KB gaps → docs → better context → faster work
repetitive workflows → skills → automation
community advances → updates → current best practices
```

### When to run

- Every 30 days (good cadence for personal projects)
- After 5+ new mistake-log entries
- After a major language/framework release
- When the AI keeps getting the same things wrong
- When onboarding a new tool or stack

---

## 14. Knowledge Packs

When `setup.sh` detects your stack, it installs pre-written KB docs with
idiomatic patterns for your language and framework. These go into
`docs/kb/architecture/` and are indexed automatically.

**Language & framework packs** (installed when stack is detected):
Ruby, Rails, TypeScript, React, Next.js, Python, Django, FastAPI, Express,
Go, Rust, Vue, Laravel, Phoenix, Elixir, PHP.

Each pack covers: style conventions, common patterns, error handling, and
pitfalls that AI agents frequently get wrong.

**Cross-language pattern packs** (installed when Rails, Django, Laravel, or
Phoenix is detected):
- `patterns-architecture.md` — state modeling, write-time computation, outbox
  pattern, idempotency, failure classification, circuit breaker
- `patterns-security.md` — SSRF defense, auth layering, scoped lookups, rate
  limiting, webhook signing, CSRF pitfalls
- `patterns-testing.md` — coverage budgets, behavior-over-implementation, no
  test-induced design damage, mock-only-at-boundaries

---

## Quick Reference Card

| I want to... | Do this |
|---------------|---------|
| Set up a new project | `cp -r template/ project/ && scripts/setup.sh` or use `--target .` |
| Commit safely | Just say "commit" — pre-commit-check auto-fires |
| Review before PR | `run code-review` or `run verification-loop` |
| Fix a bug | `run investigate-bug <description>` |
| Plan a feature | `run create-plan` |
| Start a feature fast | `run scaffold-feature <name>` |
| Check security | `run dependency-audit` or `run security-review` |
| Update changelog | `run changelog-update` |
| Pause work | `run save-session` |
| Resume work | `Continue from docs/kb/sessions/<file>` |
| Start dev environment | `run dev-environment start` |
| Fix dev env problems | `run dev-environment doctor` |
| Evolve the framework | `run evolve-framework` |
| Set up tests (no runner yet) | `run setup-tests` |
| See all skills | `run list-skills` |
| Add project knowledge | Create doc in `docs/kb/`, AI updates index |
| Check framework health | `scripts/validate.sh` |
