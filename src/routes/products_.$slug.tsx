import { Accordion } from '@base-ui/react/accordion'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'
import { useEffect } from 'react'

import { ProductGallery } from '../components/product/ProductGallery'
import { ProductCard } from '../components/product/ProductCard'
import { ProductPurchasePanel } from '../components/product/ProductPurchasePanel'
import { ProductReasons } from '../components/product/ProductReasons'
import {
  RecentlyViewedRail,
  rememberRecentlyViewedProduct,
} from '../components/product/RecentlyViewed'
import { getProductBySlug, products } from '../data/products'
import { formatPrice } from '../lib/format'
import { createPageMeta, createProductJsonLd } from '../lib/seo'

const defaultProductAccordionValue = ['fit']

export const Route = createFileRoute('/products_/$slug')({
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug)

    if (!product) {
      throw notFound()
    }

    return { product }
  },
  head: ({ params }) => {
    const product = getProductBySlug(params.slug)

    if (!product) {
      return createPageMeta({
        title: 'Product not found | Trenzura',
        description: 'This Trenzura product is unavailable.',
        path: '/products',
      })
    }

    const seo = createPageMeta({
      title: `${product.title} | Trenzura`,
      description: product.description,
      path: `/products/${product.slug}`,
      image: product.images[0],
      type: 'product',
    })

    return {
      ...seo,
      meta: [
        ...seo.meta,
        { property: 'product:price:amount', content: String(product.sellingPricePaise / 100) },
        { property: 'product:price:currency', content: 'INR' },
      ],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(createProductJsonLd(product)),
        },
      ],
    }
  },
  component: ProductPreviewPage,
})

