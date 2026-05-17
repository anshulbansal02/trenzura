import { RefreshCcw, ShieldCheck, ShoppingBag, Truck, type LucideIcon } from 'lucide-react'

import { formatPrice } from '../../lib/format'
import { shippingConfig } from '../../lib/shipping'

const benefits: Array<{ Icon: LucideIcon; copy: string; title: string }> = [
  {
    Icon: Truck,
    title: 'Clear shipping',
    copy: `${formatPrice(shippingConfig.standardShippingPaise)} shipping below ${formatPrice(
      shippingConfig.freeShippingThresholdPaise,
    )}.`,
  },
  {
    Icon: RefreshCcw,
    title: 'Easy exchanges',
    copy: '7-day size exchanges on eligible pieces.',
  },
  {
    Icon: ShieldCheck,
    title: 'Secure payments',
    copy: 'Pay safely with UPI, cards, wallets, and more.',
  },
  {
    Icon: ShoppingBag,
    title: 'Easy shopping',
    copy: 'Available sizes are shown before you add to bag.',
  },
]

export function HomeBenefits() {
  return (
    <section className="border-y border-[var(--color-line)] bg-[var(--color-paper)]">
      <div className="fashion-container grid gap-8 py-12 md:grid-cols-4">
        {benefits.map(({ Icon, title, copy }) => (
          <div key={title} className="flex gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm">
              <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-base font-medium text-[var(--color-ink)]">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">{copy}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
