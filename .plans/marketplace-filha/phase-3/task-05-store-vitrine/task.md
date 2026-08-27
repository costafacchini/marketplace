# Task: Store Vitrine + Category Filter

**Plan**: marketplace-filha
**Phase**: 3
**Task ID (phase-local)**: task-05
**Task Path**: phase-3/task-05-store-vitrine
**Spec References**: Story 1 (P1) — all 5 scenarios, FR-001, FR-002, SC-001, SC-003
**Depends On**: phase-2/task-04-api-products
**JIRA**: N/A

## Objective

Build the public store homepage (`app/(store)/page.tsx`) with a responsive product grid and category filter tabs, fetching only active products from the API.

## Context

Reference `docs/sdd.md` sections 9 (Component Hierarchy) and 2 (Architecture — store route group).

This is the store entry point. Runs in parallel with `task-06-product-detail` and `task-07-cart` — they own different pages and components. Only this task may modify `app/(store)/page.tsx` and the store layout.

Data fetching: use Next.js 14 Server Component data fetching (`fetch` from inside the page component, or call Prisma directly — choose one pattern and document it; Server Component direct Prisma call is simpler and avoids the API round-trip for SSR).

Category filter: implement as client-side tab state (no page reload). The full product list is fetched on SSR; filtering is done in the client `CategoryFilter` component using Zustand or simple `useState`.

## Before You Start

- [ ] `git switch main && git pull --rebase origin main`
- [ ] Confirm `phase-2/task-04-api-products` status is `complete`
- [ ] Read `docs/sdd.md` sections 2 and 9
- [ ] Mark this task `in-progress` in `status.md`

## File Ownership

| File | Action | Notes |
|------|--------|-------|
| `app/(store)/layout.tsx` | create | Store layout with Navbar (cart icon count badge) |
| `app/(store)/page.tsx` | create | Vitrine — Server Component |
| `components/store/CategoryFilter.tsx` | create | Client component tabs |
| `components/store/ProductGrid.tsx` | create | Grid wrapper |
| `components/store/ProductCard.tsx` | create | Single product card |

### Do NOT Modify

- `app/(store)/products/` — owned by task-06-product-detail
- `app/(store)/cart/` — owned by task-07-cart
- `store/cart.ts` — owned by task-07-cart
- `app/api/` — owned by task-04-api-products

## Conflict Avoidance Notes

- task-06 and task-07 also live under `app/(store)/`. Each owns its own sub-directory. Do not create files outside of your owned paths.

## Implementation Steps

### Step 1: Create app/(store)/layout.tsx

Server Component. Renders a header with the store name and a cart icon linking to `/cart`. Cart item count badge is a separate Client Component (reads from Zustand) — created by task-07. For now, render a static cart icon without the badge (the badge is added when task-07 is merged).

### Step 2: Create app/(store)/page.tsx

```typescript
import { prisma } from '@/lib/prisma'
import { CategoryFilter } from '@/components/store/CategoryFilter'
import { ProductGrid } from '@/components/store/ProductGrid'

export default async function VitrinePage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, price: true, category: true, images: true },
  })

  // Serialize Decimal to string before passing to Client Components
  const serialized = products.map(p => ({ ...p, price: p.price.toString() }))

  return (
    <main>
      <CategoryFilter products={serialized} />
    </main>
  )
}
```

### Step 3: Create components/store/CategoryFilter.tsx

```typescript
'use client'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductGrid } from './ProductGrid'

const TABS = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Roupas', value: 'CLOTHES' },
  { label: 'Íntimas', value: 'LINGERIE' },
  { label: 'Academia', value: 'WORKOUT' },
]

export function CategoryFilter({ products }) {
  const [active, setActive] = useState('ALL')
  const filtered = active === 'ALL' ? products : products.filter(p => p.category === active)

  return (
    <>
      <Tabs value={active} onValueChange={setActive}>
        <TabsList>
          {TABS.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <ProductGrid products={filtered} />
    </>
  )
}
```

### Step 4: Create components/store/ProductGrid.tsx

Responsive grid (`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`). Renders empty-state message when `products.length === 0`.

### Step 5: Create components/store/ProductCard.tsx

- Display: main image (next/image), product name, formatted price (`R$ X,XX`)
- Full card is a `<Link href={/products/${id}}>` (not just the title)
- Use shadcn/ui `Card` component
- Truncate long names with `line-clamp-2`

### Step 6: Format Prices

Create or use a shared utility in `lib/format.ts`:
```typescript
export function formatPrice(price: string | number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(price))
}
```

## Testing

Test stubs at `__tests__/store/vitrine.test.tsx`:

**Spec scenarios covered**:
- [ ] Story 1 / Scenario 1: **Given** homepage loads, **When** rendered, **Then** all active products appear in a grid — `__tests__/store/vitrine.test.tsx`
- [ ] Story 1 / Scenario 2: **Given** homepage loaded, **When** "Roupas" tab clicked, **Then** only CLOTHES products shown — `__tests__/store/vitrine.test.tsx`
- [ ] Story 1 / Scenario 3: **Given** homepage loaded, **When** "Íntimas" tab clicked, **Then** only LINGERIE products shown — `__tests__/store/vitrine.test.tsx`
- [ ] Story 1 / Scenario 4: **Given** homepage loaded, **When** "Academia" tab clicked, **Then** only WORKOUT products shown — `__tests__/store/vitrine.test.tsx`
- [ ] Story 1 / Scenario 5: **Given** category has no active products, **When** that tab selected, **Then** empty-state message rendered — `__tests__/store/vitrine.test.tsx`

**Additional verification**:
- [ ] `ProductCard` links correctly to `/products/[id]`
- [ ] Price is formatted as `R$ X,XX` (not raw Decimal string)
- [ ] Page is accessible without authentication

## Documentation / KB Updates

- [ ] No new KB doc required
- [ ] If the "Decimal serialization from Server Component to Client" pattern is non-obvious, run `document-solution`

## Completion Criteria

- [ ] All 5 Story 1 acceptance scenarios pass
- [ ] Category filter works without page reload
- [ ] Empty state renders when category has no products
- [ ] `npm run build` passes without errors
- [ ] Changes committed to `plan/marketplace-filha/phase-3/task-05-store-vitrine` branch
- [ ] Status updated in `status.md`
