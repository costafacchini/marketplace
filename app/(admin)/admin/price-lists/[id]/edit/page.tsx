import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { PriceListForm } from '@/components/admin/PriceListForm'

interface Props {
  params: { id: string }
}

export default async function EditPriceListPage({ params }: Props) {
  const t = await getTranslations('admin.priceLists')

  const priceList = await prisma.priceList.findUnique({
    where: { id: params.id },
    include: { items: { select: { productId: true, discountPct: true } } },
  })

  if (!priceList) {
    notFound()
  }

  const initialData = {
    name: priceList.name,
    discountPct: priceList.discountPct.toString(),
    startsAt: priceList.startsAt.toISOString().slice(0, 16),
    expiresAt: priceList.expiresAt.toISOString().slice(0, 16),
    active: priceList.active,
    categories: priceList.categories as string[],
    selectedProducts: priceList.items.map(item => ({
      productId: item.productId,
      discountPct: item.discountPct != null ? Number(item.discountPct.toString()) : undefined,
    })),
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      <PriceListForm initialData={initialData} listId={params.id} />
    </div>
  )
}
