import { Button } from '@base-ui/react/button'
import { Field } from '@base-ui/react/field'
import { Link, createFileRoute } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react'
import type { FormEvent, HTMLAttributes } from 'react'
import { useState } from 'react'

import { useCart } from '../components/cart/CartProvider'
import { ProductMedia } from '../components/product/ProductMedia'
import { formatPrice, standardShippingPaise } from '../lib/format'
import { createPageMeta } from '../lib/seo'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'

export const Route = createFileRoute('/checkout')({
  head: () =>
    createPageMeta({
      title: 'Checkout | Trenzura',
      description: 'Secure checkout for your Trenzura bag with UPI, card, and wallet payments.',
      path: '/checkout',
    }),
  component: CheckoutPage,
})

type CheckoutForm = {
  email: string
  fullName: string
  phone: string
  addressLine: string
  landmark: string
  city: string
  state: string
  pincode: string
}

const initialForm: CheckoutForm = {
  email: '',
  fullName: '',
  phone: '',
  addressLine: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
}

type CheckoutStatus =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'opening'
  | 'payment-open'
  | 'confirming'
  | 'success'
  | 'cancelled'
  | 'error'

type CreateOrderResponse = {
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

type VerifyPaymentResponse = {
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

type RazorpaySuccessResponse = {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

type PendingOrder = CreateOrderResponse & {
  fingerprint: string
}

type Confirmation = {
  orderNumber: string
  paymentId?: string
  orderStatus?: string
  shipmentStatus?: string
  trackingNumber?: string | null
  needsReview: boolean
}

const loadCheckoutScript = createIsomorphicFn()
  .client(async () => {
    const { loadRazorpayCheckout } = await import('../lib/razorpay.client')
    await loadRazorpayCheckout()
  })
  .server(() => {
    throw new Error('Razorpay checkout can only run in the browser')
  })

function CheckoutPage() {
  const { lines, itemCount, subtotal, savings, clearCart } = useCart()
  const [form, setForm] = useState(initialForm)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<CheckoutStatus>('idle')
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const shipping = subtotal === 0 ? 0 : standardShippingPaise
  const total = subtotal + shipping
  const normalizedForm = normalizeCheckoutForm(form)
  const checkoutFingerprint = JSON.stringify({
    customer: normalizedForm,
    items: lines.map((line) => ({
      productId: line.productId,
      variantId: line.variantId,
      size: line.size,
      quantity: line.quantity,
    })),
  })
  const activePendingOrder =
    pendingOrder?.fingerprint === checkoutFingerprint ? pendingOrder : null
  const summaryTotals = activePendingOrder?.totals ?? { subtotal, shipping, total }
  const isCheckoutBusy = isBusyCheckoutStatus(status)

  function updateField(field: keyof CheckoutForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setPendingOrder(null)
    if (!isBusyCheckoutStatus(status)) {
      setStatus('idle')
      setMessage('')
    }
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setConfirmation(null)

    const validationMessage = validateCheckoutForm(normalizedForm)
    if (validationMessage) {
      setStatus('error')
      setMessage(validationMessage)
      return
    }

    if (!isSupabaseConfigured) {
      setStatus('error')
      setMessage('Checkout is temporarily unavailable. Please try again later.')
      return
    }

    setStatus(activePendingOrder ? 'opening' : 'preparing')
    setMessage('')

    try {
      const order = activePendingOrder ?? (await createCheckoutOrder())
      if (!activePendingOrder) {
        setPendingOrder({ ...order, fingerprint: checkoutFingerprint })
      }

      if (!activePendingOrder && order.totals.total !== total) {
        setStatus('ready')
        setMessage(
          `We refreshed your payable total to ${formatPrice(order.totals.total)}. Review it once, then continue to payment.`,
        )
        return
      }

      await openRazorpayCheckout(order)
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Unable to start checkout')
    }
  }

  async function createCheckoutOrder() {
    const supabase = getSupabaseClient()
    const { data: order, error } = await supabase.functions.invoke<CreateOrderResponse>(
      'create-checkout-order',
      {
        body: {
          customer: normalizedForm,
          items: lines.map((line) => ({
            productId: line.productId,
            variantId: line.variantId,
            size: line.size,
            quantity: line.quantity,
          })),
        },
      },
    )

    if (error || !order) {
      throw new Error(error?.message ?? 'Unable to prepare your order')
    }

    return order
  }

  async function openRazorpayCheckout(order: CreateOrderResponse) {
    await loadCheckoutScript()

    let paymentStarted = false
    setStatus('opening')
    const checkout = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Trenzura',
      description: `${itemCount} ${itemCount === 1 ? 'item' : 'items'} from your bag`,
      order_id: order.orderId,
      prefill: {
        name: normalizedForm.fullName,
        email: normalizedForm.email,
        contact: normalizedForm.phone,
      },
      readonly: {
        name: true,
        email: true,
        contact: true,
      },
      notes: {
        orderUuid: order.orderUuid,
        orderNumber: order.orderNumber,
        customerEmail: normalizedForm.email,
      },
      theme: {
        color: '#72343d',
        backdrop_color: '#171310',
      },
      modal: {
        backdropclose: false,
        confirm_close: true,
        escape: true,
        handleback: true,
        ondismiss: () => {
          if (!paymentStarted) {
            setStatus('cancelled')
            setMessage('Payment window closed. Your details and confirmed total are still here.')
          }
        },
      },
      handler: async (response: RazorpaySuccessResponse) => {
        paymentStarted = true
        setStatus('confirming')
        setMessage('Confirming your payment...')

        try {
          const verification = await verifyPayment(order.orderUuid, response)
          const needsReview = verification.orderStatus === 'payment_review_required'

          if (!verification.verified && !needsReview) {
            throw new Error(verification.error ?? 'We could not confirm the payment')
          }

          clearCart()
          setPendingOrder(null)
          setForm(initialForm)
          setStatus('success')
          setConfirmation({
            orderNumber: verification.orderNumber ?? order.orderNumber,
            paymentId: verification.paymentId ?? response.razorpay_payment_id,
            orderStatus: verification.orderStatus,
            shipmentStatus: verification.shipment?.shipmentStatus,
            trackingNumber: verification.shipment?.trackingNumber,
            needsReview,
          })
          setMessage(
            needsReview
              ? 'Payment was received. We are checking availability before dispatch.'
              : createSuccessMessage(verification),
          )
        } catch (error) {
          setStatus('error')
          setMessage(error instanceof Error ? error.message : 'Unable to confirm your payment')
        }
      },
    })

    checkout.open()
    setStatus('payment-open')
    setMessage('Complete payment in the Razorpay window. We will confirm the order here.')
  }

  if (confirmation) {
    return (
      <main className="fashion-container py-12 lg:py-16">
        <section className="mx-auto max-w-3xl text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-[var(--color-sage)] text-white">
            {confirmation.needsReview ? (
              <AlertTriangle className="size-6" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-6" aria-hidden="true" />
            )}
          </span>
          <p className="fashion-eyebrow mt-6">Order {confirmation.orderNumber}</p>
          <h1 className="fashion-display mt-2 text-5xl sm:text-6xl">
            {confirmation.needsReview ? 'Payment received' : 'Order confirmed'}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
            {message}
          </p>
        </section>

        <section className="fashion-surface mx-auto mt-10 max-w-3xl rounded-[1.25rem] p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <ConfirmationLine label="Order number" value={confirmation.orderNumber} />
            <ConfirmationLine label="Payment reference" value={confirmation.paymentId ?? 'Recorded'} />
            <ConfirmationLine
              label="Order"
              value={formatCustomerOrderStatus(confirmation.orderStatus ?? 'paid')}
            />
            <ConfirmationLine
              label="Delivery"
              value={
                confirmation.trackingNumber
                  ? confirmation.trackingNumber
                  : formatCustomerDeliveryStatus(confirmation.shipmentStatus ?? 'shipment_pending')
              }
            />
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-[var(--color-line)] pt-5 sm:flex-row sm:justify-end">
            <Button
              nativeButton={false}
              render={
                <Link
                  to="/products"
                  className="fashion-button-secondary h-11 justify-center px-5"
                />
              }
            >
              Continue shopping
            </Button>
          </div>
        </section>
      </main>
    )
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto flex min-h-[70svh] max-w-3xl items-center justify-center px-5 py-16 text-center sm:px-8">
        <div>
          <p className="fashion-eyebrow">Checkout</p>
          <h1 className="fashion-display mt-2 text-5xl">Your bag is empty</h1>
          <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
            Choose a style and size to begin your order.
          </p>
          <Button
            nativeButton={false}
            render={
              <Link
                to="/products"
                className="fashion-button-primary mt-7 h-11 px-5"
              />
            }
          >
            Continue shopping
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="fashion-container py-10 lg:py-14">
      <div className="mb-10 flex flex-col gap-4 border-b border-[var(--color-line)] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="fashion-eyebrow">Checkout</p>
          <h1 className="fashion-display mt-2 text-5xl sm:text-6xl">
            Delivery and payment
          </h1>
        </div>
        <p className="fashion-copy max-w-xl">
          Add your delivery details, review your bag, and pay securely when everything looks right.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <form onSubmit={submitCheckout} className="space-y-8">
          <section className="fashion-surface rounded-[1.25rem] p-5">
            <h2 className="font-serif text-2xl text-[var(--color-ink)]">Contact</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <CheckoutField
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={form.email}
                onChange={(value) => updateField('email', value)}
              />
              <CheckoutField
                label="Phone"
                type="tel"
                placeholder="98765 43210"
                autoComplete="tel"
                value={form.phone}
                onChange={(value) => updateField('phone', value)}
              />
            </div>
          </section>

          <section className="fashion-surface rounded-[1.25rem] p-5">
            <h2 className="font-serif text-2xl text-[var(--color-ink)]">Delivery</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <CheckoutField
                label="Full name"
                placeholder="Aarav Sharma"
                autoComplete="name"
                value={form.fullName}
                onChange={(value) => updateField('fullName', value)}
              />
              <CheckoutField
                label="Pincode"
                inputMode="numeric"
                placeholder="400001"
                autoComplete="postal-code"
                value={form.pincode}
                onChange={(value) => updateField('pincode', value)}
              />
              <CheckoutField
                label="Address"
                placeholder="Flat 12, Palm Grove Apartments, MG Road"
                autoComplete="street-address"
                value={form.addressLine}
                onChange={(value) => updateField('addressLine', value)}
                className="sm:col-span-2"
              />
              <CheckoutField
                label="Landmark"
                placeholder="Near City Mall"
                value={form.landmark}
                onChange={(value) => updateField('landmark', value)}
                required={false}
              />
              <CheckoutField
                label="City"
                placeholder="Mumbai"
                autoComplete="address-level2"
                value={form.city}
                onChange={(value) => updateField('city', value)}
              />
              <CheckoutField
                label="State"
                placeholder="Maharashtra"
                autoComplete="address-level1"
                value={form.state}
                onChange={(value) => updateField('state', value)}
              />
            </div>
          </section>

          <section className="fashion-surface rounded-[1.25rem] p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[var(--color-ink)] text-[var(--color-paper)]">
                <CreditCard className="size-4" aria-hidden="true" />
              </span>
              <h2 className="font-serif text-2xl text-[var(--color-ink)]">Payment</h2>
            </div>
            <div className="mt-5 rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-canvas)] p-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-ink)]">
                <ShieldCheck className="size-4 text-[var(--color-sage)]" aria-hidden="true" />
                Razorpay secure checkout
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Pay with UPI, cards, wallets, and more. Your name, email, and phone are prefilled
                from this page so the payment step stays quick.
              </p>
              <div className="mt-4 grid gap-2 text-xs font-semibold text-[var(--color-muted)] sm:grid-cols-3">
                {['Review details', 'Pay in Razorpay', 'Instant confirmation'].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-3 py-2 text-center"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
            {status !== 'idle' || message ? (
              <CheckoutNotice status={status} message={message} total={summaryTotals.total} />
            ) : null}
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={clearCart}
              disabled={isCheckoutBusy}
              className="text-sm font-semibold text-[var(--color-muted)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-rouge)] hover:decoration-[var(--color-rouge)] disabled:cursor-not-allowed disabled:text-stone-400 disabled:no-underline"
            >
              Clear bag
            </button>
            <Button
              type="submit"
              disabled={isCheckoutBusy}
              className="fashion-button-primary h-12 min-w-52 gap-2 px-6"
            >
              {isCheckoutBusy ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <CreditCard className="size-4" aria-hidden="true" />
              )}
              {getPayButtonLabel(status, activePendingOrder?.totals.total ?? total)}
            </Button>
          </div>
        </form>

        <aside className="fashion-surface self-start rounded-[1.25rem] p-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-serif text-2xl text-[var(--color-ink)]">Order summary</h2>
            <p className="text-sm text-[var(--color-muted)]">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </p>
          </div>

          <div className="mt-5 space-y-5">
            {lines.map((line) => (
              <div key={line.id} className="grid grid-cols-[72px_1fr] gap-3">
                <ProductMedia product={line.product} className="aspect-[4/5]" />
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-ink)]">
                        {line.product.title}
                      </p>
                      <p className="mt-1 text-xs text-[var(--color-muted)]">
                        Size {line.size} / Qty {line.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {formatPrice(line.product.sellingPricePaise * line.quantity)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-2 border-t border-[var(--color-line)] pt-5 text-sm">
            <SummaryLine label="Subtotal" value={formatPrice(summaryTotals.subtotal)} />
            {savings > 0 && !activePendingOrder ? (
              <SummaryLine label="Savings" value={formatPrice(savings)} tone="success" />
            ) : null}
            <SummaryLine label="Shipping" value={formatPrice(summaryTotals.shipping)} />
            <div className="flex items-center justify-between border-t border-[var(--color-line)] pt-3 text-base font-semibold text-[var(--color-ink)]">
              <span>Total</span>
              <span>{formatPrice(summaryTotals.total)}</span>
            </div>
            {activePendingOrder ? (
              <p className="flex items-center gap-2 pt-2 text-xs leading-5 text-[var(--color-muted)]">
                <PackageCheck className="size-4 shrink-0 text-[var(--color-sage)]" aria-hidden="true" />
                Your bag total has been confirmed for this order.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </main>
  )
}

async function verifyPayment(orderUuid: string, response: RazorpaySuccessResponse) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.functions.invoke<VerifyPaymentResponse>(
    'verify-payment',
    {
      body: {
        orderUuid,
        ...response,
      },
    },
  )

  if (error || !data) {
    throw new Error(error?.message ?? 'Unable to confirm your payment')
  }

  return data
}

function CheckoutField({
  label,
  value,
  onChange,
  className,
  type = 'text',
  inputMode,
  placeholder,
  autoComplete,
  required = true,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
  type?: string
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  placeholder?: string
  autoComplete?: string
  required?: boolean
}) {
  return (
    <Field.Root className={className}>
      <Field.Label className="text-sm font-semibold text-[var(--color-ink)]">{label}</Field.Label>
      <Field.Control
        required={required}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 h-11 w-full rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-4 text-sm text-[var(--color-ink)] outline-none transition duration-150 ease-out placeholder:text-[var(--color-muted)]/70 focus:border-[var(--color-rouge)] focus:bg-white focus:shadow-sm"
      />
    </Field.Root>
  )
}

function CheckoutNotice({
  status,
  message,
  total,
}: {
  status: CheckoutStatus
  message: string
  total: number
}) {
  const isError = status === 'error'
  const isCancelled = status === 'cancelled'
  const isReady = status === 'ready'
  const title =
    status === 'preparing'
      ? 'Preparing payment'
      : status === 'opening'
        ? 'Opening Razorpay'
        : status === 'payment-open'
          ? 'Payment window is open'
          : status === 'confirming'
            ? 'Confirming payment'
            : isReady
              ? 'Total refreshed'
              : isCancelled
                ? 'Payment paused'
                : isError
                  ? 'Check details'
                  : 'Checkout'
  const copy =
    message ||
    (status === 'preparing'
      ? 'We are checking stock and creating your secure payment order.'
      : status === 'opening'
        ? 'Razorpay will open in a moment.'
        : status === 'payment-open'
          ? 'Complete payment in the Razorpay window. You can return here if you close it.'
          : status === 'confirming'
            ? 'Do not refresh. We are verifying your payment and order.'
            : `Payable total: ${formatPrice(total)}`)

  return (
    <div
      className={`mt-4 rounded-[1rem] border px-4 py-3 text-sm ${
        isError
          ? 'border-red-200 bg-red-50 text-red-800'
          : isCancelled
            ? 'border-amber-200 bg-amber-50 text-amber-900'
            : 'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-muted)]'
      }`}
      aria-live="polite"
    >
      <p className="font-semibold text-[var(--color-ink)]">{title}</p>
      <p className="mt-1 leading-6">{copy}</p>
    </div>
  )
}

function ConfirmationLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-canvas)] p-4 text-left">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  )
}

function SummaryLine({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'success'
}) {
  return (
    <div
      className={
        tone === 'success'
          ? 'flex justify-between text-[var(--color-sage)]'
          : 'flex justify-between text-[var(--color-muted)]'
      }
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

function isBusyCheckoutStatus(status: CheckoutStatus) {
  return (
    status === 'preparing' ||
    status === 'opening' ||
    status === 'payment-open' ||
    status === 'confirming'
  )
}

function getPayButtonLabel(status: CheckoutStatus, total: number) {
  if (status === 'preparing') return 'Preparing order'
  if (status === 'opening') return 'Opening Razorpay'
  if (status === 'payment-open') return 'Payment window open'
  if (status === 'confirming') return 'Confirming payment'
  if (status === 'ready') return `Pay ${formatPrice(total)}`
  if (status === 'cancelled') return 'Try payment again'
  if (status === 'error') return 'Try again'

  return `Pay ${formatPrice(total)}`
}

function validateCheckoutForm(form: CheckoutForm) {
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

function normalizeCheckoutForm(form: CheckoutForm): CheckoutForm {
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

function createSuccessMessage(verification: VerifyPaymentResponse) {
  if (verification.shipment?.trackingNumber) {
    return `Your order is confirmed. Tracking number: ${verification.shipment.trackingNumber}.`
  }

  if (verification.orderStatus === 'shipment_pending') {
    return 'Your order is confirmed. We will share tracking after dispatch.'
  }

  return 'Your order is confirmed. We will start preparing it shortly.'
}

function formatCustomerOrderStatus(status: string) {
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

function formatCustomerDeliveryStatus(status: string) {
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
