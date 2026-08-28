import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryFilter, SerializedProduct } from '@/components/store/CategoryFilter'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  __esModule: true,
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => ({ get: jest.fn().mockReturnValue(null) }),
}))

// Mock next-intl — returns the last segment of the key
jest.mock('next-intl', () => ({
  __esModule: true,
  useTranslations: () => (key: string) => key,
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}))

// Mock next/link so we can assert rendered anchors
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}))

// Mock SortControl to keep tests focused on filtering logic
jest.mock('@/components/store/SortControl', () => ({
  __esModule: true,
  SortControl: ({ onSort }: { onSort: (s: string) => void }) => (
    <div data-testid="sort-control">
      <button onClick={() => onSort('NAME_ASC')}>Sort by Name</button>
    </div>
  ),
  sortProducts: jest.requireActual('@/components/store/SortControl').sortProducts,
}))

const CLOTHES_PRODUCT: SerializedProduct = {
  id: 'prod-1',
  name: 'Blue T-Shirt',
  category: 'CLOTHES',
  images: ['https://example.com/img1.jpg'],
  originalPrice: '100.00',
  promotionalPrice: null,
}

const LINGERIE_PRODUCT: SerializedProduct = {
  id: 'prod-2',
  name: 'Silk Bra',
  category: 'LINGERIE',
  images: [],
  originalPrice: '80.00',
  promotionalPrice: null,
}

const WORKOUT_PRODUCT: SerializedProduct = {
  id: 'prod-3',
  name: 'Leggings',
  category: 'WORKOUT',
  images: [],
  originalPrice: '120.00',
  promotionalPrice: null,
}

const PROMO_PRODUCT: SerializedProduct = {
  id: 'prod-4',
  name: 'Promo Dress',
  category: 'CLOTHES',
  images: [],
  originalPrice: '200.00',
  promotionalPrice: '140.00',
}

const ALL_PRODUCTS = [CLOTHES_PRODUCT, LINGERIE_PRODUCT, WORKOUT_PRODUCT, PROMO_PRODUCT]

describe('CategoryFilter', () => {
  it('shows all products by default when "all" tab is active', () => {
    render(<CategoryFilter products={ALL_PRODUCTS} />)
    expect(screen.getByText('Blue T-Shirt')).toBeInTheDocument()
    expect(screen.getByText('Silk Bra')).toBeInTheDocument()
    expect(screen.getByText('Leggings')).toBeInTheDocument()
    expect(screen.getByText('Promo Dress')).toBeInTheDocument()
  })

  it('shows only CLOTHES products after clicking the CLOTHES tab', async () => {
    const user = userEvent.setup()
    render(<CategoryFilter products={ALL_PRODUCTS} />)

    await user.click(screen.getByRole('tab', { name: 'clothes' }))

    expect(screen.getByText('Blue T-Shirt')).toBeInTheDocument()
    expect(screen.getByText('Promo Dress')).toBeInTheDocument()
    expect(screen.queryByText('Silk Bra')).not.toBeInTheDocument()
    expect(screen.queryByText('Leggings')).not.toBeInTheDocument()
  })

  it('shows only LINGERIE products after clicking the LINGERIE tab', async () => {
    const user = userEvent.setup()
    render(<CategoryFilter products={ALL_PRODUCTS} />)

    await user.click(screen.getByRole('tab', { name: 'lingerie' }))

    expect(screen.getByText('Silk Bra')).toBeInTheDocument()
    expect(screen.queryByText('Blue T-Shirt')).not.toBeInTheDocument()
    expect(screen.queryByText('Leggings')).not.toBeInTheDocument()
  })

  it('shows only WORKOUT products after clicking the WORKOUT tab', async () => {
    const user = userEvent.setup()
    render(<CategoryFilter products={ALL_PRODUCTS} />)

    await user.click(screen.getByRole('tab', { name: 'workout' }))

    expect(screen.getByText('Leggings')).toBeInTheDocument()
    expect(screen.queryByText('Blue T-Shirt')).not.toBeInTheDocument()
    expect(screen.queryByText('Silk Bra')).not.toBeInTheDocument()
  })

  it('shows the empty-state message when no products are in the selected category', async () => {
    const user = userEvent.setup()
    // Only CLOTHES products, so LINGERIE tab will be empty
    render(<CategoryFilter products={[CLOTHES_PRODUCT]} />)

    await user.click(screen.getByRole('tab', { name: 'lingerie' }))

    expect(screen.getByText('empty')).toBeInTheDocument()
  })
})

describe('ProductCard promo badge', () => {
  it('shows discount badge and promotional price when promotionalPrice is set', () => {
    render(<CategoryFilter products={[PROMO_PRODUCT]} />)

    // 30% OFF: (1 - 140/200) * 100 = 30
    expect(screen.getByText(/30%\s*OFF/i)).toBeInTheDocument()
  })

  it('shows struck-through original price when promotional price is active', () => {
    render(<CategoryFilter products={[PROMO_PRODUCT]} />)
    // Both prices should be shown; original should have line-through style
    const originalPriceEl = screen.getByTestId('original-price-prod-4')
    expect(originalPriceEl).toBeInTheDocument()
    expect(originalPriceEl.className).toContain('line-through')
  })

  it('shows no promo badge when promotionalPrice is null', () => {
    render(<CategoryFilter products={[CLOTHES_PRODUCT]} />)
    expect(screen.queryByText(/OFF/i)).not.toBeInTheDocument()
  })
})
