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
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="group block focus:outline-none"
      >
        <div className="relative overflow-hidden rounded-[1.1rem] bg-[var(--color-line)]">
          <ProductMedia product={product} className="aspect-[3/4]" hoverZoom />
          {product.featured ? (
            <span className="absolute left-0 top-4 bg-[var(--color-paper)]/94 px-3 py-1.5 text-[0.68rem] font-semibold uppercase text-[var(--color-rouge)] shadow-sm backdrop-blur">
              Editor's pick
            </span>
          ) : null}
          <div className="absolute bottom-3 left-3 rounded-full bg-[var(--color-paper)]/92 px-3 py-2 text-xs font-semibold text-[var(--color-ink)] opacity-0 shadow-sm backdrop-blur transition duration-200 ease-out group-hover:opacity-100 group-focus-visible:opacity-100">
            <span>View details</span>
          </div>
        </div>
        <div className="mt-3 grid gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[var(--color-ink)] group-focus-visible:underline">
                {product.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {product.categoryLabel}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-[var(--color-ink)]">
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
            <p className="text-xs font-semibold text-[var(--color-rouge)]">
              Save {formatPrice(product.mrpPaise - product.sellingPricePaise)} today
            </p>
          ) : null}
        </div>
      </Link>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => setQuickLookOpen(true)}
          aria-label={`Quick look at ${product.title}`}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] shadow-sm shadow-stone-950/5 transition duration-150 ease-out hover:border-[#b58b91] hover:bg-white hover:text-[var(--color-rouge)] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500 disabled:shadow-none"
        >
          <Eye className="size-3.5" aria-hidden="true" />
          Quick look
        </button>
      </div>
      <ProductQuickLook
        product={product}
        open={quickLookOpen}
        onOpenChange={setQuickLookOpen}
      />
    </div>
  )
}
