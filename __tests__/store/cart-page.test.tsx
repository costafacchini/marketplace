import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('next-intl', () => ({
  useTranslations: (ns: string) => (key: string) => `${ns}.${key}`,
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
}))

jest.mock('next/image', () =>
  function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} />
  }
)

const mockClear = jest.fn()
const mockRemoveItem = jest.fn()
const mockUpdateQty = jest.fn()

const mockItems = [
  { productId: '1', name: 'Camiseta', size: 'M', price: 50, quantity: 2, image: '/img.jpg' },
  { productId: '2', name: 'Calça', size: 'G', price: 80, quantity: 1, image: '/img2.jpg' },
]

let storeItems: typeof mockItems = []
let mockTotal = 0

jest.mock('@/store/cart', () => ({
  useCartStore: (selector: (state: unknown) => unknown) => {
    const state = {
      items: storeItems,
      removeItem: mockRemoveItem,
      updateQty: mockUpdateQty,
      clear: mockClear,
      total: () => mockTotal,
    }
    return selector(state)
  },
}))

jest.mock('@/lib/whatsapp', () => ({
  buildWhatsAppUrl: () => 'https://wa.me/5511999999999?text=test',
}))

// Import components after mocks are set up
import CartPage from '@/app/(store)/cart/page'

describe('Cart Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    storeItems = []
    mockTotal = 0
  })

  describe('empty cart', () => {
    it('renders the empty message', () => {
      storeItems = []
      render(<CartPage />)
      expect(screen.getByText('store.cart.empty')).toBeInTheDocument()
    })

    it('renders a link back to the store', () => {
      storeItems = []
      render(<CartPage />)
      const link = screen.getByRole('link', { name: 'store.cart.backToStore' })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', '/')
    })
  })

  describe('cart with items', () => {
    beforeEach(() => {
      storeItems = mockItems
      mockTotal = 180
    })

    it('renders the cart title', () => {
      render(<CartPage />)
      expect(screen.getByRole('heading', { name: 'store.cart.title' })).toBeInTheDocument()
    })

    it('renders all item names', () => {
      render(<CartPage />)
      expect(screen.getByText('Camiseta')).toBeInTheDocument()
      expect(screen.getByText('Calça')).toBeInTheDocument()
    })

    it('renders the confirm order button in CartSummary', () => {
      render(<CartPage />)
      expect(screen.getByRole('button', { name: 'store.cart.confirm' })).toBeInTheDocument()
    })
  })
})
