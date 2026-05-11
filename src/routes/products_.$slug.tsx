import { Accordion } from '@base-ui/react/accordion'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { ChevronDown } from 'lucide-react'

import { ProductGallery } from '../components/product/ProductGallery'
import { ProductMedia } from '../components/product/ProductMedia'
import { ProductPurchasePanel } from '../components/product/ProductPurchasePanel'
import { getProductBySlug, products } from '../data/products'
import { formatPrice } from '../lib/format'

export const Route = createFileRoute('/products_/$slug')({
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug)

    if (!product) {
      throw notFound()
    }

    return { product }
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
    .slice(0, 3)

  return (
    <main className="fashion-container py-8 lg:py-12">
      <Link
        to="/products"
        className="text-sm font-semibold text-[var(--color-muted)] transition hover:text-[var(--color-rouge)]"
      >
        Back to shop
      </Link>

      <section className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-14">
        <ProductGallery product={product} />

        <div className="lg:sticky lg:top-24 lg:self-start">
          {product.featured ? (
            <p className="mb-4 inline-flex rounded-full bg-[var(--color-canvas)] px-3 py-1 text-xs font-semibold text-[var(--color-rouge)]">
              Featured
            </p>
          ) : null}
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="fashion-eyebrow">{product.categoryLabel}</p>
              <h1 className="fashion-display mt-2 text-5xl sm:text-6xl">
                {product.title}
              </h1>
              <p className="mt-3 text-base text-[var(--color-muted)]">
                {product.categoryLabel}
              </p>
            </div>
          </div>

          <p className="mt-7 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            {product.description}
          </p>

          <div className="mt-8">
            <ProductPurchasePanel product={product} />
          </div>
        </div>
      </section>

      <section className="mt-12 grid gap-10 border-y border-[var(--color-line)] py-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.55fr)]">
        <div>
          <h2 className="fashion-display text-3xl">Product notes</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            A cleaner product page keeps the garment visual, the fit information close, and the
            buying action direct. Select your size first, then add it to cart with full stock
            feedback.
          </p>

          <Accordion.Root
            defaultValue={['details']}
            className="mt-7 divide-y divide-[var(--color-line)]"
          >
            <Accordion.Item value="details">
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-[var(--color-ink)] outline-none transition duration-150 ease-out hover:text-[var(--color-rouge)] focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2">
                  Details
                  <ChevronDown
                    className="size-4 text-[var(--color-muted)] transition duration-150 ease-out group-data-panel-open:rotate-180"
                    aria-hidden="true"
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="pb-5">
                <ul className="space-y-3 text-sm text-[var(--color-muted)]">
                  {[
                    product.categoryLabel,
                    `${product.stockAvailable} total pieces available`,
                    `${product.sizes.map((size) => size.label).join(', ')} sizes`,
                  ].map((detail) => (
                    <li key={detail} className="flex gap-3">
                      <span className="mt-2 size-1 rounded-full bg-[var(--color-rouge)]" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value="delivery">
              <Accordion.Header>
                <Accordion.Trigger className="group flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-[var(--color-ink)] outline-none transition duration-150 ease-out hover:text-[var(--color-rouge)] focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2">
                  Delivery and exchanges
                  <ChevronDown
                    className="size-4 text-[var(--color-muted)] transition duration-150 ease-out group-data-panel-open:rotate-180"
                    aria-hidden="true"
                  />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel className="pb-5 text-sm leading-6 text-[var(--color-muted)]">
                Ships within 1-2 business days with tracking after dispatch. Size exchanges can be
                handled within 7 days.
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>
        </div>

        {product.sizeChart.length > 0 ? (
          <div id="size-chart" className="scroll-mt-24">
            <h2 className="text-sm font-semibold text-[var(--color-ink)]">Size chart</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
              Measurements are garment measurements. Pick your usual size for a regular fit.
            </p>
            <div className="mt-4 overflow-hidden rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-surface)]">
              <table className="w-full text-left text-sm">
                <tbody>
                  {product.sizeChart.map((row) => (
                    <tr
                      key={row.size}
                      className="border-b border-[var(--color-line)] last:border-b-0"
                    >
                      <th className="w-20 bg-[var(--color-canvas)] px-4 py-3 font-semibold text-[var(--color-ink)]">
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
              <p className="fashion-eyebrow">Keep browsing</p>
              <h2 className="fashion-display mt-2 text-4xl">More from this edit</h2>
            </div>
            <Link
              to="/products"
              search={{ category: product.category }}
              className="text-sm font-semibold text-[var(--color-ink)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-rouge)] hover:decoration-[var(--color-rouge)]"
            >
              View edit
            </Link>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((item) => (
              <Link
                key={item.productId}
                to="/products/$slug"
                params={{ slug: item.slug }}
                className="group rounded-[1.15rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 transition duration-200 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-950/10"
              >
                <ProductMedia product={item} className="aspect-[4/5]" />
                <div className="mt-3 flex items-start justify-between gap-3">
                  <p className="font-semibold text-[var(--color-ink)]">{item.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted)]">
                    {formatPrice(item.sellingPricePaise)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
