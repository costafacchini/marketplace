import { Category } from '@prisma/client'
export type { Category }

export interface ProductListItem {
  id: string
  name: string
  price: string // serialized Decimal
  category: Category
  images: string[]
  active: boolean
}
