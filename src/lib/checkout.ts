import { getAmountBucket } from './analytics'
import { formatPrice } from './format'

export type CheckoutForm = {
  email: string
  fullName: string
  phone: string
  addressLine: string
  landmark: string
  city: string
  state: string
  pincode: string
}

export const initialCheckoutForm: CheckoutForm = {
  email: '',
  fullName: '',
  phone: '',
  addressLine: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
}

export type CheckoutStatus =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'opening'
  | 'payment-open'
  | 'confirming'
  | 'success'
  | 'cancelled'
  | 'error'

export type CreateOrderResponse = {
  keyId: string
  orderUuid: string
  orderNumber: string
  orderId: string
  amount: number
  currency: string
  totals: {
    subtotal: number
    shipping: number
    total: number
  }
}

export type VerifyPaymentResponse = {
  verified: boolean
  orderUuid?: string
  orderNumber?: string
  paymentId?: string
  orderId?: string
  orderStatus?: string
  shipment?: {
    orderStatus?: string
    shipmentStatus?: string
    trackingNumber?: string | null
    providerOrderId?: string | null
  } | null
  error?: string
}

export type RazorpaySuccessResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export type PendingOrder = CreateOrderResponse & {
  fingerprint: string
}

export type CheckoutConfirmation = {
  orderNumber: string
  paymentId?: string
  orderStatus?: string
  shipmentStatus?: string
  trackingNumber?: string | null
  needsReview: boolean
}

export function isBusyCheckoutStatus(status: CheckoutStatus) {
  return (
    status === 'preparing' ||
    status === 'opening' ||
    status === 'payment-open' ||
    status === 'confirming'
  )
}

export function getPayButtonLabel(status: CheckoutStatus, total: number) {
  if (status === 'preparing') return 'Preparing order'
  if (status === 'opening') return 'Opening Razorpay'
  if (status === 'payment-open') return 'Payment window open'
  if (status === 'confirming') return 'Confirming payment'
  if (status === 'ready') return `Pay ${formatPrice(total)}`
  if (status === 'cancelled') return 'Try payment again'
  if (status === 'error') return 'Try again'

  return `Pay ${formatPrice(total)}`
}

export function getMobilePayButtonLabel(status: CheckoutStatus) {
  if (status === 'preparing') return 'Preparing'
  if (status === 'opening') return 'Opening'
  if (status === 'payment-open') return 'Opened'
  if (status === 'confirming') return 'Confirming'
  if (status === 'cancelled') return 'Try again'
  if (status === 'error') return 'Try again'

  return 'Pay now'
}

export function getCheckoutAnalyticsPayload(itemCount: number, totalPaise: number) {
  return {
    amount_bucket: getAmountBucket(totalPaise),
    item_count: itemCount,
  }
}

export function validateCheckoutForm(form: CheckoutForm) {
  const requiredFields = [
    form.email,
    form.fullName,
    form.phone,
    form.addressLine,
    form.city,
    form.state,
    form.pincode,
  ]

  if (requiredFields.some((field) => !field.trim())) {
    return 'Complete delivery details to continue.'
  }

  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
    return 'Enter a valid email address.'
  }

  if (!/^\d{6}$/.test(form.pincode.trim())) {
    return 'Enter a valid 6 digit pincode.'
  }

  if (!normalizePhoneForPayment(form.phone)) {
    return 'Enter a valid 10 digit phone number.'
  }

  return ''
}

export function normalizeCheckoutForm(form: CheckoutForm): CheckoutForm {
  return {
    email: form.email.trim(),
    fullName: form.fullName.trim(),
    phone: normalizePhoneForPayment(form.phone) || form.phone.trim(),
    addressLine: form.addressLine.trim(),
    landmark: form.landmark.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    pincode: form.pincode.trim(),
  }
}

function normalizePhoneForPayment(phone: string) {
  const trimmedPhone = phone.trim()
  const digits = trimmedPhone.replace(/\D/g, '')

  if (/^\+\d{10,15}$/.test(trimmedPhone)) return trimmedPhone
  if (/^\d{10}$/.test(digits)) return `+91${digits}`
  if (/^91\d{10}$/.test(digits)) return `+${digits}`

  return ''
}

export function createSuccessMessage(verification: VerifyPaymentResponse) {
  if (verification.shipment?.trackingNumber) {
    return `Your order is confirmed. Tracking number: ${verification.shipment.trackingNumber}.`
  }

  if (verification.orderStatus === 'shipment_pending') {
    return 'Your order is confirmed. We will share tracking after dispatch.'
  }

  return 'Your order is confirmed. We will start preparing it shortly.'
}

export function formatCustomerOrderStatus(status: string) {
  const labels: Record<string, string> = {
    paid: 'Confirmed',
    shipment_pending: 'Preparing',
    payment_review_required: 'Being checked',
    payment_pending: 'Awaiting payment',
    payment_failed: 'Payment incomplete',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  }

  return labels[status] ?? toTitleCase(status)
}

export function formatCustomerDeliveryStatus(status: string) {
  const labels: Record<string, string> = {
    pending: 'Preparing for dispatch',
    shipment_pending: 'Preparing for dispatch',
    created: 'Preparing for dispatch',
    in_transit: 'On the way',
    delivered: 'Delivered',
    failed: 'We will contact you',
  }

  return labels[status] ?? toTitleCase(status)
}

function toTitleCase(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
