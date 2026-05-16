import { createHash, createHmac } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { google } from 'googleapis'

type DriveImageFile = {
  id: string
  name: string
  mimeType: string
  md5Checksum?: string
  size?: string
}

type DriveFolder = {
  id: string
  name: string
}

type ProductImageManifest = {
  generatedAt: string
  bucket: string
  publicBaseUrl: string
  products: Record<string, ProductImageManifestEntry[]>
  summary: {
    productFolders: number
    imagesDiscovered: number
    imagesUploaded: number
    imagesSkipped: number
  }
}

type ProductImageManifestEntry = {
  storagePath: string
  publicUrl: string
  sourceFileId: string
  sourceFileName: string
  contentHash: string
  contentType: string
  sizeBytes: number | null
}

type SyncMode = 'sync' | 'manifest-only' | 'upload-manifest'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(dirname, '..')
const defaultManifestPath = path.join(projectRoot, 'src/generated/product-image-manifest.json')

const supportedExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
const ignoredDriveFileNames = new Set(['.ds_store', 'thumbs.db', 'desktop.ini'])

async function main() {
  await loadEnvFile()

  const mode = readMode()
  const config = readConfig(mode)
  const drive = google.drive({
    version: 'v3',
    auth: new google.auth.GoogleAuth({
      credentials: getInlineCredentials(),
      scopes: ['https://www.googleapis.com/auth/drive.readonly'],
    }),
  })

  if (mode === 'upload-manifest') {
    await uploadManifestImages(drive, config)
    return
  }

  const productFolders = await listProductFolders(drive, config.driveFolderId)
  const manifest: ProductImageManifest = {
    generatedAt: new Date().toISOString(),
    bucket: config.bucket,
    publicBaseUrl: config.publicBaseUrl,
    products: {},
    summary: {
      productFolders: productFolders.length,
      imagesDiscovered: 0,
      imagesUploaded: 0,
      imagesSkipped: 0,
    },
  }

  for (const folder of productFolders) {
    assertStableProductId(folder.name)

    const files = await listImageFiles(drive, folder.id)
    if (files.length === 0) continue

    manifest.products[folder.name] = []

    for (const file of files) {
      manifest.summary.imagesDiscovered += 1

      const hash = await resolveContentHash(drive, file)
      const objectKey = createObjectKey(folder.name, hash, file.name)
      const publicUrl = `${config.publicBaseUrl}/${encodeObjectKey(objectKey)}`

      if (mode === 'sync') {
        const exists = await r2ObjectExists(config, objectKey)

        if (exists) {
          manifest.summary.imagesSkipped += 1
        } else {
          const content = await downloadDriveFile(drive, file.id)
          await putR2Object(config, objectKey, content, getContentType(file))
          manifest.summary.imagesUploaded += 1
        }
      }

      manifest.products[folder.name].push({
        storagePath: objectKey,
        publicUrl,
        sourceFileId: file.id,
        sourceFileName: file.name,
        contentHash: hash,
        contentType: getContentType(file),
        sizeBytes: file.size ? Number(file.size) : null,
      })
    }
  }

  await writeFile(config.manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

  console.log(
    [
      `Discovered ${manifest.summary.imagesDiscovered} product images from Google Drive`,
      mode === 'sync'
        ? `Uploaded ${manifest.summary.imagesUploaded} new or changed images to R2`
        : 'Deferred R2 upload until after product data validation',
      mode === 'sync'
        ? `Skipped ${manifest.summary.imagesSkipped} unchanged images`
        : 'Skipped 0 unchanged images during manifest-only discovery',
      `Wrote ${path.relative(projectRoot, config.manifestPath)}`,
    ].join('\n'),
  )
}

async function uploadManifestImages(
  drive: ReturnType<typeof google.drive>,
  config: ReturnType<typeof readConfig>,
) {
  const manifest = JSON.parse(await readFile(config.manifestPath, 'utf8')) as ProductImageManifest

  if (!manifest || typeof manifest !== 'object' || !manifest.products || typeof manifest.products !== 'object') {
    throw new Error(`Invalid product image manifest at ${path.relative(projectRoot, config.manifestPath)}`)
  }

  if (manifest.bucket !== config.bucket) {
    throw new Error(`Image manifest bucket ${manifest.bucket} does not match ${config.bucket}`)
  }

  if (manifest.publicBaseUrl.replace(/\/+$/, '') !== config.publicBaseUrl) {
    throw new Error(`Image manifest publicBaseUrl ${manifest.publicBaseUrl} does not match ${config.publicBaseUrl}`)
  }

  let discovered = 0
  let uploaded = 0
  let skipped = 0

  for (const [productId, images] of Object.entries(manifest.products)) {
    assertStableProductId(productId)

    for (const image of images) {
      discovered += 1
      assertManifestImage(image, productId)

      const exists = await r2ObjectExists(config, image.storagePath)
      if (exists) {
        skipped += 1
        continue
      }

      const content = await downloadDriveFile(drive, image.sourceFileId)
      await putR2Object(config, image.storagePath, content, image.contentType)
      uploaded += 1
    }
  }

  console.log(
    [
      `Read ${discovered} product images from ${path.relative(projectRoot, config.manifestPath)}`,
      `Uploaded ${uploaded} new or changed images to R2`,
      `Skipped ${skipped} unchanged images`,
    ].join('\n'),
  )
}

function assertManifestImage(image: ProductImageManifestEntry, productId: string) {
  if (!image.storagePath || typeof image.storagePath !== 'string') {
    throw new Error(`Image manifest entry for ${productId} is missing storagePath`)
  }

  if (!image.sourceFileId || typeof image.sourceFileId !== 'string') {
    throw new Error(`Image manifest entry for ${productId} is missing sourceFileId`)
  }

  if (!image.contentType || typeof image.contentType !== 'string') {
    throw new Error(`Image manifest entry for ${productId} is missing contentType`)
  }
}

function readMode(): SyncMode {
  const args = new Set(process.argv.slice(2))

  if (args.has('--manifest-only') && args.has('--upload-manifest')) {
    throw new Error('Use only one image sync mode')
  }

  if (args.has('--manifest-only')) return 'manifest-only'
  if (args.has('--upload-manifest')) return 'upload-manifest'
  return 'sync'
}

function readConfig(mode: SyncMode) {
  const needsR2Access = mode !== 'manifest-only'
  const endpoint = new URL(
    (
      process.env.R2_S3_ENDPOINT
      ?? (needsR2Access ? `https://${requiredEnv('CLOUDFLARE_ACCOUNT_ID')}.r2.cloudflarestorage.com` : 'https://example.invalid')
    ).replace(/\/+$/, ''),
  )
  const publicBaseUrl = requiredEnv('PRODUCT_IMAGE_PUBLIC_BASE_URL').replace(/\/+$/, '')

  return {
    driveFolderId: requiredEnv('GOOGLE_DRIVE_IMAGE_FOLDER_ID'),
    bucket: requiredEnv('R2_PRODUCT_IMAGES_BUCKET'),
    publicBaseUrl,
    accessKeyId: needsR2Access ? requiredEnv('R2_ACCESS_KEY_ID') : '',
    secretAccessKey: needsR2Access ? requiredEnv('R2_SECRET_ACCESS_KEY') : '',
    endpoint,
    manifestPath: path.resolve(
      projectRoot,
      process.env.PRODUCT_IMAGE_MANIFEST_PATH ?? path.relative(projectRoot, defaultManifestPath),
    ),
  }
}

async function listProductFolders(drive: ReturnType<typeof google.drive>, parentFolderId: string) {
  const folders = await listDriveFiles<DriveFolder>(drive, {
    q: [
      `'${escapeDriveQueryValue(parentFolderId)}' in parents`,
      "mimeType = 'application/vnd.google-apps.folder'",
      'trashed = false',
    ].join(' and '),
    fields: 'nextPageToken, files(id, name)',
  })

  assertUniqueFolderNames(folders)

  return folders.sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }))
}

