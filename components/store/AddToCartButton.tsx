'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useCartStore } from '@/store/cart'
import { SizePicker } from './SizePicker'
import { Button } from '@/components/ui/button'

interface Props {
  productId: string
  name: string
  price: number
  image: string
  sizes: string[]
}

export function AddToCartButton({ productId, name, price, image, sizes }: Props) {
  const t = useTranslations('store.product')
  const addItem = useCartStore((s) => s.addItem)
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [added, setAdded] = useState(false)

  function handleAdd() {
    if (!selectedSize) {
      setError(true)
      return
    }
    setError(false)
    addItem({ productId, name, size: selectedSize, price, image })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="mt-4 space-y-3">
      <SizePicker
        sizes={sizes}
        value={selectedSize}
        onChange={(s) => {
          setSelectedSize(s)
          setError(false)
        }}
      />
      {error && <p className="text-sm text-red-500">{t('sizeRequired')}</p>}
      <Button onClick={handleAdd} className="w-full min-h-[44px]">
        {added ? t('added') : t('addToCart')}
      </Button>
    </div>
  )
}
