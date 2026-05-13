import '@tanstack/react-start/server-only'

import { createRemoteJWKSet, jwtVerify } from 'jose'
import { env as workerEnv } from 'cloudflare:workers'
import { createClient } from '@supabase/supabase-js'
import {
  getRequestHeader,
  getRequestHost,
  setResponseHeader,
} from '@tanstack/react-start/server'

const adminViewLimit = 50
const recentOrdersLimit = 25

const accessJwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

export type AdminOrderRow = {
  order_number: string
  order_status: string
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  total_amount_paise: number | null
  currency: string | null
  payment_status: string | null
  shipment_status: string | null
  tracking_number: string | null
  created_at: string
}

export type AdminIntegrationErrorRow = {
  source: string | null
  event_type: string | null
  status: string | null
  order_number: string | null
  error_message: string | null
  created_at: string
}

export type AdminLowStockVariantRow = {
  product_id: string
  slug: string
  title: string
  category: string
  variant_id: string
  size_label: string
  stock_available: number
  variant_active: boolean
  product_active: boolean
}

export type AdminDashboard = {
  adminEmail: string
  loadedAt: string
  shownCounts: {
    recentOrders: number
    shipmentPendingOrders: number
    paymentReviewOrders: number
    failedPayments: number
    integrationErrors: number
    lowStockVariants: number
  }
  views: {
    recentOrders: AdminOrderRow[]
    shipmentPendingOrders: AdminOrderRow[]
    paymentReviewOrders: AdminOrderRow[]
    failedPayments: AdminOrderRow[]
    integrationErrors: AdminIntegrationErrorRow[]
    lowStockVariants: AdminLowStockVariantRow[]
  }
}

export type RetryShipmentResult = {
  adminEmail: string
  orderNumber: string
  result: {
    ok: boolean
    orderId: string
    orderNumber: string
    orderStatus: string
    shipmentStatus: string
    provider: string
    providerOrderId: string | null
    trackingNumber: string | null
    providerAttempt: string
    reason?: string
  }
}

type AdminEnv = {
  adminEmails: string[]
  accessTeamDomain?: string
  accessAudience?: string
  adminDevEmail?: string
  adminDevBypass: boolean
  supabaseUrl: string
  supabaseServiceRoleKey: string
  opsServiceRoleKey: string
}

export async function loadAdminDashboard(): Promise<AdminDashboard> {
  setAdminResponseHeaders()

  try {
    const adminEmail = await requireAdminEmail()
    const env = readAdminEnv()
    const supabase = createAdminSupabaseClient(env)
    const [
      recentOrders,
      shipmentPendingOrders,
      paymentReviewOrders,
      failedPayments,
      integrationErrors,
      lowStockVariants,
    ] = await Promise.all([
      selectRows<AdminOrderRow>(supabase, 'ops_orders_recent', recentOrdersLimit),
      selectRows<AdminOrderRow>(supabase, 'ops_shipment_pending_orders', adminViewLimit),
      selectRows<AdminOrderRow>(supabase, 'ops_payment_review_orders', adminViewLimit),
      selectRows<AdminOrderRow>(supabase, 'ops_failed_payments', adminViewLimit),
      selectRows<AdminIntegrationErrorRow>(supabase, 'ops_integration_errors', adminViewLimit),
      selectRows<AdminLowStockVariantRow>(supabase, 'ops_low_stock_variants', adminViewLimit),
    ])

    return {
      adminEmail,
      loadedAt: new Date().toISOString(),
      shownCounts: {
        recentOrders: recentOrders.length,
        shipmentPendingOrders: shipmentPendingOrders.length,
        paymentReviewOrders: paymentReviewOrders.length,
        failedPayments: failedPayments.length,
        integrationErrors: integrationErrors.length,
        lowStockVariants: lowStockVariants.length,
      },
      views: {
        recentOrders,
        shipmentPendingOrders,
        paymentReviewOrders,
        failedPayments,
        integrationErrors,
        lowStockVariants,
      },
    }
  } catch (error) {
    throw sanitizeAdminError(error, 'Unable to load admin dashboard')
  }
}

