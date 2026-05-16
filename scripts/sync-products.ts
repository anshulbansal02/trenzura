import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { google } from 'googleapis'

import {
  productCatalogSchema,
  type Product,
  type ProductImageVariant,
  type ProductSize,
} from '../src/data/product-schema'
import { getGoogleServiceAccountCredentials, loadEnvFile, projectRoot } from './lib/runtime'

type SheetRow = Record<string, string>

type SlugManifest = Record<string, string>

type ImageManifest = {
  products: Record<string, ImageManifestEntry[]>
}

type ImageManifestEntry = {
  storagePath: string
  publicUrl: string
  sourceFileName?: string
  variants: ImageManifestVariant[]
}

type ImageManifestVariant = {
  width: number
  storagePath: string
  publicUrl: string
  contentType: string
}

type ResolvedProductImage = {
  storagePath: string
  publicUrl: string
  variants: ProductImageVariant[]
}

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

const slugsPath = path.join(projectRoot, 'scripts/product-slugs.json')
const outputPath = path.join(projectRoot, 'src/generated/products.json')
const syncOutputPath = path.join(projectRoot, 'src/generated/products-sync.json')

let productImageManifestPath: string | undefined
let imageManifest: ImageManifest | undefined

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
  loadRuntimeConfig()
  imageManifest = await readImageManifest()

  const rows = await loadRows()
  assertUniqueProductIds(rows)
  const slugs = await readSlugManifest()
  const normalizedProducts = await Promise.all(
    rows.map((row, index) => normalizeProduct(row, index + 2, slugs)),
  )
  const products = productCatalogSchema.parse(
    normalizedProducts
      .map(({ product }) => product)
      .filter((product): product is Product => Boolean(product)),
  )
  const syncRecords = normalizedProducts.map(({ sync }) => sync)
    .filter((sync): sync is ProductSyncRecord => Boolean(sync))

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(products, null, 2)}\n`)
  await writeFile(syncOutputPath, `${JSON.stringify(syncRecords, null, 2)}\n`)
  await writeFile(slugsPath, `${JSON.stringify(slugs, null, 2)}\n`)

  console.log(`Synced ${products.length} products to ${path.relative(projectRoot, outputPath)}`)
}

function loadRuntimeConfig() {
  productImageManifestPath = process.env.PRODUCT_IMAGE_MANIFEST_PATH
}

async function readImageManifest() {
  if (!productImageManifestPath) return undefined

  const manifestPath = path.resolve(projectRoot, productImageManifestPath)
  const content = await readFile(manifestPath, 'utf8')
  const parsed = JSON.parse(content) as ImageManifest

  if (!parsed || typeof parsed !== 'object' || !parsed.products || typeof parsed.products !== 'object') {
    throw new Error(`Invalid product image manifest at ${path.relative(projectRoot, manifestPath)}`)
  }

  return parsed
}

async function loadRows() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID

  if (!spreadsheetId) {
    throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is required')
  }

  return readGoogleSheetRows(spreadsheetId)
}

async function readGoogleSheetRows(spreadsheetId: string) {
  const auth = new google.auth.GoogleAuth({
    credentials: getGoogleServiceAccountCredentials(),
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
  const rawTitle = pick(row, ['title'], rowNumber)
  const title = createDisplayTitle(rawTitle, productId)
  const categoryLabel = pick(row, ['category'], rowNumber)
  const category = slugify(categoryLabel)
  const mrpPaise = parseMoneyToPaise(pick(row, ['mrp'], rowNumber), `mrp on row ${rowNumber}`)
  const sellingPricePaise = parseMoneyToPaise(
    pick(row, ['selling_price'], rowNumber),
    `selling_price on row ${rowNumber}`,
  )
  const resolvedImages = await resolveProductImages(
    productId,
    pickOptional(row, ['images']) ?? '',
    rowNumber,
    active,
  )
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
  const imageStoragePaths = resolvedImages.map((image) => image.storagePath)
  const publicImages = resolvedImages.map((image) => image.publicUrl)
  const imageVariants = resolvedImages.map((image) => image.variants)

  for (const { storagePath: imagePath } of resolvedImages) assertSafeStoragePath(imagePath, rowNumber)

  const description = pick(row, ['description'], rowNumber)
  const sizeChart = parseSizeChart(pickOptional(row, ['size_chart']) ?? '', rowNumber)
  const featured = parseBoolean(pick(row, ['featured'], rowNumber))
  const hasImages = resolvedImages.length > 0
  const publishProduct = active && hasImages
  const product: Product | undefined = publishProduct
    ? {
        productId,
        slug,
        title,
        images: publicImages,
        imageStoragePaths,
        imageVariants,
        mrpPaise,
        sellingPricePaise,
        discountPercent: deriveDiscountPercent(mrpPaise, sellingPricePaise),
        sizes: variants,
        stockAvailable: variants.reduce((total, size) => total + size.stockAvailable, 0),
        description,
        sizeChart,
        category,
        categoryLabel,
        imageAlt: title,
        featured,
        active,
      }
    : undefined

  const sync: ProductSyncRecord | undefined = active && !hasImages
    ? undefined
    : {
        productId,
        slug,
        title,
        category,
        description,
        images: publicImages,
        mrpPaise,
        sellingPricePaise,
        sizeChart,
        active,
        featured,
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

async function resolveProductImages(
  productId: string,
  value: string,
  rowNumber: number,
  active: boolean,
): Promise<ResolvedProductImage[]> {
  const explicitPaths = splitList(value)

  if (!imageManifest) throw new Error('PRODUCT_IMAGE_MANIFEST_PATH is required for product images')

  const manifestImages = imageManifest.products[productId]
  if (!manifestImages || manifestImages.length === 0) {
    if (!active) return []

    console.warn(`Skipping active product ${productId} on row ${rowNumber}: no supported images found`)
    return []
  }

  const resolvedManifestImages = explicitPaths.length > 0
    ? orderManifestImages(productId, explicitPaths, manifestImages, rowNumber)
    : manifestImages

  return resolvedManifestImages.map((image) => {
    if (!Array.isArray(image.variants) || image.variants.length === 0) {
      throw new Error(`Image manifest entry for ${productId} on row ${rowNumber} is missing optimized variants`)
    }

    return {
      storagePath: image.storagePath,
      publicUrl: image.publicUrl,
      variants: image.variants
        .map((variant) => ({
          width: variant.width,
          url: variant.publicUrl,
        }))
        .sort((left, right) => left.width - right.width),
    }
  })
}

function orderManifestImages(
  productId: string,
  explicitPaths: string[],
  manifestImages: ImageManifestEntry[],
  rowNumber: number,
) {
  const byName = new Map<string, ImageManifestEntry>()

  for (const image of manifestImages) {
    const fileName = image.storagePath.split('/').pop() ?? image.storagePath
    byName.set(fileName.toLowerCase(), image)
    byName.set(image.storagePath.toLowerCase(), image)
    byName.set(image.publicUrl.toLowerCase(), image)
    if (image.sourceFileName) byName.set(image.sourceFileName.toLowerCase(), image)
  }

  return explicitPaths.map((explicitPath) => {
    const match = byName.get(explicitPath.toLowerCase())
    if (!match) {
      throw new Error(
        `Image "${explicitPath}" on row ${rowNumber} was not found in the ${productId} image manifest`,
      )
    }

    return match
  })
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

function assertUniqueProductIds(rows: SheetRow[]) {
  const seen = new Map<string, number>()

  rows.forEach((row, index) => {
    const rowNumber = index + 2
    const productId = pick(row, ['product_id'], rowNumber)
    const normalizedProductId = productId.toLowerCase()
    const existingRowNumber = seen.get(normalizedProductId)

    if (existingRowNumber !== undefined) {
      throw new Error(`Duplicate product_id "${productId}" on rows ${existingRowNumber} and ${rowNumber}`)
    }

    seen.set(normalizedProductId, rowNumber)
  })
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

function createDisplayTitle(title: string, productId: string) {
  const firstSegment = title.split(/\||–|—/)[0]?.trim() ?? title.trim()
  let displayTitle = firstSegment
    .replace(/^women'?s?\s+/i, '')
    .replace(/\s+for women$/i, '')
    .replace(/\s+in pure cotton flex\b/i, '')
    .replace(/\bpure cotton flex\b/i, '')
    .replace(/\bcotton flex\b/i, '')
    .replace(/\s+with\b.*$/i, '')
    .replace(/\s+3\/4 sleeve.*$/i, '')
    .replace(/\s+collared kurta.*$/i, '')
    .replace(/\s+&\s*printed pants.*$/i, '')
    .replace(/\s+&\s*matching pants.*$/i, '')
    .replace(/\s+&\s*straight pants.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  const color = inferProductColor(productId)
  const hasColor = /\b(blue|pink|purple|yellow|green|olive|maroon|black|mauve|orange|beige|navy)\b/i
    .test(displayTitle)

  if (color && !hasColor) {
    displayTitle = `${color} ${displayTitle}`
  }

  return displayTitle
    .replace(/\bCo-Ord\b/g, 'Co-ord')
    .replace(/\bCo-Ord Set\b/g, 'Co-ord Set')
}

function inferProductColor(productId: string) {
  const normalized = productId.toUpperCase()
  const colorByCode: Record<string, string> = {
    BLU: 'Blue',
    PNK: 'Pink',
    POP: 'Purple',
    PRP: 'Purple',
    YLW: 'Yellow',
    OLV: 'Olive',
    GRN: 'Green',
    MLT: '',
    MRN: 'Maroon',
    BLK: 'Black',
    ORG: 'Orange',
  }
  const code = Object.keys(colorByCode).find((key) => normalized.includes(`-${key}-`))
  return code ? colorByCode[code] : ''
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

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
