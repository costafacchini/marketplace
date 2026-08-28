'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/store/cart'
import { CartItemRow } from '@/components/store/CartItemRow'
import { CartSummary } from '@/components/store/CartSummary'

export default function CartPage() {
  const t = useTranslations('store.cart')
  const items = useCartStore((state) => state.items)

  if (items.length === 0) {
    return (
      <main className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground mb-4">{t('empty')}</p>
        <Link
          href="/"
          className="text-primary underline underline-offset-4 hover:opacity-80"
        >
          {t('backToStore')}
        </Link>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
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
