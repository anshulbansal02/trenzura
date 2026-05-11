import type { OrderForShipment, ShipmentRow } from '../domain/shipments.ts'

export type DelhiveryShipmentResult =
  | {
      ok: true
      providerOrderId: string | null
      trackingNumber: string | null
      rawPayload: unknown
    }
  | {
      ok: false
      skipped?: boolean
      reason: string
      rawPayload?: unknown
    }

export async function createDelhiveryShipment(input: {
  order: OrderForShipment
  shipment: ShipmentRow
}): Promise<DelhiveryShipmentResult> {
  if (Deno.env.get('DELHIVERY_ENABLED') !== 'true') {
    return {
      ok: false,
      skipped: true,
      reason: 'delhivery_disabled',
    }
  }

  const apiToken = Deno.env.get('DELHIVERY_API_TOKEN')
  const apiUrl = Deno.env.get('DELHIVERY_CREATE_SHIPMENT_URL')

  if (!apiToken || !apiUrl) {
    return {
      ok: false,
      reason: 'delhivery_config_missing',
    }
  }

  const payload = buildShipmentPayload(input.order, input.shipment)
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const responsePayload = await response.json().catch(() => null)

  if (!response.ok) {
    return {
      ok: false,
      reason: readProviderError(responsePayload) ?? `delhivery_http_${response.status}`,
      rawPayload: responsePayload,
    }
  }

  return {
    ok: true,
    providerOrderId: pickString(responsePayload, [
      'order_id',
      'orderId',
      'shipment_id',
      'shipmentId',
      'refnum',
    ]),
    trackingNumber: pickString(responsePayload, [
      'waybill',
      'awb',
      'tracking_number',
      'trackingNumber',
    ]),
    rawPayload: responsePayload,
  }
}

function buildShipmentPayload(order: OrderForShipment, shipment: ShipmentRow) {
  const address = order.shipping_address

  return {
    shipment_id: shipment.id,
    order_id: order.id,
    order_number: order.order_number,
    payment_mode: 'Prepaid',
    total_amount_paise: order.total_amount_paise,
    currency: order.currency,
    consignee: {
      name: order.customer_name,
      phone: order.customer_phone,
      email: order.customer_email,
      address: String(address.address ?? address.addressLine ?? ''),
      city: String(address.city ?? ''),
      state: String(address.state ?? ''),
      pincode: String(address.pincode ?? address.postalCode ?? ''),
      landmark: String(address.landmark ?? ''),
    },
    package: {
      weight_grams: readNumberEnv('DELHIVERY_PACKAGE_WEIGHT_GRAMS', 500),
      length_cm: readNumberEnv('DELHIVERY_PACKAGE_LENGTH_CM', 30),
      breadth_cm: readNumberEnv('DELHIVERY_PACKAGE_BREADTH_CM', 25),
      height_cm: readNumberEnv('DELHIVERY_PACKAGE_HEIGHT_CM', 5),
    },
    pickup_location: Deno.env.get('DELHIVERY_PICKUP_LOCATION') ?? '',
    seller_gst: Deno.env.get('DELHIVERY_SELLER_GST') ?? '',
    hsn_code: Deno.env.get('DELHIVERY_HSN_CODE') ?? '',
    items: order.order_items.map((item) => ({
      name: item.title,
      sku: item.product_id,
      variant_id: item.variant_id,
      size: item.size_label,
      quantity: item.quantity,
      unit_price_paise: item.unit_selling_price_paise,
    })),
  }
}

function readNumberEnv(name: string, fallback: number) {
  const value = Number(Deno.env.get(name))
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function pickString(value: unknown, keys: string[]) {
  if (!value || typeof value !== 'object') return null

  for (const key of keys) {
    const nested = findNestedValue(value as Record<string, unknown>, key)
    if (typeof nested === 'string' && nested.trim()) return nested.trim()
    if (typeof nested === 'number') return String(nested)
  }

  return null
}

function findNestedValue(value: Record<string, unknown>, key: string): unknown {
  if (key in value) return value[key]

  for (const nested of Object.values(value)) {
    if (Array.isArray(nested)) {
      for (const item of nested) {
        if (item && typeof item === 'object') {
          const result = findNestedValue(item as Record<string, unknown>, key)
          if (result !== undefined) return result
        }
      }
    }

    if (nested && typeof nested === 'object') {
      const result = findNestedValue(nested as Record<string, unknown>, key)
      if (result !== undefined) return result
    }
  }

  return undefined
}

function readProviderError(value: unknown) {
  return pickString(value, ['error', 'message', 'description', 'remark'])
}