async function listImageFiles(drive: ReturnType<typeof google.drive>, parentFolderId: string) {
  const files = await listDriveFiles<DriveImageFile>(drive, {
    q: [
      `'${escapeDriveQueryValue(parentFolderId)}' in parents`,
      "mimeType != 'application/vnd.google-apps.folder'",
      'trashed = false',
    ].join(' and '),
    fields: 'nextPageToken, files(id, name, mimeType, md5Checksum, size)',
  })
  const candidateImages = files.filter((file) => !isIgnoredDriveMetadataFile(file.name))

  const unsupportedFiles = candidateImages.filter(
    (file) => !supportedExtensions.has(path.extname(file.name).toLowerCase()),
  )

  if (unsupportedFiles.length > 0) {
    throw new Error(
      `Unsupported product image file(s): ${unsupportedFiles.map((file) => file.name).join(', ')}`,
    )
  }

  return candidateImages.sort(sortImageFiles)
}

function isIgnoredDriveMetadataFile(fileName: string) {
  const normalized = fileName.trim().toLowerCase()
  return ignoredDriveFileNames.has(normalized) || normalized.startsWith('._')
}

async function listDriveFiles<T>(
  drive: ReturnType<typeof google.drive>,
  params: { q: string; fields: string },
) {
  const files: T[] = []
  let pageToken: string | undefined

  do {
    const response = await drive.files.list({
      q: params.q,
      fields: params.fields,
      pageToken,
      pageSize: 1000,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })

    files.push(...((response.data.files ?? []) as T[]))
    pageToken = response.data.nextPageToken ?? undefined
  } while (pageToken)

  return files
}

