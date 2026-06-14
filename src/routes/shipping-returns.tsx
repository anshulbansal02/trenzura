import { createFileRoute } from '@tanstack/react-router'

import { formatPrice } from '../lib/format'
import { shippingConfig } from '../lib/shipping'
import { createPageMeta } from '../lib/seo'

export const Route = createFileRoute('/shipping-returns')({
  head: () =>
    createPageMeta({
      title: 'Shipping & Returns | Trenzura',
      description: 'Shipping charges, dispatch timing, and return eligibility for Trenzura orders.',
      path: '/shipping-returns',
    }),
  component: ShippingReturnsPage,
})

function ShippingReturnsPage() {
  return (
    <main className="px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-[var(--color-muted)]">Shipping & returns</p>
        <h1 className="mt-3 font-serif text-5xl font-normal leading-none text-[var(--color-ink)] sm:text-6xl">
          Clear shipping and eligible returns.
        </h1>
        <div className="mt-8 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)] text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          <section className="py-5">
            <h2 className="text-base font-medium text-[var(--color-ink)]">Shipping</h2>
            <p className="mt-2">
              Orders usually ship in 1-2 business days after order confirmation. Shipping is free
              above {formatPrice(shippingConfig.freeShippingThresholdPaise)}. Below that, standard
              shipping is {formatPrice(shippingConfig.standardShippingPaise)}.
            </p>
          </section>
          <section className="py-5">
            <h2 className="text-base font-medium text-[var(--color-ink)]">Returns</h2>
            <p className="mt-2">
              Eligible pieces can be returned within 7 days after delivery. Items should be unused,
              unwashed, and returned with original packaging and tags where applicable.
            </p>
          </section>
          <section className="py-5">
            <h2 className="text-base font-medium text-[var(--color-ink)]">Order review</h2>
            <p className="mt-2">
              Size, quantity, shipping, and total amount are shown before payment so you can review
              the order before placing it.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
