import { prisma } from '@/lib/prisma'
import { PriceListTable } from '@/components/admin/PriceListTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function PriceListsPage() {
  const t = await getTranslations('admin.priceLists')
  const priceLists = await prisma.priceList.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { select: { productId: true } } },
  })

  const serialized = priceLists.map(pl => ({
    ...pl,
    discountPct: pl.discountPct.toString(),
    startsAt: pl.startsAt.toISOString(),
    expiresAt: pl.expiresAt.toISOString(),
    createdAt: pl.createdAt.toISOString(),
    updatedAt: pl.updatedAt.toISOString(),
  }))

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Link href="/admin/price-lists/new">
          <Button>{t('new')}</Button>
        </Link>
      </div>
      <PriceListTable priceLists={serialized} />
    </div>
  )
}
