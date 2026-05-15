import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { featuredProducts, getProduct, type Product } from '../../data/products'
import { formatPrice, joinClasses } from '../../lib/format'
import { ProductMedia } from './ProductMedia'

const recentProductsStorageKey = 'trenzura-recently-viewed'
const recentProductsEvent = 'trenzura-recently-viewed:update'
const maxStoredProducts = 8

type RecentlyViewedRailProps = {
  className?: string
  compact?: boolean
  excludeProductId?: string
  fallback?: 'featured' | 'none'
  limit?: number
  onProductClick?: () => void
  title?: string
}

export function rememberRecentlyViewedProduct(product: Product) {
  if (typeof window === 'undefined') return

  const currentProductIds = readStoredProductIds()
  const nextProductIds = [
    product.productId,
    ...currentProductIds.filter((productId) => productId !== product.productId),
  ].slice(0, maxStoredProducts)

  window.localStorage.setItem(recentProductsStorageKey, JSON.stringify(nextProductIds))
  window.dispatchEvent(new Event(recentProductsEvent))
}

export function useRecentlyViewedProducts(excludeProductId?: string, limit = 4) {
  const [recentProducts, setRecentProducts] = useState<Product[]>([])

  useEffect(() => {
    function refreshRecentProducts() {
      setRecentProducts(
        readStoredProductIds()
          .map((productId) => getProduct(productId))
          .filter((product): product is Product => Boolean(product))
          .filter((product) => product.productId !== excludeProductId)
          .slice(0, limit),
      )
    }

    refreshRecentProducts()

    window.addEventListener('storage', refreshRecentProducts)
    window.addEventListener(recentProductsEvent, refreshRecentProducts)

    return () => {
      window.removeEventListener('storage', refreshRecentProducts)
      window.removeEventListener(recentProductsEvent, refreshRecentProducts)
    }
  }, [excludeProductId, limit])

  return recentProducts
}

export function RecentlyViewedRail({
  className,
  compact = false,
  excludeProductId,
  fallback = 'none',
  limit = 4,
  onProductClick,
  title = 'Recently viewed',
}: RecentlyViewedRailProps) {
  const recentProducts = useRecentlyViewedProducts(excludeProductId, limit)
  const fallbackProducts =
    fallback === 'featured'
      ? featuredProducts
          .filter((product) => product.productId !== excludeProductId)
          .slice(0, limit)
      : []
  const products = recentProducts.length > 0 ? recentProducts : fallbackProducts
  const heading = recentProducts.length > 0 ? title : 'Picked for you'

  if (products.length === 0) return null

  return (
    <section className={joinClasses(className)}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="fashion-eyebrow">
            {recentProducts.length > 0 ? 'Continue browsing' : 'From the edit'}
          </p>
          <h2 className={joinClasses('fashion-display mt-2', compact ? 'text-2xl' : 'text-3xl')}>
            {heading}
          </h2>
        </div>
        {!compact ? (
          <Link
            to="/products"
            className="hidden text-sm font-semibold text-[var(--color-ink)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-rouge)] hover:decoration-[var(--color-rouge)] sm:inline"
          >
            View all
          </Link>
        ) : null}
      </div>
      <div
        className={joinClasses(
          'grid gap-4',
          compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4',
        )}
      >
        {products.map((product) => (
          <Link
            key={product.productId}
            to="/products/$slug"
            params={{ slug: product.slug }}
            onClick={onProductClick}
            className="group min-w-0"
          >
            <ProductMedia product={product} className="aspect-[3/4]" hoverZoom />
            <div className="mt-3 min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                {product.title}
              </p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                {formatPrice(product.sellingPricePaise)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function readStoredProductIds() {
  if (typeof window === 'undefined') return []

  try {
    const storedValue = window.localStorage.getItem(recentProductsStorageKey)
    if (!storedValue) return []

    const parsedValue = JSON.parse(storedValue)
    if (!Array.isArray(parsedValue)) return []

    return parsedValue.filter((productId): productId is string => typeof productId === 'string')
  } catch {
    return []
  }
}
