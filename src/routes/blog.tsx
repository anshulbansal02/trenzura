import { Link, createFileRoute } from '@tanstack/react-router'

import { formatBlogDate, listBlogPosts, type BlogPostSummary } from '../lib/blog'
import { getSanityImageUrl } from '../lib/sanity'
import { createPageMeta } from '../lib/seo'

export const Route = createFileRoute('/blog')({
  loader: () => listBlogPosts(),
  head: () =>
    createPageMeta({
      title: 'Blog | Trenzura',
      description: 'Styling notes, care guides, and collection stories from Trenzura.',
      path: '/blog',
    }),
  component: BlogIndexPage,
})

function BlogIndexPage() {
  const posts = Route.useLoaderData()

  return (
    <main className="px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-[90rem]">
        <section className="border-b border-[var(--color-line)] pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
            Trenzura journal
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-5xl font-normal leading-none text-[var(--color-ink)] sm:text-6xl">
            Styling notes and care guides
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--color-muted)]">
            Practical notes on fabrics, fit, styling, and everyday care for Indian wear.
          </p>
        </section>

        {posts.length > 0 ? (
          <section className="grid gap-x-6 gap-y-10 py-10 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post._id} post={post} />
            ))}
          </section>
        ) : (
          <section className="py-14">
            <div className="max-w-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6">
              <h2 className="text-base font-medium text-[var(--color-ink)]">Blog is being prepared</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-muted)]">
                Posts will appear here after Sanity is connected and the first article is published.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}

function BlogPostCard({ post }: { post: BlogPostSummary }) {
  const image = getSanityImageUrl(post.coverImage, { width: 900, height: 1125 })

  return (
    <article className="group">
      <Link to="/blog/$slug" params={{ slug: post.slug }} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[var(--color-surface)]">
          {image ? (
            <img
              src={image}
              alt={post.coverImage?.alt || post.title}
              className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.025]"
              loading="lazy"
            />
          ) : null}
        </div>
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-[var(--color-muted)]">
            {post.category ? <span>{post.category}</span> : null}
            {post.category ? <span aria-hidden="true">/</span> : null}
            <time dateTime={post.publishedAt}>{formatBlogDate(post.publishedAt)}</time>
          </div>
          <h2 className="mt-3 font-serif text-3xl font-normal leading-tight text-[var(--color-ink)]">
            {post.title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-[var(--color-muted)]">{post.excerpt}</p>
        </div>
      </Link>
    </article>
  )
}
