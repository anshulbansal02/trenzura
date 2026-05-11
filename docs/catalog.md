# Product Catalog Sync

Products are edited in Google Sheets, fetched during CI, validated, and written to `src/generated/products.json`.

The app imports catalog data through `src/data/products.ts`. Do not edit `src/generated/products.json` by hand; run:

```bash
pnpm sync:products
```

If Google Sheets env vars are missing, the script uses `scripts/seed-products.json`.

## Required Sheet Columns

| Column | Format |
| --- | --- |
| `Images` | One or more image URLs, separated by comma, pipe, or new line |
| `Title` | Product display title |
| `Product Id` | Stable product id or slug |
| `MRP` | Number, in INR |
| `Discount (percent)` | Number from `0` to `100` |
| `Size` | Size labels, such as `M, L, XL` |
| `Max Quantity` | Either one number, a size list like `2, 4, 3`, or keyed values like `M:2, L:4, XL:3` |
| `Description` | Product description |
| `Size Charts` | Semicolon rows like `M: Chest=40 in, Length=27 in; L: Chest=42 in, Length=28 in` |

## Optional Columns

| Column | Use |
| --- | --- |
| `Category` | Listing filter group. Defaults to `Apparel` |
| `Color` | Secondary product label |
| `Details` | Pipe, comma, or new-line separated detail bullets |
| `Image Alt` | Image alt text. Defaults to product title |
| `Badge` | Small product badge |
| `Featured` | `true`, `yes`, `1`, or `featured` marks the product for the home page |

## CI Secrets

Create a Google Cloud service account with read-only Sheets access, then share the Google Sheet with the service account email.

Set these repository secrets:

```bash
GOOGLE_SHEETS_SPREADSHEET_ID=<sheet id>
GOOGLE_SERVICE_ACCOUNT_JSON=<full service account JSON>
```

Optional repository variable:

```bash
GOOGLE_SHEETS_RANGE=Products!A1:Z
```
