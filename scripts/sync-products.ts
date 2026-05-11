import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { google } from 'googleapis'

import { productCatalogSchema, type Product, type ProductSize } from '../src/data/product-schema'

type SheetRow = Record<string, string>

type SlugManifest = Record<string, string>

type ProductSyncRecord = {
  productId: string
  slug: string
  title: string
  category: string
  description: string
  images: string[]
  mrpPaise: number
  sellingPricePaise: number
  sizeChart: Product['sizeChart']
  active: boolean
  featured: boolean
  variants: Array<{
    variantId: string
    sizeLabel: string
    stock: number
    restock: number | null
    active: boolean
  }>
}

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '..')
const seedPath = path.join(projectRoot, 'scripts/seed-products.json')
const slugsPath = path.join(projectRoot, 'scripts/product-slugs.json')
const outputPath = path.join(projectRoot, 'src/generated/products.json')
const syncOutputPath = path.join(projectRoot, 'src/generated/products-sync.json')
const imageSourceDir = path.join(projectRoot, process.env.PRODUCT_IMAGE_SOURCE_DIR ?? 'product-images')
const storageBucket = 'product-images'

const requiredColumns = [
  'product_id',
  'active',
  'title',
  'category',
  'description',
  'mrp',
  'selling_price',
  'images',
  'sizes',
  'stock',
  'restock',
  'size_chart',
  'featured',
]

