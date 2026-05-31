import { AlertTriangle, Boxes, Clock3, CreditCard, Truck, type LucideIcon } from 'lucide-react'

import type { AdminDashboard } from '../../lib/admin.server'
import type { AdminViewKey } from '../../lib/admin-ui'

const adminTabs: Array<{
  key: AdminViewKey
  label: string
  Icon: LucideIcon
}> = [
  { key: 'recentOrders', label: 'Recent', Icon: Clock3 },
  { key: 'shipmentPendingOrders', label: 'Shipments', Icon: Truck },
  { key: 'paymentReviewOrders', label: 'Review', Icon: CreditCard },
  { key: 'failedPayments', label: 'Payments', Icon: AlertTriangle },
  { key: 'integrationErrors', label: 'Errors', Icon: AlertTriangle },
  { key: 'lowStockVariants', label: 'Low stock', Icon: Boxes },
]

export function getAdminViewLabel(view: AdminViewKey) {
  return adminTabs.find((tab) => tab.key === view)?.label ?? 'Admin view'
}

export function AdminViewTabs({
  activeView,
  counts,
  onChange,
}: {
  activeView: AdminViewKey
  counts: AdminDashboard['shownCounts']
  onChange: (view: AdminViewKey) => void
}) {
  return (
    <div className="mb-3 overflow-x-auto">
      <div className="inline-flex min-w-max border border-[var(--color-line)] bg-[var(--color-surface)] p-1">
        {adminTabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={`inline-flex h-10 items-center gap-2 px-3 text-sm font-medium transition ${
              activeView === key
                ? 'bg-[var(--color-ink)] text-[var(--color-paper)]'
                : 'text-[var(--color-muted)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]'
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
            <span className="bg-current/10 px-2 py-0.5 text-xs">
              {counts[key]}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
