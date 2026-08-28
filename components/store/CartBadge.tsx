'use client'

import { useCartStore } from '@/store/cart'
import { ShoppingCart } from 'lucide-react'

export function CartBadge() {
  const count = useCartStore((state) =>
    state.items.reduce((n, i) => n + i.quantity, 0)
  )

  return (
    <span className="relative inline-flex">
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full size-4 flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </span>
  )
}
