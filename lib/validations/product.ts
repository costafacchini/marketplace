import { z } from 'zod'

export const productCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive().multipleOf(0.01),
  category: z.enum(['CLOTHES', 'LINGERIE', 'WORKOUT']),
  sizes: z.array(z.string().min(1)).min(1),
  images: z.array(z.string().url()).min(1),
  active: z.boolean().optional().default(true),
})

export const productUpdateSchema = productCreateSchema.partial()

export type ProductCreateInput = z.infer<typeof productCreateSchema>
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>
