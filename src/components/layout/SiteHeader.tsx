import { Link } from '@tanstack/react-router'
import { Search, ShoppingBag } from 'lucide-react'

import { useCart } from '../cart/CartProvider'

export function SiteHeader() {
  const { itemCount, openCart } = useCart()

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-paper)]/90 backdrop-blur-xl">
      <div className="border-b border-[var(--color-line)] bg-[var(--color-ink)] px-4 py-2 text-center text-xs font-semibold leading-5 text-[var(--color-paper)]">
        <span className="sm:hidden">Ships in 1-2 days - 7-day exchanges</span>
        <span className="hidden sm:inline">
          Ships in 1-2 business days - 7-day size exchanges - Secure checkout
        </span>
      </div>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          to="/"
          className="font-serif text-2xl font-normal text-[var(--color-ink)] transition duration-150 ease-out hover:text-[var(--color-rouge)]"
        >
          Trenzura
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-3 text-sm sm:gap-5">
          <Link
            to="/"
            activeProps={{ className: 'text-[var(--color-ink)]' }}
            inactiveProps={{ className: 'text-[var(--color-muted)] hover:text-[var(--color-ink)]' }}
            className="hidden transition duration-150 ease-out sm:inline"
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
            aria-label="Search products"
            className="flex size-10 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] transition duration-150 ease-out hover:border-[var(--color-ink)] hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2"
          >
            <Search className="size-4" aria-hidden="true" />
          </Link>
          <Link
            to="/checkout"
            activeProps={{ className: 'text-[var(--color-ink)]' }}
            inactiveProps={{ className: 'text-[var(--color-muted)] hover:text-[var(--color-ink)]' }}
            className="hidden transition duration-150 ease-out sm:inline"
          >
            Checkout
          </Link>
          <button
            type="button"
            onClick={openCart}
            className="fashion-button-secondary relative h-10 gap-2 px-4"
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
