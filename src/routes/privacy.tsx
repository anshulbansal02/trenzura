import { createFileRoute } from '@tanstack/react-router'

import { createPageMeta } from '../lib/seo'

export const Route = createFileRoute('/privacy')({
  head: () =>
    createPageMeta({
      title: 'Privacy | Trenzura',
      description: 'Privacy information for Trenzura customers.',
      path: '/privacy',
    }),
  component: PrivacyPage,
})

function PrivacyPage() {
  return (
    <main className="px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-[var(--color-muted)]">Privacy</p>
        <h1 className="mt-3 font-serif text-5xl font-normal leading-none text-[var(--color-ink)] sm:text-6xl">
          Customer information is used to process orders.
        </h1>
        <div className="mt-8 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)] text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          <section className="py-5">
            <h2 className="text-base font-medium text-[var(--color-ink)]">Information we use</h2>
            <p className="mt-2">
              We collect the details needed to place, confirm, ship, and support orders, including
              contact details, shipping address, selected items, and payment status.
              If you opt in at checkout, your phone number may also be used for WhatsApp order
              confirmation and shipping updates.
            </p>
          </section>
          <section className="py-5">
            <h2 className="text-base font-medium text-[var(--color-ink)]">Payments</h2>
            <p className="mt-2">
              Payments are handled through the checkout provider. Trenzura does not store full card,
              UPI, wallet, or net-banking credentials in the storefront.
            </p>
          </section>
          <section className="py-5">
            <h2 className="text-base font-medium text-[var(--color-ink)]">Support</h2>
            <p className="mt-2">
              Order and contact information may be used to respond to customer support requests,
              returns, shipping updates, and payment checks.
            </p>
          </section>
        </div>
      </section>
    </main>
  )
}
