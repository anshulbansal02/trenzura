import { HeartHandshake, Ruler, ShieldCheck, Truck, type LucideIcon } from 'lucide-react'

const trustSignals: Array<{ Icon: LucideIcon; label: string }> = [
  { Icon: Truck, label: 'Ships in 1-2 days' },
  { Icon: Ruler, label: 'Size chart on every product' },
  { Icon: ShieldCheck, label: 'Secure checkout' },
  { Icon: HeartHandshake, label: '7-day size exchanges' },
]

export function HomeTrustBar() {
  return (
    <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
      <div className="fashion-container grid gap-4 py-4 text-sm text-[var(--color-ink)] sm:grid-cols-2 lg:grid-cols-4">
        {trustSignals.map(({ Icon, label }) => (
          <div key={label} className="flex items-center gap-3 font-bold">
            <Icon className="size-4 text-[var(--color-sage)]" aria-hidden="true" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
