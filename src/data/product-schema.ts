import { z } from 'zod'

export const productSizeSchema = z.object({
  variantId: z.string().min(1),
  label: z.string().min(1),
  stockAvailable: z.number().int().min(0),
  active: z.boolean().default(true),
})

export const sizeChartRowSchema = z.object({
  size: z.string().min(1),
  measurements: z.record(z.string(), z.string().min(1)),
})

export const productSchema = z.object({
  productId: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  images: z.array(z.string().min(1)).min(1),
  imageStoragePaths: z.array(z.string().min(1)).min(1),
  mrpPaise: z.number().int().positive(),
  sellingPricePaise: z.number().int().positive(),
  discountPercent: z.number().min(0).max(100),
  sizes: z.array(productSizeSchema).min(1),
  stockAvailable: z.number().int().min(0),
  description: z.string().min(1),
  sizeChart: z.array(sizeChartRowSchema),
  category: z.string().min(1),
  categoryLabel: z.string().min(1),
  imageAlt: z.string().min(1),
  featured: z.boolean().default(false),
  active: z.boolean().default(true),
})

export const productCatalogSchema = z.array(productSchema)

export type Product = z.infer<typeof productSchema>
export type ProductSize = z.infer<typeof productSizeSchema>
export type SizeChartRow = z.infer<typeof sizeChartRowSchema>
