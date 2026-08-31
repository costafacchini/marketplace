import { getTranslations } from 'next-intl/server'
import { prisma } from '@/lib/prisma'
import { getActivePriceLists, resolvePrice } from '@/lib/pricing'
import { CategoryFilter } from '@/components/store/CategoryFilter'

export default async function VitrinePage() {
  const t = await getTranslations('store')
  const [products, activeLists] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, price: true, category: true, images: true },
    }),
    getActivePriceLists(),
  ])

  const serialized = products.map((p) => {
    const promoPrice = resolvePrice(p.id, p.category, p.price, activeLists)
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      images: p.images,
      originalPrice: p.price.toString(),
      promotionalPrice: promoPrice ? promoPrice.toString() : null,
    }
  })

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t('name')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t('tagline')}</p>
      </div>
      <CategoryFilter products={serialized} />
    </main>
  )
}
