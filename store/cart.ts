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
    }),
    { name: CART_STORAGE_KEY }
  )
)
