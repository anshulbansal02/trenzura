import { PackageCheck } from 'lucide-react'

import type { CartLineWithProduct } from '../cart/CartProvider'
import { ProductMedia } from '../product/ProductMedia'
import { formatPrice } from '../../lib/format'

type CheckoutOrderSummaryProps = {
  lines: CartLineWithProduct[]
  itemCount: number
  savings: number
  summaryTotals: {
    subtotal: number
    shipping: number
    total: number
  }
  hasConfirmedTotal: boolean
}

export function CheckoutOrderSummary({
  lines,
  itemCount,
  savings,
  summaryTotals,
  hasConfirmedTotal,
}: CheckoutOrderSummaryProps) {
  return (
    <aside className="fashion-surface order-first self-start rounded-lg bg-[var(--color-paper)] p-5 lg:order-none lg:sticky lg:top-24">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-serif text-2xl text-[var(--color-ink)]">Order summary</h2>
        <p className="text-sm text-[var(--color-muted)]">
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {lines.map((line) => (
          <div key={line.id} className="grid grid-cols-[72px_1fr] gap-3">
            <ProductMedia product={line.product} className="aspect-[4/5]" />
            <div className="min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--color-ink)]">
                    {line.product.title}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">
                    Size {line.size} / Qty {line.quantity}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[var(--color-ink)]">
                  {formatPrice(line.product.sellingPricePaise * line.quantity)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-2 border-t border-[var(--color-line)] pt-5 text-sm">
        <SummaryLine label="Subtotal" value={formatPrice(summaryTotals.subtotal)} />
        {savings > 0 && !hasConfirmedTotal ? (
          <SummaryLine label="Savings" value={formatPrice(savings)} tone="success" />
        ) : null}
        <SummaryLine label="Shipping" value={formatPrice(summaryTotals.shipping)} />
        <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-3 text-base font-semibold text-[var(--color-ink)]">
          <span>Total</span>
          <span>{formatPrice(summaryTotals.total)}</span>
        </div>
        {hasConfirmedTotal ? (
          <p className="flex items-center gap-2 pt-2 text-xs leading-5 text-[var(--color-muted)]">
            <PackageCheck className="size-4 shrink-0 text-[var(--color-accent-muted)]" aria-hidden="true" />
            Your bag total has been confirmed for this order.
          </p>
        ) : null}
      </div>
    </aside>
  )
}

function SummaryLine({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'success'
}) {
  return (
    <div
      className={
        tone === 'success'
          ? 'flex justify-between text-[var(--color-accent-muted)]'
          : 'flex justify-between text-[var(--color-muted)]'
      }
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}
