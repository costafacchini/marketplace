# Task: Product CRUD API Routes

**Plan**: marketplace-filha
**Phase**: 2
**Task ID (phase-local)**: task-04
**Task Path**: phase-2/task-04-api-products
**Spec References**: Story 1 (FR-001, FR-002), Story 5 (FR-008, FR-009, FR-011, FR-012), SC-003, SC-006
**Depends On**: phase-1/task-02-scaffold
**JIRA**: N/A

## Objective

Implement all product REST API route handlers: `GET /api/products` (with optional `active` and `category` query filters), `POST /api/products` (admin only), `GET /api/products/[id]`, and `PUT /api/products/[id]` (admin only, used for updates and soft-delete via `active` flag).

## Context

Reference `docs/sdd.md` section 4 (API Contracts) before starting.

Key rules:
- No hard `DELETE` endpoint — products are deactivated via `PUT` with `{ active: false }` (FR-008)
- `POST` and `PUT` must check `getServerSession(authOptions)` and return 401 if no session (FR-012)
- Price is stored as `Decimal(10,2)` by Prisma — coerce JS number to `Decimal` on input, serialize as string on output (FR-009)
- Validation uses **zod** schemas defined in `lib/validations/product.ts` (FR-011)
- `GET /api/products` with `?active=true` only returns active products (for the store); without the param, returns all (for admin)

This task runs **in parallel** with `task-03-auth` — they do not share files.

## Before You Start

- [ ] `git switch main && git pull --rebase origin main`
- [ ] Confirm `phase-1/task-02-scaffold` status is `complete`
- [ ] Read `docs/sdd.md` sections 3 and 4
- [ ] Verify `lib/prisma.ts` and `prisma/schema.prisma` exist (task-02 output)
- [ ] Mark this task `in-progress` in `status.md`

## File Ownership

| File | Action | Notes |
|------|--------|-------|
| `app/api/products/route.ts` | create | GET list + POST create |
| `app/api/products/[id]/route.ts` | create | GET single + PUT update |
| `lib/validations/product.ts` | create | Zod schemas for product create/update |
| `types/product.ts` | create | Shared TypeScript types for Product |

### Do NOT Modify

- `lib/auth.ts` — owned by task-03-auth
- `app/api/auth/` — owned by task-03-auth
- `middleware.ts` — owned by task-03-auth
- `lib/prisma.ts` — owned by task-02-scaffold

## Conflict Avoidance Notes

- task-03-auth runs concurrently but owns `lib/auth.ts`. Import it from there — do not redefine.
- Both tasks are created in Phase 2 but share no files.

## Implementation Steps

### Step 1: Create lib/validations/product.ts

```typescript
import { z } from 'zod'

export const productCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive().multipleOf(0.01),
  category: z.enum(['CLOTHES', 'LINGERIE', 'WORKOUT']),
  sizes: z.array(z.string().min(1)).min(1),
  images: z.array(z.string().url()).min(1),
  active: z.boolean().optional().default(true),
})

export const productUpdateSchema = productCreateSchema.partial()

export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
```

### Step 2: Create types/product.ts

```typescript
import { Product, Category } from '@prisma/client'
export type { Product, Category }

export interface ProductListItem {
  id: string
  name: string
  price: string  // serialized Decimal
  category: Category
  images: string[]
  active: boolean
}
```

### Step 3: Create app/api/products/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { productCreateSchema } from '@/lib/validations/product'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const activeParam = searchParams.get('active')
  const categoryParam = searchParams.get('category')

  const where: Record<string, unknown> = {}
  if (activeParam === 'true') where.active = true
  if (categoryParam) where.category = categoryParam

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ products })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = productCreateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const product = await prisma.product.create({ data: parsed.data })
  return NextResponse.json({ product }, { status: 201 })
}
```

### Step 4: Create app/api/products/[id]/route.ts

Implement `GET` (public, returns 404 if not found) and `PUT` (admin only, handles both field updates and `active` toggle).

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { productUpdateSchema } from '@/lib/validations/product'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const product = await prisma.product.findUnique({ where: { id: params.id } })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ product })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = productUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const product = await prisma.product.update({
    where: { id: params.id },
    data: parsed.data,
  })
  return NextResponse.json({ product })
}
```

## Testing

Test stubs to be created at `__tests__/api/products/`:

**Spec scenarios covered**:
- [ ] Story 1 / FR-001: **Given** `GET /api/products?active=true`, **When** called, **Then** only products with `active=true` are returned — `__tests__/api/products/list.test.ts`
- [ ] Story 1 / FR-002: **Given** `GET /api/products?active=true&category=CLOTHES`, **When** called, **Then** only CLOTHES products returned — `__tests__/api/products/list.test.ts`
- [ ] Story 5 / SC-006: **Given** `POST /api/products` with valid body and admin session, **When** called, **Then** 201 with created product — `__tests__/api/products/create.test.ts`
- [ ] Story 5 / FR-012: **Given** `POST /api/products` with no session, **When** called, **Then** 401 returned — `__tests__/api/products/create.test.ts`
- [ ] Story 5 / FR-012: **Given** `PUT /api/products/[id]` with no session, **When** called, **Then** 401 returned — `__tests__/api/products/update.test.ts`
- [ ] Story 5 / FR-008: **Given** admin sends `PUT` with `{ active: false }`, **When** called, **Then** product.active becomes false (soft delete) — `__tests__/api/products/update.test.ts`
- [ ] **Given** `GET /api/products/[id]` with unknown id, **When** called, **Then** 404 returned — `__tests__/api/products/get.test.ts`
- [ ] Story 5 / FR-011: **Given** `POST /api/products` with invalid body (missing name), **When** called, **Then** 400 with field errors — `__tests__/api/products/create.test.ts`

**Additional verification**:
- [ ] `GET /api/products` without `?active` param returns all products (for admin use)
- [ ] Price is correctly serialized from Decimal to string in responses

## Documentation / KB Updates

- [ ] No new KB doc required if `docs/sdd.md` section 4 is complete
- [ ] If zod + Next.js App Router API validation pattern is non-obvious, run `document-solution`

## Completion Criteria

- [ ] All 8 spec test scenarios pass (stubs filled in)
- [ ] `GET /api/products?active=true` returns only active products
- [ ] `POST /api/products` without session returns 401
- [ ] `PUT /api/products/[id]` with `{ active: false }` soft-deletes the product
- [ ] Zod validation rejects invalid POST bodies with 400
- [ ] Changes committed to `plan/marketplace-filha/phase-2/task-04-api-products` branch
- [ ] Status updated in `status.md`
