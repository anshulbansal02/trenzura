import { SlidersHorizontal, X } from 'lucide-react'

import { getSmartSearchLabels } from '../../data/product-search'
import { productPriceRange } from '../../data/products'
import {
  type ActiveProductFilter,
  type ProductSearchState,
  type ResolvedProductSearchState,
} from '../../lib/product-search-url'

type ProductResultsHeaderProps = {
  activeFilters: ActiveProductFilter[]
  resultCount: number
  search: ResolvedProductSearchState
  onSearchChange: (search: Partial<ProductSearchState>) => void
}

export function ProductResultsHeader({
  activeFilters,
  resultCount,
  search,
  onSearchChange,
}: ProductResultsHeaderProps) {
  const smartSearchLabels = search.q ? getSmartSearchLabels(search.q) : []

  return (
    <div className="mb-6 border-b border-[var(--color-line)] pb-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--color-ink)]">
            {resultCount} {resultCount === 1 ? 'style' : 'styles'}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {search.q ? (
              <>
                Results for{' '}
                <span className="font-semibold text-[var(--color-ink)]">
                  "{search.q}"
                </span>
              </>
            ) : (
              'Browse ready-to-ship short tops, kurtis, and coordinated sets.'
            )}
          </p>
        </div>
        <div className="hidden items-center gap-2 rounded-full bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-muted)] lg:inline-flex">
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
              className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 font-bold text-[var(--color-ink)]"
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
              onClick={() => onSearchChange(filter.clear)}
              className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 text-sm font-bold text-[var(--color-ink)] transition duration-150 ease-out hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              {filter.label}
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              onSearchChange({
                category: 'all',
                sizes: [],
                minPrice: productPriceRange.min,
                maxPrice: productPriceRange.max,
                inStockOnly: false,
                saleOnly: false,
              })
            }
            className="min-h-9 rounded-full px-3 text-sm font-semibold text-[var(--color-muted)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-primary)]"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  )
}
