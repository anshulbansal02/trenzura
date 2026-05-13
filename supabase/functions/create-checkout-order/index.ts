import { createClient } from 'npm:@supabase/supabase-js@2.105.4'

import { handleCors, jsonResponse } from '../_shared/http/cors.ts'
import { RateLimitError, requireRateLimit } from '../_shared/http/rate-limit.ts'
import { createRazorpayOrder } from '../_shared/integrations/razorpay.ts'

type CartItemInput = {
  productId: string
  variantId: string
  size: string
  quantity: number
}

type CustomerInput = {
  email: string
  fullName: string
  phone: string
  addressLine: string
  landmark: string
  city: string
  state: string
  pincode: string
}

type ProductRow = {
  product_id: string
  slug: string
  title: string
  images: string[]
  mrp_paise: number
  selling_price_paise: number
  active: boolean
}

type VariantRow = {
  variant_id: string
  product_id: string
  size_label: string
  stock_available: number
  active: boolean
}

const currency = 'INR'
const standardShippingPaise = 14900
const maxCheckoutQuantity = 20

Deno.serve(async (request) => {
  const cors = handleCors(request)
  if (cors) return cors

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 })
  }

  try {
    requireRateLimit(request, {
      key: 'create-checkout-order',
      limit: 20,
      windowMs: 10 * 60 * 1000,
    })

    const body = await request.json().catch(() => null)
    const customer = normalizeCustomer(body?.customer)
    const items = normalizeCartItems(body?.items)

    const supabase = createClient(
      requiredEnv('SUPABASE_URL'),
      requiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false } },
    )
    const productIds = [...new Set(items.map((item) => item.productId))]
    const variantIds = [...new Set(items.map((item) => item.variantId))]
    const { data: products, error: productError } = await supabase
      .from('products')
      .select('product_id,slug,title,images,mrp_paise,selling_price_paise,active')
      .in('product_id', productIds)

    if (productError) throw productError

    const { data: variants, error: variantError } = await supabase
      .from('product_variants')
      .select('variant_id,product_id,size_label,stock_available,active')
      .in('variant_id', variantIds)

    if (variantError) throw variantError

    const productById = new Map(
      ((products ?? []) as ProductRow[]).map((product) => [product.product_id, product]),
    )
    const variantById = new Map(
      ((variants ?? []) as VariantRow[]).map((variant) => [variant.variant_id, variant]),
    )
    const orderItems = items.map((item) => {
      const product = productById.get(item.productId)
      if (!product || !product.active) {
        throw new CheckoutError('One item in your bag is no longer available', 400)
      }

      const variant = variantById.get(item.variantId)
      if (
        !variant ||
        !variant.active ||
        variant.product_id !== product.product_id ||
        variant.size_label !== item.size
      ) {
        throw new CheckoutError(`${product.title} is unavailable in ${item.size}`, 400)
      }

      if (variant.stock_available < 1) {
        throw new CheckoutError(`${product.title} is sold out in ${item.size}`, 400)
      }

      if (item.quantity > variant.stock_available) {
        throw new CheckoutError(
          `Only ${variant.stock_available} item(s) available in ${item.size}`,
          400,
        )
      }

      return {
        product_id: product.product_id,
        variant_id: variant.variant_id,
        product_slug: product.slug,
        title: product.title,
        size_label: variant.size_label,
        quantity: item.quantity,
        unit_selling_price_paise: product.selling_price_paise,
        unit_mrp_paise: product.mrp_paise,
        discount_amount_paise: Math.max(0, product.mrp_paise - product.selling_price_paise),
        line_total_paise: product.selling_price_paise * item.quantity,
        primary_image_url: product.images[0] ?? null,
      }
    })
    const subtotal = orderItems.reduce((total, item) => total + item.line_total_paise, 0)
    const shipping = standardShippingPaise
    const total = subtotal + shipping

    if (total < 100) {
      throw new CheckoutError('Checkout amount must be at least INR 1', 400)
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: createOrderNumber(),
        status: 'payment_pending',
        currency,
        subtotal_amount_paise: subtotal,
        shipping_amount_paise: shipping,
        total_amount_paise: total,
        customer_email: customer.email,
        customer_name: customer.fullName,
        customer_phone: customer.phone,
        shipping_address: {
          addressLine: customer.addressLine,
          landmark: customer.landmark,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
        },
      })
      .select('id,order_number')
      .single()

    if (orderError) throw orderError

    const orderId = String(order.id)
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems.map((item) => ({ ...item, order_id: orderId })))

    if (itemsError) throw itemsError

    const keyId = requiredEnv('RAZORPAY_KEY_ID')
    const razorpayOrder = await createRazorpayOrder({
      keyId,
      keySecret: requiredEnv('RAZORPAY_KEY_SECRET'),
      amount: total,
      currency,
      receipt: String(order.order_number).slice(0, 40),
      notes: {
        orderId,
        orderNumber: String(order.order_number),
        customerEmail: customer.email,
      },
    })

    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        order_id: orderId,
        provider: 'razorpay',
        provider_order_id: razorpayOrder.id,
        status: 'created',
        amount_paise: total,
        currency,
        raw_payload: razorpayOrder,
      })

    if (paymentError) throw paymentError

    return jsonResponse({
      keyId,
      orderUuid: orderId,
      orderNumber: order.order_number,
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      totals: {
        subtotal,
        shipping,
        total,
      },
    })
  } catch (error) {
    if (error instanceof RateLimitError) {
      return jsonResponse(
        { error: error.message },
        {
          status: error.status,
          headers: { 'Retry-After': String(error.retryAfterSeconds) },
        },
      )
    }

    if (error instanceof CheckoutError) {
      return jsonResponse({ error: error.message }, { status: error.status })
    }

    console.error(error)
    return jsonResponse({ error: 'Unable to create checkout order' }, { status: 500 })
  }
})

