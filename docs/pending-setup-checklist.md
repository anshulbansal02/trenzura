# Pending Setup Checklist

This is the current source of truth for what is still pending before QA and prod can be fully
validated.

## Needed From You

### Google catalog

- Confirm the Google Sheet tab is named exactly `Products`.
- Create the QA Drive image root folder, for example `Trenzura Product Images - QA`.
- Share the QA Drive image folder with:
  `trenzura-sheets-sync@trenzura.iam.gserviceaccount.com`
- Send the QA Drive folder URL or folder ID.

Image folder structure:

```text
Trenzura Product Images - QA/
  PRODUCT_ID_1/
    01-front.jpg
    02-close.jpg
    03-back.jpg
  PRODUCT_ID_2/
    01-front.jpg
```

Folder names must exactly match `product_id` in the sheet.

### Delhivery QA staging

Provide the Delhivery staging values:

```text
DELHIVERY_API_TOKEN=
DELHIVERY_PICKUP_LOCATION=
DELHIVERY_SELLER_GST=
DELHIVERY_HSN_CODE=
```

The pickup location must exactly match the registered Delhivery staging warehouse name, including
case.

### Razorpay

- Confirm the QA Razorpay webhook exists in test mode.
- QA webhook URL:

```text
https://qxbzplfcjkjibsrndlbh.supabase.co/functions/v1/razorpay-webhook
```

- Event: `payment.captured`
- Before prod launch, provide separate Razorpay live mode key ID, key secret, and webhook secret.

### Prod catalog decision

Decide whether prod uses:

- the same Google Sheet and Drive image folder as QA, or
- separate prod Sheet and Drive image folder.

Separate prod folders are cleaner for launch control.

## I Will Do After You Provide These

### QA catalog

- Set `GOOGLE_DRIVE_IMAGE_FOLDER_ID` in the QA GitHub environment.
- Run the QA `Publish catalog` workflow.
- Verify image sync to R2.
- Verify product sync to QA Supabase.
- Verify QA storefront images and product data.

### QA Delhivery

- Set QA Supabase Delhivery secrets.
- Enable `DELHIVERY_ENABLED=true` in QA Supabase.
- Run `Deploy Supabase` for QA so the latest Edge Function code is active.
- Test checkout through Razorpay test mode and verify shipment creation reaches Delhivery staging.

### Prod setup

- Set prod catalog variables and secrets after the QA flow is proven.
- Set prod Supabase GitHub secrets needed by deploy/publish workflows.
- Set prod Worker Supabase runtime secrets needed by `/admin`.
- Configure Razorpay live webhook and secrets.
- Keep Delhivery prod disabled until live token and pickup configuration are confirmed.

## Current State

### Done

- Code is merged through `dev`, `qa`, and `main`.
- CI is passing on `main`.
- Storefront deploy workflows are manual-only.
- Catalog publish workflow exists.
- Admin publish button support exists.
- R2 buckets and media domains are configured.
- QA Google Sheet ID is configured.
- QA and prod R2 credentials are configured.
- QA and prod Worker `GITHUB_ACTIONS_TOKEN` is configured.
- Delhivery integration now uses Delhivery's documented shipment payload shape.
- Supabase Delhivery endpoint URLs are set:
  - QA: `https://staging-express.delhivery.com/api/cmu/create.json`
  - Prod: `https://track.delhivery.com/api/cmu/create.json`

### Still blocked

- QA catalog publish is blocked on Drive image folder ID.
- QA Delhivery enablement is blocked on staging token, pickup location, GST, and HSN.
- Prod publish/deploy is blocked until QA is validated and prod secrets are completed.
- Edge Functions need a QA deploy after the latest Delhivery code changes.

## Security Cleanup

- Rotate the local Supabase service role key that was printed in tool output earlier before relying
  on it in shared environments.
- Prefer a fine-grained GitHub token for `GITHUB_ACTIONS_TOKEN` long term.

