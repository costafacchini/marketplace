import { useCartStore, CART_STORAGE_KEY } from '@/store/cart'

beforeEach(() => {
  useCartStore.setState({ items: [] })
})

describe('useCartStore — addItem', () => {
  it('adds a new item with quantity 1', () => {
    useCartStore.getState().addItem({
      productId: 'prod-1',
      name: 'Test Shirt',
      size: 'M',
      price: 49.9,
      image: '/img.jpg',
    })

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

  it('increments quantity when same productId+size added again', () => {
    const item = { productId: 'prod-1', name: 'Test Shirt', size: 'M', price: 49.9, image: '/img.jpg' }
    useCartStore.getState().addItem(item)
    useCartStore.getState().addItem(item)

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('does NOT merge items with same productId but different size', () => {
    const base = { productId: 'prod-1', name: 'Test Shirt', price: 49.9, image: '/img.jpg' }
    useCartStore.getState().addItem({ ...base, size: 'M' })
    useCartStore.getState().addItem({ ...base, size: 'G' })

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(2)
  })

  it('stores items under the SDD-specified localStorage key', () => {
    // The exported constant must match the SDD specification.
    expect(CART_STORAGE_KEY).toBe('small-business-seller-cart')
  })
})
