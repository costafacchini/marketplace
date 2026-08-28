# Status: Store Vitrine + Category Filter

**Current Status**: complete
**Last Updated**: 2026-08-28
**Agent**: claude-sonnet-4-6
**Branch**: plan/small-business-seller/phase-3/task-05-store-vitrine
**PR**: —

## Status History

| Timestamp | Status | Agent | Notes |
|-----------|--------|-------|-------|
| 2026-08-27 | not-started | — | Task created |
| 2026-08-28 | complete | claude-sonnet-4-6 | All tests pass, lint clean, build succeeds |

## Blockers

None

## Artifacts

- `app/(store)/layout.tsx` — Store header with store name + cart link
- `app/(store)/page.tsx` — Server Component: fetches products + price lists, resolves promo prices
- `components/store/CategoryFilter.tsx` — Client Component: category tabs + sort state
- `components/store/SortControl.tsx` — Sort dropdown + `sortProducts()` pure function
- `components/store/ProductGrid.tsx` — Responsive grid with empty state
- `components/store/ProductCard.tsx` — Card with promo badge and price display
- `lib/format.ts` — `formatPrice()` using Intl.NumberFormat (pt-BR, BRL)
- `__tests__/store/vitrine.test.tsx` — RTL tests for CategoryFilter + ProductCard
- `__tests__/store/SortControl.test.ts` — Unit tests for `sortProducts()` pure function

## Adaptations

- Fixed `jest.config.js` `testPathIgnorePatterns` to use `<rootDir>/.claude/` instead of `/.claude/` so tests in the worktree environment are not silently skipped.
- Added `jest.mock('next-intl', ...)` to `SortControl.test.ts` to prevent ESM import failure when loading the SortControl module.
- Tests mock `SortControl` component in `vitrine.test.tsx` to isolate `CategoryFilter` filtering logic from the sort dropdown UI.
