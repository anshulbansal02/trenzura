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
import { useMemo, useState } from 'react'

import { useCart } from '../components/cart/CartProvider'
import { ProductMedia } from '../components/product/ProductMedia'
import { formatPrice, freeShippingThresholdPaise, standardShippingPaise } from '../lib/format'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'

export const Route = createFileRoute('/checkout')({ component: CheckoutPage })

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

type CheckoutStatus = 'idle' | 'loading' | 'success' | 'error'

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
  const shipping = subtotal >= freeShippingThresholdPaise || subtotal === 0 ? 0 : standardShippingPaise
  const total = subtotal + shipping
  const checkoutFingerprint = useMemo(
    () =>
      JSON.stringify({
        customer: normalizeFormForFingerprint(form),
        items: lines.map((line) => ({
          productId: line.productId,
          variantId: line.variantId,
          size: line.size,
          quantity: line.quantity,
        })),
      }),
    [form, lines],
  )
  const activePendingOrder =
    pendingOrder?.fingerprint === checkoutFingerprint ? pendingOrder : null
  const summaryTotals = activePendingOrder?.totals ?? { subtotal, shipping, total }

  function updateField(field: keyof CheckoutForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
    setPendingOrder(null)
  }

  async function submitCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setConfirmation(null)

    const validationMessage = validateCheckoutForm(form)
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

    setStatus('loading')
    setMessage(activePendingOrder ? 'Opening secure checkout...' : 'Preparing your order...')

    try {
      const order = activePendingOrder ?? (await createCheckoutOrder())
      if (!activePendingOrder) {
        setPendingOrder({ ...order, fingerprint: checkoutFingerprint })
      }

      if (!activePendingOrder && order.totals.total !== total) {
        setStatus('idle')
        setMessage(
          `Your payable total is now ${formatPrice(order.totals.total)}. Review the updated summary, then continue to payment.`,
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
          customer: form,
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
    const checkout = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Trenzura',
      description: `${itemCount} ${itemCount === 1 ? 'item' : 'items'} from your bag`,
      order_id: order.orderId,
      prefill: {
        name: form.fullName,
        email: form.email,
        contact: form.phone,
      },
      notes: {
        orderUuid: order.orderUuid,
        orderNumber: order.orderNumber,
      },
      theme: {
        color: '#72343d',
      },
      modal: {
        ondismiss: () => {
          if (!paymentStarted) {
            setStatus('idle')
        setMessage('Payment was cancelled. You can try again when ready.')
          }
        },
      },
      handler: async (response: RazorpaySuccessResponse) => {
        paymentStarted = true
        setStatus('loading')
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
                value={form.email}
                onChange={(value) => updateField('email', value)}
              />
              <CheckoutField
                label="Phone"
                type="tel"
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
                value={form.fullName}
                onChange={(value) => updateField('fullName', value)}
              />
              <CheckoutField
                label="Pincode"
                inputMode="numeric"
                value={form.pincode}
                onChange={(value) => updateField('pincode', value)}
              />
              <CheckoutField
                label="Address"
                value={form.addressLine}
                onChange={(value) => updateField('addressLine', value)}
                className="sm:col-span-2"
              />
              <CheckoutField
                label="Landmark"
                value={form.landmark}
                onChange={(value) => updateField('landmark', value)}
                required={false}
              />
              <CheckoutField
                label="City"
                value={form.city}
                onChange={(value) => updateField('city', value)}
              />
              <CheckoutField
                label="State"
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
                Secure payment
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Pay with UPI, cards, wallets, and more. Payment details are handled by our payment
                partner.
              </p>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={clearCart}
              className="text-sm font-semibold text-[var(--color-muted)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-rouge)] hover:decoration-[var(--color-rouge)]"
            >
              Clear bag
            </button>
            <Button
              type="submit"
              disabled={status === 'loading'}
              className="fashion-button-primary h-12 min-w-52 gap-2 px-6"
            >
              {status === 'loading' ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <CreditCard className="size-4" aria-hidden="true" />
              )}
              {activePendingOrder ? `Pay ${formatPrice(activePendingOrder.totals.total)}` : 'Pay now'}
            </Button>
          </div>

          {message ? (
            <StatusMessage status={status} message={message} />
          ) : null}
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
            <SummaryLine
              label="Shipping"
              value={summaryTotals.shipping === 0 ? 'Free' : formatPrice(summaryTotals.shipping)}
            />
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
  required = true,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  className?: string
  type?: string
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
  required?: boolean
}) {
  return (
    <Field.Root className={className}>
      <Field.Label className="text-sm font-semibold text-[var(--color-ink)]">{label}</Field.Label>
      <Field.Control
        required={required}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="mt-2 h-11 w-full rounded-full border border-[var(--color-line)] bg-[var(--color-paper)] px-4 text-sm text-[var(--color-ink)] outline-none transition duration-150 ease-out placeholder:text-[var(--color-muted)]/70 focus:border-[var(--color-rouge)] focus:bg-white focus:shadow-sm"
      />
    </Field.Root>
  )
}

function StatusMessage({ status, message }: { status: CheckoutStatus; message: string }) {
  return (
    <p
      className={
        status === 'error'
          ? 'rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800'
          : status === 'success'
            ? 'rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'
            : 'rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted)]'
      }
      aria-live="polite"
    >
      {message}
    </p>
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

  return ''
}

function normalizeFormForFingerprint(form: CheckoutForm) {
  return Object.fromEntries(
    Object.entries(form).map(([key, value]) => [key, value.trim()]),
  )
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