async function resolveContentHash(drive: ReturnType<typeof google.drive>, file: DriveImageFile) {
  if (file.md5Checksum) return file.md5Checksum.slice(0, 12)

  const content = await downloadDriveFile(drive, file.id)
  return createHash('sha256').update(content).digest('hex').slice(0, 12)
}

async function downloadDriveFile(drive: ReturnType<typeof google.drive>, fileId: string) {
  const response = await drive.files.get(
    { fileId, alt: 'media', supportsAllDrives: true },
    { responseType: 'arraybuffer' },
  )

  if (response.data instanceof ArrayBuffer) {
    return Buffer.from(response.data)
  }

  return Buffer.from(response.data as ArrayBuffer)
}

async function r2ObjectExists(config: ReturnType<typeof readConfig>, objectKey: string) {
  const response = await signedR2Fetch(config, 'HEAD', objectKey)

  if (response.status === 404) return false
  if (!response.ok) {
    throw new Error(`Unable to check R2 object ${objectKey}: ${response.status} ${response.statusText}`)
  }

  return true
}

async function putR2Object(
  config: ReturnType<typeof readConfig>,
  objectKey: string,
  body: Buffer,
  contentType: string,
) {
  const response = await signedR2Fetch(config, 'PUT', objectKey, body, {
    'cache-control': 'public, max-age=31536000, immutable',
    'content-type': contentType,
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Unable to upload R2 object ${objectKey}: ${response.status} ${response.statusText} ${text}`)
  }
}

async function signedR2Fetch(
  config: ReturnType<typeof readConfig>,
  method: 'HEAD' | 'PUT',
  objectKey: string,
  body?: Buffer,
  extraHeaders: Record<string, string> = {},
) {
  const payloadHash = createHash('sha256').update(body ?? '').digest('hex')
  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)
  const objectPath = `/${config.bucket}/${encodeObjectKey(objectKey)}`
  const url = new URL(objectPath, config.endpoint)
  const canonicalHeaders: Record<string, string> = {
    ...normalizeHeaderNames(extraHeaders),
    host: config.endpoint.host,
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': amzDate,
  }
  const signedHeaderNames = Object.keys(canonicalHeaders).sort()
  const signedHeaders = signedHeaderNames.join(';')
  const canonicalRequest = [
    method,
    objectPath,
    '',
    signedHeaderNames.map((name) => `${name}:${canonicalHeaders[name]}`).join('\n') + '\n',
    signedHeaders,
    payloadHash,
  ].join('\n')
  const credentialScope = `${dateStamp}/auto/s3/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n')
  const signature = hmacHex(getSigningKey(config.secretAccessKey, dateStamp), stringToSign)
  const headers = new Headers(extraHeaders)

  headers.set('x-amz-content-sha256', payloadHash)
  headers.set('x-amz-date', amzDate)
  headers.set(
    'authorization',
    [
      `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}`,
      `SignedHeaders=${signedHeaders}`,
      `Signature=${signature}`,
    ].join(', '),
  )

  return fetch(url, {
    method,
    headers,
    body: body as unknown as BodyInit | undefined,
  })
}

function getSigningKey(secretAccessKey: string, dateStamp: string) {
  const dateKey = hmacBuffer(`AWS4${secretAccessKey}`, dateStamp)
  const dateRegionKey = hmacBuffer(dateKey, 'auto')
  const dateRegionServiceKey = hmacBuffer(dateRegionKey, 's3')
  return hmacBuffer(dateRegionServiceKey, 'aws4_request')
}

function hmacBuffer(key: string | Buffer, value: string) {
  return createHmac('sha256', key).update(value).digest()
}

function hmacHex(key: Buffer, value: string) {
  return createHmac('sha256', key).update(value).digest('hex')
}

function normalizeHeaderNames(headers: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value.trim()]),
  )
}

