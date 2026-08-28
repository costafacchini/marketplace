# Task: Product Detail Page

**Plan**: small-business-seller
**Phase**: 3
**Task ID (phase-local)**: task-06
**Task Path**: phase-3/task-06-product-detail
**Spec References**: Story 2 (P1) — all 5 scenarios, Story 6 scenario 6, Story 8 scenarios 1–4, FR-003, FR-013, FR-014, FR-017, FR-022, FR-024, FR-025, SC-001, SC-007, SC-008, SC-010
**Depends On**: phase-2/task-04-api-products, phase-2/task-11-api-pricelists
**JIRA**: N/A

## Objective

Build the product detail page (`app/(store)/products/[id]/page.tsx`) with a multi-image gallery, size selector, and "Adicionar ao Carrinho" button that writes to the Zustand cart store.

## Context

Reference `docs/sdd.md` sections 6 (Zustand cart shape) and 9 (Component Hierarchy).

This task defines the cart store stub that `task-07-cart` will complete. To avoid blocking: this task creates `store/cart.ts` with only the `addItem` action and types. Task-07 extends it with `removeItem`, `updateQty`, `clear`, and `total`.

Runs in parallel with `task-05-store-vitrine` (owns different files) and `task-07-cart` (task-07 depends on this task).

## Before You Start

- [ ] `git switch main && git pull --rebase origin main`
- [ ] Confirm `phase-2/task-04-api-products` status is `complete`
- [ ] Read `docs/sdd.md` sections 6 and 9
- [ ] Mark this task `in-progress` in `status.md`

## File Ownership

| File | Action | Notes |
|------|--------|-------|
| `app/(store)/products/[id]/page.tsx` | create | Product detail — Server Component |
| `components/store/ImageGallery.tsx` | create | Client component: image carousel |
| `components/store/SizePicker.tsx` | create | Client component: size button group |
| `components/store/AddToCartButton.tsx` | create | Client component: add to cart action |
| `store/cart.ts` | create | Zustand store stub (addItem + types only) |

### Do NOT Modify

- `app/(store)/page.tsx` — owned by task-05-store-vitrine
- `app/(store)/cart/` — owned by task-07-cart
- `components/store/ProductCard.tsx` — owned by task-05-store-vitrine

## Conflict Avoidance Notes

- task-07-cart will extend `store/cart.ts`. This task creates the file with stub actions so task-07 can build on it without conflict. Do NOT implement `removeItem`, `updateQty`, `clear`, or `total` here — those belong to task-07.
- task-05-store-vitrine is independent; no shared files.

## Implementation Steps

### Step 1: Create store/cart.ts (stub)

Per SDD section 6:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  name: string
  size: string
  price: number
  quantity: number
  image: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  // removeItem, updateQty, clear, total — added by task-07-cart
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(
          i => i.productId === item.productId && i.size === item.size
        )
        if (existing) {
          set(state => ({
            items: state.items.map(i =>
              i.productId === item.productId && i.size === item.size
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          }))
        } else {
          set(state => ({ items: [...state.items, { ...item, quantity: 1 }] }))
        }
      },
    }),
    { name: 'small-business-seller-cart' }
  )
)
```

### Step 2: Create app/(store)/products/[id]/page.tsx

Server Component. Fetch product by ID from Prisma directly (no API round-trip):
```typescript
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { ImageGallery } from '@/components/store/ImageGallery'
import { SizePicker } from '@/components/store/SizePicker'
import { AddToCartButton } from '@/components/store/AddToCartButton'
import { formatPrice } from '@/lib/format'

