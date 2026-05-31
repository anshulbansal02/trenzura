import { Link, useRouterState } from '@tanstack/react-router'
import { Search, ShoppingBag } from 'lucide-react'

import { formatPrice } from '../../lib/format'
import { shippingConfig } from '../../lib/shipping'
import { useOptionalCart } from '../cart/CartProvider'

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const cart = useOptionalCart()
  const itemCount = cart?.itemCount ?? 0
  const openCart = cart?.openCart ?? (() => {})
  const mobileBottomNavVisible = pathname === '/' || pathname === '/products'
  const freeShippingText = `Free shipping above ${formatPrice(
    shippingConfig.freeShippingThresholdPaise,
  )}`

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-paper)]/96 backdrop-blur-sm">
      <div className="bg-[var(--color-primary)] px-4 py-2 text-center text-[0.6875rem] font-medium uppercase leading-4 tracking-[0.12em] text-[var(--color-paper)] sm:px-6 lg:px-8">
        <span className="sm:hidden">{freeShippingText} | Easy exchanges</span>
        <span className="hidden sm:inline">
          {freeShippingText} | COD-style secure checkout | 7-day easy size exchanges
        </span>
      </div>
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-7">
          <Link
            to="/"
            className="shrink-0 font-serif text-3xl font-normal leading-none text-[var(--color-ink)] transition duration-150 ease-out hover:text-[var(--color-primary-dark)] sm:text-4xl"
          >
            Trenzura
          </Link>
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-7 text-sm text-[var(--color-muted)] lg:flex"
          >
            <Link
              to="/"
              activeProps={{ className: 'text-[var(--color-ink)]' }}
              inactiveProps={{ className: 'text-[var(--color-muted)] hover:text-[var(--color-ink)]' }}
              className="transition duration-150 ease-out"
            >
              Home
            </Link>
            <Link
              to="/products"
              activeProps={{ className: 'text-[var(--color-ink)]' }}
              inactiveProps={{ className: 'text-[var(--color-muted)] hover:text-[var(--color-ink)]' }}
              className="transition duration-150 ease-out"
            >
              Shop
            </Link>
            <Link
              to="/products"
              search={{ sort: 'newest' }}
              className="transition duration-150 ease-out hover:text-[var(--color-ink)]"
            >
              New In
            </Link>
            <Link
              to="/products"
              search={{ sort: 'discount-desc' }}
              className="transition duration-150 ease-out hover:text-[var(--color-ink)]"
            >
              Offers
            </Link>
          </nav>
        </div>
        <nav aria-label="Shop actions" className="flex shrink-0 items-center justify-end gap-4 text-sm sm:gap-5">
          <Link
            to="/products"
            aria-label="Search products"
            className="flex size-10 items-center justify-center text-[var(--color-ink)] transition duration-150 ease-out hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
          >
            <Search className="size-4" aria-hidden="true" />
          </Link>
          <Link
            to="/checkout"
            activeProps={{ className: 'text-[var(--color-ink)]' }}
            inactiveProps={{ className: 'text-[var(--color-muted)] hover:text-[var(--color-ink)]' }}
            className="hidden text-sm transition duration-150 ease-out lg:inline"
          >
            Checkout
          </Link>
          <button
            type="button"
            onClick={openCart}
            className={
              mobileBottomNavVisible
                ? 'relative hidden h-10 items-center justify-center gap-2 px-1 text-sm font-medium text-[var(--color-ink)] transition duration-150 ease-out hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 sm:inline-flex'
                : 'relative inline-flex h-10 items-center justify-center gap-2 px-1 text-sm font-medium text-[var(--color-ink)] transition duration-150 ease-out hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2'
            }
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            Bag
            {itemCount > 0 ? (
              <span className="ml-1 inline-flex min-w-5 justify-center bg-[var(--color-primary)] px-1.5 py-0.5 text-xs leading-none text-[var(--color-paper)]">
                {itemCount}
              </span>
            ) : null}
          </button>
        </nav>
      </div>
    </header>
  )
}
