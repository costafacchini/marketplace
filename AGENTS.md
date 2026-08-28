<!-- ai-dev-framework v0.4.0 — update skills via /upgrade-framework -->
# AGENTS.md

---

## Quick Triggers

**Session Start**: Check `docs/kb/ai-patterns/mistake-log.md` for patterns to avoid.

**During Session**:
- User says "commit/stage" -> run `pre-commit-check`
- You get corrected -> run `log-mistake`
- KB lookup fails -> after solving, run `document-solution`
- You modify KB files -> run `check-kb-index`

**Session End** (user says "done/thanks/bye"): Run `session-end-checklist`

---

## Project Context

**Project**: small-business-seller

| Aspect | Value |
|--------|-------|
| Language/Framework | Next.js 14 (App Router), TypeScript |
| Architecture | Route groups — `(store)` public (unauthenticated) + `(admin)` protected by NextAuth |
| Main branch | `main` |
| Deployment | Vercel (frontend) + Railway (PostgreSQL) |
| Database | PostgreSQL via Prisma ORM |
| Package manager | npm |

**Key commands**:
```bash
npm run dev                              # Dev server (localhost:3000)
npm run build                            # Production build
npm run lint                             # ESLint
npx prisma migrate dev --name <name>    # Create + apply dev migration
npx prisma migrate deploy               # Apply migrations in production
npx prisma studio                        # Browse database GUI
npx prisma generate                      # Regenerate Prisma client
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

At session start, read `.agents/memory/project-profile.md` for cached context.
Check `.agents/memory/decisions.md` when making architectural choices.
Update `.agents/memory/preferences.md` when you learn how the user works.

---

## Critical Constraints

1. **No magic strings** - Use constants, enums, or config values
2. **No N+1 queries** - Use eager loading where applicable; fetch all active price lists once per page render
3. **Sanitize inputs** - Validate at system boundaries (zod on client + server for all forms)
4. **Parameterized queries** - Never interpolate user input into queries
5. **Decimal serialization** - Prisma `Decimal` cannot be passed to Client Components; serialize to `string` in the Server Component and convert back with `Number()` where needed
6. **Pricing logic** - All price resolution lives in `lib/pricing.ts`; never duplicate discount logic elsewhere
7. **Soft delete only** - Never hard-delete products or price lists; use `active = false`
8. **bcryptjs not bcrypt** - Use `bcryptjs` (pure JS) to avoid native module issues on Vercel
9. **Cloudinary uploads** - Images upload directly from the browser via Cloudinary Upload Widget; the server only stores the resulting URLs in `product.images[]`
10. **i18n — no hardcoded strings** - All user-facing text MUST use `getTranslations()` (Server Components) or `useTranslations()` (Client Components) from `next-intl`; locale is set by `NEXT_PUBLIC_LOCALE` (`en` default | `pt`); translation files are `messages/en.json` and `messages/pt.json` — every key added in one file must be mirrored in the other
11. **TDD** - Write the failing test first, then the implementation. Tests are never written after the fact. Every PR must include tests written before or alongside the code.
12. **Test coverage ≥ 60%** - `npm run test:coverage` must exit 0. Coverage threshold is enforced in `jest.config.ts` (statements, branches, functions, lines). `lib/` modules should aim for 80%+.
13. **Lint gate** - `npm run lint` must pass with 0 errors before any commit. Fix lint errors immediately; do not suppress them with inline ignores unless unavoidable.

---

## Things to Avoid

1. Over-engineering - only make directly requested changes
2. Breaking existing tests - run tests before committing
3. Adding dependencies without evaluating alternatives
4. Large PRs - prefer small, focused changesets

---

## Auto-Triggers

| Trigger | Action |
|---------|--------|
| User says "commit", "stage", "push" | `pre-commit-check` |
| KB lookup fails -> solved via code | `document-solution` |
| User corrects you | `log-mistake` |
| Modified KB files | `check-kb-index` |
| User ending session | `session-end-checklist` |

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
| `save-session` | Long session or pausing work |
| `session-end-checklist` | Session ending |
| `create-plan` | Starting a multi-step feature |
| `execute-task` | Working on a plan task |
| `execute-plan` | Running remaining plan tasks |
| `scaffold-feature` | Bootstrapping a new feature |
| `investigate-bug` | Bug — investigate, root cause, fix, document |
| `dev-environment` | Start/stop/reset/doctor local dev (AI-configured during init) |
| `changelog-update` | Updating CHANGELOG.md from commits |
| `evolve-framework` | Self-improve: audit, research, suggest |
| `list-skills` | Show all available skills |

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
