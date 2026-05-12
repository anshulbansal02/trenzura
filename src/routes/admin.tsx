import { Button } from '@base-ui/react/button'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import {
  AlertTriangle,
  Boxes,
  Clock3,
  CreditCard,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  RotateCw,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import type { FormEvent, ReactNode } from 'react'
import { useMemo, useState } from 'react'

import { formatPrice } from '../lib/format'
import { createPageMeta } from '../lib/seo'
import type {
  AdminDashboard,
  AdminIntegrationErrorRow,
  AdminLowStockVariantRow,
  AdminOrderRow,
} from '../lib/admin.server'

const getAdminDashboard = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadAdminDashboard } = await import('../lib/admin.server')
  return loadAdminDashboard()
})

const retryAdminShipment = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== 'object') {
      throw new Error('Order number is required')
    }

    return {
      orderNumber: String((data as { orderNumber?: unknown }).orderNumber ?? ''),
    }
  })
  .handler(async ({ data }) => {
    const { retryShipmentFromAdmin } = await import('../lib/admin.server')
    return retryShipmentFromAdmin(data.orderNumber)
  })

export const Route = createFileRoute('/admin')({
  head: () => {
    const pageMeta = createPageMeta({
      title: 'Admin | Trenzura',
      description: 'Operational dashboard for Trenzura order and shipment management.',
      path: '/admin',
    })

    return {
      ...pageMeta,
      meta: [
        ...pageMeta.meta,
        { name: 'robots', content: 'noindex, nofollow' },
      ],
    }
  },
  loader: () => getAdminDashboard(),
  component: AdminPage,
})

type AdminViewKey =
  | 'recentOrders'
  | 'shipmentPendingOrders'
  | 'paymentReviewOrders'
  | 'failedPayments'
  | 'integrationErrors'
  | 'lowStockVariants'

type RetryStatus = 'idle' | 'loading' | 'success' | 'error'

const adminTabs: Array<{
  key: AdminViewKey
  label: string
  Icon: typeof Clock3
}> = [
  { key: 'recentOrders', label: 'Recent', Icon: Clock3 },
  { key: 'shipmentPendingOrders', label: 'Shipments', Icon: Truck },
  { key: 'paymentReviewOrders', label: 'Review', Icon: CreditCard },
  { key: 'failedPayments', label: 'Payments', Icon: AlertTriangle },
  { key: 'integrationErrors', label: 'Errors', Icon: AlertTriangle },
  { key: 'lowStockVariants', label: 'Low stock', Icon: Boxes },
]

