import { Link } from '@tanstack/react-router'

import type { Product } from '../../data/products'
import { ProductCard } from './ProductCard'
import { RecentlyViewedRail } from './RecentlyViewed'

type ProductGridProps = {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[var(--color-line)] bg-[var(--color-paper)] px-6 py-10">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-xl font-medium text-[var(--color-ink)]">No styles match this</p>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
            Clear a filter or jump into one of the main edits. We keep the catalog small, so the
            right piece is usually only a step away.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link
              to="/products"
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-rouge)] hover:text-[var(--color-rouge)]"
            >
              Clear filters
            </Link>
            <Link
              to="/products"
              search={{ category: 'kurtis' }}
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-rouge)] hover:text-[var(--color-rouge)]"
            >
              Shop kurtis
            </Link>
            <Link
              to="/products"
              search={{ category: 'sets' }}
              className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-rouge)] hover:text-[var(--color-rouge)]"
            >
              Shop sets
            </Link>
          </div>
        </div>
        <RecentlyViewedRail
          compact
          fallback="featured"
          limit={2}
          className="mx-auto mt-10 max-w-lg text-left"
          title="Recently viewed"
        />
      </div>
    )
  }

  return (
    <div className="grid gap-x-5 gap-y-11 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.productId} product={product} />
      ))}
    </div>
  )
}
