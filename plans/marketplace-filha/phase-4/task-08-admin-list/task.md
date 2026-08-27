# Task: Admin Product List

**Plan**: marketplace-filha
**Phase**: 4
**Task ID (phase-local)**: task-08
**Task Path**: phase-4/task-08-admin-list
**Spec References**: Story 4 (P2) — Scenarios 4, FR-001 (inverse: admin sees all), FR-008 (soft delete display), SC-005
**Depends On**: phase-2/task-03-auth, phase-2/task-04-api-products
**JIRA**: N/A

## Objective

Build the admin product listing page (`app/(admin)/admin/page.tsx`) showing all products (active and inactive) in a data table, with status badges and navigation links to create/edit pages.

## Context

Reference `docs/sdd.md` sections 2 (Admin route group), 5 (auth — how to read session in Server Components), and 9 (Component Hierarchy).

This task runs in parallel with phases 3 tasks — it owns only `app/(admin)/admin/` routes. Auth middleware is already in place from task-03; this task only builds the UI on top of it.

Admin pages are Server Components by default; the product table can also be a Server Component (no client-side state needed for listing).

## Before You Start

- [ ] `git switch main && git pull --rebase origin main`
- [ ] Confirm `phase-2/task-03-auth` status is `complete` (middleware + login working)
- [ ] Confirm `phase-2/task-04-api-products` status is `complete`
- [ ] Read `docs/sdd.md` sections 2 and 9
- [ ] Verify accessing `/admin` without login redirects to `/login`
- [ ] Mark this task `in-progress` in `status.md`

## File Ownership

| File | Action | Notes |
|------|--------|-------|
| `app/(admin)/admin/page.tsx` | create | Admin product list — Server Component |
| `components/admin/ProductTable.tsx` | create | Products data table with status badges |
| `components/admin/ActiveToggle.tsx` | create | Quick toggle for active flag (calls PUT API) |

### Do NOT Modify

- `app/(admin)/login/` — owned by task-03-auth
- `app/(admin)/layout.tsx` — owned by task-03-auth
- `app/(admin)/admin/products/` — owned by task-09-admin-forms
- `components/admin/ProductForm.tsx` — owned by task-09-admin-forms
- `components/admin/CloudinaryWidget.tsx` — owned by task-09-admin-forms

## Conflict Avoidance Notes

- task-09-admin-forms will create `app/(admin)/admin/products/new/page.tsx` and `app/(admin)/admin/products/[id]/edit/page.tsx`. Do not create those pages here.

## Implementation Steps

### Step 1: Create app/(admin)/admin/page.tsx

Server Component — fetch all products (no `?active` filter):
```typescript
import { prisma } from '@/lib/prisma'
import { ProductTable } from '@/components/admin/ProductTable'
import Link from 'next/link'

export default async function AdminPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, category: true, price: true, active: true, createdAt: true },
  })

  const serialized = products.map(p => ({ ...p, price: p.price.toString() }))

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1>Produtos</h1>
        <Link href="/admin/products/new">
          <Button>+ Novo Produto</Button>
        </Link>
      </div>
      <ProductTable products={serialized} />
    </div>
  )
}
```

### Step 2: Create components/admin/ProductTable.tsx

Table columns: Name | Category | Price | Status (badge) | Actions (Edit link + ActiveToggle)

- Status badge: `active = true` → green "Ativo"; `active = false` → gray "Inativo"
- Category display: `CLOTHES → Roupas`, `LINGERIE → Íntimas`, `WORKOUT → Academia`
- Edit link: `<Link href={/admin/products/${id}/edit}>Editar</Link>`
- Active toggle: `<ActiveToggle id={id} active={active} />`

Use shadcn/ui `Badge` for status. Use a plain HTML `<table>` or shadcn/ui table primitives.

### Step 3: Create components/admin/ActiveToggle.tsx

Client Component:
```typescript
'use client'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'

export function ActiveToggle({ id, active }: { id: string; active: boolean }) {
  const router = useRouter()

  async function toggle() {
    await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !active }),
    })
    router.refresh()  // re-run Server Component data fetch
  }

  return <Switch checked={active} onCheckedChange={toggle} />
}
```

## Testing

Test stubs at `__tests__/admin/admin-list.test.tsx`:

**Spec scenarios covered**:
- [ ] Story 4 / Scenario 4: **Given** admin is on `/admin`, **When** page loads, **Then** all products (active and inactive) listed with name, category, price, and status badge — `__tests__/admin/admin-list.test.tsx`
- [ ] Story 4 / Scenario 4 (active toggle): **Given** admin toggles `ActiveToggle`, **When** clicked, **Then** `PUT /api/products/[id]` called with `{ active: !current }` — `__tests__/admin/ActiveToggle.test.tsx`

**Additional verification**:
- [ ] "Ativo" badge is green, "Inativo" badge is gray
- [ ] "Editar" link points to `/admin/products/[id]/edit`
- [ ] "+ Novo Produto" link points to `/admin/products/new`

## Documentation / KB Updates

- [ ] No new KB doc required
- [ ] If `router.refresh()` + Server Component re-fetch pattern is non-obvious, run `document-solution`

## Completion Criteria

- [ ] Admin product table shows all products with correct status badges
- [ ] ActiveToggle correctly calls PUT and refreshes the table
- [ ] "+ Novo Produto" and "Editar" navigation links work
- [ ] Changes committed to `plan/marketplace-filha/phase-4/task-08-admin-list` branch
- [ ] Status updated in `status.md`
