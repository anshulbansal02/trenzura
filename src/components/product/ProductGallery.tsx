import { useEffect, useState, type MouseEvent } from 'react'

import type { Product } from '../../data/products'
import { joinClasses } from '../../lib/format'

type ProductGalleryProps = {
  product: Product
  imageFit?: 'cover' | 'contain'
  variant?: 'default' | 'quickLook'
}

const MAGNIFIER_SIZE = 192
const MAGNIFIER_ZOOM = 2.35

export function ProductGallery({
  product,
  imageFit = 'cover',
  variant = 'default',
}: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(product.images[0])
  const [magnifier, setMagnifier] = useState({
    active: false,
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  })
  const isQuickLook = variant === 'quickLook'
  const canMagnify = !isQuickLook && imageFit === 'cover'

  useEffect(() => {
    setActiveImage(product.images[0])
    setMagnifier((current) => ({ ...current, active: false }))
  }, [product.productId, product.images])

  function handleMouseMove(event: MouseEvent<HTMLDivElement>) {
    if (!canMagnify) return

    const imageFrame = event.currentTarget.querySelector<HTMLElement>('[data-gallery-frame]')
    const bounds = imageFrame?.getBoundingClientRect()
    if (!bounds) return

    const x = event.clientX - bounds.left
    const y = event.clientY - bounds.top

    setMagnifier({
      active: true,
      height: bounds.height,
      width: bounds.width,
      x: Math.min(bounds.width, Math.max(0, x)),
      y: Math.min(bounds.height, Math.max(0, y)),
    })
  }

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
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMagnifier((current) => ({ ...current, active: false }))}
        className={joinClasses(
          'relative order-1 overflow-visible lg:order-2',
          canMagnify ? 'lg:z-10' : '',
        )}
      >
        <div
          data-gallery-frame
          className={joinClasses(
            'quick-gallery-main overflow-hidden rounded-[1.5rem] shadow-sm',
            isQuickLook
              ? 'h-[min(42svh,390px)] bg-[var(--color-surface)] sm:h-[min(54svh,520px)] lg:h-[min(62vh,620px)]'
              : 'cursor-zoom-in bg-[var(--color-line)]',
          )}
        >
          <img
            src={activeImage}
            alt={product.imageAlt}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className={joinClasses(
              'h-full w-full',
              isQuickLook ? 'aspect-[4/5] lg:aspect-auto' : 'aspect-[4/5] lg:aspect-[5/6]',
              imageFit === 'contain' ? 'object-contain' : 'object-cover',
            )}
          />
        </div>
        {canMagnify ? (
          <div
            aria-hidden="true"
            className={joinClasses(
              'pointer-events-none absolute z-10 hidden size-48 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-[var(--color-paper)] bg-[var(--color-surface)] shadow-2xl shadow-stone-950/30 ring-2 ring-[#8a3a46]/25 transition-opacity duration-150 lg:block',
              magnifier.active ? 'opacity-100' : 'opacity-0',
            )}
            style={{
              left: `${magnifier.x}px`,
              top: `${magnifier.y}px`,
            }}
          >
            <img
              src={activeImage}
              alt=""
              className="absolute max-w-none object-cover"
              draggable={false}
              style={{
                height: `${magnifier.height}px`,
                left: `${MAGNIFIER_SIZE / 2 - magnifier.x}px`,
                top: `${MAGNIFIER_SIZE / 2 - magnifier.y}px`,
                transform: `scale(${MAGNIFIER_ZOOM})`,
                transformOrigin: `${magnifier.x}px ${magnifier.y}px`,
                width: `${magnifier.width}px`,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
