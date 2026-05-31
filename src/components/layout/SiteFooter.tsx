import { Link } from '@tanstack/react-router'
import { ArrowRight, RefreshCcw, ShieldCheck, ShoppingBag, Truck, type LucideIcon } from 'lucide-react'

import { formatPrice } from '../../lib/format'
import type { ProductSearchState } from '../../lib/product-search-url'
import { shippingConfig } from '../../lib/shipping'

type FooterLink =
  | {
      label: string
      to: '/checkout'
    }
  | {
      label: string
      search?: ProductSearchState
      to: '/products'
    }

const footerSections: Array<{ links: FooterLink[]; title: string }> = [
  {
    title: 'Shop',
    links: [
      { label: 'All products', to: '/products' as const },
      { label: 'New arrivals', to: '/products' as const, search: { sort: 'newest' as const } },
      { label: 'Offers', to: '/products' as const, search: { sort: 'discount-desc' as const } },
    ],
  },
  {
    title: 'Categories',
    links: [
      { label: 'Kurti', to: '/products' as const, search: { category: 'kurti' } },
      { label: 'Co-ord sets', to: '/products' as const, search: { category: 'co-ord-sets' } },
      { label: 'Short Top', to: '/products' as const, search: { category: 'short-top' } },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Checkout', to: '/checkout' as const },
      { label: 'Size chart', to: '/products' as const },
      { label: 'Secure payment', to: '/checkout' as const },
    ],
  },
]

const footerBenefits: Array<{ Icon: LucideIcon; copy: string; title: string }> = [
  {
    Icon: ShieldCheck,
    title: 'Secure payments',
    copy: 'Pay safely with UPI, cards, wallets, and more.',
  },
  {
    Icon: Truck,
    title: 'Clear shipping',
    copy: `${formatPrice(shippingConfig.standardShippingPaise)} shipping below ${formatPrice(
      shippingConfig.freeShippingThresholdPaise,
    )}.`,
  },
  {
    Icon: RefreshCcw,
    title: 'Easy exchanges',
    copy: '7-day size exchanges on eligible pieces.',
  },
  {
    Icon: ShoppingBag,
    title: 'Easy shopping',
    copy: 'Available sizes are shown before you add to bag.',
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-paper)] px-4 pb-28 pt-10 sm:px-6 sm:pb-10 lg:px-8">
      <div className="mx-auto grid max-w-[90rem] gap-10">
        <div className="grid items-center gap-7 py-5 md:grid-cols-[minmax(0,1fr)_minmax(320px,520px)] md:py-8">
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Fresh drops and fit notes
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl font-normal leading-none text-[var(--color-ink)] sm:text-5xl">
              Easy pieces for repeat plans.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--color-muted)] sm:text-base">
              Short tops, kurtis, and coordinated sets with happy color, clean fits, and prices made
              for repeat shopping.
            </p>
          </div>
          <form className="flex w-full items-center border border-[var(--color-line)] bg-[var(--color-paper)]" aria-label="Join Trenzura updates">
            <label className="sr-only" htmlFor="footer-newsletter-email">
              Email address
            </label>
            <input
              id="footer-newsletter-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              className="h-14 min-w-0 flex-1 bg-transparent px-4 text-sm text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)] focus:bg-[var(--color-surface-soft)]"
            />
            <button
              type="button"
              aria-label="Join Trenzura updates"
              className="grid h-14 w-14 shrink-0 place-items-center bg-[var(--color-primary)] text-[var(--color-paper)] transition duration-150 ease-out hover:bg-[var(--color-primary-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <ArrowRight className="size-5" aria-hidden="true" />
            </button>
          </form>
        </div>

        <div className="flex flex-col justify-between gap-8 border-t border-[var(--color-line)] pt-8 text-sm text-[var(--color-muted)] md:flex-row">
          <div>
            <Link to="/" className="font-serif text-3xl font-normal leading-none text-[var(--color-ink)]">
              Trenzura
            </Link>
            <p className="mt-3 max-w-sm leading-6">
              Everyday Indian wear with straightforward sizing, quick checkout, and easy exchanges.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {footerSections.map((section) => (
              <div key={section.title}>
                <h2 className="mb-3 text-sm font-medium text-[var(--color-ink)]">{section.title}</h2>
                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={`${section.title}-${link.label}`}>
                      {link.to === '/products' ? (
                        <Link
                          to={link.to}
                          search={link.search}
                          className="transition duration-150 ease-out hover:text-[var(--color-primary)]"
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <Link
                          to={link.to}
                          className="transition duration-150 ease-out hover:text-[var(--color-primary)]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 border-t border-[var(--color-line)] py-7 sm:grid-cols-2 lg:grid-cols-4">
          {footerBenefits.map(({ Icon, title, copy }) => (
            <div key={title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-primary)]">
                <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-medium text-[var(--color-ink)]">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{copy}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-between gap-3 border-t border-[var(--color-line)] pt-6 text-xs text-[var(--color-muted)] sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} Trenzura. All rights reserved.</p>
          <p>Built for clear sizing, quick checkout, and repeat shopping.</p>
        </div>
      </div>
    </footer>
  )
}
