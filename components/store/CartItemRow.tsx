'use client'

import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCartStore, CartItem } from '@/store/cart'
import { formatPrice } from '@/lib/format'

interface CartItemRowProps {
  item: CartItem
}

export function CartItemRow({ item }: CartItemRowProps) {
  const t = useTranslations('store.cart')
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQty = useCartStore((state) => state.updateQty)

  return (
    <div className="flex gap-4 py-4 border-b last:border-b-0">
      <div className="relative w-16 h-16 flex-shrink-0">
        <Image
          src={item.image || '/placeholder.png'}
          alt={item.name}
          width={64}
          height={64}
          className="w-16 h-16 object-cover rounded"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <p className="font-medium">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          {t('qty')}: {item.size}
        </p>
        <p className="text-sm">{formatPrice(item.price)}</p>

        <div className="flex items-center gap-2 mt-1">
          <button
            type="button"
            aria-label="-"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center border rounded text-lg"
            disabled={item.quantity <= 1}
            onClick={() => updateQty(item.productId, item.size, item.quantity - 1)}
          >
            −
          </button>

          <input
            type="number"
            aria-label={t('qty')}
            className="w-12 text-center border rounded h-10"
            value={item.quantity}
            min={1}
            readOnly
          />

          <button
            type="button"
            aria-label="+"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center border rounded text-lg"
            onClick={() => updateQty(item.productId, item.size, item.quantity + 1)}
          >
            +
          </button>

          <button
            type="button"
            aria-label={t('remove')}
            className="ml-auto min-h-[44px] min-w-[44px] flex items-center justify-center text-destructive hover:bg-destructive/10 rounded"
            onClick={() => removeItem(item.productId, item.size)}
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
