import { Link } from '@tanstack/react-router'
import { RefreshCcw, ShieldCheck, ShoppingBag, Truck, type LucideIcon } from 'lucide-react'

import { formatPrice } from '../../lib/format'
import type { ProductSearchState } from '../../lib/product-search-url'
import { shippingConfig } from '../../lib/shipping'
import { RazorpayLogo } from '../payment/RazorpayLogo'

type FooterLink =
  | {
      label: string
      to: '/checkout'
    }
  | {
      label: string
      to: '/about' | '/shipping-returns' | '/contact' | '/terms' | '/privacy'
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
    title: 'Company',
    links: [
      { label: 'About', to: '/about' as const },
      { label: 'Contact', to: '/contact' as const },
      { label: 'Shipping & returns', to: '/shipping-returns' as const },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', to: '/terms' as const },
      { label: 'Privacy', to: '/privacy' as const },
      { label: 'Checkout', to: '/checkout' as const },
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
    copy: `Free shipping above ${formatPrice(shippingConfig.freeShippingThresholdPaise)}.`,
  },
  {
    Icon: RefreshCcw,
    title: 'Returns',
    copy: '7-day returns on eligible pieces after delivery.',
  },
  {
    Icon: ShoppingBag,
    title: 'Order review',
    copy: 'Size, quantity, shipping, and total are shown before payment.',
  },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-paper)] px-4 pb-28 pt-10 sm:px-6 sm:pb-10 lg:px-8">
      <div className="mx-auto grid max-w-[90rem] gap-10">
        <div className="py-5 md:py-8">
          <div>
            <p className="text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
              Trenzura
            </p>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl font-normal leading-none text-[var(--color-ink)] sm:text-5xl">
              Everyday Indian wear, kept straightforward.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--color-muted)] sm:text-base">
              Short tops, kurtis, and coordinated sets with clear prices, size selection, secure
              checkout, and delivery details shown before payment.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-8 border-t border-[var(--color-line)] pt-8 text-sm text-[var(--color-muted)] md:flex-row">
          <div>
            <Link
              to="/"
              aria-label="Trenzura home"
              className="inline-flex transition duration-150 ease-out hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
            >
              <img
                src="/favicon.svg"
                alt="Trenzura"
                className="size-12"
              />
            </Link>
            <p className="mt-3 max-w-sm leading-6">
              Everyday Indian wear with straightforward sizing, clear checkout, and eligible returns.
            </p>
            <RazorpayBadge />
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
          <p className="inline-flex items-center gap-2">
            <span>Secure checkout powered by</span>
            <RazorpayLogo className="h-3.5 w-auto" />
          </p>
        </div>
      </div>
    </footer>
  )
}

function RazorpayBadge() {
  return (
    <div className="mt-5 inline-flex items-center gap-2 border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-3 py-2 text-xs font-medium text-[var(--color-ink)]">
      <span>Secure checkout powered by</span>
      <span className="h-4 w-px bg-[var(--color-line)]" aria-hidden="true" />
      <RazorpayLogo className="h-4 w-auto" />
    </div>
  )
}
