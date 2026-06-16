# Sanity Blog

Trenzura uses Sanity for lightweight blog content that can be managed by a non-technical editor.

## Sanity Project

Sanity Cloud project:

- Project name: `Trenzura Store`
- Project ID: `o4p78bwk`
- QA dataset: `qa`
- Production dataset: `production`

Use `qa` for QA deployments and `production` for production deployments. These datasets are isolated content stores inside the same Sanity project.

Set these environment variables in local development and deployment:

```bash
VITE_SANITY_PROJECT_ID=o4p78bwk
VITE_SANITY_DATASET=qa
VITE_SANITY_API_VERSION=2026-06-16
SANITY_STUDIO_PROJECT_ID=o4p78bwk
SANITY_STUDIO_DATASET=qa
SANITY_READ_TOKEN=
SANITY_WRITE_TOKEN=
```

The `VITE_` variables select the Sanity project and dataset at build time. The storefront reads generated blog JSON at runtime. `SANITY_READ_TOKEN` is used only during build-time sync if the dataset is not publicly readable. The `SANITY_STUDIO_` variables are used by Sanity Studio.

If `VITE_SANITY_PROJECT_ID` is not set, `/blog` still builds and shows an empty state.

## Storefront Rendering

Blog content is fetched from Sanity during `pnpm prepare:generated`, which runs before typecheck and build. The script writes ignored generated data to `src/generated/blog-posts.json`, and the storefront imports that JSON instead of calling Sanity from route loaders.

This matters for TanStack Start because route loaders can run on the server for initial SSR and in the browser during client navigation. Keeping Sanity reads in the build-time sync avoids exposing tokens and avoids hitting the CMS on every page view.

The build prerenders `/blog` and uses link crawling to discover `/blog/$slug` detail pages. When a post changes in Sanity, trigger a QA or production rebuild through a Sanity webhook.

## Seed Sample Posts In Sanity Cloud

Create a write token in Sanity and set it locally:

```bash
SANITY_WRITE_TOKEN=...
```

Then seed QA:

```bash
SANITY_STUDIO_DATASET=qa pnpm sanity:seed-blog
```

This creates or updates three sample `Blog post` documents in the `qa` dataset and uploads local cover images as Sanity assets.

## Local Studio

Run:

```bash
pnpm studio:dev
```

The Studio is configured with the `Blog post` document type. Editors can manage title, slug, excerpt, cover image, category, author, publish date, rich content, and SEO fields.

## Studio Deployment

Sanity Studio can be deployed with:

```bash
pnpm studio:deploy
```

Use a Studio hostname like `trenzura-blog` or similar. The hosted Studio is separate from the storefront and does not require hosting a CMS server.

## Publishing Flow

Recommended flow:

1. Editor creates or updates a blog post in Sanity.
2. Editor publishes the post.
3. Sanity webhook triggers the storefront deploy workflow.
4. The storefront rebuilds `/blog` and `/blog/$slug` pages.

The storefront reads only published posts where `publishedAt <= now()`.

## Webhook

Create a Sanity webhook for create/update/delete/publish events on `blogPost` documents. Point it to the deployment provider or GitHub Actions workflow endpoint used for Trenzura deploys.

Keep the webhook secret in the deployment provider, not in Sanity document content.
