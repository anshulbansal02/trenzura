import { Dialog } from '@base-ui/react/dialog'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useState } from 'react'

import { ProductFilters } from '../components/product/ProductFilters'
import { ProductGrid } from '../components/product/ProductGrid'
import { ProductResultsHeader } from '../components/product/ProductResultsHeader'
import { StyleFinder } from '../components/product/StyleFinder'
import {
  getCategoryCounts,
  searchProducts,
} from '../data/product-search'
import {
  cleanProductSearch,
  createActiveProductFilters,
  resolveProductSearch,
  validateProductSearch,
  type ProductSearchState,
} from '../lib/product-search-url'
import { createPageMeta } from '../lib/seo'

export const Route = createFileRoute('/products')({
  head: () =>
    createPageMeta({
      title: 'Shop Short Tops, Kurtis and Co-ord Sets | Trenzura',
      description:
        'Browse Trenzura short tops, kurtis, and coordinated sets by size, price, availability, and offers.',
      path: '/products',
    }),
  validateSearch: validateProductSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ deps }) => {
    const resolvedSearch = resolveProductSearch(deps)
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

function ProductsPage() {
  const search = Route.useSearch()
  const { categoryCounts, results } = Route.useLoaderData()
  const resolvedSearch = resolveProductSearch(search)
  const navigate = useNavigate({ from: Route.fullPath })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const selectedSizesKey = resolvedSearch.sizes.join('|')
  const activeFilters = createActiveProductFilters(resolvedSearch)
  const updateSearch = useCallback(
    (nextSearch: Partial<ProductSearchState>) =>
      navigate({
        search: cleanProductSearch({
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
          <p className="fashion-eyebrow">Fresh drops, every week</p>
          <h1 className="fashion-display mt-2 text-3xl sm:text-4xl">
            Shop the collection
          </h1>
        </div>
        <div className="max-w-xl">
          <p className="fashion-copy">
            Find short tops, everyday kurtis, coordinated sets, and occasion-ready pieces by size,
            price, and availability.
          </p>
          <StyleFinder
            triggerLabel="Find my style"
            triggerClassName="fashion-button-secondary mt-4 h-10 gap-2 px-4"
          />
        </div>
      </div>

      <Dialog.Root open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="grid min-w-0 gap-8 lg:grid-cols-[280px_1fr]">
          <section className="min-w-0 lg:order-2">
            <ProductResultsHeader
              activeFilters={activeFilters}
              resultCount={results.count}
              search={resolvedSearch}
              onSearchChange={updateSearch}
            />
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
              className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.6rem)] right-5 z-30 inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-rouge)] bg-[var(--color-rouge)] px-5 text-sm font-semibold text-[var(--color-paper)] shadow-sm transition duration-150 ease-out hover:bg-[var(--color-rouge-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2 active:scale-[0.98] lg:hidden"
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
            <Dialog.Popup className="max-h-[92svh] w-full overflow-hidden rounded-t-lg border border-[var(--color-line)] bg-[var(--color-paper)] shadow-sm outline-none transition duration-200 data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0">
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
                  className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] transition duration-150 ease-out hover:border-[var(--color-gold)] hover:text-[var(--color-rouge)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2"
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
