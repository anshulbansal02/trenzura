import { Button } from '@base-ui/react/button'
import { Link } from '@tanstack/react-router'

import type { Product } from '../../data/products'
import { formatPrice } from '../../lib/format'
import { getProductImageProps } from '../../lib/product-images'
import { StyleFinder } from '../product/StyleFinder'

type HomeHeroProps = {
  gallery: Product[]
  minPricePaise: number
}

export function HomeHero({ gallery, minPricePaise }: HomeHeroProps) {
  return (
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
                  {formatPrice(minPricePaise)}+
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
          {gallery.map((product, index) => (
            <Link
              key={product.productId}
              to="/products/$slug"
              params={{ slug: product.slug }}
              className={`group relative overflow-hidden rounded-lg bg-[var(--color-line)] ${
                index === 1 ? 'sm:my-0' : 'hidden sm:block sm:my-10'
              }`}
            >
              <img
                {...getProductImageProps(
                  product,
                  0,
                  index === 1 ? '(min-width: 1024px) 36vw, 100vw' : '22vw',
                )}
                alt={product.imageAlt}
                loading={index === 1 ? undefined : 'lazy'}
                decoding="async"
                fetchPriority={index === 1 ? 'high' : undefined}
                className="h-full w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.025]"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgb(28_46_74_/_0.72)] to-transparent p-4 text-white">
                <p className="text-xs font-semibold">{index === 1 ? 'Most wanted' : 'New in'}</p>
                <p className="mt-1 text-sm font-medium">{product.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