async function main() {
  await loadEnvFile()

  const rows = await loadRows()
  const slugs = await readSlugManifest()
  const normalizedProducts = await Promise.all(
    rows.map((row, index) => normalizeProduct(row, index + 2, slugs)),
  )
  const products = productCatalogSchema.parse(normalizedProducts.map(({ product }) => product))
  const syncRecords = normalizedProducts.map(({ sync }) => sync)

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(products, null, 2)}\n`)
  await writeFile(syncOutputPath, `${JSON.stringify(syncRecords, null, 2)}\n`)
  await writeFile(slugsPath, `${JSON.stringify(slugs, null, 2)}\n`)

  console.log(`Synced ${products.length} products to ${path.relative(projectRoot, outputPath)}`)
}

async function loadRows() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

  if (!spreadsheetId) {
    console.log('GOOGLE_SHEETS_SPREADSHEET_ID not set; using scripts/seed-products.json')
    return readSeedRows()
  }

  return readGoogleSheetRows(spreadsheetId)
}

async function readSeedRows() {
  const content = await readFile(seedPath, 'utf8')
  const rows = JSON.parse(content) as SheetRow[]
  assertRequiredColumns(rows[0] ?? {})
  return rows.map(normalizeRowKeys)
}

async function readGoogleSheetRows(spreadsheetId: string) {
  const auth = new google.auth.GoogleAuth({
    credentials: getInlineCredentials(),
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  })
  const sheets = google.sheets({ version: 'v4', auth })
  const range = process.env.GOOGLE_SHEETS_RANGE ?? 'Products!A1:Z'
  const response = await sheets.spreadsheets.values.get({ spreadsheetId, range })
  const values = response.data.values ?? []

  if (values.length < 2) {
    throw new Error(`No product rows found in range ${range}`)
  }

  const [headers, ...bodyRows] = values
  const rows = bodyRows
    .map((row) => rowToObject(headers, row))
    .filter((row) => Object.values(row).some(Boolean))

  assertRequiredColumns(rows[0] ?? {})
  return rows.map(normalizeRowKeys)
}

async function readSlugManifest(): Promise<SlugManifest> {
  try {
    return JSON.parse(await readFile(slugsPath, 'utf8')) as SlugManifest
  } catch {
    return {}
  }
}

async function normalizeProduct(row: SheetRow, rowNumber: number, slugs: SlugManifest) {
  const productId = pick(row, ['product_id'], rowNumber)
  assertStableProductId(productId, rowNumber)

  const active = parseBoolean(pick(row, ['active'], rowNumber))
  const title = pick(row, ['title'], rowNumber)
  const categoryLabel = pick(row, ['category'], rowNumber)
  const category = slugify(categoryLabel)
  const mrpPaise = parseMoneyToPaise(pick(row, ['mrp'], rowNumber), `mrp on row ${rowNumber}`)
  const sellingPricePaise = parseMoneyToPaise(
    pick(row, ['selling_price'], rowNumber),
    `selling_price on row ${rowNumber}`,
  )
  const imageStoragePaths = splitList(pick(row, ['images'], rowNumber))
  const sizes = splitList(pick(row, ['sizes'], rowNumber))
  const stockBySize = parseSizeQuantityMap(
    sizes,
    pick(row, ['stock'], rowNumber),
    `stock on row ${rowNumber}`,
    true,
  )
  const restockBySize = parseSizeQuantityMap(
    sizes,
    pickOptional(row, ['restock']) ?? '',
    `restock on row ${rowNumber}`,
    false,
  )

  if (sellingPricePaise > mrpPaise) {
    throw new Error(`selling_price cannot exceed mrp on row ${rowNumber}`)
  }

  if (!slugs[productId]) {
    slugs[productId] = createProductSlug(title, productId)
  }
  const slug = slugs[productId]

  if (!slug) {
    throw new Error(`Unable to create slug for ${productId}`)
  }

  const variants: ProductSize[] = sizes.map((label) => {
    const normalizedLabel = label.trim()
    const variantId = createVariantId(productId, normalizedLabel)
    const stockAvailable = restockBySize.get(normalizedLabel.toLowerCase())
      ?? stockBySize.get(normalizedLabel.toLowerCase())
      ?? 0

    return {
      variantId,
      label: normalizedLabel,
      stockAvailable,
      active: true,
    }
  })
  const publicImages = imageStoragePaths.map(createPublicImageUrl)

  for (const imagePath of imageStoragePaths) {
    assertSafeStoragePath(imagePath, rowNumber)
    await access(path.join(imageSourceDir, imagePath)).catch(() => {
      throw new Error(`Image "${imagePath}" on row ${rowNumber} was not found in product-images`)
    })
  }

  const product: Product = {
    productId,
    slug,
    title,
    images: publicImages,
    imageStoragePaths,
    mrpPaise,
    sellingPricePaise,
    discountPercent: deriveDiscountPercent(mrpPaise, sellingPricePaise),
    sizes: variants,
    stockAvailable: variants.reduce((total, size) => total + size.stockAvailable, 0),
    description: pick(row, ['description'], rowNumber),
    sizeChart: parseSizeChart(pick(row, ['size_chart'], rowNumber), rowNumber),
    category,
    categoryLabel,
    imageAlt: title,
    featured: parseBoolean(pick(row, ['featured'], rowNumber)),
    active,
  }

  const sync: ProductSyncRecord = {
    productId,
    slug: product.slug,
    title,
    category,
    description: product.description,
    images: publicImages,
    mrpPaise,
    sellingPricePaise,
    sizeChart: product.sizeChart,
    active,
    featured: product.featured,
    variants: variants.map((variant) => ({
      variantId: variant.variantId,
      sizeLabel: variant.label,
      stock: stockBySize.get(variant.label.toLowerCase()) ?? 0,
      restock: restockBySize.get(variant.label.toLowerCase()) ?? null,
      active: variant.active,
    })),
  }

  return { product, sync }
}

function getInlineCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON

  if (!raw) return undefined

  return JSON.parse(raw) as Record<string, unknown>
}

function rowToObject(headers: unknown[], values: unknown[]) {
  return Object.fromEntries(
    headers.map((header, index) => [String(header), String(values[index] ?? '').trim()]),
  )
}

function normalizeRowKeys(row: SheetRow) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [normalizeHeader(key), String(value ?? '').trim()]),
  )
}

function assertRequiredColumns(row: SheetRow) {
  const normalized = new Set(Object.keys(normalizeRowKeys(row)))
  const missing = requiredColumns.filter((column) => !normalized.has(normalizeHeader(column)))

  if (missing.length > 0) {
    throw new Error(`Missing required product column(s): ${missing.join(', ')}`)
  }
}

function pick(row: SheetRow, aliases: string[], rowNumber: number) {
  const value = pickOptional(row, aliases)

  if (!value) {
    throw new Error(`Missing required value for ${aliases[0]} on row ${rowNumber}`)
  }

  return value
}

function pickOptional(row: SheetRow, aliases: string[]) {
  for (const alias of aliases) {
    const value = row[normalizeHeader(alias)]

    if (value) return value
  }

  return undefined
}

function parseSizeQuantityMap(
  labels: string[],
  value: string,
  context: string,
  required: boolean,
) {
  const map = new Map<string, number>()
  const parts = splitList(value)

  if (parts.length === 0) {
    if (required) throw new Error(`${context} is required`)
    return map
  }

  if (parts.some((part) => part.includes(':') || part.includes('='))) {
    for (const part of parts) {
      const [label, quantity] = part.split(/[:=]/).map((item) => item.trim())
      if (!label || !quantity) throw new Error(`Invalid ${context}: "${part}"`)
      map.set(label.toLowerCase(), parseInteger(quantity, context))
    }
  } else if (parts.length === labels.length) {
    labels.forEach((label, index) => map.set(label.toLowerCase(), parseInteger(parts[index] ?? '', context)))
  } else if (parts.length === 1) {
    const quantity = parseInteger(parts[0] ?? '', context)
    labels.forEach((label) => map.set(label.toLowerCase(), quantity))
  } else {
    throw new Error(`Invalid ${context}; use one value, one value per size, or size:value pairs`)
  }

  for (const key of map.keys()) {
    if (!labels.some((label) => label.toLowerCase() === key)) {
      throw new Error(`Unknown size "${key}" in ${context}`)
    }
  }

  if (required) {
    for (const label of labels) {
      if (!map.has(label.toLowerCase())) {
        throw new Error(`Missing stock for size "${label}" in ${context}`)
      }
    }
  }

  return map
}

function parseSizeChart(value: string, rowNumber: number): Product['sizeChart'] {
  const trimmed = value.trim()

  if (!trimmed) return []

  if (trimmed.startsWith('[')) {
    return JSON.parse(trimmed) as Product['sizeChart']
  }

  return trimmed.split(';').flatMap((entry) => {
    const [size, measurementText] = entry.split(':').map((part) => part.trim())

    if (!size || !measurementText) {
      throw new Error(`Invalid size_chart entry on row ${rowNumber}: "${entry}"`)
    }

    const measurements = Object.fromEntries(
      measurementText
        .split(',')
        .map((part) => part.split('=').map((item) => item.trim()))
        .filter(([label, measurement]) => label && measurement),
    )

    return [{ size, measurements }]
  })
}

function splitList(value: string) {
  return value
    .split(/\n|\||,/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function parseMoneyToPaise(value: string, context: string) {
  const rupees = Number(value.replace(/[^\d.-]/g, ''))

  if (!Number.isFinite(rupees) || rupees <= 0) {
    throw new Error(`Expected a positive amount for ${context}, received "${value}"`)
  }

  return Math.round(rupees * 100)
}

function parseInteger(value: string, context: string) {
  const parsed = Number(value.replace(/[^\d-]/g, ''))

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Expected a non-negative integer for ${context}, received "${value}"`)
  }

  return parsed
}