export async function retryShipmentFromAdmin(orderNumber: string): Promise<RetryShipmentResult> {
  setAdminResponseHeaders()

  try {
    requireSameOriginMutation()

    const adminEmail = await requireAdminEmail()
    const env = readAdminEnv()
    const normalizedOrderNumber = normalizeOrderNumber(orderNumber)
    const response = await fetch(`${env.supabaseUrl}/functions/v1/retry-shipment`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
        apikey: env.supabaseServiceRoleKey,
        'x-ops-key': env.opsServiceRoleKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderNumber: normalizedOrderNumber }),
    })
    const responseBody = await response.json().catch(() => null)

    console.log('admin retry-shipment', {
      adminEmail,
      orderNumber: normalizedOrderNumber,
      ok: response.ok,
      status: response.status,
    })

    if (!response.ok) {
      const errorMessage =
        responseBody &&
        typeof responseBody === 'object' &&
        'error' in responseBody &&
        typeof responseBody.error === 'string'
          ? responseBody.error
          : 'Unable to retry shipment'
      throw new AdminError(
        response.status >= 500 ? 'Unable to retry shipment' : errorMessage,
        response.status,
        response.status < 500,
      )
    }

    const result = normalizeRetryResult(responseBody)

    return {
      adminEmail,
      orderNumber: normalizedOrderNumber,
      result,
    }
  } catch (error) {
    throw sanitizeAdminError(error, 'Unable to retry shipment')
  }
}

function normalizeRetryResult(value: unknown): RetryShipmentResult['result'] {
  if (!value || typeof value !== 'object') {
    throw new AdminError('Shipment retry returned an invalid response', 502, false)
  }

  const result = value as Record<string, unknown>

  return {
    ok: result.ok === true,
    orderId: readString(result.orderId),
    orderNumber: readString(result.orderNumber),
    orderStatus: readString(result.orderStatus),
    shipmentStatus: readString(result.shipmentStatus),
    provider: readString(result.provider),
    providerOrderId: readNullableString(result.providerOrderId),
    trackingNumber: readNullableString(result.trackingNumber),
    providerAttempt: readString(result.providerAttempt),
    reason: typeof result.reason === 'string' ? result.reason : undefined,
  }
}

function readString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function readNullableString(value: unknown) {
  return typeof value === 'string' ? value : null
}

async function requireAdminEmail() {
  const env = readAdminEnv()
  const localEmail = resolveLocalAdminEmail(env)

  if (localEmail) {
    return localEmail
  }

  if (!env.accessTeamDomain || !env.accessAudience) {
    throw new AdminError('Admin access is not configured', 503, false)
  }

  const assertion = getRequestHeader('cf-access-jwt-assertion')
  if (!assertion) {
    throw new AdminError('Admin sign-in is required', 401)
  }

  const issuer = normalizeAccessIssuer(env.accessTeamDomain)
  const jwks = getAccessJwks(issuer)
  const { payload } = await jwtVerify(assertion, jwks, {
    issuer,
    audience: env.accessAudience,
  })
  const email = typeof payload.email === 'string' ? payload.email.toLowerCase() : ''

  if (!email || !env.adminEmails.includes(email)) {
    throw new AdminError('Admin access is not allowed', 403)
  }

  return email
}

function resolveLocalAdminEmail(env: AdminEnv) {
  const host = getRequestHost()
  const isLocalHost = host.startsWith('localhost') || host.startsWith('127.0.0.1')
  const email = env.adminDevEmail?.toLowerCase()

  if (!env.adminDevBypass || !isLocalDevRuntime() || !isLocalHost || !email) return null
  if (!env.adminEmails.includes(email)) {
    throw new AdminError('ADMIN_DEV_EMAIL must also be listed in ADMIN_EMAILS', 403)
  }

  return email
}

