import { useState } from 'react'

import type { Product } from '../../data/products'
import { joinClasses } from '../../lib/format'

type ProductGalleryProps = {
  product: Product
}

export function ProductGallery({ product }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(product.images[0])

  return (
    <div className="grid gap-3 lg:grid-cols-[88px_1fr]">
      <div className="order-2 flex gap-3 overflow-x-auto lg:order-1 lg:block lg:space-y-3 lg:overflow-visible">
        {product.images.map((image, index) => (
          <button
            key={image}
            type="button"
            aria-label={`View image ${index + 1} of ${product.title}`}
            aria-pressed={activeImage === image}
            onClick={() => setActiveImage(image)}
            className={joinClasses(
              'aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-[0.85rem] border bg-[var(--color-line)] transition duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2 lg:w-full',
              activeImage === image
                ? 'border-[var(--color-rouge)]'
                : 'border-transparent hover:border-[var(--color-line)]',
            )}
          >
            <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>
      <div className="order-1 overflow-hidden rounded-[1.5rem] bg-[var(--color-line)] shadow-sm lg:order-2">
        <img
          src={activeImage}
          alt={product.imageAlt}
          loading="eager"
          className="aspect-[4/5] h-full w-full object-cover lg:aspect-[5/6]"
        />
      </div>
    </div>
  )
}
