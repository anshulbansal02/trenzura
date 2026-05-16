import { Link } from '@tanstack/react-router'

import type { Product } from '../../data/products'
import { getProductImageProps } from '../../lib/product-images'

type HomeImageStoryProps = {
  products: Product[]
}

export function HomeImageStory({ products }: HomeImageStoryProps) {
  return (
    <section className="fashion-container py-10 lg:py-16">
      <div className="mb-7 flex items-end justify-between gap-6">
        <div>
          <p className="fashion-eyebrow">The cotton edit</p>
          <h2 className="fashion-display mt-2 text-2xl sm:text-3xl">Color, print, repeat</h2>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product, index) => (
          <Link
            key={product.productId}
            to="/products/$slug"
            params={{ slug: product.slug }}
            className={`group relative min-h-80 overflow-hidden rounded-lg bg-[var(--color-line)] ${
              index % 2 === 0 ? 'lg:mt-8' : ''
            }`}
          >
            <img
              {...getProductImageProps(
                product,
                index % product.images.length,
                '(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw',
              )}
              alt={product.imageAlt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover object-top transition duration-500 ease-out group-hover:scale-[1.025]"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgb(28_46_74_/_0.72)] to-transparent p-4 text-white">
              <p className="text-xs font-semibold uppercase">{product.categoryLabel}</p>
              <h2 className="mt-1 text-base font-medium">{product.title}</h2>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
