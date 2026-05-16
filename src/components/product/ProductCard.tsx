import { Link } from '@tanstack/react-router'
import { Eye } from 'lucide-react'
import { useState } from 'react'

import type { Product } from '../../data/products'
import { formatPrice } from '../../lib/format'
import { ProductMedia } from './ProductMedia'
import { ProductQuickLook } from './ProductQuickLook'

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [quickLookOpen, setQuickLookOpen] = useState(false)

  return (
    <div className="group/card transition duration-300 ease-out">
      <div className="relative overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-line)]">
        <Link
          to="/products/$slug"
          params={{ slug: product.slug }}
          className="group block focus:outline-none"
        >
          <ProductMedia product={product} className="aspect-[3/4]" hoverZoom />
          {product.featured ? (
            <span className="absolute left-3 top-3 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)]/94 px-3 py-1.5 text-[0.68rem] font-medium uppercase text-[var(--color-ink)] backdrop-blur">
              Most wanted
            </span>
          ) : null}
          {product.discountPercent > 0 ? (
            <span className="absolute right-3 top-3 rounded-full bg-[var(--color-accent-muted)] px-3 py-1.5 text-[0.68rem] font-medium uppercase text-[var(--color-paper)]">
              Save {product.discountPercent}%
            </span>
          ) : null}
          <div className="absolute bottom-3 left-3 rounded-full bg-[var(--color-paper)]/94 px-3 py-2 text-xs font-medium text-[var(--color-ink)] opacity-0 backdrop-blur transition duration-200 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
            <span>View details</span>
          </div>
        </Link>
        <button
          type="button"
          onClick={() => setQuickLookOpen(true)}
          aria-label={`Quick look at ${product.title}`}
          className="absolute bottom-3 right-3 inline-flex h-10 items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-paper)]/94 px-3 text-xs font-medium text-[var(--color-ink)] backdrop-blur transition duration-150 ease-out hover:border-[var(--color-primary)] hover:bg-white hover:text-[var(--color-primary)] active:scale-[0.98]"
        >
          <Eye className="size-3.5" aria-hidden="true" />
          Quick look
        </button>
      </div>
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="group block focus:outline-none"
      >
        <div className="mt-3 grid gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-medium text-[var(--color-ink)] group-focus-visible:underline">
                {product.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {product.categoryLabel}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-medium text-[var(--color-ink)]">
                {formatPrice(product.sellingPricePaise)}
              </p>
              {product.discountPercent > 0 ? (
                <p className="mt-1 text-xs text-[var(--color-muted)] line-through">
                  {formatPrice(product.mrpPaise)}
                </p>
              ) : null}
            </div>
          </div>
          {product.discountPercent > 0 ? (
            <p className="text-xs font-medium text-[var(--color-accent-muted)]">
              Save {formatPrice(product.mrpPaise - product.sellingPricePaise)} today
            </p>
          ) : null}
        </div>
      </Link>

      <ProductQuickLook
        product={product}
        open={quickLookOpen}
        onOpenChange={setQuickLookOpen}
      />
    </div>
  )
}
