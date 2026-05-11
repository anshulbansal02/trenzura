import { useState } from 'react'

import type { Product } from '../../data/products'
import { joinClasses } from '../../lib/format'

type ProductGalleryProps = {
  product: Product
  imageFit?: 'cover' | 'contain'
  variant?: 'default' | 'quickLook'
}

export function ProductGallery({
  product,
  imageFit = 'cover',
  variant = 'default',
}: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(product.images[0])
  const isQuickLook = variant === 'quickLook'

  return (
    <div className="grid gap-3 lg:grid-cols-[88px_1fr]">
      <div
        className={joinClasses(
          'order-2 flex gap-3 overflow-x-auto lg:order-1 lg:block lg:space-y-3 lg:overflow-visible',
          isQuickLook ? 'hidden lg:block' : '',
        )}
      >
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
            <img
              src={image}
              alt=""
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </button>
        ))}
      </div>
      <div
        className={joinClasses(
          'quick-gallery-main order-1 overflow-hidden rounded-[1.5rem] shadow-sm lg:order-2',
          isQuickLook
            ? 'h-[min(42svh,390px)] bg-[var(--color-surface)] sm:h-[min(54svh,520px)] lg:h-[min(62vh,620px)]'
            : 'bg-[var(--color-line)]',
        )}
      >
        <img
          src={activeImage}
          alt={product.imageAlt}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className={joinClasses(
            'h-full w-full transition duration-500 ease-out motion-safe:hover:scale-[1.025]',
            isQuickLook ? 'aspect-[4/5] lg:aspect-auto' : 'aspect-[4/5] lg:aspect-[5/6]',
            imageFit === 'contain' ? 'object-contain' : 'object-cover',
          )}
        />
      </div>
    </div>
  )
}
