# Task: Store Vitrine + Category Filter

**Plan**: small-business-seller
**Phase**: 3
**Task ID (phase-local)**: task-05
**Task Path**: phase-3/task-05-store-vitrine
**Spec References**: Story 1 (P1) — scenarios 1–8, Story 6 scenarios 1·4·5, Story 8 scenarios 1–4, FR-001, FR-002, FR-013, FR-014, FR-017, FR-021, FR-022, FR-024, FR-025, SC-001, SC-003, SC-007, SC-008, SC-010
**Depends On**: phase-2/task-04-api-products, phase-2/task-11-api-pricelists
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
| `components/store/CategoryFilter.tsx` | create | Client component: category tabs + sort control |
| `components/store/SortControl.tsx` | create | Client component: sort dropdown |
| `components/store/ProductGrid.tsx` | create | Grid wrapper |
| `components/store/ProductCard.tsx` | create | Single product card with promo badge |

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

Fetch products AND active price lists in one Server Component render. Call `resolvePrice()` from `lib/pricing.ts` (created by task-11) for each product. Pass `originalPrice` and `promotionalPrice` (null when no promotion applies) to client components.

```typescript
import { prisma } from '@/lib/prisma'
import { getActivePriceLists, resolvePrice } from '@/lib/pricing'
import { CategoryFilter } from '@/components/store/CategoryFilter'

export default async function VitrinePage() {
  const [products, activeLists] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, price: true, category: true, images: true },
    }),
    getActivePriceLists(),  // fetches all PriceLists + PriceListItems in one query
  ])

  const serialized = products.map(p => {
    const promoPrice = resolvePrice(p.id, p.category, p.price, activeLists)
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      images: p.images,
      originalPrice: p.price.toString(),
      promotionalPrice: promoPrice ? promoPrice.toString() : null,
    }
  })

  return (
    <main>
      <CategoryFilter products={serialized} />
    </main>
  )
}
```

### Step 3: Create components/store/CategoryFilter.tsx

Holds both category filter state and sort state. Renders the category tabs, the `SortControl`, and the `ProductGrid`.

```typescript
'use client'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProductGrid } from './ProductGrid'
import { SortControl, SortOption, sortProducts } from './SortControl'

const TABS = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Roupas', value: 'CLOTHES' },
  { label: 'Íntimas', value: 'LINGERIE' },
  { label: 'Academia', value: 'WORKOUT' },
]

export function CategoryFilter({ products }) {
  const [category, setCategory] = useState('ALL')
  const [sort, setSort] = useState<SortOption>('PROMO_FIRST')

  const filtered = category === 'ALL' ? products : products.filter(p => p.category === category)
  const sorted = sortProducts(filtered, sort)

  return (
    <>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Tabs value={category} onValueChange={setCategory}>
          <TabsList className="overflow-x-auto">
            {TABS.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
        <SortControl value={sort} onChange={setSort} />
      </div>
      <ProductGrid products={sorted} />
    </>
  )
}
```

### Step 3b: Create components/store/SortControl.tsx

```typescript
'use client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type SortOption = 'PROMO_FIRST' | 'PRICE_ASC' | 'NAME_ASC'

const OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'PROMO_FIRST', label: 'Promoções primeiro' },
  { value: 'PRICE_ASC',   label: 'Menor preço' },
  { value: 'NAME_ASC',    label: 'A–Z' },
]

export function SortControl({ value, onChange }: { value: SortOption; onChange: (v: SortOption) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-48">
        <SelectValue placeholder="Ordenar por" />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

export function sortProducts(products: Product[], sort: SortOption) {
  const clone = [...products]
  switch (sort) {
    case 'PROMO_FIRST':
      return clone.sort((a, b) => {
        const aPromo = a.promotionalPrice !== null ? 0 : 1
        const bPromo = b.promotionalPrice !== null ? 0 : 1
        return aPromo - bPromo
      })
    case 'PRICE_ASC':
      return clone.sort((a, b) =>
        Number(a.promotionalPrice ?? a.originalPrice) - Number(b.promotionalPrice ?? b.originalPrice)
      )
    case 'NAME_ASC':
      return clone.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
}
```

Default sort on page load: `PROMO_FIRST` — ensures promotions are immediately visible without any customer action.

### Step 4: Create components/store/ProductGrid.tsx

Mobile-first grid: `grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4`. The 2-column layout is the default (smallest screens); wider grids kick in at `sm:` and `lg:`. Renders empty-state message when `products.length === 0`.

### Step 5: Create components/store/ProductCard.tsx

- Full card is a `<Link href={/products/${id}}>` wrapping a shadcn/ui `Card`
- **Image container**: `relative aspect-square overflow-hidden`
  - `next/image` with `fill` and `object-cover`
  - If `promotionalPrice !== null`: overlay a badge on the top-left corner:
    ```tsx
    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
      {discountPct}% OFF
    </span>
    ```
    Compute `discountPct` as `Math.round((1 - Number(promotionalPrice) / Number(originalPrice)) * 100)`
- **Price block** (below image):
  - `promotionalPrice !== null`: promo price bold + red, original price small + `line-through text-muted-foreground`
  - Else: original price normally
- Truncate long names with `line-clamp-2`
- Card min tap area: ensure the full card is clickable (no padding-only zone)

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
- [ ] Story 6 / Scenario 1: **Given** active price list covers CLOTHES with 20% off, **When** vitrine renders, **Then** CLOTHES cards show "20% OFF" badge on image, discounted price, and struck-through original — `__tests__/store/vitrine.test.tsx`
- [ ] Story 1 / Scenario 6: **Given** sort set to "Menor preço", **When** applied, **Then** products ordered by effective price ascending — `__tests__/store/SortControl.test.tsx`
- [ ] Story 1 / Scenario 7: **Given** sort set to "Promoções primeiro", **When** applied, **Then** promotional products appear before full-price ones — `__tests__/store/SortControl.test.tsx`
- [ ] Story 1 / Scenario 8: **Given** sort set to "A–Z", **When** applied, **Then** products ordered alphabetically by name — `__tests__/store/SortControl.test.tsx`
- [ ] Story 6 / Scenario 4: **Given** expired price list, **When** vitrine renders, **Then** products show original price (no discount) — `__tests__/store/vitrine.test.tsx`
- [ ] Story 6 / Scenario 5: **Given** price list with `startsAt` in the future, **When** vitrine renders, **Then** products show original price — `__tests__/store/vitrine.test.tsx`

**Additional verification**:
- [ ] `ProductCard` links correctly to `/products/[id]`
- [ ] Price is formatted as `R$ X,XX` (not raw Decimal string)
- [ ] Page is accessible without authentication
- [ ] SC-007: No horizontal scroll on 375px viewport (Chrome DevTools mobile emulation)
- [ ] Category filter tabs are scrollable horizontally on small screens if they overflow (use `overflow-x-auto` on `TabsList`)

## Documentation / KB Updates

- [ ] No new KB doc required
- [ ] If the "Decimal serialization from Server Component to Client" pattern is non-obvious, run `document-solution`

## Completion Criteria

- [ ] Story 1 scenarios 1–8 pass (including 3 sort scenarios)
- [ ] Story 6 pricing scenarios (1, 4, 5) pass on the vitrine
- [ ] Category filter works without page reload
- [ ] Empty state renders when category has no products
- [ ] SC-008: Promo price card shows struck-through original price
- [ ] `npm run build` passes without errors
- [ ] Changes committed to `plan/small-business-seller/phase-3/task-05-store-vitrine` branch
- [ ] Status updated in `status.md`
