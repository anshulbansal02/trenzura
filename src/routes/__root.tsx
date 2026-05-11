import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import { CartDrawer } from '../components/cart/CartDrawer'
import { CartProvider } from '../components/cart/CartProvider'
import { SiteHeader } from '../components/layout/SiteHeader'
import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Trenzura',
      },
      {
        name: 'description',
        content: 'A modern clothing storefront built with TanStack Start.',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-[var(--color-canvas)] text-[var(--color-ink)] antialiased">
        <CartProvider>
          <SiteHeader />
          {children}
          <CartDrawer />
        </CartProvider>
        <Scripts />
      </body>
    </html>
  )
}
