import type { Product } from '../../data/products'

type ProductMediaProps = {
  product: Product
  priority?: boolean
  className?: string
  hoverZoom?: boolean
}

export function ProductMedia({
  product,
  priority,
  className = '',
  hoverZoom = false,
}: ProductMediaProps) {
  const image = product.images[0]
  const hoverImage = hoverZoom ? product.images[1] : undefined

  return (
    <div className={`relative overflow-hidden rounded-lg bg-[var(--color-line)] ${className}`}>
      <img
        src={image}
        alt={product.imageAlt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
        className={`h-full w-full object-cover transition duration-500 ease-out ${
          hoverZoom ? 'motion-safe:group-hover:scale-[1.03] motion-safe:group-hover/card:scale-[1.03]' : ''
        }`}
      />
      {hoverImage ? (
        <img
          src={hoverImage}
          alt=""
          loading="lazy"
          decoding="async"
          className={`absolute inset-0 h-full w-full object-cover opacity-0 transition duration-500 ease-out motion-safe:group-hover:opacity-100 motion-safe:group-focus-visible:opacity-100 motion-safe:group-hover/card:opacity-100 ${
            hoverZoom
              ? 'motion-safe:group-hover:scale-[1.03] motion-safe:group-focus-visible:scale-[1.03] motion-safe:group-hover/card:scale-[1.03]'
              : ''
          }`}
        />
      ) : null}
    </div>
  )
}
