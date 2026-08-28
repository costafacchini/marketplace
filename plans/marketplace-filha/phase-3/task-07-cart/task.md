# Task: Zustand Cart + WhatsApp Checkout

**Plan**: marketplace-filha
**Phase**: 3
**Task ID (phase-local)**: task-07
**Task Path**: phase-3/task-07-cart
**Spec References**: Story 3 (P1) — all 5 scenarios, FR-003, FR-004, FR-010, FR-013, SC-001, SC-004, SC-007
**Depends On**: phase-3/task-06-product-detail
**JIRA**: N/A

## Objective

Complete the Zustand cart store (extending the stub from task-06), build the cart page with item management and order totals, implement the WhatsApp message formatter, and create the pre-checkout confirmation step.

## Context

Reference `docs/sdd.md` sections 6 (Zustand cart shape), 8 (WhatsApp checkout flow), and 9 (Component Hierarchy).

`store/cart.ts` was created as a stub by task-06. This task extends it with `removeItem`, `updateQty`, `clear`, and `total`. Do not remove or rewrite `addItem` — only extend.

The WhatsApp number comes from `NEXT_PUBLIC_WHATSAPP_NUMBER` env var. The `text` param must be `encodeURIComponent`-encoded (handles ç, ã, etc.).

## Before You Start

- [ ] `git switch main && git pull --rebase origin main`
- [ ] Confirm `phase-3/task-06-product-detail` status is `complete`
- [ ] Confirm `store/cart.ts` exists with `addItem` and `CartItem` type
- [ ] Read `docs/sdd.md` sections 6 and 8
- [ ] Mark this task `in-progress` in `status.md`

## File Ownership

| File | Action | Notes |
|------|--------|-------|
| `store/cart.ts` | modify | Add removeItem, updateQty, clear, total |
| `app/(store)/cart/page.tsx` | create | Cart page — Client Component |
| `components/store/CartItemRow.tsx` | create | Single cart item with qty controls |
| `components/store/CartSummary.tsx` | create | Order total + checkout buttons |
| `components/store/ConfirmModal.tsx` | create | Pre-checkout WhatsApp redirect warning |
| `components/store/CartBadge.tsx` | create | Cart icon badge with item count for layout |
| `lib/whatsapp.ts` | create | Message formatter + wa.me URL builder |

### Do NOT Modify

- `app/(store)/page.tsx` — owned by task-05-store-vitrine
- `app/(store)/products/` — owned by task-06-product-detail
- `components/store/AddToCartButton.tsx` — owned by task-06-product-detail

## Implementation Steps

### Step 1: Extend store/cart.ts

Add to the existing store (do not rewrite `addItem`):
```typescript
removeItem: (productId: string, size: string) => void
updateQty: (productId: string, size: string, qty: number) => void
clear: () => void
total: () => number
```

Implementation:
```typescript
removeItem: (productId, size) =>
  set(state => ({
    items: state.items.filter(i => !(i.productId === productId && i.size === size)),
  })),
updateQty: (productId, size, qty) =>
  set(state => ({
    items: state.items.map(i =>
      i.productId === productId && i.size === size ? { ...i, quantity: qty } : i
    ),
  })),
clear: () => set({ items: [] }),
total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
```

### Step 2: Create lib/whatsapp.ts

```typescript
export function buildWhatsAppUrl(items: CartItem[]): string {
  const lines = items.map(
    i => `- ${i.name} Tam. ${i.size} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`
  )
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const message = [
    'Olá! Gostaria de encomendar:',
    '',
    ...lines,
    '',
    `Total estimado: ${formatPrice(total)}`,
  ].join('\n')

  const number = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}
```

`formatPrice` is imported from `lib/format.ts` (created by task-05).

### Step 3: Create app/(store)/cart/page.tsx

