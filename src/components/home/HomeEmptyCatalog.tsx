import { Button } from '@base-ui/react/button'
import { Link } from '@tanstack/react-router'

export function HomeEmptyCatalog() {
  return (
    <main className="pb-24 sm:pb-0">
      <section className="border-b border-[var(--color-line)] bg-[var(--color-paper)]">
        <div className="fashion-container flex min-h-[72svh] items-center py-16">
          <div className="max-w-xl">
            <p className="fashion-eyebrow">Catalog pending</p>
            <h1 className="fashion-display mt-4 text-4xl leading-[1.04] sm:text-5xl">
              Trenzura
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--color-muted)] sm:text-lg">
              The storefront catalog has not been published yet.
            </p>
            <Button
              nativeButton={false}
              render={<Link to="/products" className="fashion-button-primary mt-8 h-12 px-6" />}
            >
              View products
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}
