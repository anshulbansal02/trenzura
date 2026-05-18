# Local Development

Use Portless named URLs for browser-facing local apps and fixed non-standard ports for local
services. Do not switch back to common defaults such as `3000`, `4000`, `8000`, or `8080`; those
ports are too easy to collide with other apps.

## Storefront

```bash
pnpm dev
```

Storefront URL:

```text
http://trenzura.localhost
```

Preview server:

```bash
pnpm build
pnpm preview
```

```text
http://preview.trenzura.localhost
```

Portless proxies those URLs to fixed high child ports:

```text
Portless HTTP proxy: 80
Storefront app process: 127.0.0.1:37149
Preview app process:    127.0.0.1:39217
```

Portless uses port `80` for plain HTTP so the browser URL stays `http://trenzura.localhost` without
a numeric port. `.localhost` is reserved for loopback use, so it avoids the mDNS/Bonjour collision
risk that comes with `.local`. The Vite dev and preview servers use `strictPort`, so startup fails
if the configured child port is already occupied. Free the port instead of letting the tool silently
move to a default or random fallback.

## Supabase Local Services

Configured local Supabase ports:

```text
API:             42187
Postgres:        46823
Shadow DB:       46829
Pooler:          47561
Studio:          38473
Inbucket UI:     43127
Inbucket SMTP:   43128
Inbucket POP3:   43129
Edge inspector:  45739
Analytics:       44621
```

Supabase Auth local redirects point to `http://trenzura.localhost` and
`http://preview.trenzura.localhost`.

## Port Policy

- Use Portless named URLs for browser-facing apps.
- Keep app child-process ports and local service ports stable and committed in config.
- Avoid standard tutorial ports: `3000`, `4000`, `5000`, `5173`, `8000`, and `8080`.
- Avoid Supabase default local ports such as `54321` through `54329`.
- If a port conflicts, choose another stable high port and update this document in the same change.
