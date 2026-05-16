import generatedProducts from '../generated/products.json'
import type { Product } from './product-schema'

export type { Product, ProductImageVariant, ProductSize, SizeChartRow } from './product-schema'

export const products = generatedProducts as Product[]

export const productCategories = Array.from(
  new Set(products.map((product) => product.category)),
).sort((left, right) => left.localeCompare(right))

export const productSizes = Array.from(
  new Set(products.flatMap((product) => product.sizes.map((size) => size.label))),
).sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))

export const productPriceRange =
  products.length > 0
    ? products.reduce(
        (range, product) => ({
          min: Math.min(range.min, product.sellingPricePaise),
          max: Math.max(range.max, product.sellingPricePaise),
        }),
        { min: products[0]?.sellingPricePaise ?? 0, max: 0 },
      )
    : { min: 0, max: 0 }

export const featuredProducts = products.filter((product) => product.featured)

export const categoryLabels = Object.fromEntries(
  products.map((product) => [product.category, product.categoryLabel]),
)

export function getProduct(productId: string) {
  return products.find((product) => product.productId === productId)
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug)
}

export function getProductVariant(product: Product, variantId: string) {
  return product.sizes.find((size) => size.variantId === variantId)
}