function createObjectKey(productId: string, hash: string, fileName: string) {
  return `products/${productId}/${hash}-${sanitizeFileName(fileName)}`
}

function sanitizeFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase()
  const baseName = path.basename(fileName, extension)
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()

  if (!baseName) throw new Error(`Image filename "${fileName}" does not contain a safe basename`)

  return `${baseName}${extension}`
}

function encodeObjectKey(objectKey: string) {
  return objectKey.split('/').map(encodeURIComponent).join('/')
}

function sortImageFiles(left: DriveImageFile, right: DriveImageFile) {
  return imageSortRank(left.name) - imageSortRank(right.name)
    || left.name.localeCompare(right.name, undefined, { numeric: true })
}

function imageSortRank(fileName: string) {
  const prefix = fileName.match(/^(\d+)[\s._-]/)?.[1]
  if (prefix) return Number(prefix)

  const suffix = fileName.match(/_([A-Za-z])\.[^.]+$/)?.[1]?.toUpperCase()
  const order = ['F', 'C', 'L', 'R', 'B', 'S', 'W']
  const index = suffix ? order.indexOf(suffix) : -1
  return index === -1 ? 999 : index + 1
}

function getContentType(file: DriveImageFile) {
  if (file.mimeType.startsWith('image/')) return file.mimeType

  const extension = path.extname(file.name).toLowerCase()
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg'
  if (extension === '.png') return 'image/png'
  if (extension === '.webp') return 'image/webp'
  if (extension === '.avif') return 'image/avif'

  throw new Error(`Unsupported image extension for ${file.name}`)
}

function assertStableProductId(productId: string) {
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(productId)) {
    throw new Error(`Google Drive product image folder "${productId}" must match a valid product_id`)
  }
}

function assertUniqueFolderNames(folders: DriveFolder[]) {
  const seen = new Set<string>()

  for (const folder of folders) {
    const normalizedName = folder.name.toLowerCase()
    if (seen.has(normalizedName)) {
      throw new Error(`Duplicate Google Drive product image folder "${folder.name}"`)
    }

    seen.add(normalizedName)
  }
}

function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function getInlineCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  if (!raw) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is required')

  return JSON.parse(raw) as Record<string, unknown>
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
