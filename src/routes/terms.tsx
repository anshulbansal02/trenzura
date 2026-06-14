import { createFileRoute } from '@tanstack/react-router'

import { formatPrice } from '../lib/format'
import { shippingConfig } from '../lib/shipping'
import { createPageMeta } from '../lib/seo'

export const Route = createFileRoute('/terms')({
  head: () =>
    createPageMeta({
      title: 'Terms | Trenzura',
      description: 'Terms for shopping on Trenzura.',
      path: '/terms',
    }),
  component: TermsPage,
})

function TermsPage() {
  return (
    <main className="px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-[var(--color-muted)]">Terms</p>
        <h1 className="mt-3 font-serif text-5xl font-normal leading-none text-[var(--color-ink)] sm:text-6xl">
          Terms for buying from Trenzura.
        </h1>
        <div className="mt-8 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)] text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          <section className="py-5">
            <h2 className="text-base font-medium text-[var(--color-ink)]">Orders</h2>
            <p className="mt-2">
              Orders are confirmed after successful payment and availability checks. Product price,
              size, quantity, shipping, and total are shown before payment.
            </p>
          </section>
          <section className="py-5">
            <h2 className="text-base font-medium text-[var(--color-ink)]">Shipping</h2>
            <p className="mt-2">
              Shipping is free above {formatPrice(shippingConfig.freeShippingThresholdPaise)}.
              Orders below that amount use the shipping charge shown at checkout.
            </p>
          </section>
          <section className="py-5">
            <h2 className="text-base font-medium text-[var(--color-ink)]">Returns</h2>
            <p className="mt-2">
              Eligible pieces can be returned within 7 days after delivery when they are unused,
              unwashed, and returned with original packaging and tags where applicable.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
