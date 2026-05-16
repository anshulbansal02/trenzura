import { Button } from '@base-ui/react/button'
import { Link, createFileRoute } from '@tanstack/react-router'
import { createIsomorphicFn } from '@tanstack/react-start'
import { CreditCard, LoaderCircle, ShieldCheck } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'

import { useCart } from '../components/cart/CartProvider'
import { CheckoutConfirmation } from '../components/checkout/CheckoutConfirmation'
import { CheckoutField } from '../components/checkout/CheckoutField'
import { CheckoutNotice } from '../components/checkout/CheckoutNotice'
import { CheckoutOrderSummary } from '../components/checkout/CheckoutOrderSummary'
import { trackAnalyticsEvent } from '../lib/analytics'
import {
  type CheckoutForm,
  type CheckoutConfirmation as CheckoutConfirmationData,
  type CheckoutStatus,
  type CreateOrderResponse,
  type PendingOrder,
  type RazorpaySuccessResponse,
  type VerifyPaymentResponse,
  createSuccessMessage,
  getCheckoutAnalyticsPayload,
  getMobilePayButtonLabel,
  getPayButtonLabel,
  initialCheckoutForm,
  isBusyCheckoutStatus,
  normalizeCheckoutForm,
  validateCheckoutForm,
} from '../lib/checkout'
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
  const [form, setForm] = useState(initialCheckoutForm)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<CheckoutStatus>('idle')
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null)
  const [confirmation, setConfirmation] = useState<CheckoutConfirmationData | null>(null)
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

    trackAnalyticsEvent('checkout_submit', getCheckoutAnalyticsPayload(itemCount, total))
    setStatus(activePendingOrder ? 'opening' : 'preparing')
    setMessage('')

    try {
      trackAnalyticsEvent('checkout_started', {
        ...getCheckoutAnalyticsPayload(itemCount, total),
        reused_order: Boolean(activePendingOrder),
      })
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
      trackAnalyticsEvent('payment_failed', {
        ...getCheckoutAnalyticsPayload(itemCount, total),
        stage: 'checkout_start',
      })
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
        color: '#1C2E4A',
        backdrop_color: '#1C2E4A',
      },
      modal: {
        backdropclose: false,
        confirm_close: true,
        escape: true,
        handleback: true,
        ondismiss: () => {
          if (!paymentStarted) {
            trackAnalyticsEvent('payment_cancelled', getCheckoutAnalyticsPayload(itemCount, order.totals.total))
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
          setForm(initialCheckoutForm)
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
          trackAnalyticsEvent('purchase_completed', {
            ...getCheckoutAnalyticsPayload(itemCount, order.totals.total),
            needs_review: needsReview,
          })
        } catch (error) {
          trackAnalyticsEvent('payment_failed', {
            ...getCheckoutAnalyticsPayload(itemCount, order.totals.total),
            stage: 'payment_verify',
          })
          setStatus('error')
          setMessage(error instanceof Error ? error.message : 'Unable to confirm your payment')
        }
      },
    })

    checkout.open()
    trackAnalyticsEvent('razorpay_opened', getCheckoutAnalyticsPayload(itemCount, order.totals.total))
    setStatus('payment-open')
    setMessage('Complete payment in the Razorpay window. We will confirm the order here.')
  }

  if (confirmation) {
    return <CheckoutConfirmation confirmation={confirmation} message={message} />
  }

  if (lines.length === 0) {
    return (
      <main className="mx-auto flex min-h-[70svh] max-w-3xl items-center justify-center px-5 py-16 text-center sm:px-8">
        <div>
          <p className="fashion-eyebrow">Checkout</p>
          <h1 className="fashion-display mt-2 text-3xl">Your bag is empty</h1>
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
    <main className="fashion-container pb-36 pt-10 lg:py-14">
      <div className="mb-10 flex flex-col gap-4 border-b border-[var(--color-line)] pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="fashion-eyebrow">Checkout</p>
          <h1 className="fashion-display mt-2 text-3xl sm:text-4xl">
            Delivery and payment
          </h1>
        </div>
        <p className="fashion-copy max-w-xl">
          Add your delivery details, review your bag, and pay securely when everything looks right.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px]">
        <form id="checkout-form" onSubmit={submitCheckout} className="space-y-8">
          <section className="fashion-surface rounded-lg bg-[var(--color-paper)] p-5">
            <h2 className="font-serif text-2xl text-[var(--color-ink)]">Contact</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <CheckoutField
                label="Email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                enterKeyHint="next"
                value={form.email}
                onChange={(value) => updateField('email', value)}
              />
              <CheckoutField
                label="Phone"
                type="tel"
                placeholder="98765 43210"
                autoComplete="tel"
                enterKeyHint="next"
                value={form.phone}
                onChange={(value) => updateField('phone', value)}
              />
            </div>
          </section>

          <section className="fashion-surface rounded-lg bg-[var(--color-paper)] p-5">
            <h2 className="font-serif text-2xl text-[var(--color-ink)]">Delivery</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <CheckoutField
                label="Full name"
                placeholder="Aarav Sharma"
                autoComplete="name"
                enterKeyHint="next"
                value={form.fullName}
                onChange={(value) => updateField('fullName', value)}
              />
              <CheckoutField
                label="Pincode"
                inputMode="numeric"
                placeholder="400001"
                autoComplete="postal-code"
                enterKeyHint="next"
                value={form.pincode}
                onChange={(value) => updateField('pincode', value)}
              />
              <CheckoutField
                label="Address"
                placeholder="Flat 12, Palm Grove Apartments, MG Road"
                autoComplete="street-address"
                enterKeyHint="next"
                value={form.addressLine}
                onChange={(value) => updateField('addressLine', value)}
                className="sm:col-span-2"
              />
              <CheckoutField
                label="Landmark"
                placeholder="Near City Mall"
                enterKeyHint="next"
                value={form.landmark}
                onChange={(value) => updateField('landmark', value)}
                required={false}
              />
              <CheckoutField
                label="City"
                placeholder="Mumbai"
                autoComplete="address-level2"
                enterKeyHint="next"
                value={form.city}
                onChange={(value) => updateField('city', value)}
              />
              <CheckoutField
                label="State"
                placeholder="Maharashtra"
                autoComplete="address-level1"
                enterKeyHint="done"
                value={form.state}
                onChange={(value) => updateField('state', value)}
              />
            </div>
          </section>

          <section className="fashion-surface rounded-lg bg-[var(--color-paper)] p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-[var(--color-ink)] text-[var(--color-paper)]">
                <CreditCard className="size-4" aria-hidden="true" />
              </span>
              <h2 className="font-serif text-2xl text-[var(--color-ink)]">Payment</h2>
            </div>
            <div className="mt-5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4">
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

          <div className="hidden flex-col-reverse gap-3 sm:flex sm:flex-row sm:items-center sm:justify-between">
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

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-line)] bg-[var(--color-paper)]/96 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-sm backdrop-blur-xl sm:hidden">
            <div className="mx-auto grid max-w-md grid-cols-[1fr_auto] items-center gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-[var(--color-muted)]">
                  Total
                </p>
                <p className="mt-0.5 text-base font-semibold text-[var(--color-ink)]">
                  {formatPrice(activePendingOrder?.totals.total ?? total)}
                </p>
              </div>
              <Button
                type="submit"
                disabled={isCheckoutBusy}
                className="fashion-button-primary h-12 min-w-36 gap-2 px-5"
              >
                {isCheckoutBusy ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <CreditCard className="size-4" aria-hidden="true" />
                )}
                {getMobilePayButtonLabel(status)}
              </Button>
            </div>
          </div>
        </form>

        <CheckoutOrderSummary
          lines={lines}
          itemCount={itemCount}
          savings={savings}
          summaryTotals={summaryTotals}
          hasConfirmedTotal={Boolean(activePendingOrder)}
        />
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
