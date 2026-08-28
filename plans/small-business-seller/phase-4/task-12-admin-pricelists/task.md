# Task: Admin Price List Management

**Plan**: small-business-seller
**Phase**: 4
**Task ID (phase-local)**: task-12
**Task Path**: phase-4/task-12-admin-pricelists
**Spec References**: Story 7 (P2) — all 5 scenarios, Story 8 scenarios 1–4, FR-018, FR-019, FR-020, FR-022, FR-024, FR-025, SC-008, SC-009, SC-010
**Depends On**: phase-2/task-03-auth, phase-2/task-11-api-pricelists
**JIRA**: N/A

## Objective

Build the admin price list management UI: a listing page, a create form, and an edit form. The forms support selecting categories and/or specific products, setting a percentage discount, a date range (start + expiry), and toggling active status.

## Context

Reference `docs/sdd.md` sections 4 (API contracts for `/api/price-lists`), 5 (auth), and 9 (component hierarchy).

This task runs **in parallel** with `task-08-admin-list` and `task-09-admin-forms`. They own different pages and components under `app/(admin)/admin/`.

The form calls `POST /api/price-lists` (create) and `PUT /api/price-lists/[id]` (update), both implemented by task-11. Product selection in the form requires fetching the product list from `GET /api/products` to let the admin pick specific products.

## Before You Start

- [ ] `git switch main && git pull --rebase origin main`
- [ ] Confirm `phase-2/task-03-auth` is `complete` (middleware protecting /admin)
- [ ] Confirm `phase-2/task-11-api-pricelists` is `complete` (API routes available)
- [ ] Mark this task `in-progress` in `status.md`

## File Ownership

| File | Action | Notes |
|------|--------|-------|
| `app/(admin)/admin/price-lists/page.tsx` | create | Price list listing — Server Component |
| `app/(admin)/admin/price-lists/new/page.tsx` | create | Create form page |
| `app/(admin)/admin/price-lists/[id]/edit/page.tsx` | create | Edit form page |
| `components/admin/PriceListForm.tsx` | create | Shared form (create + edit) |
| `components/admin/PriceListTable.tsx` | create | Listing table with status badges |
| `components/admin/ProductSelector.tsx` | create | Multi-select for choosing specific products |

### Do NOT Modify

- `app/(admin)/admin/page.tsx` — owned by task-08-admin-list
- `app/(admin)/admin/products/` — owned by task-08 and task-09
- `components/admin/ProductForm.tsx` — owned by task-09-admin-forms
- `components/admin/ProductTable.tsx` — owned by task-08-admin-list
- `lib/pricing.ts` — owned by task-11-api-pricelists (read-only for this task)

## Conflict Avoidance Notes

- task-08 and task-09 run concurrently. Each owns its own sub-path. Do not create files under `app/(admin)/admin/products/` or `app/(admin)/admin/page.tsx`.
- Add a "Listas de Preços" link to the admin nav — but `app/(admin)/layout.tsx` is owned by task-03. Coordinate: add the nav link as part of task-03 or adjust the admin layout here with a note in the status.md if task-03 has already merged.

## Implementation Steps

### Step 1: Add "Listas de Preços" to Admin Nav

If `app/(admin)/layout.tsx` already exists (task-03 merged), add a nav link to `/admin/price-lists`. If task-03 has not merged yet, leave a TODO comment and note in status.md.

### Step 2: Create app/(admin)/admin/price-lists/page.tsx

Server Component:
```typescript
import { prisma } from '@/lib/prisma'
import { PriceListTable } from '@/components/admin/PriceListTable'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function PriceListsPage() {
  const priceLists = await prisma.priceList.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { select: { productId: true } } },
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>Listas de Preços</h1>
        <Link href="/admin/price-lists/new">
          <Button>+ Nova Lista</Button>
        </Link>
      </div>
      <PriceListTable priceLists={priceLists} />
    </div>
  )
}
```

### Step 3: Create components/admin/PriceListTable.tsx

Table columns: Name | Discount % | Starts | Expires | Scope | Status | Actions

- **Discount %**: `{discountPct}% off`
- **Scope**: summary string — e.g., `Roupas, Íntimas` (categories) or `3 produtos` (items count) or `Roupas + 2 produtos`
- **Status**: `active = true AND startsAt <= now <= expiresAt` → green "Ativa"; expired → gray "Expirada"; future → yellow "Agendada"; inactive → gray "Inativa"
- **Actions**: Edit link + inline active toggle (shadcn Switch via `ActivePriceListToggle`)

Create `components/admin/ActivePriceListToggle.tsx` as a Client Component (same pattern as `ActiveToggle` from task-08, calling `PUT /api/price-lists/[id]`).

### Step 4: Create components/admin/ProductSelector.tsx

Client Component. Multi-select for picking specific products:
- On mount, fetch `GET /api/products` (all, not just active) to get the full product list
- Render a searchable list of checkboxes or a shadcn/ui multi-select
- Selected product IDs are maintained in state and passed to parent via `onChange`
- Optional: show the current `discountPct` override input next to each selected product for FR-019 (individual override)

