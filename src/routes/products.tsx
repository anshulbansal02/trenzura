import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'

import {
  ProductFilters,
  type ProductCategoryFilter,
  type ProductSearchState,
} from '../components/product/ProductFilters'
import { ProductGrid } from '../components/product/ProductGrid'
import {
  getCategoryCounts,
  searchProducts,
  type ProductSort,
} from '../data/product-search'
import {
  productCategories,
  productPriceRange,
  productSizes,
} from '../data/products'

export const Route = createFileRoute('/products')({
  validateSearch: (search: Record<string, unknown>): ProductSearchState => ({
    q: typeof search.q === 'string' && search.q.trim() ? search.q : undefined,
    category: isCategoryFilter(search.category) ? search.category : undefined,
    sort: isSort(search.sort) ? search.sort : undefined,
    sizes: parseOptionalArraySearch(search.sizes, isSizeFilter),
    minPrice: parsePrice(search.minPrice),
    maxPrice: parsePrice(search.maxPrice),
    inStockOnly: search.inStockOnly === 'true' ? true : undefined,
    saleOnly: search.saleOnly === 'true' ? true : undefined,
  }),
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const resolvedSearch = resolveSearch(deps)
    const results = await searchProducts({
      query: resolvedSearch.q,
      category: resolvedSearch.category,
      sort: resolvedSearch.sort,
      sizes: resolvedSearch.sizes,
      minPrice: resolvedSearch.minPrice,
      maxPrice: resolvedSearch.maxPrice,
      inStockOnly: resolvedSearch.inStockOnly,
      saleOnly: resolvedSearch.saleOnly,
    })
    const categoryResults =
      resolvedSearch.category === 'all'
        ? results.products
        : (
            await searchProducts({
              query: resolvedSearch.q,
              category: 'all',
              sort: 'recommended',
              sizes: resolvedSearch.sizes,
              minPrice: resolvedSearch.minPrice,
              maxPrice: resolvedSearch.maxPrice,
              inStockOnly: resolvedSearch.inStockOnly,
              saleOnly: resolvedSearch.saleOnly,
            })
          ).products

    return {
      categoryCounts: getCategoryCounts(categoryResults),
      results,
    }
  },
  component: ProductsPage,
})

const categoryFilters: ProductCategoryFilter[] = ['all', ...productCategories]

const sortOptions: ProductSort[] = ['recommended', 'price-asc', 'price-desc', 'discount-desc']

function ProductsPage() {
  const search = Route.useSearch()
  const { categoryCounts, results } = Route.useLoaderData()
  const resolvedSearch = resolveSearch(search)
  const navigate = useNavigate({ from: Route.fullPath })
  const selectedSizesKey = resolvedSearch.sizes.join('|')
  const updateSearch = useCallback(
    (nextSearch: Partial<ProductSearchState>) =>
      navigate({
        search: cleanSearch({
          ...resolvedSearch,
          ...nextSearch,
        }),
        replace: true,
      }),
    [
      navigate,
      resolvedSearch.category,
      resolvedSearch.inStockOnly,
      resolvedSearch.maxPrice,
      resolvedSearch.minPrice,
      resolvedSearch.q,
      resolvedSearch.saleOnly,
      selectedSizesKey,
      resolvedSearch.sort,
    ],
  )

  return (
    <main className="fashion-container py-10 lg:py-14">
      <div className="mb-10 flex flex-col gap-4 border-b border-[var(--color-line)] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="fashion-eyebrow">Shop</p>
          <h1 className="fashion-display mt-2 text-5xl sm:text-6xl">
            Kurtis and sets
          </h1>
        </div>
        <p className="fashion-copy max-w-xl">
          Find everyday kurtis, coordinated sets, and occasion-ready pieces by size, price, and
          availability.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <ProductFilters
          search={resolvedSearch}
          resultCount={results.count}
          categoryCounts={categoryCounts}
          onSearchChange={updateSearch}
        />
        <section>
          <div className="mb-5 flex min-h-6 items-center justify-between gap-4 text-sm text-[var(--color-muted)]">
            <p>
              {resolvedSearch.q ? (
                <>
                  Showing results for{' '}
                  <span className="font-semibold text-[var(--color-ink)]">
                    "{resolvedSearch.q}"
                  </span>
                </>
              ) : (
                'Showing all styles'
              )}
            </p>
          </div>
          <ProductGrid products={results.products} />
        </section>
      </div>
    </main>
  )
}

function resolveSearch(search: ProductSearchState): Required<ProductSearchState> {
  return {
    q: search.q ?? '',
    category: search.category ?? 'all',
    sort: search.sort ?? 'recommended',
    sizes: search.sizes ?? [],
    minPrice: search.minPrice ?? productPriceRange.min,
    maxPrice: search.maxPrice ?? productPriceRange.max,
    inStockOnly: search.inStockOnly ?? false,
    saleOnly: search.saleOnly ?? false,
  }
}

function cleanSearch(search: Required<ProductSearchState>): ProductSearchState {
  return {
    q: search.q.trim() || undefined,
    category: search.category === 'all' ? undefined : search.category,
    sort: search.sort === 'recommended' ? undefined : search.sort,
    sizes: search.sizes.length > 0 ? search.sizes : undefined,
    minPrice: search.minPrice > productPriceRange.min ? search.minPrice : undefined,
    maxPrice: search.maxPrice < productPriceRange.max ? search.maxPrice : undefined,
    inStockOnly: search.inStockOnly || undefined,
    saleOnly: search.saleOnly || undefined,
  }
}

function isCategoryFilter(value: unknown): value is ProductCategoryFilter {
  return typeof value === 'string' && categoryFilters.includes(value as ProductCategoryFilter)
}

function isSort(value: unknown): value is ProductSort {
  return typeof value === 'string' && sortOptions.includes(value as ProductSort)
}

function isSizeFilter(value: string) {
  return productSizes.includes(value)
}

function parseArraySearch(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  return typeof value === 'string' && value ? [value] : []
}

function parseOptionalArraySearch(value: unknown, isAllowed: (value: string) => boolean) {
  const values = parseArraySearch(value).filter(isAllowed)
  return values.length > 0 ? values : undefined
}

function parsePrice(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return undefined

  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : undefined
}
