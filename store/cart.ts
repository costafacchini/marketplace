import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const CART_STORAGE_KEY = 'small-business-seller-cart'

export interface CartItem {
  productId: string
  name: string
  size: string
  price: number
  quantity: number
  image: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string, size: string) => void
  updateQty: (productId: string, size: string, qty: number) => void
  clear: () => void
  total: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find(
          (i) => i.productId === item.productId && i.size === item.size
        )
        if (existing) {
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === item.productId && i.size === item.size
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          }))
        } else {
          set((state) => ({ items: [...state.items, { ...item, quantity: 1 }] }))
        }
      },
      removeItem: (productId, size) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.productId === productId && i.size === size)
          ),
        }))
      },
      updateQty: (productId, size, qty) => {
        if (qty <= 0) {
          set((state) => ({
            items: state.items.filter(
              (i) => !(i.productId === productId && i.size === size)
            ),
          }))
        } else {
          set((state) => ({
            items: state.items.map((i) =>
              i.productId === productId && i.size === size ? { ...i, quantity: qty } : i
            ),
          }))
        }
      },
      clear: () => set({ items: [] }),
      total: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: CART_STORAGE_KEY }
  )
)
