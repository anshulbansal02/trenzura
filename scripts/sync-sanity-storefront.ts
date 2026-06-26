import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { createClient } from '@sanity/client'

import { projectRoot } from './lib/runtime'

const projectId = process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.VITE_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET
const apiVersion = process.env.VITE_SANITY_API_VERSION || '2026-06-16'
const perspective = parsePerspective(process.env.SANITY_CONTENT_PERSPECTIVE)
const token = process.env.SANITY_READ_TOKEN || process.env.SANITY_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN
const generatedDir = path.join(projectRoot, 'src/generated')
const blogOutputPath = path.join(generatedDir, 'blog-posts.json')
const siteContentOutputPath = path.join(generatedDir, 'site-content.json')

const requiredStaticPageSlugs = ['about', 'contact', 'shipping-returns', 'terms', 'privacy']

await mkdir(generatedDir, { recursive: true })

if (!projectId || !dataset) {
  await writeJson(blogOutputPath, [])
  await writeJson(siteContentOutputPath, {})
  console.log('Sanity storefront content sync skipped: missing project or dataset.')
  process.exit(0)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  perspective,
  token,
  useCdn: false,
})

const [posts, siteContent] = await Promise.all([
  client.fetch(`
    *[
      _type == "blogPost" &&
      defined(slug.current) &&
      defined(publishedAt) &&
      publishedAt <= now()
    ] | order(publishedAt desc) {
      _id,
      title,
      "slug": slug.current,
      excerpt,
      category,
      authorName,
      publishedAt,
      seoTitle,
      seoDescription,
      "coverImage": {
        "url": coalesce(coverImageUrl, coverImage.asset->url),
        "alt": coalesce(coverImageAlt, coverImage.alt)
      },
      content[] {
        ...,
        _type == "externalImage" => {
          _key,
          _type,
          alt,
          url
        },
        _type == "image" => {
          _key,
          _type,
          alt,
          "url": asset->url
        }
      }
    }
  `),
  client.fetch(`
    {
      "siteSettings": *[_type == "siteSettings"][0] {
        announcement,
        headerLinks,
        footerEyebrow,
        footerHeadline,
        footerDescription,
        footerShortCopy,
        footerSections,
        socialLinks,
        benefits,
        copyrightLine,
        bottomNote,
        seoDefaults
      },
      "homePage": *[_type == "homePage"][0] {
        seo,
        hero,
        categorySection,
        bestSellersSection,
        imageStory,
        newArrivalsSection
      },
      "staticPages": *[_type == "staticPage"] {
        _id,
        slug,
        eyebrow,
        title,
        body,
        seoTitle,
        seoDescription
      }
    }
  `),
])

validateContent(siteContent)

await writeJson(blogOutputPath, posts)
await writeJson(siteContentOutputPath, siteContent)

console.log(
  `Synced ${Array.isArray(posts) ? posts.length : 0} blog posts and storefront content from ${dataset} with ${perspective} perspective.`,
)

async function writeJson(filePath: string, value: unknown) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`)
}

function validateContent(content: unknown) {
  if (!isRecord(content)) {
    throw new Error('Sanity storefront content query returned an invalid response.')
  }

  const staticPages = Array.isArray(content.staticPages) ? content.staticPages : []
  const seenSlugs = new Set<string>()

  for (const page of staticPages) {
    if (!isRecord(page) || typeof page.slug !== 'string') {
      throw new Error('Sanity staticPage documents must include a valid slug.')
    }

    if (!requiredStaticPageSlugs.includes(page.slug)) {
      throw new Error(
        `Sanity staticPage slug "${page.slug}" is not supported. Expected one of ${requiredStaticPageSlugs.join(', ')}.`,
      )
    }

    if (seenSlugs.has(page.slug)) {
      throw new Error(`Sanity has multiple staticPage documents for "${page.slug}".`)
    }

    seenSlugs.add(page.slug)
  }

  if (!shouldRequireContent()) return

  if (!content.siteSettings) {
    throw new Error('Sanity required document missing: siteSettings.')
  }

  if (!content.homePage) {
    throw new Error('Sanity required document missing: homePage.')
  }

  for (const slug of requiredStaticPageSlugs) {
    if (!seenSlugs.has(slug)) {
      throw new Error(`Sanity required staticPage missing: ${slug}.`)
    }
  }
}

function shouldRequireContent() {
  return process.env.SANITY_VALIDATE_REQUIRED_CONTENT === 'true'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function parsePerspective(value: string | undefined): 'drafts' | 'published' {
  if (!value) return 'published'

  if (value === 'drafts' || value === 'published') return value

  throw new Error('SANITY_CONTENT_PERSPECTIVE must be "drafts" or "published".')
}
