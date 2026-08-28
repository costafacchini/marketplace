/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/products/route'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

const makeProduct = (overrides = {}) => ({
  id: 'prod-1',
  name: 'Test Product',
  description: 'A test product',
  price: { toString: () => '29.99' },
  category: 'CLOTHES',
  sizes: ['S', 'M', 'L'],
  images: ['https://example.com/img.jpg'],
  active: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
})

describe('GET /api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls prisma with where: { active: true } when ?active=true', async () => {
    const products = [makeProduct()]
    ;(mockPrisma.product.findMany as jest.Mock).mockResolvedValue(products)

    const req = new NextRequest('http://localhost:3000/api/products?active=true')
    const res = await GET(req)
    const json = await res.json()

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true } })
    )
    expect(res.status).toBe(200)
    expect(json.products).toHaveLength(1)
  })

  it('calls prisma with where: { active: true, category: "CLOTHES" } when ?active=true&category=CLOTHES', async () => {
    const products = [makeProduct()]
    ;(mockPrisma.product.findMany as jest.Mock).mockResolvedValue(products)

    const req = new NextRequest(
      'http://localhost:3000/api/products?active=true&category=CLOTHES'
    )
    await GET(req)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { active: true, category: 'CLOTHES' } })
    )
  })

  it('calls prisma with empty where when no params provided', async () => {
    ;(mockPrisma.product.findMany as jest.Mock).mockResolvedValue([])

    const req = new NextRequest('http://localhost:3000/api/products')
    await GET(req)

    expect(mockPrisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it('serializes price as string in response', async () => {
    const products = [makeProduct()]
    ;(mockPrisma.product.findMany as jest.Mock).mockResolvedValue(products)

    const req = new NextRequest('http://localhost:3000/api/products')
    const res = await GET(req)
    const json = await res.json()

    expect(json.products[0].price).toBe('29.99')
    expect(typeof json.products[0].price).toBe('string')
  })
})
