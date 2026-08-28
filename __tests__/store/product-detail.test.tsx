import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AddToCartButton } from '@/components/store/AddToCartButton'
import { useCartStore } from '@/store/cart'

// Mock next-intl: useTranslations returns a function that echoes the key
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock SizePicker to isolate AddToCartButton logic (optional — we use real one)
// We let the real SizePicker render so the size buttons are visible.

const defaultProps = {
  productId: 'prod-1',
  name: 'Test Shirt',
  price: 49.9,
  image: '/img.jpg',
  sizes: ['P', 'M', 'G'],
}

beforeEach(() => {
  useCartStore.setState({ items: [] })
})

describe('AddToCartButton', () => {
  it('renders size buttons from the sizes prop', () => {
    render(<AddToCartButton {...defaultProps} />)
    expect(screen.getByText('P')).toBeInTheDocument()
    expect(screen.getByText('M')).toBeInTheDocument()
    expect(screen.getByText('G')).toBeInTheDocument()
  })

  it('shows sizeRequired error when "addToCart" is clicked without selecting a size', () => {
    render(<AddToCartButton {...defaultProps} />)
    fireEvent.click(screen.getByText('addToCart'))
    expect(screen.getByText('sizeRequired')).toBeInTheDocument()
  })

  it('calls addItem with correct args when a size is selected then button clicked', () => {
    render(<AddToCartButton {...defaultProps} />)

    // Select size M
    fireEvent.click(screen.getByText('M'))
    // Click add-to-cart
    fireEvent.click(screen.getByText('addToCart'))

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      productId: 'prod-1',
      name: 'Test Shirt',
      size: 'M',
      price: 49.9,
      image: '/img.jpg',
      quantity: 1,
    })
  })

  it('does not show error when a size has been selected', () => {
    render(<AddToCartButton {...defaultProps} />)

    fireEvent.click(screen.getByText('M'))
    fireEvent.click(screen.getByText('addToCart'))

    expect(screen.queryByText('sizeRequired')).not.toBeInTheDocument()
  })

  it('increments quantity when the same product+size is added twice via store', () => {
    useCartStore.getState().addItem({ productId: 'prod-1', name: 'Test Shirt', size: 'M', price: 49.9, image: '/img.jpg' })
    useCartStore.getState().addItem({ productId: 'prod-1', name: 'Test Shirt', size: 'M', price: 49.9, image: '/img.jpg' })

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })
})
