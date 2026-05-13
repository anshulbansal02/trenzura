import { Dialog } from '@base-ui/react/dialog'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useState } from 'react'

import {
  ProductFilters,
  type ProductCategoryFilter,
  type ProductSearchState,
} from '../components/product/ProductFilters'
import { ProductGrid } from '../components/product/ProductGrid'
import { StyleFinder } from '../components/product/StyleFinder'
import {
  getCategoryCounts,
  getSmartSearchLabels,
  searchProducts,
  type ProductSort,
} from '../data/product-search'
import {
  categoryLabels,
  productCategories,
  productPriceRange,
  productSizes,
} from '../data/products'
import { formatPrice } from '../lib/format'
import { createPageMeta } from '../lib/seo'

export const Route = createFileRoute('/products')({
  head: () =>
    createPageMeta({
      title: 'Shop Kurtis and Sets | Trenzura',
      description:
        'Browse Trenzura kurtis and coordinated sets by size, price, availability, and offers.',
      path: '/products',
    }),
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

const sortOptions: ProductSort[] = [
  'recommended',
  'newest',
  'price-asc',
  'price-desc',
  'discount-desc',
]

function ProductsPage() {
  const search = Route.useSearch()
  const { categoryCounts, results } = Route.useLoaderData()
  const resolvedSearch = resolveSearch(search)
  const navigate = useNavigate({ from: Route.fullPath })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const selectedSizesKey = resolvedSearch.sizes.join('|')
  const activeFilters = createActiveFilters(resolvedSearch)
  const smartSearchLabels = resolvedSearch.q ? getSmartSearchLabels(resolvedSearch.q) : []
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
    <main className="fashion-container pb-32 pt-10 lg:py-14">
      <div className="mb-10 flex flex-col gap-5 border-b border-[var(--color-line)] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="fashion-eyebrow">Shop</p>
          <h1 className="fashion-display mt-2 text-5xl sm:text-6xl">
            Kurtis and sets
          </h1>
        </div>
        <div className="max-w-xl">
          <p className="fashion-copy">
            Find everyday kurtis, coordinated sets, and occasion-ready pieces by size, price, and
            availability.
          </p>
          <StyleFinder
            triggerLabel="Help me choose"
            triggerClassName="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm font-semibold text-[var(--color-ink)] shadow-sm shadow-stone-950/5 transition hover:border-[#b58b91] hover:bg-white hover:text-[var(--color-rouge)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2"
          />
        </div>
      </div>

      <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="grid min-w-0 gap-8 lg:grid-cols-[280px_1fr]">
          <section className="min-w-0 lg:order-2">
            <div className="mb-5 rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {results.count} {results.count === 1 ? 'style' : 'styles'}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {resolvedSearch.q ? (
                      <>
                        Results for{' '}
                        <span className="font-semibold text-[var(--color-ink)]">
                          "{resolvedSearch.q}"
                        </span>
                      </>
                    ) : (
                      'Browse ready-to-ship kurtis and coordinated sets.'
                    )}
                  </p>
                </div>
                <div className="hidden items-center gap-2 rounded-full bg-[var(--color-canvas)] px-3 py-2 text-xs font-semibold text-[var(--color-muted)] lg:inline-flex">
                  <SlidersHorizontal className="size-4" aria-hidden="true" />
                  Filters update instantly
                </div>
              </div>
              {smartSearchLabels.length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-[var(--color-muted)]">Understood as</span>
                  {smartSearchLabels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-[var(--color-canvas)] px-2.5 py-1 font-semibold text-[var(--color-ink)]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              ) : null}
              {activeFilters.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeFilters.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => updateSearch(filter.clear)}
                      className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 text-sm font-medium text-[var(--color-ink)] transition duration-150 ease-out hover:border-[var(--color-rouge)] hover:text-[var(--color-rouge)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2"
                    >
                      {filter.label}
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateSearch({
                        category: 'all',
                        sizes: [],
                        minPrice: productPriceRange.min,
                        maxPrice: productPriceRange.max,
                        inStockOnly: false,
                        saleOnly: false,
                      })
                    }
                    className="min-h-9 rounded-full px-3 text-sm font-semibold text-[var(--color-muted)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-rouge)]"
                  >
                    Clear all
                  </button>
                </div>
              ) : null}
            </div>
            <ProductGrid products={results.products} />
          </section>
          <div className="hidden lg:block">
            <ProductFilters
              search={resolvedSearch}
              resultCount={results.count}
              categoryCounts={categoryCounts}
              onSearchChange={updateSearch}
              idPrefix="desktop"
            />
          </div>
        </div>
        <Dialog.Trigger
          render={
            <button
              type="button"
              className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.6rem)] right-5 z-30 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#b58b91] bg-[var(--color-ink)] px-5 text-sm font-semibold text-[var(--color-paper)] shadow-xl shadow-stone-950/20 transition duration-150 ease-out hover:bg-[var(--color-rouge-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2 active:scale-[0.98] lg:hidden"
              aria-label="Open product filters"
            />
          }
        >
          <SlidersHorizontal className="size-4" aria-hidden="true" />
          Filters
          {activeFilters.length > 0 ? (
            <span className="grid min-w-5 place-items-center rounded-full bg-[var(--color-paper)] px-1.5 text-xs text-[var(--color-rouge)]">
              {activeFilters.length}
            </span>
          ) : null}
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-sm transition duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 lg:hidden" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex min-h-svh items-end justify-center lg:hidden">
            <Dialog.Popup className="max-h-[92svh] w-full overflow-hidden rounded-t-[1.35rem] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-2xl shadow-stone-950/25 outline-none transition duration-200 data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0">
              <div className="flex items-start justify-between gap-4 border-b border-[var(--color-line)] px-5 py-4">
                <div>
                  <Dialog.Title className="text-lg font-semibold text-[var(--color-ink)]">
                    Filters
                  </Dialog.Title>
                  <Dialog.Description className="mt-1 text-sm text-[var(--color-muted)]">
                    Refine the shop without leaving this page.
                  </Dialog.Description>
                </div>
                <Dialog.Close
                  aria-label="Close filters"
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] transition duration-150 ease-out hover:border-[#b58b91] hover:text-[var(--color-rouge)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2"
                >
                  <X className="size-4" aria-hidden="true" />
                </Dialog.Close>
              </div>
              <div className="max-h-[calc(92svh-89px)] overflow-y-auto px-5 py-5">
                <ProductFilters
                  search={resolvedSearch}
                  resultCount={results.count}
                  categoryCounts={categoryCounts}
                  onSearchChange={updateSearch}
                  idPrefix="mobile"
                  onDone={() => setFiltersOpen(false)}
                  showHeader={false}
                  variant="sheet"
                />
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
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

function createActiveFilters(search: Required<ProductSearchState>) {
  const filters: Array<{
    key: string
    label: string
    clear: Partial<ProductSearchState>
  }> = []

  if (search.category !== 'all') {
    filters.push({
      key: 'category',
      label: categoryLabels[search.category] ?? search.category,
      clear: { category: 'all' },
    })
  }

  for (const size of search.sizes) {
    filters.push({
      key: `size-${size}`,
      label: `Size ${size}`,
      clear: { sizes: search.sizes.filter((item) => item !== size) },
    })
  }

  if (search.minPrice > productPriceRange.min) {
    filters.push({
      key: 'min-price',
      label: `From ${formatPrice(search.minPrice)}`,
      clear: { minPrice: productPriceRange.min },
    })
  }

  if (search.maxPrice < productPriceRange.max) {
    filters.push({
      key: 'max-price',
      label: `Up to ${formatPrice(search.maxPrice)}`,
      clear: { maxPrice: productPriceRange.max },
    })
  }

  if (search.inStockOnly) {
    filters.push({
      key: 'in-stock',
      label: 'In stock',
      clear: { inStockOnly: false },
    })
  }

  if (search.saleOnly) {
    filters.push({
      key: 'sale',
      label: 'On sale',
      clear: { saleOnly: false },
    })
  }

  return filters
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
