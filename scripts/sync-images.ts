import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { createClient } from '@supabase/supabase-js'

import { productCatalogSchema } from '../src/data/product-schema'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '..')
const productsPath = path.join(projectRoot, 'src/generated/products.json')
const imageSourceDir = path.join(projectRoot, process.env.PRODUCT_IMAGE_SOURCE_DIR ?? 'product-images')
const storageBucket = 'product-images'

async function main() {
  await loadEnvFile()

  const supabaseUrl = requiredEnv('SUPABASE_URL')
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  const products = productCatalogSchema.parse(JSON.parse(await readFile(productsPath, 'utf8')))
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
  const imagePaths = [...new Set(products.flatMap((product) => product.imageStoragePaths))]

  for (const imagePath of imagePaths) {
    const filePath = path.join(imageSourceDir, imagePath)
    const file = await readFile(filePath)
    const { error } = await supabase.storage
      .from(storageBucket)
      .upload(imagePath, file, {
        upsert: true,
        contentType: getContentType(imagePath),
        cacheControl: '31536000',
      })

    if (error) {
      throw new Error(`Unable to upload ${imagePath}: ${error.message}`)
    }
  }

  console.log(`Uploaded ${imagePaths.length} product images to Supabase Storage`)
}

function getContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase()

  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.png') return 'image/png'
  if (extension === '.webp') return 'image/webp'
  if (extension === '.avif') return 'image/avif'

  throw new Error(`Unsupported image extension for ${filePath}`)
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
