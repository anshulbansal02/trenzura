# Trenzura

Minimal server-rendered storefront foundation built with TanStack Start, Tailwind CSS v4, and Base UI.

## Getting Started

To run this application:

```bash
pnpm install
pnpm dev
```

## Building For Production

To build this application for production:

```bash
pnpm build
```

To fetch products before building in CI:

```bash
pnpm build:ci
```

## Deployment

The storefront deploys as a TanStack Start SSR app on Cloudflare Workers.

See `docs/deployment.md` for Wrangler config, GitHub Actions, and secret boundaries.

## Product Data

Product data is generated from Google Sheets into `src/generated/products.json`.

```bash
pnpm sync:products
```

See `docs/catalog.md` for the sheet columns, local seed fallback, and CI secrets.

## Search

Product search uses a local Orama index over the generated catalog.

See `docs/search.md` for the search architecture.

## Payments

Razorpay checkout uses server routes for order creation, payment verification, and webhook signature validation.

See `docs/razorpay.md` for required environment variables and launch notes.

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Routing

This project uses [TanStack Router](https://tanstack.com/router) with file-based routing. Routes are managed as files in `src/routes`.
