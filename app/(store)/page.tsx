import { prisma } from '@/lib/prisma'
import { getActivePriceLists, resolvePrice } from '@/lib/pricing'
import { CategoryFilter } from '@/components/store/CategoryFilter'

export default async function VitrinePage() {
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
      <CategoryFilter products={serialized} />
    </main>
  )
}