function ProductPreviewPage() {
  const { product } = Route.useLoaderData()
  const relatedProducts = products
    .filter(
      (item) =>
        item.category === product.category && item.productId !== product.productId,
    )
    .slice(0, 4)
  const availableSizeLabels = product.sizes
    .filter((size) => size.stockAvailable > 0)
    .map((size) => size.label)

  useEffect(() => {
    rememberRecentlyViewedProduct(product)
  }, [product])

  return (
    <main className="px-4 pb-28 pt-8 sm:px-6 sm:pt-10 lg:px-8 lg:pb-14 lg:pt-4">
      <div className="mx-auto max-w-[90rem]">
        <section className="grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:gap-14">
          <div className="min-w-0 max-w-full lg:sticky lg:top-28 lg:self-start">
            <ProductGallery product={product} />
          </div>

          <div className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            <nav
              aria-label="Product breadcrumb"
              className="mb-6 flex min-w-0 flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]"
            >
              <Link to="/products" className="transition hover:text-[var(--color-ink)]">
                Shop
              </Link>
              <span aria-hidden="true">/</span>
              <span className="min-w-0 break-words text-[var(--color-ink)]">
                {product.title}
              </span>
            </nav>

            <section className="border-b border-[var(--color-line)] pb-7">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-[var(--color-muted)]">{product.categoryLabel}</p>
                {product.featured ? (
                  <p className="bg-[var(--color-surface)] px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--color-primary)]">
                    Most wanted
                  </p>
                ) : null}
                <p className="bg-[var(--color-blush-surface)] px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-[var(--color-accent-muted)]">
                  {product.stockAvailable > 0 ? 'In stock' : 'Sold out'}
                </p>
              </div>
              <h1 className="mt-3 min-w-0 break-words font-serif text-5xl font-normal leading-none text-[var(--color-ink)] sm:text-6xl [overflow-wrap:anywhere]">
                {product.title}
              </h1>
              <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-2">
                <p className="text-2xl font-medium leading-tight text-[var(--color-primary)]">
                  {formatPrice(product.sellingPricePaise)}
                </p>
                {product.discountPercent > 0 ? (
                  <>
                    <p className="text-sm text-[var(--color-muted)] line-through">
                      {formatPrice(product.mrpPaise)}
                    </p>
                    <p className="border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 px-2 py-1 text-xs font-medium uppercase text-[var(--color-primary)]">
                      {product.discountPercent}% off
                    </p>
                  </>
                ) : null}
              </div>

              <p className="mt-5 max-w-xl text-base leading-7 text-[var(--color-muted)]">
                {product.description}
              </p>
            </section>

            <div id="buy-panel" className="mt-7 scroll-mt-24">
              <ProductPurchasePanel product={product} showPrice={false} />
            </div>

            <div className="mt-6">
              <ProductReasons product={product} includeAvailability={false} />
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-10 border-y border-[var(--color-line)] py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)]">
          <div>
            <h2 className="font-serif text-3xl font-normal leading-none text-[var(--color-ink)]">About this piece</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
              Designed for repeat wear: easy to style, comfortable through the day, and clear enough
              to buy without guessing on fit, availability, or delivery.
            </p>

            <Accordion.Root
              defaultValue={defaultProductAccordionValue}
              className="mt-7 divide-y divide-[var(--color-line)]"
            >
              <Accordion.Item value="fit">
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between py-4 text-left text-sm font-medium text-[var(--color-ink)] outline-none transition duration-150 ease-out hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2">
                    Fit and sizing
                    <ChevronDown
                      className="size-4 text-[var(--color-muted)] transition duration-150 ease-out group-data-panel-open:rotate-180"
                      aria-hidden="true"
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel className={accordionPanelClass}>
                  <div className="pb-5">
                    Available in {availableSizeLabels.join(', ')}. Measurements below are garment
                    measurements, so compare them with a similar piece you already like before choosing
                    a size.
                  </div>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="delivery">
                <Accordion.Header>
                  <Accordion.Trigger className="group flex w-full items-center justify-between py-4 text-left text-sm font-medium text-[var(--color-ink)] outline-none transition duration-150 ease-out hover:text-[var(--color-primary)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2">
                    Delivery and exchanges
                    <ChevronDown
                      className="size-4 text-[var(--color-muted)] transition duration-150 ease-out group-data-panel-open:rotate-180"
                      aria-hidden="true"
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Panel className={accordionPanelClass}>
                  <div className="pb-5">
                    Ships within 1-2 business days. Tracking is shared after dispatch, and eligible
                    size exchanges can be requested within 7 days.
                  </div>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion.Root>
          </div>

          {product.sizeChart.length > 0 ? (
            <div id="size-chart" className="scroll-mt-24">
              <h2 className="text-sm font-medium text-[var(--color-ink)]">Size chart</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Measurements are garment measurements. Pick your usual size for a regular fit.
              </p>
              <div className="mt-4 overflow-hidden border border-[var(--color-line)] bg-[var(--color-paper)]">
                <table className="w-full text-left text-sm">
                  <tbody>
                    {product.sizeChart.map((row) => (
                      <tr
                        key={row.size}
                        className="border-b border-[var(--color-line)] last:border-b-0"
                      >
                        <th className="w-20 bg-[var(--color-surface)] px-4 py-3 font-medium text-[var(--color-ink)]">
                          {row.size}
                        </th>
                        <td className="px-4 py-3 text-[var(--color-muted)]">
                          {Object.entries(row.measurements)
                            .map(([label, value]) => `${label}: ${value}`)
                            .join(' / ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </section>

        {relatedProducts.length > 0 ? (
          <section className="mt-14">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--color-muted)]">Keep browsing</p>
                <h2 className="mt-2 font-serif text-5xl font-normal leading-none text-[var(--color-ink)]">
                  More from this edit
                </h2>
              </div>
              <Link
                to="/products"
                search={{ category: product.category }}
                className="text-sm font-medium text-[var(--color-ink)] underline-offset-4 transition hover:underline"
              >
                View edit
              </Link>
            </div>
            <div className="mt-7 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((item) => (
                <ProductCard key={item.productId} product={item} />
              ))}
            </div>
          </section>
        ) : null}

        <RecentlyViewedRail
          excludeProductId={product.productId}
          limit={4}
          className="mt-14"
          title="Recently viewed"
        />

      </div>
    </main>
  )
}

const accordionPanelClass =
  'h-[var(--accordion-panel-height)] overflow-hidden text-sm leading-6 text-[var(--color-muted)] transition-[height,opacity] duration-200 ease-out data-[ending-style]:h-0 data-[ending-style]:opacity-0 data-[starting-style]:h-0 data-[starting-style]:opacity-0'
