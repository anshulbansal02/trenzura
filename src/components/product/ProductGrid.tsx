import type { Product } from '../../data/products'
import { ProductCard } from './ProductCard'

type ProductGridProps = {
  products: Product[]
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-[1.25rem] border border-dashed border-[var(--color-line)] bg-[var(--color-surface)] px-6 text-center">
        <div>
          <p className="font-serif text-2xl text-[var(--color-ink)]">No products found</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">Try a different search or filter.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-x-5 gap-y-11 sm:grid-cols-2 xl:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.productId} product={product} />
      ))}
    </div>
  )
}