export default async function ProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } })
  if (!product || !product.active) notFound()

  const activeLists = await getActivePriceLists()
  const promoPrice = resolvePrice(product.id, product.category, product.price, activeLists)

  return (
    <div>
      <ImageGallery images={product.images} name={product.name} />
      <h1>{product.name}</h1>
      {promoPrice ? (
        <div>
          <span className="text-lg font-bold text-primary">{formatPrice(promoPrice.toString())}</span>
          <span className="ml-2 text-sm line-through text-muted-foreground">{formatPrice(product.price.toString())}</span>
          <span className="ml-2 text-xs text-green-600">Em promoção</span>
        </div>
      ) : (
        <p>{formatPrice(product.price.toString())}</p>
      )}
      <p>{product.description}</p>
      <AddToCartButton
        productId={product.id}
        name={product.name}
        price={promoPrice ? Number(promoPrice) : Number(product.price)}
        image={product.images[0]}
        sizes={product.sizes}
      />
    </div>
  )
}
```

### Step 3: Create components/store/ImageGallery.tsx

Client Component:
- State: `selectedIndex` (default 0)
- Renders main image large (`aspect-square w-full`) + thumbnails row below (`flex gap-2 overflow-x-auto`)
- Clicking a thumbnail updates `selectedIndex`
- Use `next/image` with `fill` on a positioned container for the main image; fixed size for thumbnails
- Thumbnail row must be horizontally scrollable on mobile — do not wrap

### Step 4: Create components/store/SizePicker.tsx

Client Component:
- Props: `sizes: string[]`, `value: string | null`, `onChange: (size: string) => void`
- Renders each size as a button; selected size is highlighted
- Each button: `min-h-[44px] min-w-[44px]` — required by FR-013 for mobile tap target size
- Wrap in `flex flex-wrap gap-2` so sizes wrap naturally on narrow screens
- If no size selected, `value === null`

### Step 5: Create components/store/AddToCartButton.tsx

Client Component integrating `SizePicker` and the cart add action:
- Internal state: `selectedSize: string | null`
- On click "Adicionar ao Carrinho": validate `selectedSize !== null`; if null, show inline error "Selecione um tamanho"
- On valid: call `useCartStore.getState().addItem({ productId, name, size: selectedSize, price, image })`
- Show a brief success toast/notification after adding

## Testing

Test stubs at `__tests__/store/product-detail.test.tsx`:

**Spec scenarios covered**:
- [ ] Story 2 / Scenario 1: **Given** customer on vitrine, **When** clicks product card, **Then** detail page loads with images, description, price, sizes — `__tests__/store/product-detail.test.tsx`
- [ ] Story 2 / Scenario 2: **Given** size selected and "Adicionar" clicked, **Then** item added to cart store with correct size — `__tests__/store/product-detail.test.tsx`
- [ ] Story 2 / Scenario 3: **Given** no size selected, **When** "Adicionar" clicked, **Then** inline error shown — `__tests__/store/product-detail.test.tsx`
- [ ] Story 2 / Scenario 4: **Given** product has multiple images, **When** thumbnail clicked, **Then** main image updates — `__tests__/store/ImageGallery.test.tsx`
- [ ] Story 2 / Scenario 5: **Given** same product+size added twice, **When** cart checked, **Then** quantity is 2 not 2 separate items — `__tests__/store/cart.test.ts`

**Additional verification**:
- [ ] `notFound()` is called for inactive products
- [ ] Cart store `addItem` increments quantity for duplicate product+size
- [ ] SC-007: No horizontal scroll on 375px viewport; size buttons are large enough to tap comfortably
- [ ] "Adicionar ao Carrinho" button is full-width on mobile (`w-full`)

## Documentation / KB Updates

- [ ] No new KB doc required if SDD section 6 covers the Zustand shape

## Completion Criteria

- [ ] All 5 Story 2 scenarios pass
- [ ] Adding same product+size twice results in qty=2 in cart
- [ ] Inactive product URL returns 404 page
- [ ] Cart store is persisted to localStorage (`small-business-seller-cart` key)
- [ ] Changes committed to `plan/small-business-seller/phase-3/task-06-product-detail` branch
- [ ] Status updated in `status.md`
