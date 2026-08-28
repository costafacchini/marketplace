/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { GET } from '@/app/api/products/[id]/route'

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

describe('GET /api/products/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 404 when product is not found', async () => {
    ;(mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/products/unknown-id')
    const res = await GET(req, { params: { id: 'unknown-id' } })

    expect(res.status).toBe(404)
  })

  it('returns 200 with product and price as string when product is found', async () => {
    ;(mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(makeProduct())

    const req = new NextRequest('http://localhost:3000/api/products/prod-1')
    const res = await GET(req, { params: { id: 'prod-1' } })
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.product).toBeDefined()
    expect(json.product.id).toBe('prod-1')
    expect(json.product.price).toBe('29.99')
    expect(typeof json.product.price).toBe('string')
  })
})