```typescript
'use client'
import { useEffect, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'

interface ProductOption {
  id: string
  name: string
  category: string
}

interface SelectedProduct {
  productId: string
  discountPct?: number  // optional override
}

interface Props {
  value: SelectedProduct[]
  onChange: (items: SelectedProduct[]) => void
}

export function ProductSelector({ value, onChange }: Props) {
  const [products, setProducts] = useState<ProductOption[]>([])

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(d => setProducts(d.products))
  }, [])

  function toggle(productId: string) {
    const existing = value.find(v => v.productId === productId)
    if (existing) {
      onChange(value.filter(v => v.productId !== productId))
    } else {
      onChange([...value, { productId }])
    }
  }

  function setOverride(productId: string, pct: number | undefined) {
    onChange(value.map(v => v.productId === productId ? { ...v, discountPct: pct } : v))
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto border rounded p-2">
      {products.map(p => {
        const sel = value.find(v => v.productId === p.id)
        return (
          <div key={p.id} className="flex items-center gap-3">
            <Checkbox checked={!!sel} onCheckedChange={() => toggle(p.id)} />
            <span className="flex-1 text-sm">{p.name} <span className="text-muted-foreground">({p.category})</span></span>
            {sel && (
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  step={0.01}
                  placeholder="% override"
                  className="w-24 h-7 text-xs"
                  value={sel.discountPct ?? ''}
                  onChange={e => setOverride(p.id, e.target.value ? Number(e.target.value) : undefined)}
                />
                <span className="text-xs">%</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
```

### Step 5: Create components/admin/PriceListForm.tsx

Client Component using react-hook-form + zod:

Fields:
- **Name**: text input (required)
- **Discount %**: number input, 0.01–100, step 0.01 (required)
- **Starts at**: datetime-local input (required)
- **Expires at**: datetime-local input (required, must be after startsAt)
- **Active**: Switch (default on)
- **Categories**: checkbox group (CLOTHES / LINGERIE / WORKOUT) — multi-select
- **Specific products**: `<ProductSelector />` — optional, shows individual overrides

On submit, build the POST/PUT body:
```typescript
const body = {
  name, discountPct, startsAt, expiresAt, active, categories,
  productIds: selectedProducts.map(p => p.productId),
  itemOverrides: Object.fromEntries(
    selectedProducts.filter(p => p.discountPct !== undefined)
      .map(p => [p.productId, p.discountPct])
  ),
}
```

### Step 6: Create create and edit pages

`app/(admin)/admin/price-lists/new/page.tsx` — renders `<PriceListForm />` with no initial data.

`app/(admin)/admin/price-lists/[id]/edit/page.tsx` — Server Component, fetches the price list including items, maps to `initialData`, and renders `<PriceListForm initialData={...} />`.

## Testing

Test stubs at `__tests__/admin/price-list-form.test.tsx`:

**Spec scenarios covered**:
- [ ] Story 7 / Scenario 1: **Given** all required fields filled, **When** form submitted, **Then** `POST /api/price-lists` called with correct body and redirected to listing — `__tests__/admin/price-list-form.test.tsx`
- [ ] Story 7 / Scenario 2: **Given** `expiresAt` before `startsAt`, **When** form submitted, **Then** validation error displayed — `__tests__/admin/price-list-form.test.tsx`
- [ ] Story 7 / Scenario 3: **Given** edit page with initialData, **When** fields updated, **Then** `PUT /api/price-lists/[id]` called — `__tests__/admin/price-list-form.test.tsx`
- [ ] Story 7 / Scenario 4: **Given** active toggle switched off, **When** saved, **Then** `active: false` sent in PUT body — `__tests__/admin/price-list-form.test.tsx`
- [ ] Story 7 / Scenario 5: **Given** price lists exist, **When** listing page renders, **Then** name, discount %, date range, status badge shown — `__tests__/admin/price-list-table.test.tsx`

**Additional verification**:
- [ ] Status badge shows "Ativa" only when `active = true AND startsAt <= now <= expiresAt`
- [ ] Status badge shows "Agendada" when `active = true AND startsAt > now`
- [ ] Status badge shows "Expirada" when `active = true AND expiresAt < now`
- [ ] ProductSelector fetches all products on mount
- [ ] Per-product `discountPct` override is included in the POST body when set

## Documentation / KB Updates

- [ ] Run `document-solution` if the multi-state status badge pattern (Ativa / Agendada / Expirada / Inativa) is non-obvious

## Completion Criteria

- [ ] All 5 Story 7 scenarios pass
- [ ] Price list listing shows correct status badges
- [ ] Create and edit forms submit correct payloads to the API
- [ ] Date range validation (`expiresAt > startsAt`) works client-side
- [ ] ProductSelector renders products and passes selected IDs + overrides to form
- [ ] Changes committed to `plan/small-business-seller/phase-4/task-12-admin-pricelists` branch
- [ ] Status updated in `status.md`
