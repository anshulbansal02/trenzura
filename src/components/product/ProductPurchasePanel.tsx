import { Button } from '@base-ui/react/button'
import { useNavigate } from '@tanstack/react-router'
import { Minus, Plus, ShieldCheck, Truck, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useCart } from '../cart/CartProvider'
import type { Product } from '../../data/products'
import { formatPrice, joinClasses, standardShippingPaise } from '../../lib/format'
import { FitConfidenceHelper } from './FitConfidenceHelper'

type ProductPurchasePanelProps = {
  product: Product
  variant?: 'default' | 'quickLook'
  onAdded?: () => void
}

export function ProductPurchasePanel({
  product,
  variant = 'default',
  onAdded,
}: ProductPurchasePanelProps) {
  const isQuickLook = variant === 'quickLook'
  const availableSizes = useMemo(
    () => product.sizes.filter((size) => size.stockAvailable > 0),
    [product.sizes],
  )
  const [selectedSize, setSelectedSize] = useState(availableSizes[0]?.label ?? '')
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()
  const navigate = useNavigate()
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

  useEffect(() => {
    setSelectedSize(availableSizes[0]?.label ?? '')
    setQuantity(1)
  }, [availableSizes, product.productId])

  function addCurrentSelection() {
    if (!canAddToCart) return
    addItem({ product, size: selectedSize, quantity })
    onAdded?.()
  }

  function buyCurrentSelection() {
    if (!canAddToCart) return
    addItem({ product, size: selectedSize, quantity })
    void navigate({ to: '/checkout' })
  }

  return (
    <>
      <div
        className={joinClasses(
          isQuickLook ? '' : 'fashion-surface rounded-[1.25rem] p-4 lg:p-5',
        )}
      >
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
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Select size</p>
          {product.sizeChart.length > 0 && !isQuickLook ? (
            <div className="ml-auto flex shrink-0 items-center gap-2 text-right">
              <FitConfidenceHelper product={product} onSelectSize={setSelectedSize} />
              <span className="h-4 w-px bg-[var(--color-line)]" aria-hidden="true" />
              <a
                href="#size-chart"
                className="inline-flex items-center text-xs font-semibold leading-4 text-[var(--color-muted)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-rouge)] hover:decoration-[var(--color-rouge)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2"
              >
                Size chart
              </a>
            </div>
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
                  'h-11 rounded-full border text-sm font-semibold transition duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2',
                  isSelected
                    ? 'border-[var(--color-rouge)] bg-[var(--color-rouge)] text-[var(--color-paper)]'
                    : 'border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:border-[var(--color-rouge)] hover:bg-white',
                  !isAvailable &&
                    'cursor-not-allowed border-[var(--color-line)] bg-stone-100 text-stone-500 hover:border-[var(--color-line)]',
                )}
              >
                {size.label}
              </button>
            )
          })}
        </div>
        {selectedInventory ? (
          <p className="mt-2 text-xs text-[var(--color-muted)]">
            {selectedInventory.stockAvailable <= 3
              ? `Only ${selectedInventory.stockAvailable} left in ${selectedInventory.label}`
              : `${selectedInventory.stockAvailable} available in ${selectedInventory.label}`}
          </p>
        ) : (
          <p className="mt-2 text-xs text-red-700">This product is currently sold out.</p>
        )}
      </div>

      {!isQuickLook ? (
        <div className="mt-6">
          <p className="text-sm font-semibold text-[var(--color-ink)]">Quantity</p>
          <div className="mt-3 inline-flex h-11 items-center overflow-hidden rounded-full border border-[var(--color-line)] bg-[var(--color-paper)]">
            <button
              type="button"
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              className="grid h-full w-11 place-items-center text-[var(--color-muted)] transition duration-150 ease-out hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)] active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-stone-400 disabled:active:scale-100"
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <span className="w-10 text-center text-sm font-semibold text-[var(--color-ink)]">
              {quantity}
            </span>
            <button
              type="button"
              disabled={!selectedInventory || quantity >= maxQuantity}
              aria-label="Increase quantity"
              onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
              className="grid h-full w-11 place-items-center text-[var(--color-muted)] transition duration-150 ease-out hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)] active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-stone-400 disabled:active:scale-100"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : null}

      <div
        className={joinClasses(
          'mt-6 grid gap-3',
          isQuickLook ? '' : 'sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2',
        )}
      >
        <Button
          type="button"
          disabled={!canAddToCart}
          onClick={addCurrentSelection}
          className="fashion-button-primary h-12 px-5"
        >
          Add to bag
        </Button>
        {!isQuickLook ? (
          <Button
            type="button"
            disabled={!canAddToCart}
            onClick={buyCurrentSelection}
            className="fashion-button-secondary h-12 px-5 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-500 disabled:shadow-none"
          >
            Buy now
          </Button>
        ) : null}
      </div>

      <div
        className={joinClasses(
          'mt-6 grid gap-3 border-t border-[var(--color-line)] pt-5 text-sm text-[var(--color-muted)]',
          isQuickLook ? 'text-xs leading-5' : '',
        )}
      >
        <p className="flex gap-3">
          <Truck className="mt-0.5 size-4 shrink-0 text-[var(--color-sage)]" aria-hidden="true" />
          <span>Ships in 1-2 business days from the studio.</span>
        </p>
        {!isQuickLook ? (
          <>
            <p className="flex gap-3">
              <Undo2 className="mt-0.5 size-4 shrink-0 text-[var(--color-sage)]" aria-hidden="true" />
              <span>Flat {formatPrice(standardShippingPaise)} shipping and easy 7-day exchanges.</span>
            </p>
            <p className="flex gap-3">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-[var(--color-sage)]"
                aria-hidden="true"
              />
              <span>Secure payment options at checkout.</span>
            </p>
          </>
        ) : null}
      </div>
      </div>

      {!isQuickLook ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-[var(--color-paper)]/96 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-2xl shadow-stone-950/12 backdrop-blur-xl sm:hidden">
          <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] items-center gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--color-ink)]">
                {selectedSize ? `${product.title} - ${selectedSize}` : product.title}
              </p>
              <p className="mt-0.5 text-sm text-[var(--color-muted)]">
                {formatPrice(product.sellingPricePaise)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                disabled={!canAddToCart}
                onClick={addCurrentSelection}
                className="fashion-button-secondary h-12 px-4 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-500 disabled:shadow-none"
              >
                Add
              </Button>
              <Button
                type="button"
                disabled={!canAddToCart}
                onClick={buyCurrentSelection}
                className="fashion-button-primary h-12 px-5"
              >
                Buy
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
