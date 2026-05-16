import { Dialog } from '@base-ui/react/dialog'
import { Expand, X } from 'lucide-react'
import { useEffect, useRef, useState, type MouseEvent, type UIEvent } from 'react'

import type { Product } from '../../data/products'
import { joinClasses } from '../../lib/format'
import { getProductImage, getProductImageProps } from '../../lib/product-images'

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
  const [activeIndex, setActiveIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  const mobileStripRef = useRef<HTMLDivElement | null>(null)
  const [magnifier, setMagnifier] = useState({
    active: false,
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  })
  const isQuickLook = variant === 'quickLook'
  const canMagnify = !isQuickLook && imageFit === 'cover'
  const activeImage = getProductImage(product, activeIndex)
  const activeImageProps = getProductImageProps(product, activeIndex, '(min-width: 1024px) 50vw, 100vw')

  useEffect(() => {
    setActiveIndex(0)
    setViewerOpen(false)
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

  function handleMobileScroll(event: UIEvent<HTMLDivElement>) {
    const nextIndex = Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth)

    if (nextIndex !== activeIndex) {
      setActiveIndex(Math.min(product.images.length - 1, Math.max(0, nextIndex)))
    }
  }

  function showMobileImage(index: number) {
    setActiveIndex(index)
    mobileStripRef.current?.scrollTo({
      behavior: 'smooth',
      left: mobileStripRef.current.clientWidth * index,
    })
  }

  return (
    <>
      <div className="lg:hidden">
        <div
          ref={mobileStripRef}
          className="flex snap-x snap-mandatory overflow-x-auto rounded-lg bg-[var(--color-line)] shadow-sm"
          onScroll={handleMobileScroll}
        >
          {product.images.map((image, index) => (
            <button
              key={image}
              type="button"
              aria-label={`Open image ${index + 1} of ${product.title}`}
              onClick={() => {
                setActiveIndex(index)
                setViewerOpen(true)
              }}
              className="relative aspect-[4/5] w-full shrink-0 snap-center overflow-hidden"
            >
              <img
                {...getProductImageProps(product, index, '100vw')}
                alt={index === 0 ? product.imageAlt : ''}
                className={joinClasses(
                  'h-full w-full',
                  imageFit === 'contain' ? 'object-contain' : 'object-cover',
                )}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={index === 0 ? 'high' : undefined}
              />
              <span className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-[var(--color-paper)]/90 text-[var(--color-ink)] shadow-sm backdrop-blur">
                <Expand className="size-4" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
        {product.images.length > 1 ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Product image previews">
            {product.images.map((image, index) => (
              <button
                key={image}
                type="button"
                aria-label={`View image ${index + 1}`}
                aria-pressed={activeIndex === index}
                onClick={() => showMobileImage(index)}
                className={joinClasses(
                  'aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-lg border bg-[var(--color-line)] transition duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2',
                  activeIndex === index
                    ? 'border-[var(--color-rouge)]'
                    : 'border-transparent',
                )}
              >
                <img
                  {...getProductImageProps(product, index, '64px')}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="hidden gap-3 lg:grid lg:grid-cols-[88px_1fr]">
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
              aria-pressed={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              className={joinClasses(
                'aspect-[4/5] w-20 shrink-0 overflow-hidden rounded-lg border bg-[var(--color-line)] transition duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2 lg:w-full',
                activeIndex === index
                  ? 'border-[var(--color-rouge)]'
                  : 'border-transparent hover:border-[var(--color-line)]',
              )}
            >
              <img
                {...getProductImageProps(product, index, '88px')}
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
              'quick-gallery-main overflow-hidden rounded-lg shadow-sm',
              isQuickLook
                ? 'h-[min(42svh,390px)] bg-[var(--color-surface)] sm:h-[min(54svh,520px)] lg:h-[min(62vh,620px)]'
                : 'cursor-zoom-in bg-[var(--color-line)]',
            )}
          >
            <img
              {...activeImageProps}
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
                'pointer-events-none absolute z-10 hidden size-48 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-2 border-[var(--color-paper)] bg-[var(--color-surface)] shadow-sm ring-2 ring-[var(--color-rouge)]/15 transition-opacity duration-150 lg:block',
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

      <Dialog.Root open={viewerOpen} onOpenChange={setViewerOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-stone-950/86 backdrop-blur-sm transition duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 lg:hidden" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex min-h-svh items-center justify-center p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-[calc(env(safe-area-inset-top)+0.75rem)] lg:hidden">
            <Dialog.Popup className="relative flex h-full w-full flex-col justify-center outline-none">
              <Dialog.Title className="sr-only">{product.title} images</Dialog.Title>
              <Dialog.Close
                aria-label="Close image viewer"
                className="absolute right-2 top-2 z-10 grid size-11 place-items-center rounded-full bg-[var(--color-paper)]/92 text-[var(--color-ink)] shadow-sm backdrop-blur transition active:scale-95"
              >
                <X className="size-5" aria-hidden="true" />
              </Dialog.Close>
              <div className="flex snap-x snap-mandatory overflow-x-auto">
                {product.images.map((image, index) => (
                  <div key={image} className="flex h-[82svh] w-full shrink-0 snap-center items-center">
                    <img
                      {...getProductImageProps(product, index, '100vw')}
                      alt={index === 0 ? product.imageAlt : ''}
                      className="max-h-full w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ))}
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
