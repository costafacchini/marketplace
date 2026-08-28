import { z } from 'zod'

const priceListBaseSchema = z.object({
  name: z.string().min(1).max(200),
  discountPct: z.number().min(0.01).max(100).multipleOf(0.01),
  startsAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
  active: z.boolean().optional().default(true),
  categories: z.array(z.enum(['CLOTHES', 'LINGERIE', 'WORKOUT'])).optional().default([]),
  productIds: z.array(z.string()).optional().default([]),
  itemOverrides: z.record(z.string(), z.number().min(0).max(100)).optional().default({}),
})

export const priceListCreateSchema = priceListBaseSchema.refine(
  data => new Date(data.expiresAt) > new Date(data.startsAt),
  { message: 'expiresAt must be after startsAt', path: ['expiresAt'] }
)

export const priceListUpdateSchema = priceListBaseSchema.partial()

export type PriceListCreateInput = z.infer<typeof priceListCreateSchema>
export type PriceListUpdateInput = z.infer<typeof priceListUpdateSchema>
