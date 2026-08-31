'use client'
import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ProductGrid } from './ProductGrid'
import { SortControl, SortOption, sortProducts } from './SortControl'

export interface SerializedProduct {
  id: string
  name: string
  category: string
  images: string[]
  originalPrice: string
  promotionalPrice: string | null
}

type CategoryFilter = 'ALL' | 'CLOTHES' | 'LINGERIE' | 'WORKOUT'

const CATEGORIES: CategoryFilter[] = ['ALL', 'CLOTHES', 'LINGERIE', 'WORKOUT']

interface CategoryFilterProps {
  products: SerializedProduct[]
}

export function CategoryFilter({ products }: CategoryFilterProps) {
  const t = useTranslations('store.filter')
  const [category, setCategory] = useState<CategoryFilter>('ALL')
  const [sort, setSort] = useState<SortOption>('PROMO_FIRST')

  const filtered =
    category === 'ALL' ? products : products.filter((p) => p.category === category)

  const sorted = sortProducts(filtered, sort)

  return (
    <Tabs value={category} onValueChange={(v) => setCategory(v as CategoryFilter)}>
      <div className="flex items-start gap-2 mb-4">
        <TabsList className="min-w-0 flex-wrap h-auto gap-1">
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat} value={cat} className="min-h-[44px]">
              {t(cat.toLowerCase() as 'all' | 'clothes' | 'lingerie' | 'workout')}
            </TabsTrigger>
          ))}
        </TabsList>
        <SortControl value={sort} onSort={setSort} />
      </div>
      {CATEGORIES.map((cat) => (
        <TabsContent key={cat} value={cat} className="mt-0">
          <ProductGrid products={sorted} />
        </TabsContent>
      ))}
    </Tabs>
  )
}
