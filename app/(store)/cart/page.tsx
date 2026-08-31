'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/store/cart'
import { CartItemRow } from '@/components/store/CartItemRow'
import { CartSummary } from '@/components/store/CartSummary'
import { Button } from '@/components/ui/button'

export default function CartPage() {
  const t = useTranslations('store.cart')
  const items = useCartStore((state) => state.items)

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">{t('title')}</h1>
        <div className="flex flex-col items-center text-center py-12">
          <ShoppingBag
            className="size-12 text-muted-foreground mb-4"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="font-medium mb-1">{t('empty')}</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">{t('emptyHint')}</p>
          <Button asChild className="min-h-[44px]">
            <Link href="/">{t('backToStore')}</Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <div className="divide-y">
        {items.map((item) => (
          <CartItemRow key={`${item.productId}-${item.size}`} item={item} />
        ))}
      </div>

      <CartSummary />
    </main>
  )
}
