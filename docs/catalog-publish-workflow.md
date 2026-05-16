# Catalog Publish Workflow

This document defines how the shop owner manages product data and product images without a custom
product-editing admin UI.

## Goals

- Keep product management simple for the owner.
- Keep code deployment, catalog sync, and image sync inside CI/CD.
- Keep QA and production separated.
- Avoid storing owner-managed product images in Git.
- Avoid paid image services until traffic or requirements justify them.
- Fail fast on missing or invalid catalog/image data.

## Decision

Use this workflow:

```text
Google Sheets product data
+ Google Drive product image folders
-> GitHub Actions publish workflow
-> Cloudflare R2 product image hosting
-> Supabase runtime catalog
-> Cloudflare Workers storefront deploy
```

Use Cloudflare R2 for product image hosting.

Rationale:

- R2 has a useful free tier for early traffic: 10 GB-month storage, 1 million Class A operations,
  10 million Class B operations, and no internet egress charge on Standard storage.
- The storefront already runs on Cloudflare Workers.
- R2 keeps product images out of the repo and out of the database platform.
- Cloudflare Images transformations can be added later if responsive variants become necessary.

Do not use Cloudflare Images storage for v1. It is a paid image-hosting product and is unnecessary
for the initial catalog size.

## Environments

Use separate buckets and separate public hostnames.

```text
QA bucket:   trenzura-qa-product-images
Prod bucket: trenzura-prod-product-images

QA media host:   media-qa.trenzura.in
Prod media host: media.trenzura.in
```

These names are configurable through GitHub environment variables. Do not hardcode bucket names,
domains, Google Drive folder IDs, or sheet IDs in application code.

Recommended GitHub environment variables:

```text
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SHEETS_RANGE
GOOGLE_DRIVE_IMAGE_FOLDER_ID
R2_PRODUCT_IMAGES_BUCKET
PRODUCT_IMAGE_PUBLIC_BASE_URL
```

Recommended GitHub secrets:

```text
GOOGLE_SERVICE_ACCOUNT_JSON
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PROJECT_REF
```

## Owner Workflow

The owner manages catalog content in two Google-owned places:

1. Google Sheets for product data.
2. Google Drive for product images.

Recommended Google Drive folder names:

```text
Trenzura Product Images - QA
Trenzura Product Images - Prod
```

Inside each folder, create one folder per product ID:

```text
Trenzura Product Images - QA/
  TZ-001/
    01-front.jpg
    02-close.jpg
    03-side.jpg
    04-back.jpg
  TZ-002/
    01-front.jpg
    02-close.jpg
```

Rules:

