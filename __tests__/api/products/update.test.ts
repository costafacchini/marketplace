/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { PUT } from '@/app/api/products/[id]/route'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
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

const mockGetServerSession = getServerSession as jest.Mock
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

describe('PUT /api/products/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/products/prod-1', {
      method: 'PUT',
      body: JSON.stringify({ active: false }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PUT(req, { params: { id: 'prod-1' } })
    expect(res.status).toBe(401)
  })

  it('soft-deletes product by setting active: false', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@test.com' } })
    ;(mockPrisma.product.findUnique as jest.Mock).mockResolvedValue(makeProduct())
    ;(mockPrisma.product.update as jest.Mock).mockResolvedValue(makeProduct({ active: false }))

    const req = new NextRequest('http://localhost:3000/api/products/prod-1', {
      method: 'PUT',
      body: JSON.stringify({ active: false }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await PUT(req, { params: { id: 'prod-1' } })
    expect(res.status).toBe(200)

    expect(mockPrisma.product.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'prod-1' },
        data: expect.objectContaining({ active: false }),
      })
    )
  })
})
