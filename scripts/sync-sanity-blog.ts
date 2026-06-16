import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { createClient } from '@sanity/client'

import { projectRoot } from './lib/runtime'

const projectId = process.env.VITE_SANITY_PROJECT_ID || process.env.SANITY_STUDIO_PROJECT_ID
const dataset = process.env.VITE_SANITY_DATASET || process.env.SANITY_STUDIO_DATASET
const apiVersion = process.env.VITE_SANITY_API_VERSION || '2026-06-16'
const token = process.env.SANITY_READ_TOKEN || process.env.SANITY_WRITE_TOKEN || process.env.SANITY_AUTH_TOKEN
const outputPath = path.join(projectRoot, 'src/generated/blog-posts.json')

await mkdir(path.dirname(outputPath), { recursive: true })

if (!projectId || !dataset) {
  await writeBlogPosts([])
  console.log('Sanity blog sync skipped: missing project or dataset.')
  process.exit(0)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion,
  token,
  useCdn: false,
})

const posts = await client.fetch(`
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
    coverImage {
      alt,
      "url": asset->url
    },
    content[] {
      ...,
      _type == "image" => {
        _key,
        _type,
        alt,
        "url": asset->url
      }
    }
  }
`)

await writeBlogPosts(posts)
console.log(`Synced ${Array.isArray(posts) ? posts.length : 0} Sanity blog posts from ${dataset}.`)

async function writeBlogPosts(posts: unknown) {
  await writeFile(outputPath, `${JSON.stringify(posts, null, 2)}\n`)
}
