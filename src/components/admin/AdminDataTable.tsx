import { PackageCheck } from 'lucide-react'
import type { ReactNode } from 'react'

import type {
  AdminDashboard,
  AdminIntegrationErrorRow,
  AdminLowStockVariantRow,
  AdminOrderRow,
} from '../../lib/admin.server'
import {
  formatAdminDateTime,
  getAdminViewDescription,
  type AdminViewKey,
} from '../../lib/admin-ui'
import { formatPrice } from '../../lib/format'
import { getAdminViewLabel } from './AdminViewTabs'

export function AdminDataTable({
  dashboard,
  activeView,
  rows,
}: {
  dashboard: AdminDashboard
  activeView: AdminViewKey
  rows: AdminDashboard['views'][AdminViewKey]
}) {
  return (
    <section className="overflow-hidden border border-[var(--color-line)] bg-[var(--color-paper)]">
      <div className="flex flex-col gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-medium text-[var(--color-ink)]">
            {getAdminViewLabel(activeView)}
          </h2>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {getAdminViewDescription(activeView)}
          </p>
        </div>
        <p className="text-xs font-medium text-[var(--color-muted)]">
          {dashboard.shownCounts[activeView]} shown
        </p>
      </div>
      {rows.length === 0 ? (
        <div className="bg-[var(--color-surface)] px-4 py-12 text-center">
          <PackageCheck className="mx-auto size-8 text-[var(--color-accent-muted)]" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-[var(--color-ink)]">No rows to review</p>
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
    <>
      <OrderMobileCards rows={rows} />
      <div className="hidden overflow-x-auto sm:block">
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
          <tbody className="bg-[var(--color-surface)]">
            {rows.map((row) => (
              <tr key={`${row.order_number}-${row.created_at}`} className="border-t border-[var(--color-line)] transition duration-150 ease-out hover:bg-[var(--color-paper)]">
                <TableCell>
                  <p className="font-medium text-[var(--color-ink)]">{row.order_number}</p>
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
                <TableCell>{formatAdminDateTime(row.created_at)}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function IntegrationErrorsTable({ rows }: { rows: AdminIntegrationErrorRow[] }) {
  return (
    <>
      <IntegrationErrorMobileCards rows={rows} />
      <div className="hidden overflow-x-auto sm:block">
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
          <tbody className="bg-[var(--color-surface)]">
            {rows.map((row) => (
              <tr
                key={`${row.source}-${row.event_type}-${row.order_number}-${row.created_at}`}
                className="border-t border-[var(--color-line)] transition duration-150 ease-out hover:bg-[var(--color-paper)]"
              >
                <TableCell>
                  <p className="font-medium text-[var(--color-ink)]">{row.source || '-'}</p>
                  <StatusBadge value={row.status || '-'} />
                </TableCell>
                <TableCell>{row.event_type || '-'}</TableCell>
                <TableCell>{row.order_number || '-'}</TableCell>
                <TableCell>
                  <p className="max-w-xl whitespace-normal leading-6">{row.error_message || '-'}</p>
                </TableCell>
                <TableCell>{formatAdminDateTime(row.created_at)}</TableCell>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function LowStockTable({ rows }: { rows: AdminLowStockVariantRow[] }) {
  return (
    <>
      <LowStockMobileCards rows={rows} />
      <div className="hidden overflow-x-auto sm:block">
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
          <tbody className="bg-[var(--color-surface)]">
            {rows.map((row) => (
              <tr key={row.variant_id} className="border-t border-[var(--color-line)] transition duration-150 ease-out hover:bg-[var(--color-paper)]">
                <TableCell>
                  <p className="font-medium text-[var(--color-ink)]">{row.title}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{row.slug}</p>
                </TableCell>
                <TableCell>
                  <p>{row.size_label}</p>
                  <p className="mt-1 text-xs text-[var(--color-muted)]">{row.variant_id}</p>
                </TableCell>
                <TableCell>{row.category}</TableCell>
                <TableCell>
                  <span className="text-base font-medium text-[var(--color-primary)]">
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
    </>
  )
}

function OrderMobileCards({ rows }: { rows: AdminOrderRow[] }) {
  return (
    <div className="divide-y divide-[var(--color-line)] sm:hidden">
      {rows.map((row) => (
        <article key={`${row.order_number}-${row.created_at}`} className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-medium text-[var(--color-ink)]">
                {row.order_number}
              </p>
              <StatusBadge value={row.order_status} />
            </div>
            <p className="shrink-0 text-sm font-medium text-[var(--color-ink)]">
              {typeof row.total_amount_paise === 'number'
                ? formatPrice(row.total_amount_paise)
                : '-'}
            </p>
          </div>

          <div className="mt-4 grid gap-3 text-sm">
            <MobileField label="Customer">
              <p className="font-medium text-[var(--color-ink)]">{row.customer_name || '-'}</p>
              <p className="mt-1 break-words text-xs text-[var(--color-muted)]">
                {row.customer_phone || '-'}
              </p>
              <p className="mt-1 break-words text-xs text-[var(--color-muted)]">
                {row.customer_email || '-'}
              </p>
            </MobileField>
            <div className="grid grid-cols-2 gap-3">
              <MobileField label="Payment">
                <StatusBadge value={row.payment_status || '-'} />
              </MobileField>
              <MobileField label="Shipment">
                <StatusBadge value={row.shipment_status || '-'} />
              </MobileField>
            </div>
            <MobileField label="Tracking">
              {row.tracking_number || 'No tracking'}
            </MobileField>
            <MobileField label="Created">
              {formatAdminDateTime(row.created_at)}
            </MobileField>
          </div>
        </article>
      ))}
    </div>
  )
}

function IntegrationErrorMobileCards({ rows }: { rows: AdminIntegrationErrorRow[] }) {
  return (
    <div className="divide-y divide-[var(--color-line)] sm:hidden">
      {rows.map((row) => (
        <article
          key={`${row.source}-${row.event_type}-${row.order_number}-${row.created_at}`}
          className="px-4 py-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-medium text-[var(--color-ink)]">
                {row.source || '-'}
              </p>
              <StatusBadge value={row.status || '-'} />
            </div>
            <p className="shrink-0 text-xs font-medium text-[var(--color-muted)]">
              {formatAdminDateTime(row.created_at)}
            </p>
          </div>
          <div className="mt-4 grid gap-3 text-sm">
            <MobileField label="Event">{row.event_type || '-'}</MobileField>
            <MobileField label="Order">{row.order_number || '-'}</MobileField>
            <MobileField label="Error">
              <span className="break-words leading-6">{row.error_message || '-'}</span>
            </MobileField>
          </div>
        </article>
      ))}
    </div>
  )
}

function LowStockMobileCards({ rows }: { rows: AdminLowStockVariantRow[] }) {
  return (
    <div className="divide-y divide-[var(--color-line)] sm:hidden">
      {rows.map((row) => (
        <article key={row.variant_id} className="px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="break-words text-sm font-medium text-[var(--color-ink)]">
                {row.title}
              </p>
              <p className="mt-1 break-words text-xs text-[var(--color-muted)]">{row.slug}</p>
            </div>
            <p className="shrink-0 text-lg font-medium text-[var(--color-primary)]">
              {row.stock_available}
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <MobileField label="Variant">
              <span className="font-medium text-[var(--color-ink)]">{row.size_label}</span>
              <span className="mt-1 block break-words text-xs text-[var(--color-muted)]">
                {row.variant_id}
              </span>
            </MobileField>
            <MobileField label="Category">{row.category}</MobileField>
            <MobileField label="Status">
              <StatusBadge value={row.product_active && row.variant_active ? 'active' : 'inactive'} />
            </MobileField>
          </div>
        </article>
      ))}
    </div>
  )
}

function MobileField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[0.68rem] font-medium uppercase text-[var(--color-muted)]">{label}</p>
      <div className="mt-1 text-[var(--color-ink-soft)]">{children}</div>
    </div>
  )
}

function TableHead({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-medium">{children}</th>
}

function TableCell({ children }: { children: ReactNode }) {
  return <td className="px-4 py-4 align-top text-[var(--color-ink-soft)]">{children}</td>
}

function StatusBadge({ value }: { value: string }) {
  const normalized = value.replaceAll('_', ' ')
  const alert = /failed|review|pending|error/i.test(value)

  return (
    <span
      className={`mt-2 inline-flex border px-2 py-1 text-xs font-medium ${
        alert ? 'bg-red-50 text-red-800' : 'bg-emerald-50 text-emerald-800'
      }`}
    >
      {normalized}
    </span>
  )
}
