import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { Link, createFileRoute, notFound } from '@tanstack/react-router'

import { formatBlogDate, getBlogPostBySlug } from '../lib/blog'
import { getSanityImageUrl, type SanityImage } from '../lib/sanity'
import { createAbsoluteUrl, createPageMeta, siteName } from '../lib/seo'

export const Route = createFileRoute('/blog_/$slug')({
  loader: ({ params }) => {
    const post = getBlogPostBySlug(params.slug)

    if (!post) {
      throw notFound()
    }

    return { post }
  },
  head: ({ params }) => {
    const post = getBlogPostBySlug(params.slug)

    if (!post) {
      return createPageMeta({
        title: 'Blog post not found | Trenzura',
        description: 'This Trenzura blog post is unavailable.',
        path: '/blog',
      })
    }

    const image = getSanityImageUrl(post.coverImage, { width: 1200, height: 1500 })
    const seo = createPageMeta({
      title: `${post.seoTitle || post.title} | Trenzura`,
      description: post.seoDescription || post.excerpt,
      path: `/blog/${post.slug}`,
      image,
      type: 'website',
    })

    return {
      ...seo,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.seoDescription || post.excerpt,
            datePublished: post.publishedAt,
            image,
            author: {
              '@type': 'Organization',
              name: post.authorName || siteName,
            },
            publisher: {
              '@type': 'Organization',
              name: siteName,
            },
            mainEntityOfPage: createAbsoluteUrl(`/blog/${post.slug}`),
          }),
        },
      ],
    }
  },
  component: BlogDetailPage,
})

const portableTextComponents: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-10 font-serif text-4xl font-normal leading-tight text-[var(--color-ink)]">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-8 text-xl font-medium leading-tight text-[var(--color-ink)]">{children}</h3>
    ),
    normal: ({ children }) => (
      <p className="mt-5 text-base leading-8 text-[var(--color-ink-soft)]">{children}</p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="mt-7 border-l-2 border-[var(--color-primary)] pl-5 font-serif text-2xl leading-9 text-[var(--color-ink)]">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="mt-5 list-disc space-y-2 pl-5 text-base leading-8 text-[var(--color-ink-soft)]">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="mt-5 list-decimal space-y-2 pl-5 text-base leading-8 text-[var(--color-ink-soft)]">
        {children}
      </ol>
    ),
  },
  marks: {
    link: ({ children, value }) => {
      const href = typeof value?.href === 'string' ? value.href : '#'
      const external = href.startsWith('http')

      return (
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
          className="text-[var(--color-primary)] underline underline-offset-4"
        >
          {children}
        </a>
      )
    },
  },
  types: {
    image: ({ value }) => {
      const image = value as SanityImage
      const url = getSanityImageUrl(image, { width: 1200 })
      if (!url) return null

      return (
        <figure className="my-9">
          <img
            src={url}
            alt={image.alt || ''}
            className="w-full bg-[var(--color-surface)] object-cover"
            loading="lazy"
          />
          {image.alt ? (
            <figcaption className="mt-3 text-xs leading-5 text-[var(--color-muted)]">
              {image.alt}
            </figcaption>
          ) : null}
        </figure>
      )
    },
  },
}

function BlogDetailPage() {
  const { post } = Route.useLoaderData()
  const coverImage = getSanityImageUrl(post.coverImage, { width: 1400, height: 1750 })

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <article className="mx-auto max-w-[90rem]">
        <nav
          aria-label="Blog breadcrumb"
          className="mb-6 flex flex-wrap items-center gap-2 text-sm text-[var(--color-muted)]"
        >
          <Link to="/blog" className="transition hover:text-[var(--color-ink)]">
            Blog
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-[var(--color-ink)]">{post.title}</span>
        </nav>

        <header className="grid gap-8 border-b border-[var(--color-line)] pb-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(360px,0.54fr)] lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
              {post.category ? <span>{post.category}</span> : null}
              {post.category ? <span aria-hidden="true">/</span> : null}
              <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
            </div>
            <h1 className="mt-4 max-w-4xl font-serif text-5xl font-normal leading-none text-[var(--color-ink)] sm:text-6xl lg:text-7xl">
              {post.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
              {post.excerpt}
            </p>
            <p className="mt-5 text-sm text-[var(--color-muted)]">By {post.authorName}</p>
          </div>
          {coverImage ? (
            <img
              src={coverImage}
              alt={post.coverImage?.alt || post.title}
              className="aspect-[4/5] w-full bg-[var(--color-surface)] object-cover"
            />
          ) : null}
        </header>

        <div className="mx-auto max-w-3xl py-10">
          <PortableText value={post.content} components={portableTextComponents} />
        </div>
      </article>
    </main>
  )
}
