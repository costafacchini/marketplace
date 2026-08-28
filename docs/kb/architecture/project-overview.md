# Project Overview — Marketplace Filha

> **Primary reference**: [`docs/sdd.md`](../../sdd.md) — authoritative Software Design Document covering architecture, data model, API contracts, auth, state management, deployment, i18n, and testing strategy.

## Stack

| Aspect | Value |
|--------|-------|
| Project | marketplace-filha |
| Languages | TypeScript |
| Frameworks | Next.js 14 (App Router), Prisma ORM, NextAuth.js (Credentials), Zustand, shadcn/ui, Tailwind CSS, next-intl |
| Architecture | Route groups — `(store)` public + `(admin)` protected by NextAuth middleware |
| Package manager | npm |
| Databases | PostgreSQL (Railway) via Prisma |
| Test runners | Jest + React Testing Library (TDD, ≥60% coverage) |
| Linters | ESLint (Next.js recommended, 0 errors required) |
| CI/CD | GitHub Actions |
| Deployment | Vercel (frontend) + Railway (PostgreSQL) |
| Main branch | `main` |

## Key Commands

```bash
npm run dev                              # Dev server (localhost:3000)
npm run build                            # Production build
npm run lint                             # ESLint — must pass with 0 errors
npm test                                 # Jest test suite
npm run test:coverage                    # Jest with coverage report (threshold: 60%)
npx prisma migrate dev --name <name>    # Create + apply dev migration
npx prisma migrate deploy               # Apply migrations in production
npx prisma studio                        # Browse database GUI
npx prisma generate                      # Regenerate Prisma client
```

## Architecture Notes

- **Store front** (`app/(store)/`): Server Components fetch products + active price lists from Prisma. Price resolution (`lib/pricing.ts`) runs server-side. Filtering and sorting are client-side in `CategoryFilter` / `SortControl`.
- **Admin panel** (`app/(admin)/`): Protected by `middleware.ts`. Product and price list CRUD via API routes with zod validation.
- **Pricing engine** (`lib/pricing.ts`): `getActivePriceLists()` + `resolvePrice()` — single source of truth for promotional pricing. Never duplicated.
- **Cart**: Zustand store persisted in `localStorage` under key `marketplace-filha-cart`. Price snapshotted at add-to-cart time.
- **i18n**: `next-intl` with static locale from `NEXT_PUBLIC_LOCALE` env var (`en` default | `pt`). All display strings in `messages/en.json` and `messages/pt.json`.
- **Images**: Cloudinary Upload Widget — browser-direct upload, server stores only the resulting URLs in `product.images[]`.
- **Checkout**: WhatsApp deep link (`wa.me`) with `encodeURIComponent` message built by `lib/whatsapp.ts`.

## Key Design Decisions

See `docs/sdd.md` for full rationale. Key decisions at a glance:

| Decision | Choice | Reason |
|----------|--------|--------|
| ORM | Prisma | Type-safe queries, migrations, Railway PostgreSQL |
| Auth | NextAuth Credentials | Single admin user, no OAuth needed |
| Password hashing | `bcryptjs` | Pure JS — avoids Vercel native module issues |
| Image upload | Cloudinary Widget | No server upload proxy needed |
| Cart persistence | Zustand + localStorage | No customer login required |
| Decimal handling | Serialize to string | Prisma `Decimal` is not JSON-serializable for Client Components |
| Locale | Env var (`NEXT_PUBLIC_LOCALE`) | Fixed per deployment; no runtime switcher in v1 |
