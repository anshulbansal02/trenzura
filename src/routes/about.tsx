import { createFileRoute } from '@tanstack/react-router'

import { createPageMeta } from '../lib/seo'

export const Route = createFileRoute('/about')({
  head: () =>
    createPageMeta({
      title: 'About | Trenzura',
      description: 'Learn about Trenzura and our approach to everyday Indian wear.',
      path: '/about',
    }),
  component: AboutPage,
})

function AboutPage() {
  return (
    <main className="px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-[var(--color-muted)]">About Trenzura</p>
        <h1 className="mt-3 font-serif text-5xl font-normal leading-none text-[var(--color-ink)] sm:text-6xl">
          Everyday pieces with clear buying details.
        </h1>
        <div className="mt-7 grid gap-5 text-sm leading-7 text-[var(--color-muted)] sm:text-base">
          <p>
            Trenzura focuses on wearable Indian styles such as short tops, kurtis, and coordinated
            sets. The catalog is kept direct: clear product photos, visible size selection, variant
            details, and pricing before checkout.
          </p>
          <p>
            Orders are placed online through secure payment options. Shipping, return eligibility,
            size, quantity, and order totals are shown before payment.
          </p>
        </div>
      </section>
    </main>
  )
}
