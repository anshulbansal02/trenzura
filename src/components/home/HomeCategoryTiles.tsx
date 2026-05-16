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
        {tiles.map(({ category, product }) => (
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
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgb(28_46_74_/_0.72))]" />
            <div className="absolute inset-x-0 bottom-0 p-6 text-[var(--color-paper)]">
              <p className="text-xs font-semibold uppercase text-[var(--color-paper)]/82">Shop</p>
              <h2 className="mt-2 text-xl font-medium">{categoryLabels[category]}</h2>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
