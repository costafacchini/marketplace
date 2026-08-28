/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'

jest.mock('next-auth', () => ({ getServerSession: jest.fn() }))
jest.mock('@/lib/auth', () => ({ authOptions: {} }))
jest.mock('@/lib/prisma', () => ({
  prisma: {
    priceList: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    priceListItem: { deleteMany: jest.fn() },
    $transaction: jest.fn(),
  },
}))

const mockGetServerSession = getServerSession as jest.Mock
const mockPrismaCreate = (prisma.priceList.create as jest.Mock)

// Lazy import route after mocks are set
let POST: (req: NextRequest) => Promise<Response>
let GET: (req: NextRequest) => Promise<Response>

beforeAll(async () => {
  const mod = await import('@/app/api/price-lists/route')
  POST = mod.POST
  GET = mod.GET
})

beforeEach(() => {
  jest.clearAllMocks()
})

const validBody = {
  name: 'Summer Sale',
  discountPct: 20,
  startsAt: '2026-08-01T00:00:00.000Z',
  expiresAt: '2026-08-31T23:59:59.000Z',
  active: true,
  categories: ['CLOTHES'],
  productIds: [],
  itemOverrides: {},
}

describe('POST /api/price-lists', () => {
  it('returns 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/price-lists', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 201 with created price list when session is valid', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@test.com' } })

    const created = {
      id: 'list-1',
      ...validBody,
      discountPct: '20.00',
      startsAt: new Date(validBody.startsAt),
      expiresAt: new Date(validBody.expiresAt),
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    }
    mockPrismaCreate.mockResolvedValue(created)

    const req = new NextRequest('http://localhost:3000/api/price-lists', {
      method: 'POST',
      body: JSON.stringify(validBody),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(201)

    const body = await res.json()
    expect(body).toHaveProperty('priceList')
    expect(body.priceList.name).toBe('Summer Sale')
  })

  it('returns 400 when expiresAt is before startsAt', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@test.com' } })

    const invalidBody = {
      ...validBody,
      startsAt: '2026-09-01T00:00:00.000Z',
      expiresAt: '2026-08-01T00:00:00.000Z',
    }

    const req = new NextRequest('http://localhost:3000/api/price-lists', {
      method: 'POST',
      body: JSON.stringify(invalidBody),
      headers: { 'content-type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/price-lists', () => {
  it('returns all price lists', async () => {
    const mockFindMany = prisma.priceList.findMany as jest.Mock
    mockFindMany.mockResolvedValue([])

    const req = new NextRequest('http://localhost:3000/api/price-lists')
    const res = await GET(req)

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('priceLists')
    expect(Array.isArray(body.priceLists)).toBe(true)
  })
})
