import { create, insertMultiple, search } from '@orama/orama'

import type { Product } from './product-schema'
import { products } from './products'

export type ProductSort = 'recommended' | 'price-asc' | 'price-desc' | 'discount-desc'

export type ProductSearchInput = {
  query: string
  category: string
  sort: ProductSort
  sizes: string[]
  minPrice?: number
  maxPrice?: number
  inStockOnly: boolean
  saleOnly: boolean
}

export type ProductSearchResult = {
  products: Product[]
  count: number
  elapsed?: string
}

export type ProductCategoryCounts = Record<string, number>

type ProductSearchDocument = {
  productId: string
  title: string
  description: string
  category: string
  categoryLabel: string
  sizes: string
  sellingPricePaise: number
  mrpPaise: number
  discountPercent: number
  featured: boolean
  stockAvailable: number
}

type ProductSearchIndex = Awaited<ReturnType<typeof createProductSearchIndex>>

const productById = new Map(products.map((product) => [product.productId, product]))
let indexPromise: Promise<ProductSearchIndex> | undefined

export async function searchProducts(input: ProductSearchInput): Promise<ProductSearchResult> {
  const query = input.query.trim()
  const where = input.category === 'all' ? undefined : { category: input.category }
  const filterProduct = createProductFilter(input)

  if (!query) {
    const filteredProducts = products.filter(filterProduct)

    return {
      products: sortProducts(filteredProducts, input.sort),
      count: filteredProducts.length,
    }
  }

  const db = await getProductSearchIndex()
  const result = await search(db, {
    term: query,
    properties: ['title', 'description', 'categoryLabel', 'sizes'],
    boost: {
      title: 4,
      categoryLabel: 2,
      sizes: 1.2,
    },
    tolerance: query.length > 3 ? 1 : 0,
    threshold: 0,
    where,
    limit: products.length,
  })

  const matchedProducts = result.hits
    .map((hit) => productById.get(hit.document.productId))
    .filter((product): product is Product => Boolean(product))
    .filter(filterProduct)

  return {
    products: sortProducts(matchedProducts, input.sort, query),
    count: matchedProducts.length,
    elapsed: result.elapsed.formatted,
  }
}

export function getCategoryCounts(items: Product[]): ProductCategoryCounts {
  const counts: ProductCategoryCounts = {}

  for (const product of items) {
    counts[product.category] = (counts[product.category] ?? 0) + 1
  }

  return counts
}

function getProductSearchIndex() {
  indexPromise ??= createProductSearchIndex()
  return indexPromise
}

async function createProductSearchIndex() {
  const db = create({
    schema: {
      productId: 'string',
      title: 'string',
      description: 'string',
      category: 'string',
      categoryLabel: 'string',
      sizes: 'string',
      sellingPricePaise: 'number',
      mrpPaise: 'number',
      discountPercent: 'number',
      featured: 'boolean',
      stockAvailable: 'number',
    },
    sort: {
      enabled: true,
      unsortableProperties: [
        'productId',
        'title',
        'description',
        'category',
        'categoryLabel',
        'sizes',
      ],
    },
  })

  await insertMultiple(db, products.map(toSearchDocument))

  return db
}

function toSearchDocument(product: Product): ProductSearchDocument {
  return {
    productId: product.productId,
    title: product.title,
    description: product.description,
    category: product.category,
    categoryLabel: product.categoryLabel,
    sizes: product.sizes.map((size) => size.label).join(' '),
    sellingPricePaise: product.sellingPricePaise,
    mrpPaise: product.mrpPaise,
    discountPercent: product.discountPercent,
    featured: product.featured,
    stockAvailable: product.stockAvailable,
  }
}

function sortProducts(items: Product[], sort: ProductSort, query = '') {
  const productsToSort = [...items]

  if (sort === 'price-asc') {
    return productsToSort.sort((left, right) => left.sellingPricePaise - right.sellingPricePaise)
  }

  if (sort === 'price-desc') {
    return productsToSort.sort((left, right) => right.sellingPricePaise - left.sellingPricePaise)
  }

  if (sort === 'discount-desc') {
    return productsToSort.sort(
      (left, right) =>
        right.discountPercent - left.discountPercent ||
        left.sellingPricePaise - right.sellingPricePaise,
    )
  }

  if (!query) {
    return productsToSort.sort(
      (left, right) =>
        Number(right.featured) - Number(left.featured) ||
        left.title.localeCompare(right.title),
    )
  }

  return productsToSort
}

function createProductFilter(input: ProductSearchInput) {
  const sizeSet = new Set(input.sizes)

  return (product: Product) => {
    if (input.category !== 'all' && product.category !== input.category) return false
    if (input.saleOnly && product.discountPercent <= 0) return false
    if (input.inStockOnly && product.stockAvailable < 1) return false
    if (input.minPrice !== undefined && product.sellingPricePaise < input.minPrice) return false
    if (input.maxPrice !== undefined && product.sellingPricePaise > input.maxPrice) return false

    if (sizeSet.size > 0) {
      return product.sizes.some((size) => size.stockAvailable > 0 && sizeSet.has(size.label))
    }

    return true
  }
}
