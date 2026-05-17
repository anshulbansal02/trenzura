import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { createClient } from '@supabase/supabase-js'

import { loadEnvFile, projectRoot, requiredEnv } from './lib/runtime'

type ProductSyncRecord = {
  productId: string
  slug: string
  title: string
  category: string
  description: string
  images: string[]
  mrpPaise: number
  sellingPricePaise: number
  sizeChart: unknown
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

type ExistingProductRow = {
  product_id: string
  slug: string
}

type ExistingVariantRow = {
  variant_id: string
  stock_available: number
}

const syncPath = path.join(projectRoot, 'src/generated/products-sync.json')

async function main() {
  await loadEnvFile()

  const supabaseUrl = requiredEnv('SUPABASE_URL')
  const serviceRoleKey = requiredEnv('SUPABASE_SERVICE_ROLE_KEY')
  assertExpectedSupabaseProject(supabaseUrl)
  const records = JSON.parse(await readFile(syncPath, 'utf8')) as ProductSyncRecord[]
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const { data: existingProducts, error: productReadError } = await supabase
    .from('products')
    .select('product_id,slug')

  if (productReadError) throw productReadError

  const { data: existingVariants, error: variantReadError } = await supabase
    .from('product_variants')
    .select('variant_id,stock_available')

  if (variantReadError) throw variantReadError

  const existingSlugByProductId = new Map(
    ((existingProducts ?? []) as ExistingProductRow[]).map((product) => [
      product.product_id,
      product.slug,
    ]),
  )
  const existingStockByVariantId = new Map(
    ((existingVariants ?? []) as ExistingVariantRow[]).map((variant) => [
      variant.variant_id,
      variant.stock_available,
    ]),
  )
  const productIds = new Set(records.map((product) => product.productId))
  const variantIds = new Set(records.flatMap((product) => product.variants.map((variant) => variant.variantId)))

  await assertOk(
    supabase.from('products').upsert(
      records.map((product) => ({
        product_id: product.productId,
        slug: existingSlugByProductId.get(product.productId) ?? product.slug,
        title: product.title,
        category: product.category,
        description: product.description,
        images: product.images,
        mrp_paise: product.mrpPaise,
        selling_price_paise: product.sellingPricePaise,
        size_chart: product.sizeChart,
        active: product.active,
        featured: product.featured,
      })),
      { onConflict: 'product_id' },
    ),
    'Unable to upsert products',
  )

  for (const product of records) {
    for (const variant of product.variants) {
      const currentStock = existingStockByVariantId.get(variant.variantId)
      const stockAvailable = currentStock === undefined
        ? variant.stock
        : variant.restock ?? currentStock

      await assertOk(
        supabase.from('product_variants').upsert(
          {
            variant_id: variant.variantId,
            product_id: product.productId,
            size_label: variant.sizeLabel,
            stock_available: stockAvailable,
            active: variant.active && product.active,
          },
          { onConflict: 'variant_id' },
        ),
        `Unable to upsert variant ${variant.variantId}`,
      )
    }
  }

  for (const product of (existingProducts ?? []) as ExistingProductRow[]) {
    if (productIds.has(product.product_id)) continue

    await assertOk(
      supabase.from('products').update({ active: false }).eq('product_id', product.product_id),
      `Unable to deactivate stale product ${product.product_id}`,
    )
  }

  for (const variant of (existingVariants ?? []) as ExistingVariantRow[]) {
    if (variantIds.has(variant.variant_id)) continue

    await assertOk(
      supabase.from('product_variants').update({ active: false }).eq('variant_id', variant.variant_id),
      `Unable to deactivate stale variant ${variant.variant_id}`,
    )
  }

  const variantCount = records.reduce((total, product) => total + product.variants.length, 0)
  console.log(`Synced ${records.length} products and ${variantCount} variants to Supabase`)
}

async function assertOk<T>(
  operation: PromiseLike<{ data: T | null; error: { message: string } | null }>,
  message: string,
) {
  const { error } = await operation

  if (error) {
    throw new Error(`${message}: ${error.message}`)
  }
}

function assertExpectedSupabaseProject(supabaseUrl: string) {
  const expectedRef = process.env.EXPECTED_SUPABASE_PROJECT_REF
  if (!expectedRef) {
    throw new Error('EXPECTED_SUPABASE_PROJECT_REF is required before syncing products')
  }

  const actualRef = new URL(supabaseUrl).hostname.split('.')[0]
  if (actualRef !== expectedRef) {
    throw new Error(
      `SUPABASE_URL points to ${actualRef}; expected ${expectedRef}. Refusing to sync products.`,
    )
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
