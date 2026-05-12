import { Button } from '@base-ui/react/button'
import { Link } from '@tanstack/react-router'
import { AlertTriangle, LoaderCircle, RefreshCw, Search } from 'lucide-react'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function RoutePending() {
  return (
    <main className="fashion-container grid min-h-[55svh] place-items-center py-16">
      <div className="text-center">
        <LoaderCircle
          className="mx-auto size-8 animate-spin text-[var(--color-rouge)]"
          aria-hidden="true"
        />
        <p className="mt-4 text-sm font-semibold text-[var(--color-ink)]">Loading Trenzura</p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Preparing the latest styles and availability.
        </p>
      </div>
    </main>
  )
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : 'Something went wrong while loading this page.'

  return (
    <main className="fashion-container grid min-h-[55svh] place-items-center py-16">
      <section className="max-w-xl rounded-[1.25rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 text-center shadow-sm">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-red-50 text-red-700">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </span>
        <h1 className="fashion-display mt-5 text-3xl">We could not load this page</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button type="button" onClick={reset} className="fashion-button-primary h-11 gap-2 px-5">
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </Button>
          <Button
            nativeButton={false}
            render={<Link to="/products" className="fashion-button-secondary h-11 gap-2 px-5" />}
          >
            <Search className="size-4" aria-hidden="true" />
            Browse shop
          </Button>
        </div>
      </section>
    </main>
  )
}

export function RouteNotFound() {
  return (
    <main className="fashion-container grid min-h-[55svh] place-items-center py-16">
      <section className="max-w-xl text-center">
        <p className="fashion-eyebrow">404</p>
        <h1 className="fashion-display mt-2 text-5xl">Page not found</h1>
        <p className="mt-4 text-sm leading-6 text-[var(--color-muted)]">
          The page or product you are looking for is unavailable. Browse the current edit instead.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button
            nativeButton={false}
            render={<Link to="/products" className="fashion-button-primary h-11 px-5" />}
          >
            Shop current styles
          </Button>
          <Button
            nativeButton={false}
            render={<Link to="/" className="fashion-button-secondary h-11 px-5" />}
          >
            Go home
          </Button>
        </div>
      </section>
    </main>
  )
}
