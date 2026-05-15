import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

type GeneratedProduct = {
  productId?: string
  images?: unknown
  imageStoragePaths?: unknown
}

type ProductSyncRecord = {
  productId?: string
  images?: unknown
}

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '..')
const productsPath = path.join(projectRoot, 'src/generated/products.json')
const productsSyncPath = path.join(projectRoot, 'src/generated/products-sync.json')

async function main() {
  await loadEnvFile()

  const publicBaseUrl = requiredEnv('PRODUCT_IMAGE_PUBLIC_BASE_URL').replace(/\/+$/, '')
  const products = JSON.parse(await readFile(productsPath, 'utf8')) as GeneratedProduct[]
  const syncRecords = JSON.parse(await readFile(productsSyncPath, 'utf8')) as ProductSyncRecord[]

  validateProducts(products, publicBaseUrl)
  validateSyncRecords(syncRecords, publicBaseUrl)

  console.log(`Validated generated catalog image URLs against ${publicBaseUrl}`)
}

function validateProducts(products: GeneratedProduct[], publicBaseUrl: string) {
  for (const product of products) {
    const productId = readProductId(product.productId)
    const images = readStringArray(product.images, `${productId}.images`)
    const storagePaths = readStringArray(product.imageStoragePaths, `${productId}.imageStoragePaths`)

    if (images.length === 0) {
      throw new Error(`${productId} must have at least one generated product image URL`)
    }

    for (const image of images) {
      assertPublicImageUrl(image, publicBaseUrl, `${productId}.images`)
    }

    for (const storagePath of storagePaths) {
      assertR2StoragePath(storagePath, productId)
    }
  }
}

function validateSyncRecords(records: ProductSyncRecord[], publicBaseUrl: string) {
  for (const record of records) {
    const productId = readProductId(record.productId)
    const images = readStringArray(record.images, `${productId}.images`)

    for (const image of images) {
      assertPublicImageUrl(image, publicBaseUrl, `${productId}.images`)
    }
  }
}

function assertPublicImageUrl(value: string, publicBaseUrl: string, context: string) {
  if (value.startsWith('/') || value.includes('/Photo/')) {
    throw new Error(`${context} contains local product image path "${value}"`)
  }

  let url: URL
  try {
    url = new URL(value)
  } catch {
    throw new Error(`${context} must contain absolute hosted image URLs, received "${value}"`)
  }

  if (url.protocol !== 'https:') {
    throw new Error(`${context} must use https image URLs, received "${value}"`)
  }

  if (!value.startsWith(`${publicBaseUrl}/`)) {
    throw new Error(`${context} image URL "${value}" must start with ${publicBaseUrl}/`)
  }
}

function assertR2StoragePath(value: string, productId: string) {
  if (path.isAbsolute(value) || value.startsWith('/') || value.includes('..')) {
    throw new Error(`${productId}.imageStoragePaths contains unsafe path "${value}"`)
  }

  if (!value.startsWith(`products/${productId}/`)) {
    throw new Error(`${productId}.imageStoragePaths must use products/${productId}/ R2 keys`)
  }
}

function readProductId(value: unknown) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('Generated catalog product is missing productId')
  }

  return value
}

function readStringArray(value: unknown, context: string) {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`${context} must be a string array`)
  }

  return value as string[]
}

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
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
