# Plan: Marketplace Filha

**Status**: not-started
**Created**: 2026-08-27
**Last Updated**: 2026-08-27
**Assigned Dev**: Alan Costa Facchini
**PR Strategy**: per-wave
**Spec**: [spec.md](spec.md) — 5 user stories · 24 acceptance scenarios · 6 success criteria

## Objective

Build a complete Next.js 14 clothing marketplace where customers browse products, build a cart, and checkout via WhatsApp — while the seller manages the catalog through an authenticated admin panel.

## Scope

### In Scope
- Software Design Document (SDD) covering all architectural decisions
- Next.js 14 App Router project scaffold with Prisma, shadcn/ui, Tailwind
- PostgreSQL schema (Product + Category enum) deployed on Railway
- NextAuth.js Credentials authentication for single admin user
- Product CRUD REST API (soft-delete via `active` flag)
- Store front: vitrine with category filter, product detail with image gallery
- Client-side cart via Zustand (add, remove, update qty, clear)
- WhatsApp checkout flow with pre-formatted message
- Admin panel: product list, create form, edit form, active toggle
- Cloudinary Upload Widget for direct browser-to-cloud image upload
- Vercel deployment configuration and environment variable documentation

### Out of Scope
- Online payment / checkout gateway
- Customer registration or login
- Order history or persistence
- Stock quantity management
- Multiple admin users
- Push notifications or email
- Native mobile app

## Kill Criteria

- If WhatsApp announces deprecation of `wa.me` deep links, stop and re-evaluate checkout strategy.
- If Railway PostgreSQL free tier is discontinued before launch, pause and migrate to an alternative provider.
- If Next.js 14 App Router introduces a breaking change that blocks NextAuth v4/v5 compatibility during active development, pause and assess upgrade path.

## Phases

| Phase | Name | Tasks | Dependencies | Description |
|-------|------|-------|--------------|-------------|
| 0 | SDD | task-01-sdd | None | Author the Software Design Document covering architecture, data model, API contracts, auth flow, and deployment |
| 1 | Foundation | task-02-scaffold | Phase 0 | Scaffold Next.js 14 project, configure Prisma schema, run initial DB migration |
| 2 | Auth + API | task-03-auth, task-04-api-products | Phase 1 | NextAuth Credentials auth with middleware + full product CRUD API routes |
| 3 | Store Frontend | task-05-store-vitrine, task-06-product-detail, task-07-cart | Phase 2 | Customer-facing pages: vitrine, product detail, Zustand cart, WhatsApp checkout |
| 4 | Admin Panel | task-08-admin-list, task-09-admin-forms | Phase 2 | Seller admin: product table, create/edit forms, Cloudinary widget |
| 5 | Deploy | task-10-deploy | Phases 3 + 4 | Vercel config, Railway DB setup, environment docs, CI validation |

## Task Summary

| Task Path | Title | Phase | Status | Depends On |
|-----------|-------|-------|--------|------------|
| phase-0/task-01-sdd | Software Design Document | 0 | not-started | — |
| phase-1/task-02-scaffold | Project Scaffold + Prisma Schema | 1 | not-started | phase-0/task-01-sdd |
| phase-2/task-03-auth | NextAuth Authentication + Middleware | 2 | not-started | phase-1/task-02-scaffold |
| phase-2/task-04-api-products | Product CRUD API Routes | 2 | not-started | phase-1/task-02-scaffold |
| phase-3/task-05-store-vitrine | Store Vitrine + Category Filter | 3 | not-started | phase-2/task-04-api-products |
| phase-3/task-06-product-detail | Product Detail Page | 3 | not-started | phase-2/task-04-api-products |
| phase-3/task-07-cart | Zustand Cart + WhatsApp Checkout | 3 | not-started | phase-3/task-06-product-detail |
| phase-4/task-08-admin-list | Admin Product List | 4 | not-started | phase-2/task-03-auth, phase-2/task-04-api-products |
| phase-4/task-09-admin-forms | Admin Create/Edit Forms + Cloudinary | 4 | not-started | phase-4/task-08-admin-list |
| phase-5/task-10-deploy | Deployment Config + Runbook | 5 | not-started | phase-3/task-07-cart, phase-4/task-09-admin-forms |

## Branch Convention

Pattern: `plan/marketplace-filha/{task-path}`

Example branches:
- `plan/marketplace-filha/phase-0/task-01-sdd`
- `plan/marketplace-filha/phase-1/task-02-scaffold`
- `plan/marketplace-filha/phase-2/task-03-auth`

Base branch: `main`

Per-wave PRs — open one PR per phase after ALL tasks in that phase are complete.

## Key Files

| File/Directory | Relevance |
|----------------|-----------|
| `spec.md` | Project requirements and architecture decisions |
| `prisma/schema.prisma` | Product model + Category enum |
| `app/(store)/` | Customer-facing route group |
| `app/(admin)/` | Seller admin route group |
| `app/api/products/` | Product CRUD API handlers |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth handler |
| `middleware.ts` | Route protection for /admin |
| `store/cart.ts` | Zustand cart store |
| `lib/whatsapp.ts` | WhatsApp message formatter |
| `lib/prisma.ts` | Prisma client singleton |
| `components/` | Shared UI components |
| `.env.example` | Environment variable template |
| `docs/sdd.md` | Software Design Document (output of task-01) |

## Risks

- **Cloudinary Upload Widget CORS/CSP** — Ensure `Content-Security-Policy` allows `*.cloudinary.com` scripts; mitigate with explicit CSP headers in `next.config.js`.
- **Prisma + Railway cold starts** — Connection pooling via `DATABASE_URL` with `?connection_limit=1` for serverless; mitigate with `prisma.$connect()` guard.
- **NextAuth session edge cases** — Credentials strategy does not support refresh tokens; session expiry must be explicit. Mitigate with a short but reasonable session `maxAge`.
- **WhatsApp message encoding** — Special characters (ç, ã, etc.) must be `encodeURIComponent`-encoded in the URL; verify on mobile.
- **bcrypt on serverless** — `bcryptjs` (pure JS) preferred over native `bcrypt` to avoid Vercel native module issues.

## Success Criteria

- [ ] SC-001: Full customer flow (browse → detail → cart → WhatsApp) works end-to-end on mobile
- [ ] SC-002: Admin can create a product with photos in < 3 minutes
- [ ] SC-003: Inactive products are hidden from the vitrine
- [ ] SC-004: WhatsApp message is correctly formatted with all cart items
- [ ] SC-005: Unauthenticated `/admin` access redirects to `/login`
- [ ] SC-006: All form validation works client and server-side
- [ ] All tests pass (`npm test`)
- [ ] Required KB / documentation updates are complete
- [ ] No regressions in existing functionality

## References

- **JIRA Epic**: N/A
- **Weekly Plan Brief**: N/A
- **Related Plans**: None
- **Rock Alignment**: N/A
- **Source spec**: `spec.md` at project root
