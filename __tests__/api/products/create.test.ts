/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { POST } from '@/app/api/products/route'

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

const validBody = {
  name: 'New Product',
  description: 'A product',
  price: 49.99,
  category: 'LINGERIE',
  sizes: ['S', 'M'],
  images: ['https://example.com/photo.jpg'],
  active: true,
}

const makeCreatedProduct = (overrides = {}) => ({
  id: 'prod-new',
  name: 'New Product',
  description: 'A product',
  price: { toString: () => '49.99' },
  category: 'LINGERIE',
  sizes: ['S', 'M'],
  images: ['https://example.com/photo.jpg'],
  active: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  ...overrides,
})

describe('POST /api/products', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 401 when there is no session', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/products', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('creates a product and returns 201 with valid body and session', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@test.com' } })
    ;(mockPrisma.product.create as jest.Mock).mockResolvedValue(makeCreatedProduct())

    const req = new NextRequest('http://localhost:3000/api/products', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.product).toBeDefined()
    expect(json.product.id).toBe('prod-new')
    expect(json.product.price).toBe('49.99')
    expect(mockPrisma.product.create).toHaveBeenCalledTimes(1)
  })

  it('returns 400 with field errors when body is missing name', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@test.com' } })

    const { name: _name, ...bodyWithoutName } = validBody

    const req = new NextRequest('http://localhost:3000/api/products', {
      method: 'POST',
      body: JSON.stringify(bodyWithoutName),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.errors).toBeDefined()
  })
})
