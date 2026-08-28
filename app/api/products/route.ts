import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { productCreateSchema } from '@/lib/validations/product'
import { Category } from '@prisma/client'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl

  const where: {
    active?: boolean
    category?: Category
  } = {}

  const activeParam = searchParams.get('active')
  if (activeParam === 'true') {
    where.active = true
  } else if (activeParam === 'false') {
    where.active = false
  }

  const categoryParam = searchParams.get('category')
  if (categoryParam && Object.values(Category).includes(categoryParam as Category)) {
    where.category = categoryParam as Category
  }

  const products = await prisma.product.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({
    products: products.map((p) => ({ ...p, price: p.price.toString() })),
  })
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

  const result = productCreateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { errors: result.error.format() },
      { status: 400 }
    )
  }

  const product = await prisma.product.create({
    data: result.data,
  })

  return NextResponse.json(
    { product: { ...product, price: product.price.toString() } },
    { status: 201 }
  )
}
