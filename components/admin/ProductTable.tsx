'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { ActiveToggle } from '@/components/admin/ActiveToggle'

type Category = 'CLOTHES' | 'LINGERIE' | 'WORKOUT'

const CATEGORY_KEY_MAP: Record<Category, string> = {
  CLOTHES: 'category.clothes',
  LINGERIE: 'category.lingerie',
  WORKOUT: 'category.workout',
} as const

interface SerializedProduct {
  id: string
  name: string
  category: Category
  price: string
  active: boolean
  createdAt: Date
}

interface ProductTableProps {
  products: SerializedProduct[]
}

const priceFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

export function ProductTable({ products }: ProductTableProps) {
  const t = useTranslations('admin.products')

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">{t('table.name')}</th>
            <th className="px-4 py-3 text-left font-medium">{t('table.category')}</th>
            <th className="px-4 py-3 text-left font-medium">{t('table.price')}</th>
            <th className="px-4 py-3 text-left font-medium">{t('table.status')}</th>
            <th className="px-4 py-3 text-left font-medium">{t('table.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-4 py-3 font-medium">{product.name}</td>
              <td className="px-4 py-3">
                {t(CATEGORY_KEY_MAP[product.category])}
              </td>
              <td className="px-4 py-3">
                {priceFormatter.format(Number(product.price))}
              </td>
              <td className="px-4 py-3">
                <Badge variant={product.active ? 'default' : 'secondary'}>
                  {product.active ? t('status.active') : t('status.inactive')}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    {t('table.edit')}
                  </Link>
                  <ActiveToggle id={product.id} active={product.active} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
