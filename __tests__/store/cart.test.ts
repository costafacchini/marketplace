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

describe('useCartStore — removeItem', () => {
  it('removes the item matching productId+size', () => {
    useCartStore.getState().addItem({ productId: 'p1', name: 'Shirt', size: 'M', price: 50, image: '' })
    useCartStore.getState().addItem({ productId: 'p2', name: 'Pants', size: 'G', price: 80, image: '' })

    useCartStore.getState().removeItem('p1', 'M')

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].productId).toBe('p2')
  })

  it('leaves other items untouched when removing one', () => {
    const base = { productId: 'p1', name: 'Shirt', price: 50, image: '' }
    useCartStore.getState().addItem({ ...base, size: 'M' })
    useCartStore.getState().addItem({ ...base, size: 'G' })

    useCartStore.getState().removeItem('p1', 'M')

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].size).toBe('G')
  })
})

describe('useCartStore — updateQty', () => {
  it('updates the quantity for the matching productId+size', () => {
    useCartStore.getState().addItem({ productId: 'p1', name: 'Shirt', size: 'M', price: 50, image: '' })

    useCartStore.getState().updateQty('p1', 'M', 5)

    const { items } = useCartStore.getState()
    expect(items[0].quantity).toBe(5)
  })

  it('does not affect other items', () => {
    useCartStore.getState().addItem({ productId: 'p1', name: 'Shirt', size: 'M', price: 50, image: '' })
    useCartStore.getState().addItem({ productId: 'p2', name: 'Pants', size: 'G', price: 80, image: '' })

    useCartStore.getState().updateQty('p1', 'M', 3)

    const { items } = useCartStore.getState()
    const p2 = items.find((i) => i.productId === 'p2')
    expect(p2?.quantity).toBe(1)
  })

  it('removes the item when qty is 0', () => {
    useCartStore.getState().addItem({ productId: 'p1', name: 'Shirt', size: 'M', price: 50, image: '' })

    useCartStore.getState().updateQty('p1', 'M', 0)

    expect(useCartStore.getState().items).toHaveLength(0)
  })

  it('removes the item when qty is negative', () => {
    useCartStore.getState().addItem({ productId: 'p1', name: 'Shirt', size: 'M', price: 50, image: '' })
    useCartStore.getState().addItem({ productId: 'p2', name: 'Pants', size: 'G', price: 80, image: '' })

    useCartStore.getState().updateQty('p1', 'M', -1)

    const { items } = useCartStore.getState()
    expect(items).toHaveLength(1)
    expect(items[0].productId).toBe('p2')
  })
})

describe('useCartStore — clear', () => {
  it('empties the cart', () => {
    useCartStore.getState().addItem({ productId: 'p1', name: 'Shirt', size: 'M', price: 50, image: '' })
    useCartStore.getState().addItem({ productId: 'p2', name: 'Pants', size: 'G', price: 80, image: '' })

    useCartStore.getState().clear()

    expect(useCartStore.getState().items).toHaveLength(0)
  })
})

describe('useCartStore — total', () => {
  it('returns 0 for an empty cart', () => {
    expect(useCartStore.getState().total()).toBe(0)
  })

  it('sums price × quantity for all items', () => {
    useCartStore.getState().addItem({ productId: 'p1', name: 'Shirt', size: 'M', price: 50, image: '' })
    useCartStore.getState().addItem({ productId: 'p2', name: 'Pants', size: 'G', price: 80, image: '' })
    useCartStore.getState().updateQty('p1', 'M', 2)

    // 50 × 2 + 80 × 1 = 180
    expect(useCartStore.getState().total()).toBe(180)
  })
})
