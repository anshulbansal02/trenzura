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

  return (
    <div className={`overflow-hidden rounded-[1.1rem] bg-[var(--color-line)] ${className}`}>
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
    </div>
  )
}
