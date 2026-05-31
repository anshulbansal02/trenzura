import { Link } from '@tanstack/react-router'

import type { Product } from '../../data/products'
import { getProductImageProps } from '../../lib/product-images'

type HomeCategoryTile = {
  category: string
  product: Product
}

type HomeCategoryTilesProps = {
  categoryLabels: Record<string, string>
  tiles: HomeCategoryTile[]
}

export function HomeCategoryTiles({ categoryLabels, tiles }: HomeCategoryTilesProps) {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-[90rem]">
      <div className="mb-8 flex flex-col justify-between gap-5 border-b border-[var(--color-line)] pb-6 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium text-[var(--color-muted)]">Kurtis crafted for every mood</p>
          <h2 className="mt-2 font-serif text-5xl font-normal leading-none text-[var(--color-ink)] sm:text-6xl">
            Shop by style
          </h2>
        </div>
        <Link
          to="/products"
          className="hidden text-sm font-medium text-[var(--color-ink)] underline-offset-4 transition hover:underline sm:inline"
        >
          View all
        </Link>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {tiles.map(({ category, product }) => (
          <Link
            key={category}
            to="/products"
            search={{ category }}
            className="group relative overflow-hidden bg-[var(--color-surface)]"
          >
            <img
              {...getProductImageProps(product, 0, '(min-width: 768px) 33vw, 100vw')}
              alt={product.imageAlt}
              loading="lazy"
              decoding="async"
              className="aspect-[3/4] h-full w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgb(28_46_74_/_0.62))]" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-[var(--color-paper)]">
              <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-[var(--color-paper)]/82">Shop</p>
              <h2 className="mt-2 font-serif text-3xl font-normal leading-none">
                {categoryLabels[category]}
              </h2>
            </div>
          </Link>
        ))}
      </div>
      </div>
    </section>
  )
}
