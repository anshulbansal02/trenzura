import { Button } from '@base-ui/react/button'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  HeartHandshake,
  RefreshCcw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react'

import { ProductGrid } from '../components/product/ProductGrid'
import { RecentlyViewedRail } from '../components/product/RecentlyViewed'
import { StyleFinder } from '../components/product/StyleFinder'
import {
  categoryLabels,
  featuredProducts,
  productCategories,
  products,
} from '../data/products'
import { formatPrice } from '../lib/format'
import { createPageMeta } from '../lib/seo'

export const Route = createFileRoute('/')({
  head: () =>
    createPageMeta({
      title: 'Trenzura | Printed Kurtis and Sets',
      description:
        'Shop printed kurtis and coordinated sets for everyday plans, festive lunches, and easy occasion wear.',
      path: '/',
      image: products[0]?.images[0],
    }),
  component: Home,
})

function Home() {
  const heroProduct = products[0]
  const categoryTiles = productCategories.slice(0, 3).map((category) => {
    const product = products.find((item) => item.category === category) ?? products[0]
    return { category, product }
  })
  const newArrivals = products.slice(0, 3)
  const heroGallery = [
    products[1] ?? heroProduct,
    heroProduct,
    products[3] ?? products[2] ?? heroProduct,
  ]
  const heroPrice = formatPrice(heroProduct.sellingPricePaise)
  const trustSignals = [
    { Icon: Truck, label: 'Ships in 1-2 days' },
    { Icon: Ruler, label: 'Size chart on every product' },
    { Icon: ShieldCheck, label: 'Secure checkout' },
    { Icon: HeartHandshake, label: '7-day size exchanges' },
  ]
  const footerBenefits = [
    {
      Icon: Truck,
      title: 'Flat shipping',
      copy: 'Fixed shipping shown before payment.',
    },
    {
      Icon: RefreshCcw,
      title: 'Easy exchanges',
      copy: '7-day size exchanges on eligible pieces.',
    },
    {
      Icon: ShieldCheck,
      title: 'Secure payments',
      copy: 'Pay safely with UPI, cards, wallets, and more.',
    },
    {
      Icon: ShoppingBag,
      title: 'Easy shopping',
      copy: 'Available sizes are shown before you add to bag.',
    },
  ]

  return (
    <main>
      <section className="relative overflow-hidden bg-[var(--color-ink)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgb(114_52_61_/_0.26),transparent_30%),linear-gradient(115deg,#171310_0%,#171310_52%,#2b211d_100%)]" />
        <div className="fashion-container relative grid min-h-[82svh] gap-8 py-10 lg:grid-cols-[minmax(0,0.84fr)_minmax(520px,0.86fr)] lg:items-end lg:py-12">
          <div className="flex min-h-[54svh] items-end pb-4 pt-24 text-[var(--color-paper)] lg:min-h-[72svh] lg:pb-12">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase text-[var(--color-paper)]/80">
                The festive everyday edit
              </p>
              <h1 className="mt-4 font-serif text-6xl font-normal leading-[0.95] text-[var(--color-paper)] sm:text-8xl lg:text-9xl">
                Trenzura
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[var(--color-paper)]/86 sm:text-lg">
                Printed kurtis and coordinated sets for bright mornings, family lunches, and easy
                festive evenings. Comfortable silhouettes, polished details, and pieces you will
                reach for often.
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
                <StyleFinder
                  triggerLabel="Help me choose"
                  triggerClassName="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-paper)]/70 px-6 text-sm font-semibold text-[var(--color-paper)] transition duration-200 ease-out hover:bg-[var(--color-paper)]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-paper)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-ink)] active:scale-[0.99]"
                />
              </div>
              <div className="mt-8 flex flex-wrap gap-5 text-sm font-semibold text-[var(--color-paper)]/86">
                {categoryTiles.map(({ category }) => (
                  <Link
                    key={category}
                    to="/products"
                    search={{ category }}
                    className="border-b border-[var(--color-paper)]/35 pb-1 transition hover:border-[var(--color-paper)] hover:text-white"
                  >
                    Shop {categoryLabels[category]}
                  </Link>
                ))}
                <Link
                  to="/products"
                  search={{ sort: 'newest' }}
                  className="border-b border-[var(--color-paper)]/35 pb-1 transition hover:border-[var(--color-paper)] hover:text-white"
                >
                  New arrivals
                </Link>
              </div>
            </div>
          </div>
          <div className="relative mx-auto h-[560px] w-full max-w-[620px] self-end sm:h-[640px] lg:mx-0 lg:h-[720px] lg:justify-self-end">
            <Link
              to="/products/$slug"
              params={{ slug: heroGallery[0].slug }}
              className="group absolute bottom-4 left-0 hidden w-[42%] overflow-hidden rounded-[1rem] bg-[var(--color-line)] shadow-2xl shadow-stone-950/35 sm:block"
            >
              <img
                src={heroGallery[0].images[0]}
                alt={heroGallery[0].imageAlt}
                loading="lazy"
                decoding="async"
                className="aspect-[3/4] w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.025]"
              />
            </Link>
            <Link
              to="/products/$slug"
              params={{ slug: heroProduct.slug }}
              className="group absolute bottom-0 left-1/2 z-10 w-[62%] -translate-x-1/2 overflow-hidden rounded-[1.25rem] bg-[var(--color-line)] shadow-2xl shadow-stone-950/40"
            >
              <img
                src={heroProduct.images[0]}
                alt={heroProduct.imageAlt}
                decoding="async"
                fetchPriority="high"
                className="aspect-[3/4] w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.025]"
              />
            </Link>
            <Link
              to="/products/$slug"
              params={{ slug: heroGallery[2].slug }}
              className="group absolute right-0 top-10 hidden w-[38%] overflow-hidden rounded-[1rem] bg-[var(--color-line)] shadow-2xl shadow-stone-950/30 md:block"
            >
              <img
                src={heroGallery[2].images[0]}
                alt={heroGallery[2].imageAlt}
                loading="lazy"
                decoding="async"
                className="aspect-[3/4] w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.025]"
              />
            </Link>
            <Link
              to="/products/$slug"
              params={{ slug: heroProduct.slug }}
              className="absolute bottom-5 left-1/2 z-20 w-[min(360px,calc(100%-2.5rem))] -translate-x-1/2 rounded-[1rem] border border-[var(--color-paper)]/60 bg-[var(--color-paper)]/94 p-4 text-[var(--color-ink)] shadow-xl shadow-stone-950/20 backdrop-blur transition duration-200 ease-out hover:-translate-y-1 hover:bg-[var(--color-paper)]"
            >
              <div className="flex gap-4">
                <img
                  src={heroProduct.images[1] ?? heroProduct.images[0]}
                  alt={heroProduct.imageAlt}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/5] w-28 rounded-[0.75rem] object-cover"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-[var(--color-rouge)]">
                    Featured now
                  </p>
                  <h2 className="mt-2 text-base font-semibold">{heroProduct.title}</h2>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {heroProduct.categoryLabel}
                  </p>
                  <p className="mt-4 text-sm font-semibold">{heroPrice}</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="fashion-container grid gap-4 py-4 text-sm text-[var(--color-ink)] sm:grid-cols-2 lg:grid-cols-4">
          {trustSignals.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <Icon className="size-4 text-[var(--color-sage)]" aria-hidden="true" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="fashion-container py-12 lg:py-16">
        <div className="mb-7 flex items-end justify-between gap-6">
          <div>
            <p className="fashion-eyebrow">Shop by mood</p>
            <h2 className="fashion-display mt-2 text-4xl sm:text-5xl">Freshly picked</h2>
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
              className="group relative overflow-hidden rounded-[1.25rem] bg-[var(--color-line)] shadow-sm"
            >
              <img
                src={product.images[0]}
                alt={product.imageAlt}
                loading="lazy"
                decoding="async"
                className="aspect-[3/4] h-full w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.03]"
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

      <RecentlyViewedRail className="fashion-container py-8 lg:py-12" limit={4} />

      <section className="fashion-container py-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="fashion-eyebrow">This week</p>
            <h2 className="fashion-display mt-2 text-4xl sm:text-5xl">
              New favourites
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
        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              title: 'Real outfit context',
              copy: 'Every style shows multiple photos so shoppers can inspect shape, length, and drape before opening the product page.',
            },
            {
              title: 'No surprise stock',
              copy: 'Available sizes and low-stock cues are visible before add-to-bag, reducing dead ends during shopping.',
            },
            {
              title: 'Made for repeat wear',
              copy: 'Soft occasion pieces with clear prices, discounts, shipping, and exchange details surfaced early.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="border-t border-[var(--color-line)] pt-5"
            >
              <Sparkles className="size-5 text-[var(--color-rouge)]" aria-hidden="true" />
              <h2 className="mt-4 font-serif text-2xl text-[var(--color-ink)]">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="fashion-container py-10 lg:py-16">
        <div className="fashion-surface grid overflow-hidden rounded-[1.5rem] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="min-h-96 bg-[var(--color-line)]">
            <img
              src={newArrivals[0]?.images[1] ?? heroProduct.images[0]}
              alt={newArrivals[0]?.imageAlt ?? heroProduct.imageAlt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="fashion-eyebrow">Latest arrivals</p>
            <h2 className="fashion-display mt-2 text-4xl sm:text-5xl">
              Easy outfits, ready to wear
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
              Shop offers
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="fashion-container grid gap-8 py-12 md:grid-cols-4">
          {footerBenefits.map(({ Icon, title, copy }) => (
            <div key={title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-rouge)] shadow-sm">
                <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-serif text-xl text-[var(--color-ink)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
