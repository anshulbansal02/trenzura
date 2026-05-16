import { Link, useRouterState } from '@tanstack/react-router'
import { Search, ShoppingBag } from 'lucide-react'

import { useOptionalCart } from '../cart/CartProvider'

export function SiteHeader() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const cart = useOptionalCart()
  const itemCount = cart?.itemCount ?? 0
  const openCart = cart?.openCart ?? (() => {})
  const mobileBottomNavVisible = pathname === '/' || pathname === '/products'
  const isHome = pathname === '/'
  const isProducts = pathname === '/products'

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-paper)]/94 backdrop-blur-xl">
      <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-2 text-center text-xs font-semibold leading-5 text-[var(--color-ink)]">
        <span className="sm:hidden">Free shipping above ₹1,299 | Easy exchanges</span>
        <span className="hidden sm:inline">
          Free shipping above ₹1,299 | COD-style secure checkout | 7-day easy size exchanges
        </span>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2 text-2xl font-semibold tracking-[0.04em] text-[var(--color-ink)] transition duration-150 ease-out hover:text-[var(--color-rouge)]"
        >
          <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--color-line)] bg-[var(--color-canvas)]">
            <img
              src="/assets/brand/trenzura-mark.webp"
              alt=""
              className="size-7 object-contain"
              aria-hidden="true"
            />
          </span>
          <span className="text-xl sm:text-2xl">Trenzura</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-3 text-sm sm:gap-5">
          {isHome ? (
            <Link
              to="/products"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition duration-150 ease-out active:scale-[0.98] sm:hidden"
            >
              Shop
            </Link>
          ) : null}
          {isProducts ? (
            <Link
              to="/"
              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-sm font-bold text-[var(--color-ink)] shadow-sm transition duration-150 ease-out active:scale-[0.98] sm:hidden"
            >
              Home
            </Link>
          ) : null}
          <Link
            to="/"
            activeProps={{ className: 'text-[var(--color-ink)]' }}
            inactiveProps={{ className: 'text-[var(--color-muted)] hover:text-[var(--color-ink)]' }}
            className="hidden text-xs font-semibold transition duration-150 ease-out sm:inline"
          >
            Home
          </Link>
          <Link
            to="/products"
            activeProps={{ className: 'text-[var(--color-ink)]' }}
            inactiveProps={{ className: 'text-[var(--color-muted)] hover:text-[var(--color-ink)]' }}
            className="hidden text-xs font-semibold transition duration-150 ease-out sm:inline"
          >
            Shop
          </Link>
          <Link
            to="/products"
            search={{ sort: 'newest' }}
            className="hidden text-xs font-semibold text-[var(--color-muted)] transition duration-150 ease-out hover:text-[var(--color-ink)] md:inline"
          >
            New In
          </Link>
          <Link
            to="/products"
            search={{ sort: 'discount-desc' }}
            className="hidden text-xs font-semibold text-[var(--color-muted)] transition duration-150 ease-out hover:text-[var(--color-ink)] md:inline"
          >
            Offers
          </Link>
          <Link
            to="/products"
            aria-label="Search products"
            className="hidden size-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)] transition duration-150 ease-out hover:border-[var(--color-rouge)] hover:text-[var(--color-rouge)] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2 sm:flex"
          >
            <Search className="size-4" aria-hidden="true" />
          </Link>
          <Link
            to="/checkout"
            activeProps={{ className: 'text-[var(--color-ink)]' }}
            inactiveProps={{ className: 'text-[var(--color-muted)] hover:text-[var(--color-ink)]' }}
            className="hidden text-xs font-semibold transition duration-150 ease-out lg:inline"
          >
            Checkout
          </Link>
          <button
            type="button"
            onClick={openCart}
            className={
              mobileBottomNavVisible
                ? 'fashion-button-secondary relative hidden h-10 gap-2 px-4 sm:inline-flex'
                : 'fashion-button-secondary relative h-10 gap-2 px-4'
            }
          >
            <ShoppingBag className="size-4" aria-hidden="true" />
            Bag
            {itemCount > 0 ? (
              <span className="ml-1 inline-flex min-w-5 justify-center rounded-full bg-[var(--color-rouge)] px-1.5 py-0.5 text-xs leading-none text-[var(--color-paper)]">
                {itemCount}
              </span>
            ) : null}
          </button>
        </nav>
      </div>
    </header>
  )
}
