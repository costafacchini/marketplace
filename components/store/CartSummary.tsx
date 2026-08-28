'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cart'
import { formatPrice } from '@/lib/format'
import { ConfirmModal } from './ConfirmModal'

export function CartSummary() {
  const t = useTranslations('store.cart')
  const items = useCartStore((state) => state.items)
  const total = useCartStore((state) => state.total)
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-6 border-t pt-4">
      <div className="flex items-center justify-between text-lg font-semibold mb-4">
        <span>{t('total')}</span>
        <span>{formatPrice(total())}</span>
      </div>

      <Button className="w-full" onClick={() => setOpen(true)}>
        {t('confirm')}
      </Button>

      <ConfirmModal open={open} onClose={() => setOpen(false)} items={items} />
    </div>
  )
}