function normalizeCartItems(value: unknown): CartItemInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new CheckoutError('Your bag is empty', 400)
  }

  if (value.length > 50) {
    throw new CheckoutError('Too many cart lines', 400)
  }

  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new CheckoutError('Invalid cart item', 400)
    }

    const input = item as Partial<CartItemInput>
    const productId = String(input.productId ?? '').trim()
    const variantId = String(input.variantId ?? '').trim()
    const size = String(input.size ?? '').trim()
    const quantity = Number(input.quantity)

    if (!productId || !variantId || !size || !Number.isInteger(quantity) || quantity < 1) {
      throw new CheckoutError('Invalid cart item', 400)
    }

    if (quantity > maxCheckoutQuantity) {
      throw new CheckoutError(`Quantity cannot exceed ${maxCheckoutQuantity}`, 400)
    }

    return { productId, variantId, size, quantity }
  })
}

function normalizeCustomer(value: unknown): CustomerInput {
  if (!value || typeof value !== 'object') {
    throw new CheckoutError('Delivery details are required', 400)
  }

  const input = value as Partial<CustomerInput> & {
    address?: string
    postalCode?: string
  }
  const customer = {
    email: String(input.email ?? '').trim(),
    fullName: String(input.fullName ?? '').trim(),
    phone: String(input.phone ?? '').trim(),
    addressLine: String(input.addressLine ?? input.address ?? '').trim(),
    landmark: String(input.landmark ?? '').trim(),
    city: String(input.city ?? '').trim(),
    state: String(input.state ?? '').trim(),
    pincode: String(input.pincode ?? input.postalCode ?? '').trim(),
  }

  const requiredFields = [
    customer.email,
    customer.fullName,
    customer.phone,
    customer.addressLine,
    customer.city,
    customer.state,
    customer.pincode,
  ]

  if (requiredFields.some((field) => field.length === 0)) {
    throw new CheckoutError('Complete delivery details to continue', 400)
  }

  if (!/^\S+@\S+\.\S+$/.test(customer.email)) {
    throw new CheckoutError('Enter a valid email address', 400)
  }

  if (!/^\d{6}$/.test(customer.pincode)) {
    throw new CheckoutError('Enter a valid 6 digit pincode', 400)
  }

  return customer
}

function createOrderNumber() {
  const date = new Date()
  const datePart = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('')
  const randomPart = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()

  return `TZ-${datePart}-${randomPart}`
}

function requiredEnv(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new CheckoutError(`${name} is not configured`, 503)
  return value
}

class CheckoutError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message)
  }
}
