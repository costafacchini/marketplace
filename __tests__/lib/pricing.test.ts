import { Decimal } from '@prisma/client'
import { resolvePrice, getActivePriceLists, ActivePriceList } from '@/lib/pricing'
import { prisma } from '@/lib/prisma'
import { Category } from '@prisma/client'

jest.mock('@/lib/prisma', () => ({
  prisma: {
    priceList: {
      findMany: jest.fn(),
    },
  },
}))

const mockPrisma = prisma as jest.Mocked<typeof prisma>

function dec(val: string | number): Decimal {
  return new Decimal(String(val))
}

function makeList(overrides: Partial<ActivePriceList> = {}): ActivePriceList {
  return {
    id: 'list-1',
    discountPct: dec(20),
    createdAt: new Date('2026-08-01'),
    categories: [],
    items: [],
    ...overrides,
  }
}

describe('resolvePrice()', () => {
  const price100 = dec(100)

  it('applies item-level discount when product is in list.items', () => {
    const list = makeList({
      categories: [Category.CLOTHES],
      items: [{ productId: 'prod-1', discountPct: dec(30) }],
    })
    const result = resolvePrice('prod-1', Category.CLOTHES, price100, [list])
    expect(result?.toFixed(2)).toBe('70.00')
  })

  it('item override wins over list.discountPct when both would apply', () => {
    const list = makeList({
      discountPct: dec(20),
      categories: [Category.CLOTHES],
      items: [{ productId: 'prod-1', discountPct: dec(30) }],
    })
    // item discount (30%) should win over category discount (20%)
    const result = resolvePrice('prod-1', Category.CLOTHES, price100, [list])
    expect(result?.toFixed(2)).toBe('70.00')
  })

  it('first list in array wins when two lists cover the same product', () => {
    // Array is sorted createdAt DESC, so first element is most recent
    const newerList = makeList({
      id: 'list-newer',
      discountPct: dec(25),
      createdAt: new Date('2026-08-10'),
      items: [{ productId: 'prod-1', discountPct: null }],
    })
    const olderList = makeList({
      id: 'list-older',
      discountPct: dec(10),
      createdAt: new Date('2026-08-01'),
      items: [{ productId: 'prod-1', discountPct: null }],
    })
    const result = resolvePrice('prod-1', Category.CLOTHES, price100, [newerList, olderList])
    expect(result?.toFixed(2)).toBe('75.00')
  })

  it('returns null when product is not in any active list', () => {
    const list = makeList({
      categories: [Category.LINGERIE],
      items: [],
    })
    const result = resolvePrice('prod-999', Category.CLOTHES, price100, [list])
    expect(result).toBeNull()
  })

  it('applies category discount when no product-level item exists', () => {
    const list = makeList({
      discountPct: dec(15),
      categories: [Category.WORKOUT],
      items: [],
    })
    const result = resolvePrice('prod-1', Category.WORKOUT, price100, [list])
    expect(result?.toFixed(2)).toBe('85.00')
  })

  it('applyDiscount(100, 20) returns 80.00', () => {
    const list = makeList({ discountPct: dec(20), categories: [Category.CLOTHES] })
    const result = resolvePrice('prod-1', Category.CLOTHES, dec(100), [list])
    expect(result?.toFixed(2)).toBe('80.00')
  })

  it('uses item override discountPct instead of list.discountPct', () => {
    const list = makeList({
      discountPct: dec(10),
      items: [{ productId: 'prod-1', discountPct: dec(50) }],
    })
    const result = resolvePrice('prod-1', Category.CLOTHES, price100, [list])
    expect(result?.toFixed(2)).toBe('50.00')
  })

  it('uses list.discountPct when item discountPct is null', () => {
    const list = makeList({
      discountPct: dec(20),
      items: [{ productId: 'prod-1', discountPct: null }],
    })
    const result = resolvePrice('prod-1', Category.CLOTHES, price100, [list])
    expect(result?.toFixed(2)).toBe('80.00')
  })
})

describe('getActivePriceLists()', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('calls prisma.priceList.findMany with correct active + date where clause', async () => {
    const mockFindMany = mockPrisma.priceList.findMany as jest.Mock
    mockFindMany.mockResolvedValue([])

    await getActivePriceLists()

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          active: true,
          startsAt: expect.objectContaining({ lte: expect.any(Date) }),
          expiresAt: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      })
    )
  })

  it('returns the result from prisma.priceList.findMany', async () => {
    const mockList = [makeList()]
    const mockFindMany = mockPrisma.priceList.findMany as jest.Mock
    mockFindMany.mockResolvedValue(mockList)

    const result = await getActivePriceLists()
    expect(result).toEqual(mockList)
  })
})
