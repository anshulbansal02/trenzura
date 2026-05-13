# GoDaddy and Cloudflare DNS

Goal: GoDaddy is only the registrar. Cloudflare is DNS and Worker routing.

## Current Status

- Domain: `trenzura.in`
- Registrar: GoDaddy
- Registered: yes
- Current nameservers from RDAP:
  - `ns29.domaincontrol.com`
  - `ns30.domaincontrol.com`
- Public DNS result: `NXDOMAIN`
- RDAP status includes `client hold`

`client hold` is the blocker. It means the registrar/registry is not publishing the domain in DNS. Cloudflare
cannot make `trenzura.in` or `qa.trenzura.in` work until GoDaddy removes that hold.

## What To Do In GoDaddy

1. Open GoDaddy.
2. Go to `My Products` -> `Domains` -> `trenzura.in`.
3. Check for pending actions:
   - email verification
   - registrant/contact verification
   - payment/order verification
   - domain suspension/hold notice
4. Complete the pending action.
5. Wait until the domain no longer shows a hold/suspension.

Then verify locally:

```bash
dig trenzura.in NS
```

It should stop returning `NXDOMAIN`.

## What To Do In Cloudflare

After GoDaddy hold is removed:

1. Cloudflare -> `Websites` -> `Add a domain`.
2. Add `trenzura.in`.
3. Choose the Free plan.
4. Cloudflare will give two nameservers.
5. Copy any existing DNS records from GoDaddy into Cloudflare if needed.
6. In GoDaddy, change nameservers to Cloudflare's two nameservers.
7. Wait until Cloudflare marks the site active.

## What I Can Do After That

Once Cloudflare shows `trenzura.in` active, I can run/verify:

```bash
dig trenzura.in NS
dig trenzura.in
dig www.trenzura.in
dig qa.trenzura.in
pnpm exec wrangler deployments list
```

After code and environment secrets are ready, deployments will create Worker custom-domain routes:

- prod: `trenzura.in`
- prod: `www.trenzura.in`
- QA: `qa.trenzura.in`

## Current Cloudflare Worker Status

- Prod Worker `trenzura` exists.
- QA Worker `trenzura-qa` does not exist yet.
- No Worker secrets are configured, which is expected because this app uses Vite/GitHub build-time
  environment variables for public Supabase config.
- Do not deploy QA until the GitHub `qa` environment has QA Supabase secrets.

## Cloudflare Environments

The repo config already defines:

- default/prod Worker: `trenzura`
- QA Worker environment: `trenzura-qa`

Nothing else should be added in Cloudflare for now. Avoid paid add-ons.

## Zero-Cost Notes

- Use Cloudflare Free.
- Do not enable paid add-ons.
- Do not use Cloudflare Images, R2, D1, Queues, or paid Workers features unless intentionally added later.

## Cost Safety Check

CLI checks showed:

- `wrangler.jsonc` has no KV, D1, R2, Queues, Durable Objects, Hyperdrive, Vectorize, AI, or paid bindings.
- D1 list is empty.
- KV namespace list is empty.
- Queues list is empty.
- R2 is not enabled on the account.

Dashboard checks still needed:

1. `Manage Account` -> `Billing` -> `Subscriptions`: confirm Workers is Free and there are no paid add-ons.
2. `Manage Account` -> `Billing` -> `Billable Usage`: create a budget alert at `$1`.
3. `Workers & Pages` -> `Plans`: confirm Workers plan is Free.
4. When adding `trenzura.in`, choose the Cloudflare Free website plan.
