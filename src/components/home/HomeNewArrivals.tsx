import { Button } from '@base-ui/react/button'
import { Link } from '@tanstack/react-router'

import type { Product } from '../../data/products'
import { formatPrice } from '../../lib/format'
import { getProductImageProps } from '../../lib/product-images'

type HomeNewArrivalsProps = {
  collageProducts: Product[]
  products: Product[]
}

export function HomeNewArrivals({ collageProducts, products }: HomeNewArrivalsProps) {
  return (
    <section className="fashion-container py-10 lg:py-16">
      <div className="grid gap-8 border-y border-[var(--color-line)] py-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="grid grid-cols-2 gap-2">
          {collageProducts.map((product, index) => (
            <Link
              key={product.productId}
              to="/products/$slug"
              params={{ slug: product.slug }}
              className={`group overflow-hidden rounded-[var(--radius-image)] bg-[var(--color-surface)] ${
                index === 0 ? 'row-span-2' : ''
              }`}
            >
              <img
                {...getProductImageProps(
                  product,
                  index % product.images.length,
                  index === 0 ? '(min-width: 1024px) 25vw, 50vw' : '25vw',
                )}
                alt={product.imageAlt}
                loading="lazy"
                decoding="async"
                className={`${
                  index === 0 ? 'h-full min-h-[520px]' : 'aspect-[4/5]'
                } w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.025]`}
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
            {products.map((product) => (
              <Link
                key={product.productId}
                to="/products/$slug"
                params={{ slug: product.slug }}
                className="flex items-center justify-between gap-5 py-4 text-sm transition duration-150 ease-out hover:translate-x-1"
              >
                <span>
                  <span className="block font-normal text-[var(--color-ink)]">
                    {product.title}
                  </span>
                  <span className="mt-1 block text-[var(--color-muted)]">
                    {product.categoryLabel}
                  </span>
                </span>
                <span className="font-normal text-[var(--color-ink)]">
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
  )
}
