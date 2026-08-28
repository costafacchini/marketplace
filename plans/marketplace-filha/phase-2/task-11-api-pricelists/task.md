# Task: Price List CRUD API + lib/pricing.ts

**Plan**: marketplace-filha
**Phase**: 2
**Task ID (phase-local)**: task-11
**Task Path**: phase-2/task-11-api-pricelists
**Spec References**: Story 6 (P1) — scenarios 2·3·4·5, Story 7 (P2) — scenarios 1·2·3·4, FR-014 through FR-020, SC-008, SC-009
**Depends On**: phase-1/task-02-scaffold
**JIRA**: N/A

## Objective

Implement the price list REST API (CRUD) and the core `lib/pricing.ts` resolution engine that determines effective promotional prices for products based on active price lists.

## Context

Reference `docs/sdd.md` sections 3 (Data Model — PriceList + PriceListItem) and 4 (API Contracts).

**Resolution algorithm** (FR-014 through FR-016):
1. Find all price lists where `active = true AND startsAt <= now() <= expiresAt`
2. Sort by `createdAt DESC` (most recent list takes priority)
3. For a given product, scan the sorted list and return the **first match**:
   - Match if `product.id` is in the list's `items[]` → use `item.discountPct ?? list.discountPct`
   - Else if `product.category` is in the list's `categories[]` → use `list.discountPct`
   - Product-level (items[]) always beats category-level within the same list (FR-015)
4. Apply: `promotionalPrice = price × (1 − discountPct / 100)`, rounded to 2 decimal places
5. If no match → return `null` (no promotion applies)

This task runs **in parallel** with `task-03-auth` and `task-04-api-products` — no shared files.

## Before You Start

- [ ] `git switch main && git pull --rebase origin main`
- [ ] Confirm `phase-1/task-02-scaffold` is `complete` — `PriceList` and `PriceListItem` models must be in `prisma/schema.prisma`
- [ ] Verify `npx prisma generate` has been run (client types for new models available)
- [ ] Mark this task `in-progress` in `status.md`

## File Ownership

| File | Action | Notes |
|------|--------|-------|
| `lib/pricing.ts` | create | Core resolution engine — `getActivePriceLists()` + `resolvePrice()` |
| `lib/validations/pricelist.ts` | create | Zod schemas for price list create/update |
| `app/api/price-lists/route.ts` | create | GET list + POST create |
| `app/api/price-lists/[id]/route.ts` | create | GET single + PUT update |

### Do NOT Modify

- `lib/auth.ts` — owned by task-03-auth
- `app/api/products/` — owned by task-04-api-products
- `lib/validations/product.ts` — owned by task-04-api-products
- `lib/prisma.ts` — owned by task-02-scaffold

## Conflict Avoidance Notes

- task-03 and task-04 run concurrently. No shared files with either.
- `lib/pricing.ts` is created here and consumed (read-only) by task-05, task-06. Do not let those tasks modify it.

## Implementation Steps

### Step 1: Create lib/validations/pricelist.ts

```typescript
import { z } from 'zod'

export const priceListCreateSchema = z.object({
  name: z.string().min(1).max(200),
  discountPct: z.number().min(0.01).max(100).multipleOf(0.01),
  startsAt: z.string().datetime(),   // ISO string from client
  expiresAt: z.string().datetime(),
  active: z.boolean().optional().default(true),
  categories: z.array(z.enum(['CLOTHES', 'LINGERIE', 'WORKOUT'])).optional().default([]),
  productIds: z.array(z.string().cuid()).optional().default([]),  // IDs for PriceListItem entries
  itemOverrides: z.record(z.string(), z.number().min(0).max(100)).optional().default({}),
  // itemOverrides: { [productId]: discountPct } — optional per-product override
}).refine(
  data => new Date(data.expiresAt) > new Date(data.startsAt),
  { message: 'expiresAt must be after startsAt', path: ['expiresAt'] }
)

export const priceListUpdateSchema = priceListCreateSchema.partial().omit({ productIds: true, itemOverrides: true }).extend({
  productIds: z.array(z.string().cuid()).optional(),
  itemOverrides: z.record(z.string(), z.number().min(0).max(100)).optional(),
})

export type PriceListCreateInput = z.infer<typeof priceListCreateSchema>
export type PriceListUpdateInput = z.infer<typeof priceListUpdateSchema>
```

### Step 2: Create lib/pricing.ts

```typescript
import { prisma } from '@/lib/prisma'
import { Category } from '@prisma/client'
import Decimal from 'decimal.js'

export interface ActivePriceList {
  id: string
  discountPct: Decimal
  createdAt: Date
  categories: Category[]
  items: Array<{ productId: string; discountPct: Decimal | null }>
}

export async function getActivePriceLists(): Promise<ActivePriceList[]> {
  const now = new Date()
  return prisma.priceList.findMany({
    where: {
      active: true,
      startsAt: { lte: now },
      expiresAt: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      discountPct: true,
      createdAt: true,
      categories: true,
      items: { select: { productId: true, discountPct: true } },
    },
  })
}

export function resolvePrice(
  productId: string,
  category: Category,
  originalPrice: Decimal,
  activeLists: ActivePriceList[]
): Decimal | null {
  // activeLists is already sorted createdAt DESC — first match wins
  for (const list of activeLists) {
    const item = list.items.find(i => i.productId === productId)
    if (item) {
      // Product-level match — use item override if present, else list default
      const pct = item.discountPct ?? list.discountPct
      return applyDiscount(originalPrice, pct)
    }
    if (list.categories.includes(category)) {
      return applyDiscount(originalPrice, list.discountPct)
    }
  }
  return null
}

function applyDiscount(price: Decimal, discountPct: Decimal): Decimal {
  const factor = new Decimal(1).minus(discountPct.div(100))
  return price.times(factor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}
```