function isLocalDevRuntime() {
  const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : undefined
  return import.meta.env.DEV || nodeEnv === 'development'
}

function readAdminEnv(): AdminEnv {
  const adminEmails = parseAdminEmails(readEnv('ADMIN_EMAILS'))
  const supabaseUrl = requireEnv('SUPABASE_URL')
  const supabaseServiceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  const opsServiceRoleKey = readEnv('OPS_SERVICE_ROLE_KEY') || supabaseServiceRoleKey

  return {
    adminEmails,
    accessTeamDomain: readEnv('CF_ACCESS_TEAM_DOMAIN'),
    accessAudience: readEnv('CF_ACCESS_AUD'),
    adminDevEmail: readEnv('ADMIN_DEV_EMAIL'),
    adminDevBypass: readEnv('ADMIN_DEV_BYPASS') === 'true',
    supabaseUrl,
    supabaseServiceRoleKey,
    opsServiceRoleKey,
  }
}

function readEnv(name: string) {
  const nodeEnv = typeof process !== 'undefined' ? process.env[name] : undefined
  return workerEnv[name] || nodeEnv
}

function requireEnv(name: string) {
  const value = readEnv(name)
  if (!value) {
    throw new AdminError(`${name} is not configured`, 503, false)
  }

  return value
}

function parseAdminEmails(value: string | undefined) {
  const emails =
    value
      ?.split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? []

  if (emails.length === 0) {
    throw new AdminError('ADMIN_EMAILS is not configured', 503, false)
  }

  return emails
}

function createAdminSupabaseClient(env: AdminEnv) {
  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

async function selectRows<Row>(supabase: ReturnType<typeof createAdminSupabaseClient>, view: string, limit: number) {
  const { data, error } = await supabase.from(view).select('*').limit(limit)

  if (error) {
    throw new AdminError(`Unable to load ${view}: ${error.message}`, 500, false)
  }

  return (data ?? []) as Row[]
}

function normalizeAccessIssuer(teamDomain: string) {
  const normalizedDomain = teamDomain.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  return `https://${normalizedDomain}`
}

function getAccessJwks(issuer: string) {
  const cached = accessJwksCache.get(issuer)
  if (cached) return cached

  const jwks = createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`))
  accessJwksCache.set(issuer, jwks)
  return jwks
}

function normalizeOrderNumber(value: string) {
  const orderNumber = value.trim().toUpperCase()

  if (!/^TZ-\d{8}-[A-Z0-9]{6}$/.test(orderNumber)) {
    throw new AdminError('Enter a valid order number like TZ-20260511-A7K2F1', 400)
  }

  return orderNumber
}

function setAdminResponseHeaders() {
  setResponseHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
  setResponseHeader('CDN-Cache-Control', 'no-store')
  setResponseHeader('Pragma', 'no-cache')
  setResponseHeader('X-Robots-Tag', 'noindex, nofollow')
}

function requireSameOriginMutation() {
  const host = getRequestHost({ xForwardedHost: true })
  const origin = getRequestHeader('origin')
  const secFetchSite = getRequestHeader('sec-fetch-site')

  if (secFetchSite && !['same-origin', 'none'].includes(secFetchSite)) {
    throw new AdminError('Admin request origin is not allowed', 403)
  }

  if (!origin) return

  let originHost = ''
  try {
    originHost = new URL(origin).host
  } catch {
    throw new AdminError('Admin request origin is not allowed', 403)
  }

  if (originHost !== host) {
    throw new AdminError('Admin request origin is not allowed', 403)
  }
}

function sanitizeAdminError(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminError && error.expose) {
    return error
  }

  console.error(fallbackMessage, error)
  return new AdminError(fallbackMessage, error instanceof AdminError ? error.status : 500)
}

class AdminError extends Error {
  constructor(
    message: string,
    readonly status = 500,
    readonly expose = true,
  ) {
    super(message)
  }
}
