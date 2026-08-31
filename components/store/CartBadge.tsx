'use client'

import { useRef, useState, useEffect } from 'react'
import { useCartStore } from '@/store/cart'
import { ShoppingCart } from 'lucide-react'

export function CartBadge() {
  const count = useCartStore((state) =>
    state.items.reduce((n, i) => n + i.quantity, 0)
  )
  const [bumpKey, setBumpKey] = useState(0)
  const prevCount = useRef(count)

  useEffect(() => {
    if (count > prevCount.current) {
      setBumpKey((k) => k + 1)
    }
    prevCount.current = count
  }, [count])

  return (
    <span className="relative inline-flex">
      <ShoppingCart className="size-5" aria-hidden />
      {count > 0 && (
        <span
          key={bumpKey}
          aria-hidden="true"
          className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full size-4 flex items-center justify-center motion-safe:animate-[badge-bump_0.35s_ease-out]"
        >
          {count > 9 ? '9+' : count}
        </span>
      )}
    </span>
  )
}
