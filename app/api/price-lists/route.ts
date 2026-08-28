import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { priceListCreateSchema } from '@/lib/validations/pricelist'

function serializePriceList(priceList: Record<string, unknown>): Record<string, unknown> {
  return {
    ...priceList,
    discountPct: priceList.discountPct?.toString(),
    items: Array.isArray(priceList.items)
      ? (priceList.items as Array<Record<string, unknown>>).map(item => ({
          ...item,
          discountPct: item.discountPct != null ? item.discountPct.toString() : null,
        }))
      : [],
  }
}

export async function GET() {
  const lists = await prisma.priceList.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: { select: { productId: true, discountPct: true } } },
  })
  return NextResponse.json({ priceLists: lists.map(l => serializePriceList(l as unknown as Record<string, unknown>)) })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = priceListCreateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const { name, discountPct, startsAt, expiresAt, active, categories, productIds, itemOverrides } = result.data

  const itemsToCreate = [
    ...productIds.map(productId => ({
      productId,
      discountPct: productId in itemOverrides ? itemOverrides[productId] : null,
    })),
    ...Object.entries(itemOverrides)
      .filter(([productId]) => !productIds.includes(productId))
      .map(([productId, pct]) => ({ productId, discountPct: pct })),
  ]

  const priceList = await prisma.priceList.create({
    data: {
      name,
      discountPct,
      startsAt: new Date(startsAt),
      expiresAt: new Date(expiresAt),
      active,
      categories,
      items: {
        create: itemsToCreate,
      },
    },
    include: { items: { select: { productId: true, discountPct: true } } },
  })

  return NextResponse.json(
    { priceList: serializePriceList(priceList as unknown as Record<string, unknown>) },
    { status: 201 }
  )
}
