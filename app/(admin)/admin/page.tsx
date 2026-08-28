import { prisma } from '@/lib/prisma'
import { ProductTable } from '@/components/admin/ProductTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function AdminPage() {
  const t = await getTranslations('admin.products')

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      active: true,
      createdAt: true,
    },
  })

  const serialized = products.map((p) => ({
    ...p,
    price: p.price.toString(),
  }))

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Link href="/admin/products/new">
          <Button>{t('newProduct')}</Button>
        </Link>
      </div>
      <ProductTable products={serialized} />
    </div>
  )
}
