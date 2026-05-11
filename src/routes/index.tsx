import { Button } from '@base-ui/react/button'
import { Link, createFileRoute } from '@tanstack/react-router'

import { ProductGrid } from '../components/product/ProductGrid'
import {
  categoryLabels,
  featuredProducts,
  productCategories,
  products,
} from '../data/products'
import { formatPrice } from '../lib/format'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  const heroProduct = products[0]
  const categoryTiles = productCategories.slice(0, 3).map((category) => {
    const product = products.find((item) => item.category === category) ?? products[0]
    return { category, product }
  })
  const newArrivals = products.slice(0, 3)

  return (
    <main>
      <section className="relative min-h-[82svh] overflow-hidden bg-[var(--color-ink)]">
        <img
          src={heroProduct.images[0]}
          alt={heroProduct.imageAlt}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(23_19_16_/_0.72),rgb(23_19_16_/_0.34),rgb(23_19_16_/_0.16))]" />
        <div className="fashion-container relative flex min-h-[82svh] items-end pb-14 pt-24 lg:pb-18">
          <div className="max-w-3xl text-[var(--color-paper)]">
            <p className="text-xs font-semibold uppercase text-[var(--color-paper)]/80">
              The festive everyday edit
            </p>
            <h1 className="mt-4 font-serif text-6xl font-normal leading-[0.95] text-[var(--color-paper)] sm:text-8xl lg:text-9xl">
              Trenzura
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[var(--color-paper)]/86 sm:text-lg">
              Printed kurtis and coordinated sets with an easy, polished feel. Made to move from
              weekday errands to small celebrations without changing the rhythm of your day.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                nativeButton={false}
                render={
                  <Link
                    to="/products"
                    className="fashion-button-primary h-12 bg-[var(--color-paper)] px-6 text-[var(--color-ink)] hover:bg-white"
                  />
                }
              >
                Shop new arrivals
              </Button>
              <Button
                nativeButton={false}
                render={
                  <Link
                    to="/products/$slug"
                    params={{ slug: heroProduct.slug }}
                    className="inline-flex h-12 items-center rounded-full border border-[var(--color-paper)]/70 px-6 text-sm font-semibold text-[var(--color-paper)] transition duration-200 ease-out hover:-translate-y-0.5 hover:bg-[var(--color-paper)]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-paper)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-ink)] active:translate-y-0 active:scale-[0.99]"
                  />
                }
              >
                View the lead piece
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="fashion-container py-12 lg:py-16">
        <div className="mb-7 flex items-end justify-between gap-6">
          <div>
            <p className="fashion-eyebrow">Shop by mood</p>
            <h2 className="fashion-display mt-2 text-4xl sm:text-5xl">Curated edits</h2>
          </div>
          <Link
            to="/products"
            className="hidden text-sm font-semibold text-[var(--color-ink)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-rouge)] hover:decoration-[var(--color-rouge)] sm:inline"
          >
            View all
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {categoryTiles.map(({ category, product }) => (
            <Link
              key={category}
              to="/products"
              search={{ category }}
              className="group relative min-h-96 overflow-hidden rounded-[1.25rem] bg-[var(--color-line)] shadow-sm"
            >
              <img
                src={product.images[0]}
                alt={product.imageAlt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgb(23_19_16_/_0.7))]" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-[var(--color-paper)]">
                <p className="text-xs font-semibold uppercase text-[var(--color-paper)]/76">Shop</p>
                <h2 className="mt-2 font-serif text-3xl font-normal">
                  {categoryLabels[category]}
                </h2>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="fashion-container py-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="fashion-eyebrow">Featured</p>
            <h2 className="fashion-display mt-2 text-4xl sm:text-5xl">
              Pieces with presence
            </h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-[var(--color-ink)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-rouge)] hover:decoration-[var(--color-rouge)]"
          >
            View all products
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      <section className="fashion-container py-10 lg:py-16">
        <div className="fashion-surface grid overflow-hidden rounded-[1.5rem] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="min-h-96 bg-[var(--color-line)]">
            <img
              src={newArrivals[0]?.images[1] ?? heroProduct.images[0]}
              alt={newArrivals[0]?.imageAlt ?? heroProduct.imageAlt}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="fashion-eyebrow">Latest drops</p>
            <h2 className="fashion-display mt-2 text-4xl sm:text-5xl">
              Quiet details, easy silhouettes
            </h2>
            <div className="mt-8 divide-y divide-[var(--color-line)]">
              {newArrivals.map((product) => (
                <Link
                  key={product.productId}
                  to="/products/$slug"
                  params={{ slug: product.slug }}
                  className="flex items-center justify-between gap-5 py-4 text-sm transition duration-150 ease-out hover:translate-x-1"
                >
                  <span>
                    <span className="block font-medium text-[var(--color-ink)]">
                      {product.title}
                    </span>
                    <span className="mt-1 block text-[var(--color-muted)]">
                      {product.categoryLabel}
                    </span>
                  </span>
                  <span className="font-medium text-[var(--color-ink)]">
                    {formatPrice(product.sellingPricePaise)}
                  </span>
                </Link>
              ))}
            </div>
            <Button
              nativeButton={false}
              render={
                <Link
                  to="/products"
                  search={{ sort: 'discount-desc' }}
                  className="fashion-button-primary mt-8 h-12 px-6"
                />
              }
            >
              Browse offers
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="fashion-container grid gap-8 py-12 md:grid-cols-4">
          {[
            ['Free shipping', `Applied on orders over ${formatPrice(250000)}.`],
            ['Easy exchanges', 'Simple 7-day exchange flow for size issues.'],
            ['Secure payments', 'Razorpay-ready checkout architecture.'],
            ['Stock aware', 'Size availability stays visible before cart.'],
          ].map(([title, copy]) => (
            <div key={title}>
              <h3 className="font-serif text-xl text-[var(--color-ink)]">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{copy}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
