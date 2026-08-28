# Status: Project Scaffold + Prisma Schema

**Current Status**: complete
**Last Updated**: 2026-08-28
**Agent**: Claude Sonnet 4.6
**Branch**: plan/small-business-seller/phase-1/task-02-scaffold
**PR**: —

## Status History

| Timestamp | Status | Agent | Notes |
|-----------|--------|-------|-------|
| 2026-08-27 | not-started | — | Task created |
| 2026-08-28 | in-progress | Claude Sonnet 4.6 | Scaffold files created manually (directory was non-empty) |
| 2026-08-28 | complete | Claude Sonnet 4.6 | Lint ✓, build ✓, tests pass (no tests yet — scaffold only) |

## Blockers

None

## Artifacts

- `package.json` — all dependencies pinned to current versions as of 2026-08-28
- `next.config.mjs` — Next.js 14 config with Cloudinary remote pattern + next-intl plugin
- `tsconfig.json` — TypeScript strict config with `@/*` path alias
- `tailwind.config.ts` — Tailwind v3.4.19 config (v4 pinned back — breaks shadcn/ui)
- `postcss.config.mjs` — PostCSS config
- `prisma/schema.prisma` — Product, PriceList, PriceListItem models + Category enum
- `prisma.config.ts` — Prisma 7 datasource config (url moved out of schema.prisma)
- `.env.example` — all 9 env vars documented
- `lib/prisma.ts` — PrismaClient global singleton
- `app/layout.tsx` — Root layout with NextIntlClientProvider + Inter font
- `app/globals.css` — Tailwind directives + shadcn CSS variables
- `components/ui/` — button, card, badge, input, label, tabs, dialog, select, switch, checkbox
- `jest.config.js` — CommonJS Jest config with 60% coverage thresholds
- `jest.setup.ts` — @testing-library/jest-dom import
- `i18n.ts` — next-intl request config (reads NEXT_PUBLIC_LOCALE)
- `messages/en.json` + `messages/pt.json` — scaffold-level common keys

## Adaptations

1. **`next.config.mjs` not `.ts`**: Next.js 14 does not support `.ts` config extension. Used `.mjs` instead.
2. **`jest.config.js` not `.ts`**: Jest 30 cannot parse TypeScript config without `ts-node`. Used CommonJS `.js` to avoid adding an unlisted dependency.
3. **Prisma 7 `prisma.config.ts`**: Prisma 7 removed `url = env("DATABASE_URL")` from `datasource` block in schema.prisma. Created `prisma.config.ts` using `defineConfig` pattern instead.
4. **Tailwind pinned to v3.4.19**: Latest `tailwindcss@4.x` uses CSS-based config incompatible with the `tailwind.config.ts` + JS plugin approach that shadcn/ui requires. Pinned to v3.
5. **shadcn v4 / tw-animate-css**: shadcn@4 uses `tw-animate-css` via CSS import instead of `tailwindcss-animate` plugin. Removed the plugin entry to prevent missing-module error.
6. **`prisma migrate dev` skipped**: No local PostgreSQL instance configured. Ran `prisma generate` only. Migration runs when `DATABASE_URL` is set (documented in task-10-deploy).
7. **Manual scaffold**: `create-next-app` rejected the non-empty directory. All Next.js files were created manually with exact pinned versions.
