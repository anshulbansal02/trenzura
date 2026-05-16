import { Link } from '@tanstack/react-router'
import { ShoppingBag, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { formatPrice } from '../../lib/format'
import { ProductMedia } from '../product/ProductMedia'
import { type AddedCartItem, useOptionalCart } from './CartProvider'

export function AddToBagToast() {
  const cart = useOptionalCart()
  const dismissAddedItem = cart?.dismissAddedItem
  const openCart = cart?.openCart
  const [visibleItem, setVisibleItem] = useState<AddedCartItem | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const closeToast = useCallback(() => {
    setIsVisible(false)
    window.setTimeout(() => {
      dismissAddedItem?.()
      setVisibleItem(null)
    }, 180)
  }, [dismissAddedItem])

  useEffect(() => {
    if (!cart?.addedItem) return

    setVisibleItem(cart.addedItem)
    const frame = window.requestAnimationFrame(() => setIsVisible(true))

    return () => window.cancelAnimationFrame(frame)
  }, [cart?.addedItem])

  useEffect(() => {
    if (!visibleItem || !isVisible) return

    const timeout = window.setTimeout(closeToast, 5200)
    return () => window.clearTimeout(timeout)
  }, [closeToast, isVisible, visibleItem])

  if (!cart || !visibleItem) return null

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] p-3 shadow-sm transition duration-200 ease-out sm:bottom-5 sm:left-auto sm:right-5 sm:translate-x-0 ${
        isVisible
          ? 'translate-y-0 opacity-100 sm:translate-y-0'
          : 'translate-y-2 opacity-0 sm:translate-y-2'
      }`}
    >
      <div className="grid grid-cols-[64px_1fr_auto] gap-3">
        <ProductMedia product={visibleItem.product} className="aspect-[4/5] rounded-lg" />
        <div className="min-w-0 py-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase text-[var(--color-primary)]">
            <ShoppingBag className="size-3.5" aria-hidden="true" />
            Added to bag
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-[var(--color-ink)]">
            {visibleItem.product.title}
          </p>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Size {visibleItem.size} / Qty {visibleItem.quantity} /{' '}
            {formatPrice(visibleItem.product.sellingPricePaise * visibleItem.quantity)}
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss add to bag message"
          onClick={closeToast}
          className="grid size-8 place-items-center rounded-full text-[var(--color-muted)] transition hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)]"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            closeToast()
            openCart?.()
          }}
          className="h-10 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-ink)]"
        >
          View bag
        </button>
        <Link
          to="/checkout"
          onClick={closeToast}
          className="fashion-button-primary h-10 px-4"
        >
          Checkout
        </Link>
      </div>
    </div>
  )
}
