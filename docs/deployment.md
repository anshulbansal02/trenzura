# Deployment

The storefront deploys as a TanStack Start SSR app on Cloudflare Workers. The runtime backend stays
on Supabase Edge Functions.

## Cloudflare Workers

The project follows Cloudflare's current TanStack Start Workers guide:

- Cloudflare TanStack Start guide:
  `https://developers.cloudflare.com/workers/framework-guides/web-apps/tanstack-start/`
- Cloudflare Vite plugin:
  `https://developers.cloudflare.com/workers/vite-plugin/`

Cloudflare files:

- `vite.config.ts` uses `@cloudflare/vite-plugin` with the TanStack Start SSR environment.
- `wrangler.jsonc` declares the Worker entrypoint as `@tanstack/react-start/server-entry`.
- `.github/workflows/deploy-cloudflare.yml` builds and deploys with Wrangler.

Local commands:

```bash
pnpm build:ci
pnpm deploy
```

## GitHub Secrets

Required for deploy:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Required when CI should fetch products from Google Sheets:

```text
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SERVICE_ACCOUNT_JSON
```

Optional GitHub variable:

```text
GOOGLE_SHEETS_RANGE
```

## Secret Boundary

Only public browser-safe values may use the `VITE_` prefix.

Do not add these to Cloudflare public env vars or Vite env vars:

```text
SUPABASE_SERVICE_ROLE_KEY
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
DELHIVERY_API_TOKEN
OPS_SERVICE_ROLE_KEY
TELEGRAM_BOT_TOKEN
```

Those secrets belong only in Supabase Edge Function secrets or GitHub Actions jobs that need direct
operational access.
