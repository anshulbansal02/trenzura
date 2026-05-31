import { Link } from '@tanstack/react-router'

import type { Product } from '../../data/products'
import { getProductImageProps } from '../../lib/product-images'

type HomeImageStoryProps = {
  products: Product[]
}

export function HomeImageStory({ products }: HomeImageStoryProps) {
  const featureProduct = products[0]
  const supportingProducts = products.slice(1, 4)

  if (!featureProduct) {
    return null
  }

  return (
    <section className="border-y border-[var(--color-line)] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto grid max-w-[90rem] gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <Link
          to="/products/$slug"
          params={{ slug: featureProduct.slug }}
          className="group relative aspect-[5/4] overflow-hidden bg-[var(--color-surface)]"
        >
          <img
            {...getProductImageProps(featureProduct, 0, '(min-width: 1024px) 54vw, 100vw')}
            alt={featureProduct.imageAlt}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.02]"
          />
        </Link>

        <div className="lg:pl-10">
          <p className="text-sm font-medium text-[var(--color-muted)]">The cotton edit</p>
          <h2 className="mt-3 font-serif text-5xl font-normal leading-none text-[var(--color-ink)] sm:text-7xl">
            Color, print, repeat
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-[var(--color-muted)]">
            Pick easy silhouettes with enough polish for everyday plans, festive lunches, and
            weekend dressing.
          </p>
          <Link
            to="/products"
            className="mt-7 inline-flex h-11 items-center justify-center border border-[var(--color-line)] bg-[var(--color-paper)] px-6 text-sm font-medium text-[var(--color-ink)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
          >
            Shop new arrivals
          </Link>

          {supportingProducts.length > 0 ? (
            <div className="mt-9 grid grid-cols-3 gap-3">
              {supportingProducts.map((product) => (
                <Link
                  key={product.productId}
                  to="/products/$slug"
                  params={{ slug: product.slug }}
                  className="group block"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-[var(--color-surface)]">
                    <img
                      {...getProductImageProps(product, 0, '(min-width: 1024px) 12vw, 30vw')}
                      alt={product.imageAlt}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.02]"
                    />
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-[var(--color-ink)]">
                    {product.title}
                  </p>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
