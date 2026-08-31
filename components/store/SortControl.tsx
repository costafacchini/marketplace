'use client'
import { ArrowUpDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SerializedProduct } from './CategoryFilter'

export type SortOption = 'PROMO_FIRST' | 'PRICE_ASC' | 'NAME_ASC'

const SHORT_KEYS: Record<SortOption, 'promoFirstShort' | 'priceAscShort' | 'nameAscShort'> = {
  PROMO_FIRST: 'promoFirstShort',
  PRICE_ASC: 'priceAscShort',
  NAME_ASC: 'nameAscShort',
}

export function sortProducts(products: SerializedProduct[], sort: SortOption): SerializedProduct[] {
  const clone = [...products]
  switch (sort) {
    case 'PROMO_FIRST':
      return clone.sort((a, b) => (a.promotionalPrice ? 0 : 1) - (b.promotionalPrice ? 0 : 1))
    case 'PRICE_ASC':
      return clone.sort(
        (a, b) =>
          Number(a.promotionalPrice ?? a.originalPrice) -
          Number(b.promotionalPrice ?? b.originalPrice)
      )
    case 'NAME_ASC':
      return clone.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }
}

interface SortControlProps {
  value: SortOption
  onSort: (sort: SortOption) => void
}

export function SortControl({ value, onSort }: SortControlProps) {
  const t = useTranslations('store.sort')

  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="hidden sm:block text-sm text-muted-foreground">{t('label')}</span>
      <Select value={value} onValueChange={(v) => onSort(v as SortOption)}>
        <SelectTrigger className="min-h-[44px] w-auto sm:w-[200px] px-2 sm:px-3" aria-label={t('label')}>
          {/* AT + desktop: full option label */}
          <span className="sr-only sm:not-sr-only sm:inline">
            <SelectValue />
          </span>
          {/* Mobile only: icon + short active-state label for sighted users */}
          <span className="flex items-center gap-1 sm:hidden" aria-hidden="true">
            <ArrowUpDown className="size-4 shrink-0" />
            <span className="text-sm font-medium">{t(SHORT_KEYS[value])}</span>
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PROMO_FIRST">{t('promoFirst')}</SelectItem>
          <SelectItem value="PRICE_ASC">{t('priceAsc')}</SelectItem>
          <SelectItem value="NAME_ASC">{t('nameAsc')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
