import { createFileRoute } from '@tanstack/react-router'

import { createPageMeta } from '../lib/seo'

export const Route = createFileRoute('/contact')({
  head: () =>
    createPageMeta({
      title: 'Contact | Trenzura',
      description: 'Contact Trenzura for order, shipping, return, and product questions.',
      path: '/contact',
    }),
  component: ContactPage,
})

function ContactPage() {
  return (
    <main className="px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-[var(--color-muted)]">Contact</p>
        <h1 className="mt-3 font-serif text-5xl font-normal leading-none text-[var(--color-ink)] sm:text-6xl">
          Help with orders and product questions.
        </h1>
        <div className="mt-8 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)] text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          <section className="py-5">
            <h2 className="text-base font-medium text-[var(--color-ink)]">Order support</h2>
            <p className="mt-2">
              Use the contact details shown on your order confirmation for order-specific help. Keep
              your order ID ready so the team can check payment, shipping, or return details.
            </p>
          </section>
          <section className="py-5">
            <h2 className="text-base font-medium text-[var(--color-ink)]">Product questions</h2>
            <p className="mt-2">
              For size, fabric, or product-detail questions, share the product code from the product
              page so the exact variant can be reviewed.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
