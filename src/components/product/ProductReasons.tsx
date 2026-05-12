import { Sparkles } from 'lucide-react'

import type { Product } from '../../data/products'
import { getProductReasons } from '../../lib/product-insights'
import { joinClasses } from '../../lib/format'

type ProductReasonsProps = {
  product: Product
  compact?: boolean
  includeAvailability?: boolean
}

export function ProductReasons({
  product,
  compact = false,
  includeAvailability = true,
}: ProductReasonsProps) {
  const limit = compact ? 2 : 3
  const reasons = getProductReasons(product, includeAvailability ? limit : limit + 1)
    .filter((reason) => includeAvailability || !reason.startsWith('Available in '))
    .slice(0, limit)

  if (reasons.length === 0) return null

  return (
    <div
      className={joinClasses(
        'rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-surface)]',
        compact ? 'p-3' : 'p-4',
      )}
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--color-rouge)]">
        <Sparkles className="size-3.5" aria-hidden="true" />
        Why this piece
      </p>
      <ul className={joinClasses('grid gap-2', compact ? 'mt-3 text-xs' : 'mt-4 text-sm')}>
        {reasons.map((reason) => (
          <li key={reason} className="flex gap-2 leading-5 text-[var(--color-muted)]">
            <span className="mt-2 size-1 rounded-full bg-[var(--color-rouge)]" />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
