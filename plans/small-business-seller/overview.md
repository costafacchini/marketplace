# Plan: Small Business Seller

**Status**: not-started
**Created**: 2026-08-27
**Last Updated**: 2026-08-28
**Assigned Dev**: Alan Costa Facchini
**PR Strategy**: per-wave
**Spec**: [spec.md](spec.md) — 8 user stories · 43 acceptance scenarios · 11 success criteria

## Objective

Build a complete Next.js 14 clothing marketplace where customers browse products, build a cart, and checkout via WhatsApp — while the seller manages the catalog through an authenticated admin panel.

## Scope

### In Scope
- Software Design Document (SDD) covering all architectural decisions
- Next.js 14 App Router project scaffold with Prisma, shadcn/ui, Tailwind
- PostgreSQL schema (Product + Category enum) deployed on Railway
- NextAuth.js Credentials authentication for single admin user
- Product CRUD REST API (soft-delete via `active` flag)
- Store front: vitrine with category filter + sort control (menor preço / promoções primeiro / A–Z), product detail with image gallery — mobile-first (≥ 320px)
- Promo badge ("X% OFF") overlaid on product card image when a price list is active
- Promotional pricing: price lists with % discount, date range, category/product scope
- Client-side cart via Zustand (add, remove, update qty, clear) — uses resolved promotional price
- WhatsApp checkout flow with pre-formatted message (promotional prices)
- Admin panel: product list, create form, edit form, active toggle
- Admin price list management: create/edit price lists with date range and scope
- Cloudinary Upload Widget for direct browser-to-cloud image upload
- Vercel deployment configuration and environment variable documentation
- Internationalization (i18n) via `next-intl`: English (default) and Brazilian Portuguese, locale configured by `NEXT_PUBLIC_LOCALE` env var
- Automated test suite: Jest + React Testing Library, TDD approach, ≥ 60% coverage enforced via `coverageThreshold`
- ESLint with Next.js recommended rules — 0 errors required before every phase PR

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
| 2 | Auth + API | task-03-auth, task-04-api-products, task-11-api-pricelists | Phase 1 | NextAuth auth + product CRUD + price list CRUD API + `lib/pricing.ts` resolution logic |
| 3 | Store Frontend | task-05-store-vitrine, task-06-product-detail, task-07-cart | Phase 2 | Customer-facing pages: promo badge + sort control on vitrine, promotional price on detail, Zustand cart + WhatsApp checkout |
| 4 | Admin Panel | task-08-admin-list, task-09-admin-forms, task-12-admin-pricelists | Phase 2 | Product management + price list management UI |
| 5 | Deploy | task-10-deploy | Phases 3 + 4 | Vercel config, Railway DB setup, environment docs, CI validation |

## Task Summary

| Task Path | Title | Phase | Status | Depends On |
|-----------|-------|-------|--------|------------|
| phase-0/task-01-sdd | Software Design Document | 0 | complete | — |
| phase-1/task-02-scaffold | Project Scaffold + Prisma Schema | 1 | complete | phase-0/task-01-sdd |
| phase-2/task-03-auth | NextAuth Authentication + Middleware | 2 | complete | phase-1/task-02-scaffold |
| phase-2/task-04-api-products | Product CRUD API Routes | 2 | complete | phase-1/task-02-scaffold |
| phase-2/task-11-api-pricelists | Price List CRUD API + lib/pricing.ts | 2 | complete | phase-1/task-02-scaffold |
| phase-3/task-05-store-vitrine | Store Vitrine + Category Filter | 3 | not-started | phase-2/task-04-api-products, phase-2/task-11-api-pricelists |
| phase-3/task-06-product-detail | Product Detail Page | 3 | not-started | phase-2/task-04-api-products, phase-2/task-11-api-pricelists |
| phase-3/task-07-cart | Zustand Cart + WhatsApp Checkout | 3 | not-started | phase-3/task-06-product-detail |
| phase-4/task-08-admin-list | Admin Product List | 4 | not-started | phase-2/task-03-auth, phase-2/task-04-api-products |
| phase-4/task-09-admin-forms | Admin Create/Edit Forms + Cloudinary | 4 | not-started | phase-4/task-08-admin-list |
| phase-4/task-12-admin-pricelists | Admin Price List Management | 4 | not-started | phase-2/task-03-auth, phase-2/task-11-api-pricelists |
| phase-5/task-10-deploy | Deployment Config + Runbook | 5 | not-started | phase-3/task-07-cart, phase-4/task-09-admin-forms, phase-4/task-12-admin-pricelists |

## Branch Convention

Pattern: `plan/small-business-seller/{task-path}`

Example branches:
- `plan/small-business-seller/phase-0/task-01-sdd`
- `plan/small-business-seller/phase-1/task-02-scaffold`
- `plan/small-business-seller/phase-2/task-03-auth`

