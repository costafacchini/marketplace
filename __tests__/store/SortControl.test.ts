// Mock next-intl (ESM package) before importing anything that depends on it
jest.mock('next-intl', () => ({
  __esModule: true,
  useTranslations: () => (key: string) => key,
}))

import { sortProducts } from '@/components/store/SortControl'
import { SerializedProduct } from '@/components/store/CategoryFilter'

function makeProduct(
  overrides: Partial<SerializedProduct> & Pick<SerializedProduct, 'id' | 'name'>
): SerializedProduct {
  return {
    category: 'CLOTHES',
    images: [],
    originalPrice: '100.00',
    promotionalPrice: null,
    ...overrides,
  }
}

describe('sortProducts()', () => {
  it('PROMO_FIRST: promotional products appear before non-promotional', () => {
    const products = [
      makeProduct({ id: '1', name: 'Alpha', promotionalPrice: null }),
      makeProduct({ id: '2', name: 'Beta', promotionalPrice: '80.00' }),
      makeProduct({ id: '3', name: 'Gamma', promotionalPrice: null }),
      makeProduct({ id: '4', name: 'Delta', promotionalPrice: '60.00' }),
    ]
    const sorted = sortProducts(products, 'PROMO_FIRST')
    // All promos come first
    expect(sorted[0].promotionalPrice).not.toBeNull()
    expect(sorted[1].promotionalPrice).not.toBeNull()
    expect(sorted[2].promotionalPrice).toBeNull()
    expect(sorted[3].promotionalPrice).toBeNull()
  })

  it('PRICE_ASC: sorts by effective price (promotional when available, original otherwise)', () => {
    const products = [
      makeProduct({ id: '1', name: 'Expensive', originalPrice: '200.00', promotionalPrice: null }),
      makeProduct({ id: '2', name: 'Cheap Promo', originalPrice: '150.00', promotionalPrice: '50.00' }),
      makeProduct({ id: '3', name: 'Mid', originalPrice: '100.00', promotionalPrice: null }),
      makeProduct({ id: '4', name: 'Pricey Promo', originalPrice: '300.00', promotionalPrice: '120.00' }),
    ]
    const sorted = sortProducts(products, 'PRICE_ASC')
    const prices = sorted.map(p => Number(p.promotionalPrice ?? p.originalPrice))
    expect(prices).toEqual([50, 100, 120, 200])
  })

  it('NAME_ASC: sorts alphabetically by name using pt-BR locale', () => {
    const products = [
      makeProduct({ id: '1', name: 'Zebra' }),
      makeProduct({ id: '2', name: 'Árvore' }),
      makeProduct({ id: '3', name: 'Maca' }),
    ]
    const sorted = sortProducts(products, 'NAME_ASC')
    expect(sorted.map(p => p.name)).toEqual(['Árvore', 'Maca', 'Zebra'])
  })

  it('does not mutate the original array', () => {
    const products = [
      makeProduct({ id: '1', name: 'B', originalPrice: '200.00' }),
      makeProduct({ id: '2', name: 'A', originalPrice: '100.00' }),
    ]
    const original = [...products]
    sortProducts(products, 'NAME_ASC')
    expect(products).toEqual(original)
  })
})
