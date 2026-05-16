import { Button } from '@base-ui/react/button'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'

import type { CheckoutConfirmation as CheckoutConfirmationData } from '../../lib/checkout'
import {
  formatCustomerDeliveryStatus,
  formatCustomerOrderStatus,
} from '../../lib/checkout'

type CheckoutConfirmationProps = {
  confirmation: CheckoutConfirmationData
  message: string
}

export function CheckoutConfirmation({ confirmation, message }: CheckoutConfirmationProps) {
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
        <h1 className="fashion-display mt-2 text-3xl sm:text-4xl">
          {confirmation.needsReview ? 'Payment received' : 'Order confirmed'}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-[var(--color-muted)]">
          {message}
        </p>
      </section>

      <section className="fashion-surface mx-auto mt-10 max-w-3xl rounded-lg bg-[var(--color-paper)] p-5">
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

function ConfirmationLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-left">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-[var(--color-ink)]">{value}</p>
    </div>
  )
}
