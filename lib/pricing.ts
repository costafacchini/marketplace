import { prisma } from '@/lib/prisma'
import { Category, Prisma } from '@prisma/client'

const { Decimal } = Prisma

export interface ActivePriceList {
  id: string
  discountPct: Prisma.Decimal
  createdAt: Date
  categories: Category[]
  items: Array<{ productId: string; discountPct: Prisma.Decimal | null }>
}

export async function getActivePriceLists(): Promise<ActivePriceList[]> {
  const now = new Date()
  return prisma.priceList.findMany({
    where: {
      active: true,
      startsAt: { lte: now },
      expiresAt: { gte: now },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      discountPct: true,
      createdAt: true,
      categories: true,
      items: { select: { productId: true, discountPct: true } },
    },
  })
}

export function resolvePrice(
  productId: string,
  category: Category,
  originalPrice: Prisma.Decimal,
  activeLists: ActivePriceList[]
): Prisma.Decimal | null {
  for (const list of activeLists) {
    const item = list.items.find(i => i.productId === productId)
    if (item) {
      const pct = item.discountPct ?? list.discountPct
      return applyDiscount(originalPrice, pct)
    }
    if (list.categories.includes(category)) {
      return applyDiscount(originalPrice, list.discountPct)
    }
  }
  return null
}

function applyDiscount(price: Prisma.Decimal, discountPct: Prisma.Decimal): Prisma.Decimal {
  const factor = new Decimal(1).minus(discountPct.div(100))
  return price.times(factor).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
}
