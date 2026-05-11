# CI/CD

The repository uses three long-lived Git branches:

- `dev`: day-to-day work branch. Pushes run CI only.
- `qa`: QA branch. Merge into this branch to deploy `qa.trenzura.in`.
- `main`: production branch. Merge into this branch to deploy `trenzura.in` and `www.trenzura.in`.

## Flow

1. Branch from `dev` for feature work.
2. Open a pull request into `dev`, or push directly to `dev` for small changes.
3. Open a pull request from `dev` to `qa`.
4. When merged, QA deploys automatically.
5. Test `https://qa.trenzura.in`.
6. Open a pull request from `qa` to `main`.
7. When merged, production deploys automatically.

## Automation

- `CI` runs on pushes to `dev`, `qa`, and `main`.
- `CI` runs on pull requests targeting `qa` and `main`.
- `Deploy storefront QA` runs on pushes to `qa`.
- `Deploy storefront` runs on pushes to `main`.
- `Deploy Supabase` and `Sync products` are manual workflows with an environment selector.

## Secret Layout

Keep shared, non-environment-specific secrets at repo level:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SERVICE_ACCOUNT_JSON
```

Keep runtime secrets only inside GitHub environments `qa` and `prod`:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PROJECT_REF
SUPABASE_DB_PASSWORD
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
```

Do not keep runtime Supabase or Razorpay secrets at repo level after `qa` and `prod` environment secrets are set.

## Branch Protection

After `gh auth login -h github.com`, protect `qa` and `main` so they only change through pull requests.

```bash
gh api \
  --method PUT \
  repos/anshulbansal02/trenzura/branches/qa/protection \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=build \
  --field enforce_admins=true \
  --field required_pull_request_reviews[required_approving_review_count]=0 \
  --field required_pull_request_reviews[require_code_owner_reviews]=false \
  --field required_pull_request_reviews[dismiss_stale_reviews]=false \
  --field restrictions=null

gh api \
  --method PUT \
  repos/anshulbansal02/trenzura/branches/main/protection \
  --field required_status_checks[strict]=true \
  --field required_status_checks[contexts][]=build \
  --field enforce_admins=true \
  --field required_pull_request_reviews[required_approving_review_count]=0 \
  --field required_pull_request_reviews[require_code_owner_reviews]=false \
  --field required_pull_request_reviews[dismiss_stale_reviews]=false \
  --field restrictions=null
```

This keeps friction low: no mandatory reviewer, but direct pushes are blocked and CI must pass.

## Supabase Environments

Use separate Supabase environments for QA and production. The simplest reliable setup is two Supabase projects:

- `trenzura-shop` for production.
- `trenzura-shop-qa` for QA.

Supabase hosted projects have one main Postgres database per project. You can isolate QA and production inside
one project with schemas or Supabase Branching, but it is not the simplest operational setup for this shop:

- Auth, Storage, Edge Functions, API keys, and function secrets are environment-level concerns.
- Payment webhooks and shipping integrations need hard separation.
- Using schemas would require app-level schema routing and extra migration discipline.
- Supabase Branching creates separate environments and credentials, but it is not included in the Free plan.

For this project, two Supabase projects keep QA test keys and production live keys clearly separated while the
same migration files and Google Sheet drive both.