Base branch: `main`

Per-wave PRs — open one PR per phase after ALL tasks in that phase are complete.

## Key Files

| File/Directory | Relevance |
|----------------|-----------|
| `spec.md` | Project requirements and architecture decisions |
| `prisma/schema.prisma` | Product + PriceList + PriceListItem models |
| `app/(store)/` | Customer-facing route group |
| `app/(admin)/` | Seller admin route group |
| `app/api/products/` | Product CRUD API handlers |
| `app/api/price-lists/` | Price list CRUD API handlers |
| `app/api/auth/[...nextauth]/route.ts` | NextAuth handler |
| `middleware.ts` | Route protection for /admin |
| `lib/pricing.ts` | `getActivePriceLists()` + `resolvePrice()` — price resolution engine |
| `lib/whatsapp.ts` | WhatsApp message formatter |
| `lib/prisma.ts` | Prisma client singleton |
| `store/cart.ts` | Zustand cart store |
| `components/store/SortControl.tsx` | Sort dropdown + `sortProducts()` pure function |
| `components/` | Shared UI components |
| `.env.example` | Environment variable template |
| `docs/sdd.md` | Software Design Document (output of task-01) |
| `jest.config.ts` | Jest config with coverage thresholds (60%) and next/jest preset |
| `jest.setup.ts` | Jest setup — imports `@testing-library/jest-dom` |
| `__tests__/` | Test files, co-located with the feature directories they cover |
| `i18n.ts` | next-intl request config — reads `NEXT_PUBLIC_LOCALE` |
| `messages/en.json` | English translation strings |
| `messages/pt.json` | Brazilian Portuguese translation strings |

## Risks

- **Cloudinary Upload Widget CORS/CSP** — Ensure `Content-Security-Policy` allows `*.cloudinary.com` scripts; mitigate with explicit CSP headers in `next.config.js`.
- **Prisma + Railway cold starts** — Connection pooling via `DATABASE_URL` with `?connection_limit=1` for serverless; mitigate with `prisma.$connect()` guard.
- **NextAuth session edge cases** — Credentials strategy does not support refresh tokens; session expiry must be explicit. Mitigate with a short but reasonable session `maxAge`.
- **WhatsApp message encoding** — Special characters (ç, ã, etc.) must be `encodeURIComponent`-encoded in the URL; verify on mobile.
- **bcrypt on serverless** — `bcryptjs` (pure JS) preferred over native `bcrypt` to avoid Vercel native module issues.
- **Mobile tap targets** — shadcn/ui defaults may produce tap targets < 44px on some controls (size pickers, qty buttons). Verify and add `min-h-[44px] min-w-[44px]` overrides where needed.
- **Price resolution N+1** — resolving promotional prices for a full vitrine product list must batch-fetch all active price lists once, not per product. Mitigate with a single `getActivePriceLists()` call in the page Server Component passed down to a pure `resolvePrice()` function.
- **i18n missing keys** — If a key exists in `en.json` but is absent from `pt.json`, next-intl falls back to the key name (not the English string). All keys added in English must be mirrored in Portuguese before merging. Enforce this in PR review.
- **Price staleness in cart** — promotional price is snapshotted at add-to-cart time (Zustand localStorage). If a price list expires after the customer adds the item, the cart keeps the old price. This is accepted behavior for v1; the seller verifies at closing.

## Success Criteria

- [ ] SC-001: Full customer flow (browse → detail → cart → WhatsApp) works end-to-end on mobile
- [ ] SC-002: Admin can create a product with photos in < 3 minutes
- [ ] SC-003: Inactive products are hidden from the vitrine
- [ ] SC-004: WhatsApp message is correctly formatted with all cart items
- [ ] SC-005: Unauthenticated `/admin` access redirects to `/login`
- [ ] SC-006: All form validation works client and server-side
- [ ] SC-007: Full customer flow verified on 375px viewport — no layout breaks, no horizontal scroll, all tap targets ≥ 44px
- [ ] SC-008: Active price list products show struck-through original price + discounted price on vitrine and detail
- [ ] SC-009: WhatsApp order message uses promotional price when applicable
- [ ] SC-010: Changing `NEXT_PUBLIC_LOCALE` between `en` and `pt` switches all UI text without code changes
- [ ] SC-011: `npm run test:coverage` exits 0 with ≥ 60% coverage; `npm run lint` exits 0 with 0 errors
- [ ] All tests pass (`npm test`)
- [ ] Required KB / documentation updates are complete
- [ ] No regressions in existing functionality

## References

- **JIRA Epic**: N/A
- **Weekly Plan Brief**: N/A
- **Related Plans**: None
- **Rock Alignment**: N/A
- **Source spec**: `spec.md` at project root
