'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { ActivePriceListToggle } from '@/components/admin/ActivePriceListToggle'

interface SerializedPriceList {
  id: string
  name: string
  discountPct: string
  startsAt: string
  expiresAt: string
  active: boolean
  categories: string[]
  createdAt: string
  updatedAt: string
  items: Array<{ productId: string }>
}

interface Props {
  priceLists: SerializedPriceList[]
}

type StatusKey = 'status.active' | 'status.inactive' | 'status.expired' | 'status.scheduled'

function getStatus(
  active: boolean,
  startsAt: string,
  expiresAt: string
): { key: StatusKey; className: string } {
  if (!active) {
    return { key: 'status.inactive', className: 'bg-gray-100 text-gray-600' }
  }
  const now = new Date()
  const start = new Date(startsAt)
  const end = new Date(expiresAt)
  if (end < now) {
    return { key: 'status.expired', className: 'bg-gray-100 text-gray-600' }
  }
  if (start > now) {
    return { key: 'status.scheduled', className: 'bg-yellow-100 text-yellow-800' }
  }
  return { key: 'status.active', className: 'bg-green-100 text-green-800' }
}

export function PriceListTable({ priceLists }: Props) {
  const t = useTranslations('admin.priceLists')

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 text-left font-medium">{t('table.name')}</th>
            <th className="px-4 py-3 text-left font-medium">{t('table.discount')}</th>
            <th className="px-4 py-3 text-left font-medium">{t('table.starts')}</th>
            <th className="px-4 py-3 text-left font-medium">{t('table.expires')}</th>
            <th className="px-4 py-3 text-left font-medium">{t('table.status')}</th>
            <th className="px-4 py-3 text-left font-medium">{t('table.actions')}</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {priceLists.map(pl => {
            const status = getStatus(pl.active, pl.startsAt, pl.expiresAt)
            return (
              <tr key={pl.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{pl.name}</td>
                <td className="px-4 py-3">{pl.discountPct}%</td>
                <td className="px-4 py-3">
                  {new Date(pl.startsAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  {new Date(pl.expiresAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                  >
                    {t(status.key)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/admin/price-lists/${pl.id}/edit`}
                      className="text-sm text-primary hover:underline"
                    >
                      {t('table.edit')}
                    </Link>
                    <ActivePriceListToggle id={pl.id} active={pl.active} />
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {priceLists.length === 0 && (
        <p className="px-4 py-8 text-center text-muted-foreground text-sm">—</p>
      )}
    </div>
  )
}
