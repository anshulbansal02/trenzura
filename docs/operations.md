# Store Operations

## Shipment Handling

Phase 4 keeps logistics operational without requiring live Delhivery shipment creation.

After payment is verified:

1. Stock is deducted atomically.
2. Payment is marked `verified`.
3. The order moves into shipment handling.
4. A `shipments` row is created or reused.
5. If Delhivery is disabled, the order is marked `shipment_pending` for manual fulfillment.
6. If Delhivery is enabled and fails, the order remains paid and `shipment_pending`.

`shipment_pending` means the order is paid and needs logistics attention. It does not mean the
package has shipped.

## Manual Retry

Use the GitHub Actions workflow `Retry shipment`.

Input:

```text
order_number
```

The workflow calls the `retry-shipment` Edge Function with the service-role key. The function only
accepts an exact `SUPABASE_SERVICE_ROLE_KEY` match or an exact `OPS_SERVICE_ROLE_KEY` match, and only
works on orders in valid shipment states. For v1, `OPS_SERVICE_ROLE_KEY` can be set to the same
value as the service-role key used by GitHub Actions.

## Product Sync

Use the GitHub Actions workflow `Sync products` when the owner has updated Google Sheets or product
images and the runtime Supabase catalog needs to be refreshed.

The workflow:

1. generates `src/generated/products.json` and `src/generated/products-sync.json`;
2. uploads referenced images to Supabase Storage;
3. syncs products and variants to Supabase;
4. runs TypeScript typechecking.

It does not deploy the storefront. A storefront deployment should run after catalog changes when
the public static product JSON needs to be refreshed.

## Optional Telegram Alerts

Set these Supabase Edge Function secrets to enable owner alerts:

```text
TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID
```

Telegram failures never fail checkout, payment verification, or shipment retry.

## Delhivery Guard

Delhivery live creation is disabled unless:

```text
DELHIVERY_ENABLED=true
DELHIVERY_API_TOKEN=...
DELHIVERY_CREATE_SHIPMENT_URL=...
```

Default package configuration:

```text
DELHIVERY_PICKUP_LOCATION=
DELHIVERY_PACKAGE_WEIGHT_GRAMS=500
DELHIVERY_PACKAGE_LENGTH_CM=30
DELHIVERY_PACKAGE_BREADTH_CM=25
DELHIVERY_PACKAGE_HEIGHT_CM=5
DELHIVERY_SELLER_GST=
DELHIVERY_HSN_CODE=
```

Until Delhivery account-specific details are confirmed, keep `DELHIVERY_ENABLED=false` and fulfill
from `shipment_pending` orders manually.
