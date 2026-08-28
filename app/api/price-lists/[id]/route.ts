import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { priceListUpdateSchema } from '@/lib/validations/pricelist'

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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const priceList = await prisma.priceList.findUnique({
    where: { id: params.id },
    include: { items: { select: { productId: true, discountPct: true } } },
  })

  if (!priceList) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ priceList: serializePriceList(priceList as unknown as Record<string, unknown>) })
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

  const result = priceListUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 })
  }

  const { name, discountPct, startsAt, expiresAt, active, categories, productIds, itemOverrides } = result.data

  const itemsToCreate: Array<{ productId: string; discountPct: number | null }> = []

  if (productIds !== undefined || itemOverrides !== undefined) {
    const ids = productIds ?? []
    const overrides = itemOverrides ?? {}

    for (const productId of ids) {
      itemsToCreate.push({
        productId,
        discountPct: productId in overrides ? overrides[productId] : null,
      })
    }

    for (const [productId, pct] of Object.entries(overrides)) {
      if (!ids.includes(productId)) {
        itemsToCreate.push({ productId, discountPct: pct })
      }
    }
  }

  const priceList = await prisma.$transaction(async tx => {
    if (productIds !== undefined || itemOverrides !== undefined) {
      await tx.priceListItem.deleteMany({ where: { priceListId: params.id } })
    }

    return tx.priceList.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(discountPct !== undefined && { discountPct }),
        ...(startsAt !== undefined && { startsAt: new Date(startsAt) }),
        ...(expiresAt !== undefined && { expiresAt: new Date(expiresAt) }),
        ...(active !== undefined && { active }),
        ...(categories !== undefined && { categories }),
        ...((productIds !== undefined || itemOverrides !== undefined) && {
          items: { create: itemsToCreate },
        }),
      },
      include: { items: { select: { productId: true, discountPct: true } } },
    })
  })

  return NextResponse.json({ priceList: serializePriceList(priceList as unknown as Record<string, unknown>) })
}