function parseBoolean(value: string) {
  return ['true', 'yes', '1', 'active', 'featured'].includes(value.trim().toLowerCase())
}

function normalizeHeader(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function createProductSlug(title: string, productId: string) {
  const suffix = shortDeterministicSuffix(productId)
  return `${slugify(title)}-${suffix}`
}

function shortDeterministicSuffix(value: string) {
  let hash = 0

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0
  }

  return hash.toString(36).slice(0, 4).padStart(4, '0')
}

function createVariantId(productId: string, size: string) {
  return `${productId}:${size.trim().toLowerCase()}`
}

function createPublicImageUrl(imagePath: string) {
  const supabaseUrl = requiredSupabaseUrl()
  return `${supabaseUrl}/storage/v1/object/public/${storageBucket}/${encodeStoragePath(imagePath)}`
}

function requiredSupabaseUrl() {
  const value = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  if (!value) throw new Error('SUPABASE_URL or VITE_SUPABASE_URL is required for product image URLs')
  return value.replace(/\/$/, '')
}

function encodeStoragePath(imagePath: string) {
  return imagePath.split('/').map(encodeURIComponent).join('/')
}

function assertStableProductId(productId: string, rowNumber: number) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(productId)) {
    throw new Error(`product_id on row ${rowNumber} must use letters, numbers, hyphens, or underscores`)
  }
}

function assertSafeStoragePath(imagePath: string, rowNumber: number) {
  if (path.isAbsolute(imagePath) || imagePath.startsWith('/') || imagePath.includes('..')) {
    throw new Error(`images on row ${rowNumber} must be relative storage paths`)
  }
}

function deriveDiscountPercent(mrpPaise: number, sellingPricePaise: number) {
  return Math.round(((mrpPaise - sellingPricePaise) / mrpPaise) * 100)
}

async function loadEnvFile() {
  const envPath = path.join(projectRoot, '.env')

  try {
    const content = await readFile(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue

      const [key, ...valueParts] = trimmed.split('=')
      if (!key || process.env[key]) continue

      process.env[key] = valueParts.join('=').replace(/^['"]|['"]$/g, '')
    }
  } catch {
    // .env is optional; CI can provide environment variables directly.
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
