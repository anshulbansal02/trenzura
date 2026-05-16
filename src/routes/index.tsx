import { Button } from '@base-ui/react/button'
import { Link, createFileRoute } from '@tanstack/react-router'
import {
  HeartHandshake,
  RefreshCcw,
  Ruler,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from 'lucide-react'

import { ProductGrid } from '../components/product/ProductGrid'
import { RecentlyViewedRail } from '../components/product/RecentlyViewed'
import { StyleFinder } from '../components/product/StyleFinder'
import {
  categoryLabels,
  featuredProducts,
  productCategories,
  productPriceRange,
  products,
} from '../data/products'
import { formatPrice } from '../lib/format'
import { getProductImage, getProductImageProps } from '../lib/product-images'
import { createPageMeta } from '../lib/seo'

export const Route = createFileRoute('/')({
  head: () =>
    createPageMeta({
      title: 'Trenzura | Short Tops, Kurtis and Co-ord Sets',
      description:
        'Shop printed short tops, kurtis, and coordinated sets for everyday plans, festive lunches, and easy occasion wear.',
      path: '/',
      image: products[0] ? getProductImage(products[0], 0) : undefined,
    }),
  component: Home,
})

function Home() {
  if (products.length === 0) {
    return (
      <main className="pb-24 sm:pb-0">
        <section className="border-b border-[var(--color-line)] bg-[var(--color-paper)]">
          <div className="fashion-container flex min-h-[72svh] items-center py-16">
            <div className="max-w-xl">
              <p className="fashion-eyebrow">Catalog pending</p>
              <h1 className="fashion-display mt-4 text-4xl leading-[1.04] sm:text-5xl">
                Trenzura
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[var(--color-muted)] sm:text-lg">
                The storefront catalog has not been published yet.
              </p>
              <Button
                nativeButton={false}
                render={<Link to="/products" className="fashion-button-primary mt-8 h-12 px-6" />}
              >
                View products
              </Button>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const heroProduct = products[0]
  const categoryTiles = productCategories.slice(0, 3).map((category) => {
    const product = products.find((item) => item.category === category) ?? products[0]
    return { category, product }
  })
  const newArrivals = products.slice(0, 3)
  const imageStoryProducts = products.slice(3, 7)
  const heroGallery = [
    products[1] ?? heroProduct,
    heroProduct,
    products[3] ?? products[2] ?? heroProduct,
  ]
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
    <main className="pb-24 sm:pb-0">
      <section className="relative overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="fashion-container grid min-h-[82svh] gap-8 py-7 lg:grid-cols-[minmax(0,0.72fr)_minmax(540px,1fr)] lg:items-stretch lg:py-10">
          <div className="flex items-center py-10 lg:py-16">
            <div className="max-w-xl">
              <p className="fashion-eyebrow">Fresh drops, every week</p>
              <h1 className="fashion-display mt-4 text-4xl leading-[1.04] sm:text-5xl lg:text-6xl">
                Trenzura
              </h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-[var(--color-muted)] sm:text-lg">
                Easy short tops, kurtis, and coordinated sets with happy color, clean fits, and
                prices made for repeat shopping.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      to="/products"
                      search={{ sort: 'newest' }}
                      className="fashion-button-primary h-12 px-6"
                    />
                  }
                >
                  Shop new arrivals
                </Button>
                <StyleFinder
                  triggerLabel="Find my style"
                  triggerClassName="fashion-button-secondary h-12 gap-2 px-6"
                />
              </div>
              <div className="mt-9 grid grid-cols-3 gap-3 text-center">
                <div className="border-y border-[var(--color-line)] py-3">
                  <p className="text-lg font-semibold text-[var(--color-ink)]">
                    {formatPrice(productPriceRange.min)}+
                  </p>
                  <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">Easy buys</p>
                </div>
                <div className="border-y border-[var(--color-line)] py-3">
                  <p className="text-lg font-semibold text-[var(--color-ink)]">7 days</p>
                  <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">Exchanges</p>
                </div>
                <div className="border-y border-[var(--color-line)] py-3">
                  <p className="text-lg font-semibold text-[var(--color-ink)]">1-2 days</p>
                  <p className="mt-1 text-xs font-medium text-[var(--color-muted)]">Ships fast</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid min-h-[520px] gap-3 sm:grid-cols-[0.7fr_1fr_0.7fr] lg:min-h-[680px]">
            {heroGallery.map((product, index) => (
              <Link
                key={product.productId}
                to="/products/$slug"
                params={{ slug: product.slug }}
                className={`group relative overflow-hidden rounded-lg bg-[var(--color-line)] ${
                  index === 1 ? 'sm:my-0' : 'hidden sm:block sm:my-10'
                }`}
              >
                <img
                  {...getProductImageProps(product, 0, index === 1 ? '(min-width: 1024px) 36vw, 100vw' : '22vw')}
                  alt={product.imageAlt}
                  loading={index === 1 ? undefined : 'lazy'}
                  decoding="async"
                  fetchPriority={index === 1 ? 'high' : undefined}
                  className="h-full w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.025]"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgb(77_16_16_/_0.72)] to-transparent p-4 text-white">
                  <p className="text-xs font-semibold">{index === 1 ? 'Most wanted' : 'New in'}</p>
                  <p className="mt-1 text-sm font-medium">{product.title}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <div className="fashion-container grid gap-4 py-4 text-sm text-[var(--color-ink)] sm:grid-cols-2 lg:grid-cols-4">
          {trustSignals.map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-3 font-bold">
              <Icon className="size-4 text-[var(--color-sage)]" aria-hidden="true" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="fashion-container py-12 lg:py-16">
        <div className="mb-7 flex items-end justify-between gap-6">
          <div>
            <p className="fashion-eyebrow">Kurtis crafted for every mood</p>
            <h2 className="fashion-display mt-2 text-2xl sm:text-3xl">Shop by style</h2>
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
              className="group relative overflow-hidden rounded-lg bg-[var(--color-line)] shadow-sm"
            >
              <img
                {...getProductImageProps(product, 0, '(min-width: 768px) 33vw, 100vw')}
                alt={product.imageAlt}
                loading="lazy"
                decoding="async"
                className="aspect-[3/4] h-full w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgb(77_16_16_/_0.7))]" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-[var(--color-paper)]">
                <p className="text-xs font-semibold uppercase text-[var(--color-paper)]/82">Shop</p>
                <h2 className="mt-2 text-xl font-medium">
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
            <p className="fashion-eyebrow">Loved by shoppers</p>
            <h2 className="fashion-display mt-2 text-2xl sm:text-3xl">
              Best sellers
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
        <div className="mb-7 flex items-end justify-between gap-6">
          <div>
            <p className="fashion-eyebrow">The cotton edit</p>
            <h2 className="fashion-display mt-2 text-2xl sm:text-3xl">Color, print, repeat</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {imageStoryProducts.map((product, index) => (
            <Link
              key={product.productId}
              to="/products/$slug"
              params={{ slug: product.slug }}
              className={`group relative min-h-80 overflow-hidden rounded-lg bg-[var(--color-line)] ${
                index % 2 === 0 ? 'lg:mt-8' : ''
              }`}
            >
              <img
                {...getProductImageProps(product, index % product.images.length, '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw')}
                alt={product.imageAlt}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.025]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgb(77_16_16_/_0.72)] to-transparent p-4 text-white">
                <p className="text-xs font-semibold uppercase">{product.categoryLabel}</p>
                <h2 className="mt-1 text-base font-medium">{product.title}</h2>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="fashion-container py-10 lg:py-16">
        <div className="grid gap-8 border-y border-[var(--color-line)] py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="grid grid-cols-2 gap-3">
            {newArrivals.concat(products.slice(7, 8)).slice(0, 4).map((product, index) => (
              <Link
                key={product.productId}
                to="/products/$slug"
                params={{ slug: product.slug }}
                className={`group overflow-hidden rounded-lg bg-[var(--color-line)] ${
                  index === 0 ? 'row-span-2' : ''
                }`}
              >
                <img
                  {...getProductImageProps(product, index % product.images.length, index === 0 ? '(min-width: 1024px) 25vw, 50vw' : '25vw')}
                  alt={product.imageAlt}
                  loading="lazy"
                  decoding="async"
                  className={`${index === 0 ? 'h-full min-h-[520px]' : 'aspect-[4/5]'} w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.025]`}
                />
              </Link>
            ))}
          </div>
          <div>
            <p className="fashion-eyebrow">Latest arrivals</p>
            <h2 className="fashion-display mt-2 text-2xl sm:text-3xl">
              New arrivals, ready to wear
            </h2>
            <div className="mt-8 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
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

      <section className="border-y border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="fashion-container grid gap-8 py-12 md:grid-cols-4">
          {footerBenefits.map(({ Icon, title, copy }) => (
            <div key={title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-rouge)] shadow-sm">
                <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-medium text-[var(--color-ink)]">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
