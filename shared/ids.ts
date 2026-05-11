export function createVariantId(productId: string, size: string) {
  return `${productId.trim()}:${size.trim().toLowerCase()}`
}

export function normalizeSlugPart(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
