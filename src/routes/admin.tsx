import { Button } from '@base-ui/react/button'
import { createFileRoute } from '@tanstack/react-router'
import { createServerFn, useServerFn } from '@tanstack/react-start'
import {
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'

import { AdminActionPanel } from '../components/admin/AdminActionPanel'
import { AdminDataTable } from '../components/admin/AdminDataTable'
import { AdminMetrics } from '../components/admin/AdminMetrics'
import { AdminViewTabs } from '../components/admin/AdminViewTabs'
import { createPageMeta } from '../lib/seo'
import type {
  CatalogPublishEnvironment,
  CatalogPublishRun,
} from '../lib/admin.server'
import {
  formatAdminDateTime,
  type AdminActionStatus,
  type AdminPublishEnvironment,
  type AdminViewKey,
} from '../lib/admin-ui'

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

const publishCatalog = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    if (!data || typeof data !== 'object') {
      throw new Error('Publish environment is required')
    }

    const environment = String((data as { environment?: unknown }).environment ?? '')
    if (environment !== 'qa' && environment !== 'prod') {
      throw new Error('Publish environment must be qa or prod')
    }

    return { environment: environment as CatalogPublishEnvironment }
  })
  .handler(async ({ data }) => {
    const { publishCatalogFromAdmin } = await import('../lib/admin.server')
    return publishCatalogFromAdmin(data.environment)
  })

const getCatalogPublishStatus = createServerFn({ method: 'GET' }).handler(async () => {
  const { loadCatalogPublishStatus } = await import('../lib/admin.server')
  return loadCatalogPublishStatus()
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

function AdminPage() {
  const dashboard = Route.useLoaderData()
  const retryShipment = useServerFn(retryAdminShipment)
  const dispatchCatalogPublish = useServerFn(publishCatalog)
  const loadPublishStatus = useServerFn(getCatalogPublishStatus)
  const [activeView, setActiveView] = useState<AdminViewKey>('recentOrders')
  const [orderNumber, setOrderNumber] = useState('')
  const [retryStatus, setRetryStatus] = useState<AdminActionStatus>('idle')
  const [retryMessage, setRetryMessage] = useState('')
  const [publishEnvironment, setPublishEnvironment] = useState<AdminPublishEnvironment>('qa')
  const [publishConfirmation, setPublishConfirmation] = useState('')
  const [publishStatus, setPublishStatus] = useState<AdminActionStatus>('idle')
  const [publishMessage, setPublishMessage] = useState('')
  const [publishRuns, setPublishRuns] = useState<CatalogPublishRun[]>([])
  const activeRows = dashboard.views[activeView]

  function refreshDashboard() {
    window.location.reload()
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
    } catch (error) {
      setRetryStatus('error')
      setRetryMessage(error instanceof Error ? error.message : 'Unable to retry shipment')
    }
  }

  async function refreshPublishStatus() {
    setPublishStatus('loading')
    setPublishMessage('Loading publish status...')

    try {
      const status = await loadPublishStatus()
      setPublishRuns(status.runs)
      setPublishStatus('idle')
      setPublishMessage(status.runs.length > 0 ? 'Latest publish runs loaded.' : 'No publish runs found.')
    } catch (error) {
      setPublishStatus('error')
      setPublishMessage(error instanceof Error ? error.message : 'Unable to load publish status')
    }
  }

  async function submitPublishCatalog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (publishEnvironment === 'prod' && publishConfirmation.trim().toUpperCase() !== 'PUBLISH PROD') {
      setPublishStatus('error')
      setPublishMessage('Type PUBLISH PROD before publishing production.')
      return
    }

    setPublishStatus('loading')
    setPublishMessage(`Dispatching ${publishEnvironment.toUpperCase()} catalog publish...`)

    try {
      const result = await dispatchCatalogPublish({ data: { environment: publishEnvironment } })
      setPublishStatus('success')
      setPublishMessage(
        `Catalog publish dispatched for ${result.environment.toUpperCase()} from ${result.ref}.`,
      )
      setPublishConfirmation('')
      await refreshPublishStatus()
    } catch (error) {
      setPublishStatus('error')
      setPublishMessage(error instanceof Error ? error.message : 'Unable to publish catalog')
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
            Updated {formatAdminDateTime(dashboard.loadedAt)}
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

      <AdminMetrics dashboard={dashboard} />

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <AdminViewTabs
            activeView={activeView}
            counts={dashboard.shownCounts}
            onChange={setActiveView}
          />
          <AdminDataTable dashboard={dashboard} activeView={activeView} rows={activeRows} />
        </div>

        <AdminActionPanel
          publishEnvironment={publishEnvironment}
          publishConfirmation={publishConfirmation}
          publishStatus={publishStatus}
          publishMessage={publishMessage}
          publishRuns={publishRuns}
          onPublishEnvironmentChange={setPublishEnvironment}
          onPublishConfirmationChange={setPublishConfirmation}
          onPublishSubmit={submitPublishCatalog}
          onRefreshPublishStatus={refreshPublishStatus}
          orderNumber={orderNumber}
          retryStatus={retryStatus}
          retryMessage={retryMessage}
          onOrderNumberChange={setOrderNumber}
          onRetrySubmit={submitRetry}
        />
      </section>
    </main>
  )
}