Client Component (needs cart store):
```typescript
'use client'
import { useCartStore } from '@/store/cart'
import { CartItemRow } from '@/components/store/CartItemRow'
import { CartSummary } from '@/components/store/CartSummary'
import Link from 'next/link'

export default function CartPage() {
  const items = useCartStore(state => state.items)

  if (items.length === 0) {
    return (
      <div>
        <p>Seu carrinho está vazio.</p>
        <Link href="/">Ver Produtos</Link>
      </div>
    )
  }

  return (
    <div>
      <h1>Meu Carrinho</h1>
      {items.map(item => (
        <CartItemRow key={`${item.productId}-${item.size}`} item={item} />
      ))}
      <CartSummary items={items} />
    </div>
  )
}
```

### Step 4: Create components/store/CartItemRow.tsx

Displays item image (small, `w-16 h-16`), name, size, unit price. Quantity controls: `-` button (min 1), input, `+` button. Remove button (trash icon). On quantity change: call `updateQty`; on remove: call `removeItem`.

Mobile layout: use `flex` row with the image on the left and content stacked on the right. Quantity `-`/`+` buttons must be `min-h-[44px] min-w-[44px]` (FR-013). The remove button must also be large enough to tap without zooming.

### Step 5: Create components/store/CartSummary.tsx

Shows grand total. "Confirmar Pedido" button opens `ConfirmModal`.

### Step 6: Create components/store/ConfirmModal.tsx

shadcn/ui `Dialog`. Content:
> "Você será redirecionada ao WhatsApp para finalizar a compra diretamente com a vendedora."

"Enviar pelo WhatsApp" button: calls `buildWhatsAppUrl(items)`, opens in new tab, then calls `clear()`.
"Voltar" button: closes modal.

### Step 7: Add CartBadge to store layout

Create `components/store/CartBadge.tsx` (Client Component):
- Reads `useCartStore(state => state.items).reduce((n, i) => n + i.quantity, 0)`
- Renders a badge overlay on the cart icon in `app/(store)/layout.tsx`
- Update the layout to import and render `CartBadge` next to the cart icon link

## Testing

Test stubs at `__tests__/store/cart.test.ts` and `__tests__/store/cart-page.test.tsx`:

**Spec scenarios covered**:
- [ ] Story 3 / Scenario 1: **Given** cart has items, **When** cart page renders, **Then** all items listed with name, size, qty, unit price, and grand total — `__tests__/store/cart-page.test.tsx`
- [ ] Story 3 / Scenario 2: **Given** cart has items, **When** "Confirmar Pedido" clicked, **Then** confirmation modal appears with WhatsApp redirect message — `__tests__/store/cart-page.test.tsx`
- [ ] Story 3 / Scenario 3: **Given** confirmation modal open, **When** "Enviar pelo WhatsApp" clicked, **Then** correct wa.me URL opened — `__tests__/lib/whatsapp.test.ts`
- [ ] Story 3 / Scenario 4: **Given** cart is empty, **When** cart page renders, **Then** empty state with "Ver Produtos" link shown — `__tests__/store/cart-page.test.tsx`
- [ ] Story 3 / Scenario 5: **Given** cart has items, **When** qty adjusted or item removed, **Then** total updates immediately — `__tests__/store/cart.test.ts`

**Additional verification**:
- [ ] `buildWhatsAppUrl` correctly encodes special Portuguese characters (ã, ç, etc.)
- [ ] Cart clears after "Enviar pelo WhatsApp" is clicked
- [ ] Cart badge count updates immediately when items are added or removed
- [ ] SC-007: Cart page has no horizontal scroll on 375px viewport; qty buttons meet 44px tap target
- [ ] "Confirmar Pedido" button is full-width on mobile (`w-full`)

## Documentation / KB Updates

- [ ] Run `document-solution` if the `encodeURIComponent` + Portuguese chars edge case is non-obvious
- [ ] No other KB updates required

## Completion Criteria

- [ ] All 5 Story 3 scenarios pass
- [ ] WhatsApp URL contains correctly encoded message with all cart items and total
- [ ] Cart clears after checkout
- [ ] Empty cart state shows "Ver Produtos" link
- [ ] Cart badge count reflects total item quantity
- [ ] Changes committed to `plan/marketplace-filha/phase-3/task-07-cart` branch
- [ ] Status updated in `status.md`