function AdminPage() {
  const dashboard = Route.useLoaderData()
  const router = useRouter()
  const retryShipment = useServerFn(retryAdminShipment)
  const [activeView, setActiveView] = useState<AdminViewKey>('recentOrders')
  const [orderNumber, setOrderNumber] = useState('')
  const [retryStatus, setRetryStatus] = useState<RetryStatus>('idle')
  const [retryMessage, setRetryMessage] = useState('')
  const activeRows = dashboard.views[activeView]
  const criticalCount =
    dashboard.shownCounts.shipmentPendingOrders +
    dashboard.shownCounts.paymentReviewOrders +
    dashboard.shownCounts.failedPayments +
    dashboard.shownCounts.integrationErrors

  async function refreshDashboard() {
    await router.invalidate()
  }

  async function submitRetry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRetryStatus('loading')
    setRetryMessage('Retrying shipment...')

    try {
      const result = await retryShipment({ data: { orderNumber } })
      setRetryStatus('success')
      setRetryMessage(`Shipment retry requested for ${result.orderNumber}.`)
      setOrderNumber('')
      await router.invalidate()
    } catch (error) {
      setRetryStatus('error')
      setRetryMessage(error instanceof Error ? error.message : 'Unable to retry shipment')
    }
  }

  return (
    <main className="fashion-container py-8 lg:py-10">
      <div className="mb-7 flex flex-col gap-5 border-b border-[var(--color-line)] pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-muted)]">
            <ShieldCheck className="size-4 text-[var(--color-sage)]" aria-hidden="true" />
            {dashboard.adminEmail}
          </div>
          <h1 className="fashion-display mt-4 text-4xl sm:text-5xl">Admin</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-muted)]">
            Order, payment, shipment, integration, and inventory signals from Supabase ops views.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold text-[var(--color-muted)]">
            Updated {formatDateTime(dashboard.loadedAt)}
          </p>
          <Button
            type="button"
            onClick={refreshDashboard}
            className="fashion-button-secondary h-10 gap-2 px-4"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Open issues"
          value={criticalCount}
          tone={criticalCount > 0 ? 'alert' : 'normal'}
          Icon={AlertTriangle}
        />
        <MetricCard
          label="Shipment pending"
          value={dashboard.shownCounts.shipmentPendingOrders}
          tone={dashboard.shownCounts.shipmentPendingOrders > 0 ? 'alert' : 'normal'}
          Icon={Truck}
        />
        <MetricCard
          label="Payment review"
          value={dashboard.shownCounts.paymentReviewOrders}
          tone={dashboard.shownCounts.paymentReviewOrders > 0 ? 'alert' : 'normal'}
          Icon={CreditCard}
        />
        <MetricCard
          label="Low stock"
          value={dashboard.shownCounts.lowStockVariants}
          tone={dashboard.shownCounts.lowStockVariants > 0 ? 'alert' : 'normal'}
          Icon={Boxes}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="mb-3 overflow-x-auto">
            <div className="inline-flex min-w-max rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-1">
              {adminTabs.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveView(key)}
                  className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${
                    activeView === key
                      ? 'bg-[var(--color-ink)] text-[var(--color-paper)] shadow-sm'
                      : 'text-[var(--color-muted)] hover:bg-[var(--color-paper)] hover:text-[var(--color-ink)]'
                  }`}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                  <span className="rounded-full bg-current/10 px-2 py-0.5 text-xs">
                    {dashboard.shownCounts[key]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <AdminTable dashboard={dashboard} activeView={activeView} rows={activeRows} />
        </div>

        <aside className="xl:sticky xl:top-[calc(var(--site-header-height)+1rem)] xl:self-start">
          <form
            onSubmit={submitRetry}
            className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-ink)] text-[var(--color-paper)]">
                <RotateCw className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[var(--color-ink)]">
                  Retry shipment
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                  Runs the existing shipment retry function for a paid order in a valid shipment
                  state.
                </p>
              </div>
            </div>
            <label className="mt-5 block text-sm font-semibold text-[var(--color-ink)]">
              Order number
              <input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="TZ-20260511-A7K2F1"
                className="mt-2 h-11 w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-paper)] px-3 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-rouge)] focus:ring-2 focus:ring-[var(--color-rouge)]/20"
              />
            </label>
            <Button
              type="submit"
              disabled={retryStatus === 'loading'}
              className="fashion-button-primary mt-4 h-11 w-full gap-2"
            >
              {retryStatus === 'loading' ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <PackageCheck className="size-4" aria-hidden="true" />
              )}
              Retry shipment
            </Button>
            {retryMessage ? (
              <p
                className={`mt-3 rounded-lg px-3 py-2 text-sm leading-6 ${
                  retryStatus === 'error'
                    ? 'bg-red-50 text-red-800'
                    : retryStatus === 'success'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-[var(--color-paper)] text-[var(--color-muted)]'
                }`}
              >
                {retryMessage}
              </p>
            ) : null}
          </form>
        </aside>
      </section>
    </main>
  )
}

function MetricCard({
  label,
  value,
  tone,
  Icon,
}: {
  label: string
  value: number
  tone: 'normal' | 'alert'
  Icon: typeof Clock3
}) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-[var(--color-muted)]">{label}</p>
        <Icon
          className={`size-5 ${tone === 'alert' ? 'text-[var(--color-rouge)]' : 'text-[var(--color-sage)]'}`}
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 text-3xl font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  )
}

function AdminTable({
  dashboard,
  activeView,
  rows,
}: {
  dashboard: AdminDashboard
  activeView: AdminViewKey
  rows: AdminDashboard['views'][AdminViewKey]
}) {
  const title = adminTabs.find((tab) => tab.key === activeView)?.label ?? 'Admin view'
  const description = useMemo(() => getViewDescription(activeView), [activeView])

  return (
    <section className="overflow-hidden rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm">
      <div className="flex flex-col gap-2 border-b border-[var(--color-line)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-ink)]">{title}</h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{description}</p>
        </div>
        <p className="text-xs font-semibold text-[var(--color-muted)]">
          {dashboard.shownCounts[activeView]} shown
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <PackageCheck className="mx-auto size-8 text-[var(--color-sage)]" aria-hidden="true" />
          <p className="mt-3 text-sm font-semibold text-[var(--color-ink)]">No rows to review</p>
        </div>
      ) : activeView === 'integrationErrors' ? (
        <IntegrationErrorsTable rows={rows as AdminIntegrationErrorRow[]} />
      ) : activeView === 'lowStockVariants' ? (
        <LowStockTable rows={rows as AdminLowStockVariantRow[]} />
      ) : (
        <OrdersTable rows={rows as AdminOrderRow[]} />
      )}
    </section>
  )
}

function OrdersTable({ rows }: { rows: AdminOrderRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[980px] w-full border-collapse text-left text-sm">
        <thead className="bg-[var(--color-paper)] text-xs uppercase text-[var(--color-muted)]">
          <tr>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Shipment</TableHead>
            <TableHead>Created</TableHead>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.order_number}-${row.created_at}`} className="border-t border-[var(--color-line)]">
              <TableCell>
                <p className="font-semibold text-[var(--color-ink)]">{row.order_number}</p>
                <StatusBadge value={row.order_status} />
              </TableCell>
              <TableCell>
                <p className="font-medium text-[var(--color-ink)]">{row.customer_name || '-'}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{row.customer_phone || '-'}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{row.customer_email || '-'}</p>
              </TableCell>
              <TableCell>
                {typeof row.total_amount_paise === 'number'
                  ? formatPrice(row.total_amount_paise)
                  : '-'}
              </TableCell>
              <TableCell>
                <StatusBadge value={row.payment_status || '-'} />
              </TableCell>
              <TableCell>
                <StatusBadge value={row.shipment_status || '-'} />
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {row.tracking_number || 'No tracking'}
                </p>
              </TableCell>
              <TableCell>{formatDateTime(row.created_at)}</TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function IntegrationErrorsTable({ rows }: { rows: AdminIntegrationErrorRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[860px] w-full border-collapse text-left text-sm">
        <thead className="bg-[var(--color-paper)] text-xs uppercase text-[var(--color-muted)]">
          <tr>
            <TableHead>Source</TableHead>
            <TableHead>Event</TableHead>
            <TableHead>Order</TableHead>
            <TableHead>Error</TableHead>
            <TableHead>Created</TableHead>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={`${row.source}-${row.event_type}-${row.order_number}-${row.created_at}`}
              className="border-t border-[var(--color-line)]"
            >
              <TableCell>
                <p className="font-semibold text-[var(--color-ink)]">{row.source || '-'}</p>
                <StatusBadge value={row.status || '-'} />
              </TableCell>
              <TableCell>{row.event_type || '-'}</TableCell>
              <TableCell>{row.order_number || '-'}</TableCell>
              <TableCell>
                <p className="max-w-xl whitespace-normal leading-6">{row.error_message || '-'}</p>
              </TableCell>
              <TableCell>{formatDateTime(row.created_at)}</TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function LowStockTable({ rows }: { rows: AdminLowStockVariantRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-[760px] w-full border-collapse text-left text-sm">
        <thead className="bg-[var(--color-paper)] text-xs uppercase text-[var(--color-muted)]">
          <tr>
            <TableHead>Product</TableHead>
            <TableHead>Variant</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Stock</TableHead>
            <TableHead>Status</TableHead>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.variant_id} className="border-t border-[var(--color-line)]">
              <TableCell>
                <p className="font-semibold text-[var(--color-ink)]">{row.title}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{row.slug}</p>
              </TableCell>
              <TableCell>
                <p>{row.size_label}</p>
                <p className="mt-1 text-xs text-[var(--color-muted)]">{row.variant_id}</p>
              </TableCell>
              <TableCell>{row.category}</TableCell>
              <TableCell>
                <span className="text-base font-semibold text-[var(--color-rouge)]">
                  {row.stock_available}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge value={row.product_active && row.variant_active ? 'active' : 'inactive'} />
              </TableCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TableHead({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>
}

function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-4 align-top text-[var(--color-ink-soft)]">{children}</td>
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.replaceAll('_', ' ')
  const alert = /failed|review|pending|error/i.test(value)

  return (
    <span
      className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
        alert ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'
      }`}
    >
      {normalized}
    </span>
  )
}

function getViewDescription(view: AdminViewKey) {
  switch (view) {
    case 'recentOrders':
      return 'Latest orders across all operational states.'
    case 'shipmentPendingOrders':
      return 'Paid orders that need shipment creation, pickup, or logistics attention.'
    case 'paymentReviewOrders':
      return 'Orders where payment state needs manual review.'
    case 'failedPayments':
      return 'Orders or payment rows marked failed.'
    case 'integrationErrors':
      return 'Failed integration events and provider errors.'
    case 'lowStockVariants':
      return 'Active product variants at or below the low stock threshold.'
  }
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(date)
}
