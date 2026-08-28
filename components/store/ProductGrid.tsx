'use client'
import { useTranslations } from 'next-intl'
import { ProductCard } from './ProductCard'
import type { SerializedProduct } from './CategoryFilter'

interface ProductGridProps {
  products: SerializedProduct[]
}

export function ProductGrid({ products }: ProductGridProps) {
  const t = useTranslations('store.filter')

  if (products.length === 0) {
    return (
      <p className="col-span-full py-12 text-center text-muted-foreground">{t('empty')}</p>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
