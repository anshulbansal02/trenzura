import { Button } from '@base-ui/react/button'
import { Drawer } from '@base-ui/react/drawer'
import { Link } from '@tanstack/react-router'
import { Minus, Plus, ShoppingBag, X } from 'lucide-react'

import { formatPrice, freeShippingThresholdPaise, standardShippingPaise } from '../../lib/format'
import { ProductMedia } from '../product/ProductMedia'
import { useCart } from './CartProvider'

export function CartDrawer() {
  const {
    lines,
    itemCount,
    subtotal,
    savings,
    isOpen,
    setCartOpen,
    updateQuantity,
    removeItem,
    closeCart,
  } = useCart()
  const shippingLabel = subtotal >= freeShippingThresholdPaise || subtotal === 0
    ? 'Free'
    : formatPrice(standardShippingPaise)
  const total = subtotal >= freeShippingThresholdPaise ? subtotal : subtotal + standardShippingPaise

  return (
    <Drawer.Root open={isOpen} onOpenChange={setCartOpen} swipeDirection="right">
      <Drawer.Portal>
        <Drawer.Backdrop className="fixed inset-0 z-40 bg-[var(--color-ink)]/35 backdrop-blur-sm transition duration-200 ease-out data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Drawer.Viewport>
          <Drawer.Popup className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col bg-[var(--color-paper)] shadow-2xl shadow-stone-950/20 outline-none transition duration-200 ease-out data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full">
          <div className="flex items-start justify-between gap-6 border-b border-[var(--color-line)] px-5 py-5">
            <div>
              <Drawer.Title className="flex items-center gap-2 font-serif text-2xl text-[var(--color-ink)]">
                <ShoppingBag className="size-5" aria-hidden="true" />
                Shopping bag
              </Drawer.Title>
              <Drawer.Description className="mt-1 text-sm text-[var(--color-muted)]">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </Drawer.Description>
            </div>
            <Drawer.Close
              aria-label="Close cart"
              className="inline-flex size-9 items-center justify-center rounded-full text-[var(--color-muted)] transition duration-150 ease-out hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] active:scale-95"
            >
              <X className="size-4" aria-hidden="true" />
            </Drawer.Close>
          </div>

          {lines.length === 0 ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center">
              <div>
                <p className="font-serif text-3xl text-[var(--color-ink)]">Your bag is empty</p>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                  Choose a style and size to begin your order.
                </p>
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      to="/products"
                      onClick={closeCart}
                      className="fashion-button-primary mt-6 h-11 px-5"
                    />
                  }
                >
                  Browse products
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="space-y-5">
                  {lines.map((line) => (
                    <div key={line.id} className="grid grid-cols-[88px_1fr] gap-4">
                      <Link
                        to="/products/$slug"
                        params={{ slug: line.product.slug }}
                        onClick={closeCart}
                        className="group"
                      >
                        <ProductMedia product={line.product} className="aspect-[4/5]" />
                      </Link>
                      <div className="min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Link
                              to="/products/$slug"
                              params={{ slug: line.product.slug }}
                              onClick={closeCart}
                              className="text-sm font-semibold text-[var(--color-ink)] transition hover:text-[var(--color-rouge)]"
                            >
                              {line.product.title}
                            </Link>
                            <p className="mt-1 text-xs text-[var(--color-muted)]">
                              Size {line.size} / {line.product.categoryLabel}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-[var(--color-ink)]">
                            {formatPrice(line.product.sellingPricePaise * line.quantity)}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="inline-flex h-9 items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)]">
                            <button
                              type="button"
                              aria-label={`Decrease ${line.product.title} quantity`}
                              disabled={line.quantity <= 1}
                              onClick={() => updateQuantity(line.id, line.quantity - 1)}
                              className="size-9 rounded-full text-[var(--color-muted)] transition duration-150 ease-out hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)] active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-stone-400 disabled:active:scale-100"
                            >
                              <Minus className="mx-auto size-4" aria-hidden="true" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              aria-label={`Increase ${line.product.title} quantity`}
                              disabled={line.quantity >= line.maxQuantity}
                              onClick={() => updateQuantity(line.id, line.quantity + 1)}
                              className="size-9 rounded-full text-[var(--color-muted)] transition duration-150 ease-out hover:bg-[var(--color-canvas)] hover:text-[var(--color-ink)] active:scale-95 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-stone-400 disabled:active:scale-100"
                            >
                              <Plus className="mx-auto size-4" aria-hidden="true" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(line.id)}
                            className="text-xs font-semibold text-[var(--color-muted)] underline decoration-[var(--color-line)] underline-offset-4 transition duration-150 ease-out hover:text-[var(--color-rouge)] hover:decoration-[var(--color-rouge)] active:scale-[0.98]"
                          >
                            Remove
                          </button>
                        </div>
                        {line.quantity >= line.maxQuantity ? (
                          <p className="mt-2 text-xs text-amber-700">
                            Only {line.maxQuantity} available in this size
                          </p>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-5">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between text-[var(--color-muted)]">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[var(--color-ink)]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  {savings > 0 ? (
                    <div className="flex items-center justify-between text-emerald-700">
                      <span>Savings</span>
                      <span>{formatPrice(savings)}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-[var(--color-muted)]">
                    <span>Estimated shipping</span>
                    <span>{shippingLabel}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-3 text-base font-semibold text-[var(--color-ink)]">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
                {subtotal < freeShippingThresholdPaise ? (
                  <p className="mt-3 text-xs text-[var(--color-muted)]">
                    Add {formatPrice(freeShippingThresholdPaise - subtotal)} more for free shipping.
                  </p>
                ) : (
                  <p className="mt-3 text-xs text-emerald-700">Free shipping applied.</p>
                )}
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      to="/checkout"
                      onClick={closeCart}
                      className="fashion-button-primary mt-4 flex h-12 w-full px-5"
                    />
                  }
                >
                  Checkout
                </Button>
              </div>
            </>
          )}
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