- Product image folder name must match `product_id` in the sheet.
- File order comes from the numeric filename prefix.
- Supported extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`.
- OS metadata files such as `.DS_Store`, `Thumbs.db`, `desktop.ini`, and AppleDouble `._*`
  files are ignored.
- Active products must have at least one image.
- The sync must fail if an active product has no matching image folder.
- The sync must fail if a referenced image is missing, unreadable, or has an unsupported extension.
- The owner should replace images by uploading new files and then running a publish workflow.

## Sheet Contract

The `Products` tab remains the owner-facing product data source.

Required v1 columns:

```text
product_id
active
title
category
description
mrp
selling_price
images
sizes
stock
restock
size_chart
featured
```

The `images` column is optional for the normal owner workflow.

If `images` is blank, the sync discovers images from the Google Drive folder matching `product_id`.
If `images` is filled, it should contain explicit image filenames or storage paths in the intended
display order. Explicit paths are useful for exceptions, but the folder-based convention should be
the default.

## Image URL Strategy

Store product image URLs as hosted public URLs generated during sync.

Recommended object key shape:

```text
products/<product_id>/<content_hash>-<original_file_name>
```

Example:

```text
products/TZ-001/8f31c2a4-01-front.jpg
```

Using a content hash in the object key avoids stale browser/CDN cache when an owner replaces an
image with the same filename.

Generated public URL:

```text
https://media.trenzura.in/products/TZ-001/8f31c2a4-01-front.jpg
```

## Publish Workflow

Catalog publish is a manual GitHub Actions workflow with an environment selector.

For `qa`, it publishes to QA services only.
For `prod`, it publishes to production services only.

Workflow steps:

1. Validate required GitHub environment variables and secrets.
2. Read product rows from Google Sheets.
3. Read product image folders/files from Google Drive.
4. Validate sheet rows and image availability.
5. Generate a product image manifest with content-hash object keys and hosted image URLs.
6. Generate the product catalog using hosted image URLs.
7. Validate that generated image URLs use the configured environment media host.
8. Upload missing or changed images from the validated manifest to the environment's R2 bucket.
9. Sync products and variants to the environment's Supabase project.
10. Build the storefront.
11. Deploy the storefront through Cloudflare Workers.

The workflow must stop before mutating R2, Supabase, or deploying if sheet/image validation fails.

## Admin Trigger

The `/admin` page can expose a `Publish catalog` action, but it must not run sync logic directly.

The admin action should:

1. Verify Cloudflare Access identity and `ADMIN_EMAILS`.
2. Dispatch the GitHub Actions publish workflow through the GitHub API.
3. Pass the selected target environment: `qa` or `prod`.
4. Show workflow status: queued, running, succeeded, failed.
5. Link to the GitHub Actions run logs.

This keeps the owner experience simple while preserving CI/CD as the only deployment path.

Production should require an explicit confirmation in the admin page before dispatching the prod
publish workflow.

## Generated Catalog Explanation

The storefront currently imports product data from generated JSON in the app build. That means the
public product listing, product detail pages, search data, and SEO metadata are baked into the
deployed storefront bundle.

Because of that, changing Google Sheets or product images is not fully live until the storefront is
rebuilt and deployed.

So the owner-facing action should be `Publish catalog`, not just `Sync products`.

`Publish catalog` means:

```text
read sheet + read images + upload images + sync Supabase + build + deploy
```

This is still CI/CD because the admin page only dispatches a GitHub Actions workflow. It does not
deploy from the local machine or from the browser.

## Non-Goals For V1

- No product edit UI.
- No browser image upload UI.
- No scheduled publish.
- No automatic publish on every sheet edit.
- No paid image transformation dependency.
- No Git-tracked product image library.

## Open Setup Items

- Owner creates Google Drive image folders for QA and production.
- Share each image root folder with the Google service account.
- Enable R2 in the Cloudflare dashboard.
- Create R2 buckets:
  - `trenzura-qa-product-images`
  - `trenzura-prod-product-images`
- Attach public media hostnames to the correct R2 buckets:
  - `media-qa.trenzura.in`
  - `media.trenzura.in`
- Create R2 S3 API credentials with object read/write access scoped to the product image buckets.
- Store all environment-specific IDs and URLs in GitHub environment variables.
- Add the remaining production publish secrets after production sheet, Drive, R2, and Supabase values
  are finalized.

## Implemented In Repo

- `.github/workflows/publish-catalog.yml` validates environment config, publishes images/data, builds,
  and deploys through GitHub Actions.
- `scripts/sync-drive-images-to-r2.ts` reads Google Drive, computes content hashes, writes the image
  manifest, and can upload only the missing R2 objects after product validation passes.
- `scripts/sync-products.ts` reads Google Sheets, validates active product images from the manifest, and
  generates catalog data.
- `scripts/sync-products-to-supabase.ts` syncs product and variant rows to the configured Supabase project
  after verifying the expected project ref.
- `scripts/validate-catalog-assets.ts` blocks publish/deploy when generated product image URLs still point
  at local paths or at a hostname other than the environment's configured media host.
- `/admin` dispatches the publish workflow and shows recent workflow status.

## Required Setup Values

GitHub environment variables for both `qa` and `prod`:

```text
GOOGLE_SHEETS_SPREADSHEET_ID
GOOGLE_SHEETS_RANGE
GOOGLE_DRIVE_IMAGE_FOLDER_ID
R2_PRODUCT_IMAGES_BUCKET
PRODUCT_IMAGE_PUBLIC_BASE_URL
CLOUDFLARE_WORKER_NAME
CLOUDFLARE_DOMAIN
CLOUDFLARE_WWW_DOMAIN
```

`CLOUDFLARE_WWW_DOMAIN` is required only for production.

GitHub environment secrets for both `qa` and `prod`:

```text
GOOGLE_SERVICE_ACCOUNT_JSON
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_PROJECT_REF
```

Repository-level GitHub secrets:

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

Cloudflare Worker secrets for admin workflow dispatch:

```text
GITHUB_ACTIONS_TOKEN
```

Cloudflare Worker variables for admin workflow dispatch are tracked in `wrangler.jsonc`:

```text
GITHUB_REPOSITORY
CATALOG_PUBLISH_WORKFLOW_FILE
CATALOG_PUBLISH_QA_REF
CATALOG_PUBLISH_PROD_REF
```

Recommended values:

```text
GITHUB_REPOSITORY=anshulbansal02/trenzura
CATALOG_PUBLISH_WORKFLOW_FILE=publish-catalog.yml
CATALOG_PUBLISH_QA_REF=dev
CATALOG_PUBLISH_PROD_REF=main
```