### Step 3: Create app/api/price-lists/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { priceListCreateSchema } from '@/lib/validations/pricelist'

export async function GET() {
  const lists = await prisma.priceList.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { select: { productId: true, discountPct: true } } },
  })
  return NextResponse.json({ priceLists: lists })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = priceListCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { productIds, itemOverrides, categories, ...listData } = parsed.data

  const priceList = await prisma.priceList.create({
    data: {
      ...listData,
      startsAt: new Date(listData.startsAt),
      expiresAt: new Date(listData.expiresAt),
      categories,
      items: {
        create: productIds.map(productId => ({
          productId,
          discountPct: itemOverrides[productId] ?? null,
        })),
      },
    },
    include: { items: true },
  })

  return NextResponse.json({ priceList }, { status: 201 })
}
```

### Step 4: Create app/api/price-lists/[id]/route.ts

Implement `GET` (returns single price list with items) and `PUT` (admin only — handles full replace of items array via delete + recreate within a transaction).

```typescript
// PUT handler — replaces items entirely
const priceList = await prisma.$transaction(async (tx) => {
  await tx.priceListItem.deleteMany({ where: { priceListId: params.id } })
  return tx.priceList.update({
    where: { id: params.id },
    data: {
      ...listData,
      startsAt: new Date(listData.startsAt),
      expiresAt: new Date(listData.expiresAt),
      categories: parsed.data.categories ?? [],
      items: {
        create: (parsed.data.productIds ?? []).map(productId => ({
          productId,
          discountPct: (parsed.data.itemOverrides ?? {})[productId] ?? null,
        })),
      },
    },
    include: { items: true },
  })
})
```

## Testing

Test stubs at `__tests__/api/price-lists/` and `__tests__/lib/pricing.test.ts`:

**Spec scenarios covered**:
- [ ] Story 6 / Scenario 2: **Given** product in list.items[] AND category in list.categories[], **When** `resolvePrice()` called, **Then** item-level discount applied — `__tests__/lib/pricing.test.ts`
- [ ] Story 6 / Scenario 3: **Given** two active lists cover same product, **When** `resolvePrice()` called, **Then** most recently created list wins — `__tests__/lib/pricing.test.ts`
- [ ] Story 6 / Scenario 4: **Given** `expiresAt` in past, **When** `getActivePriceLists()` called, **Then** list not returned — `__tests__/lib/pricing.test.ts`
- [ ] Story 6 / Scenario 5: **Given** `startsAt` in future, **When** `getActivePriceLists()` called, **Then** list not returned — `__tests__/lib/pricing.test.ts`
- [ ] Story 7 / Scenario 1: **Given** valid body, **When** `POST /api/price-lists`, **Then** 201 with created price list — `__tests__/api/price-lists/create.test.ts`
- [ ] Story 7 / Scenario 2: **Given** `expiresAt` before `startsAt`, **When** `POST /api/price-lists`, **Then** 400 with validation error — `__tests__/api/price-lists/create.test.ts`
- [ ] Story 7 / Scenario 3: **Given** valid update body, **When** `PUT /api/price-lists/[id]`, **Then** 200 with updated list — `__tests__/api/price-lists/update.test.ts`
- [ ] Story 7 / Scenario 4: **Given** `PUT` with `{ active: false }`, **When** called, **Then** list marked inactive — `__tests__/api/price-lists/update.test.ts`
- [ ] **Given** `POST /api/price-lists` without session, **When** called, **Then** 401 — `__tests__/api/price-lists/create.test.ts`

**Additional verification**:
- [ ] `resolvePrice()` returns `null` when no active list covers the product
- [ ] `applyDiscount(100, 20)` returns `80.00` (correct rounding)
- [ ] Items array is fully replaced on PUT (no orphaned PriceListItems)

## Documentation / KB Updates

- [ ] Run `document-solution` after this task — the price resolution algorithm + Prisma transaction pattern for items replace is non-obvious and worth preserving in KB
- [ ] Run `check-kb-index` after adding the KB doc

## Completion Criteria

- [ ] `resolvePrice()` correctly applies product-level over category-level discount
- [ ] Most recently created active list wins when multiple lists cover the same product
- [ ] Expired and future-start lists are excluded from `getActivePriceLists()`
- [ ] `POST /api/price-lists` without session returns 401
- [ ] `expiresAt <= startsAt` validation returns 400
- [ ] All 9 test scenarios above pass
- [ ] Changes committed to `plan/marketplace-filha/phase-2/task-11-api-pricelists` branch
- [ ] Status updated in `status.md`
