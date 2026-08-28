import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { productUpdateSchema } from '@/lib/validations/product'

type RouteContext = { params: { id: string } }

export async function GET(
  _req: NextRequest,
  { params }: RouteContext
) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
  })

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    product: { ...product, price: product.price.toString() },
  })
}

export async function PUT(
  req: NextRequest,
  { params }: RouteContext
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.product.findUnique({
    where: { id: params.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = productUpdateSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { errors: result.error.format() },
      { status: 400 }
    )
  }

  const updated = await prisma.product.update({
    where: { id: params.id },
    data: result.data,
  })

  return NextResponse.json({
    product: { ...updated, price: updated.price.toString() },
  })
}
