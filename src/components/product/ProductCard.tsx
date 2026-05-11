import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

import type { Product } from '../../data/products'
import { formatPrice } from '../../lib/format'
import { useCart } from '../cart/CartProvider'
import { ProductMedia } from './ProductMedia'

type ProductCardProps = {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart()
  const firstAvailableSize = product.sizes.find((size) => size.stockAvailable > 0)

  return (
    <div className="group/card transition duration-300 ease-out hover:-translate-y-1">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="group block focus:outline-none"
      >
        <div className="relative overflow-hidden rounded-[1.1rem] bg-[var(--color-line)]">
          <ProductMedia product={product} className="aspect-[4/5]" />
          {product.featured ? (
            <span className="absolute left-3 top-3 rounded-full bg-[var(--color-paper)]/92 px-3 py-1 text-xs font-semibold text-[var(--color-ink)] shadow-sm backdrop-blur">
              Featured
            </span>
          ) : null}
        </div>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-ink)] group-focus-visible:underline">
              {product.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {product.categoryLabel}
            </p>
          </div>
          <div className="text-right">
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
      </Link>

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 gap-1 overflow-hidden text-xs text-[var(--color-muted)]">
          {product.sizes.slice(0, 4).map((size) => (
            <span key={size.label} className={size.stockAvailable > 0 ? '' : 'text-stone-400'}>
              {size.label}
            </span>
          ))}
        </div>
        <button
          type="button"
          disabled={!firstAvailableSize}
          onClick={() =>
            firstAvailableSize
              ? addItem({ product, size: firstAvailableSize.label, quantity: 1 })
              : undefined
          }
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] shadow-sm shadow-stone-950/5 transition duration-150 ease-out hover:border-[var(--color-ink)] hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-500 disabled:shadow-none"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Quick add
        </button>
      </div>
    </div>
  )
}
