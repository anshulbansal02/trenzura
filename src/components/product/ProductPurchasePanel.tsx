import { Button } from '@base-ui/react/button'
import { Link } from '@tanstack/react-router'
import { Minus, Plus, ShieldCheck, Truck, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useCart } from '../cart/CartProvider'
import type { Product } from '../../data/products'
import { formatPrice, joinClasses } from '../../lib/format'

type ProductPurchasePanelProps = {
  product: Product
}

export function ProductPurchasePanel({ product }: ProductPurchasePanelProps) {
  const availableSizes = useMemo(
    () => product.sizes.filter((size) => size.stockAvailable > 0),
    [product.sizes],
  )
  const [selectedSize, setSelectedSize] = useState(availableSizes[0]?.label ?? '')
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()
  const selectedInventory = availableSizes.find((size) => size.label === selectedSize)
  const maxQuantity = selectedInventory?.stockAvailable ?? 0
  const canAddToCart = Boolean(selectedInventory && quantity >= 1 && quantity <= maxQuantity)

  useEffect(() => {
    const stillAvailable = availableSizes.some((size) => size.label === selectedSize)

    if (!stillAvailable) {
      setSelectedSize(availableSizes[0]?.label ?? '')
      setQuantity(1)
      return
    }

    setQuantity((value) => Math.min(Math.max(value, 1), maxQuantity))
  }, [availableSizes, maxQuantity, selectedSize])

  function addCurrentSelection() {
    if (!canAddToCart) return
    addItem({ product, size: selectedSize, quantity })
  }

  return (
    <div className="fashion-surface rounded-[1.25rem] p-4 lg:p-5">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-2xl font-semibold text-[var(--color-ink)]">
            {formatPrice(product.sellingPricePaise)}
          </p>
          {product.discountPercent > 0 ? (
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              <span className="line-through">{formatPrice(product.mrpPaise)}</span>
              <span className="ml-2 text-[var(--color-rouge)]">
                {product.discountPercent}% off
              </span>
            </p>
          ) : null}
        </div>
        <p className="rounded-full bg-[var(--color-canvas)] px-3 py-1 text-xs font-semibold text-[var(--color-sage)]">
          {product.stockAvailable > 0 ? 'In stock' : 'Sold out'}
        </p>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Select size</p>
          {product.sizeChart.length > 0 ? (
            <a
              href="#size-chart"
              className="text-sm font-semibold text-[var(--color-muted)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-rouge)] hover:decoration-[var(--color-rouge)]"
            >
              Size chart
            </a>
          ) : null}
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {product.sizes.map((size) => {
            const isSelected = selectedSize === size.label
            const isAvailable = size.stockAvailable > 0

            return (
              <button
                key={size.label}
                type="button"
                disabled={!isAvailable}
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedSize(size.label)
                  setQuantity(1)
                }}
                className={joinClasses(
                  'h-11 rounded-full border text-sm font-semibold transition duration-150 ease-out hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-[var(--color-rouge)] bg-[var(--color-rouge)] text-[var(--color-paper)]'
                    : 'border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:border-[var(--color-rouge)] hover:bg-white',
                  !isAvailable &&
                    'cursor-not-allowed border-[var(--color-line)] bg-stone-100 text-stone-500 hover:translate-y-0 hover:border-[var(--color-line)]',
                )}
              >
                {size.label}
              </button>
            )
          })}
        </div>
        {selectedInventory ? (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {selectedInventory.stockAvailable} available in {selectedInventory.label}
          </p>
        ) : (
          <p className="mt-2 text-xs text-red-700">This product is currently sold out.</p>
        )}
      </div>

      <div className="mt-6">
        <p className="text-sm font-semibold text-[var(--color-ink)]">Quantity</p>
        <div className="mt-3 inline-flex h-11 items-center rounded-full border border-[var(--color-line)] bg-[var(--color-paper)]">
          <button
            type="button"
            disabled={quantity <= 1}
            aria-label="Decrease quantity"
            onClick={() => setQuantity((value) => Math.max(1, value - 1))}
            className="size-11 rounded-full text-[var(--color-muted)] transition duration-150 ease-out hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)] active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-stone-400 disabled:active:scale-100"
          >
            <Minus className="mx-auto size-4" aria-hidden="true" />
          </button>
          <span className="w-10 text-center text-sm font-semibold text-[var(--color-ink)]">
            {quantity}
          </span>
          <button
            type="button"
            disabled={!selectedInventory || quantity >= maxQuantity}
            aria-label="Increase quantity"
            onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
            className="size-11 rounded-full text-[var(--color-muted)] transition duration-150 ease-out hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)] active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-stone-400 disabled:active:scale-100"
          >
            <Plus className="mx-auto size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Button
          type="button"
          disabled={!canAddToCart}
          onClick={addCurrentSelection}
          className="fashion-button-primary h-12 px-5 disabled:hover:translate-y-0"
        >
          Add to bag
        </Button>
        <Button
          nativeButton={false}
          render={
            <Link
              to="/checkout"
              onClick={addCurrentSelection}
              className={joinClasses(
                'fashion-button-secondary h-12 px-5',
                canAddToCart
                  ? ''
                  : 'pointer-events-none border-stone-200 bg-stone-100 text-stone-500 shadow-none',
              )}
            />
          }
        >
          Buy now
        </Button>
      </div>

      <div className="mt-6 grid gap-3 border-t border-[var(--color-line)] pt-5 text-sm text-[var(--color-muted)]">
        <p className="flex gap-3">
          <Truck className="mt-0.5 size-4 shrink-0 text-[var(--color-sage)]" aria-hidden="true" />
          <span>Ships in 1-2 business days from the studio.</span>
        </p>
        <p className="flex gap-3">
          <Undo2 className="mt-0.5 size-4 shrink-0 text-[var(--color-sage)]" aria-hidden="true" />
          <span>Free shipping over {formatPrice(250000)} and easy 7-day exchanges.</span>
        </p>
        <p className="flex gap-3">
          <ShieldCheck
            className="mt-0.5 size-4 shrink-0 text-[var(--color-sage)]"
            aria-hidden="true"
          />
          <span>Secure checkout with Razorpay-ready payment handoff.</span>
        </p>
      </div>
    </div>
  )
}
