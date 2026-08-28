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
const mockTransaction = prisma.$transaction as jest.Mock

let PUT: (req: NextRequest, ctx: { params: { id: string } }) => Promise<Response>
let GET_ONE: (req: NextRequest, ctx: { params: { id: string } }) => Promise<Response>

beforeAll(async () => {
  const mod = await import('@/app/api/price-lists/[id]/route')
  PUT = mod.PUT
  GET_ONE = mod.GET
})

beforeEach(() => {
  jest.clearAllMocks()
})

const validUpdateBody = {
  name: 'Updated Sale',
  discountPct: 25,
  startsAt: '2026-08-01T00:00:00.000Z',
  expiresAt: '2026-08-31T23:59:59.000Z',
  active: true,
  categories: ['CLOTHES'],
  productIds: [],
  itemOverrides: {},
}

describe('PUT /api/price-lists/[id]', () => {
  it('returns 401 when no session', async () => {
    mockGetServerSession.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/price-lists/list-1', {
      method: 'PUT',
      body: JSON.stringify(validUpdateBody),
      headers: { 'content-type': 'application/json' },
    })

    const res = await PUT(req, { params: { id: 'list-1' } })
    expect(res.status).toBe(401)
  })

  it('calls prisma.$transaction when updating with valid body and session', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@test.com' } })

    const updated = {
      id: 'list-1',
      ...validUpdateBody,
      discountPct: '25.00',
      startsAt: new Date(validUpdateBody.startsAt),
      expiresAt: new Date(validUpdateBody.expiresAt),
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    }
    mockTransaction.mockResolvedValue(updated)

    const req = new NextRequest('http://localhost:3000/api/price-lists/list-1', {
      method: 'PUT',
      body: JSON.stringify(validUpdateBody),
      headers: { 'content-type': 'application/json' },
    })

    const res = await PUT(req, { params: { id: 'list-1' } })
    expect(res.status).toBe(200)
    expect(mockTransaction).toHaveBeenCalledTimes(1)
  })

  it('marks list inactive when active: false is sent', async () => {
    mockGetServerSession.mockResolvedValue({ user: { email: 'admin@test.com' } })

    const updated = {
      id: 'list-1',
      ...validUpdateBody,
      active: false,
      discountPct: '25.00',
      startsAt: new Date(validUpdateBody.startsAt),
      expiresAt: new Date(validUpdateBody.expiresAt),
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    }
    mockTransaction.mockResolvedValue(updated)

    const req = new NextRequest('http://localhost:3000/api/price-lists/list-1', {
      method: 'PUT',
      body: JSON.stringify({ active: false }),
      headers: { 'content-type': 'application/json' },
    })

    const res = await PUT(req, { params: { id: 'list-1' } })
    expect(res.status).toBe(200)
    expect(mockTransaction).toHaveBeenCalledTimes(1)

    const body = await res.json()
    expect(body.priceList.active).toBe(false)
  })
})

describe('GET /api/price-lists/[id]', () => {
  it('returns 404 when price list is not found', async () => {
    const mockFindUnique = prisma.priceList.findUnique as jest.Mock
    mockFindUnique.mockResolvedValue(null)

    const req = new NextRequest('http://localhost:3000/api/price-lists/nonexistent')
    const res = await GET_ONE(req, { params: { id: 'nonexistent' } })

    expect(res.status).toBe(404)
  })

  it('returns the price list when found', async () => {
    const mockFindUnique = prisma.priceList.findUnique as jest.Mock
    const found = {
      id: 'list-1',
      name: 'Sale',
      discountPct: '20.00',
      startsAt: new Date(),
      expiresAt: new Date(),
      active: true,
      categories: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      items: [],
    }
    mockFindUnique.mockResolvedValue(found)

    const req = new NextRequest('http://localhost:3000/api/price-lists/list-1')
    const res = await GET_ONE(req, { params: { id: 'list-1' } })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.priceList.id).toBe('list-1')
  })
})
