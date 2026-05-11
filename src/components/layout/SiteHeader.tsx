import { Link } from '@tanstack/react-router'
import { ShoppingBag } from 'lucide-react'

import { useCart } from '../cart/CartProvider'

export function SiteHeader() {
  const { itemCount, openCart } = useCart()

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-paper)]/88 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          to="/"
          className="font-serif text-2xl font-normal text-[var(--color-ink)] transition duration-150 ease-out hover:text-[var(--color-rouge)]"
        >
          Trenzura
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-5 text-sm">
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
