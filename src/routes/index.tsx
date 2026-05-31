import { Link, createFileRoute } from '@tanstack/react-router'

import { HomeCategoryTiles } from '../components/home/HomeCategoryTiles'
import { HomeEmptyCatalog } from '../components/home/HomeEmptyCatalog'
import { HomeHero } from '../components/home/HomeHero'
import { HomeImageStory } from '../components/home/HomeImageStory'
import { HomeNewArrivals } from '../components/home/HomeNewArrivals'
import { ProductGrid } from '../components/product/ProductGrid'
import { RecentlyViewedRail } from '../components/product/RecentlyViewed'
import {
  categoryLabels,
  featuredProducts,
  productCategories,
  products,
} from '../data/products'
import { createPageMeta } from '../lib/seo'

export const Route = createFileRoute('/')({
  head: () =>
    createPageMeta({
      title: 'Trenzura | Short Tops, Kurtis and Co-ord Sets',
      description:
        'Shop printed short tops, kurtis, and coordinated sets for everyday plans, festive lunches, and easy occasion wear.',
      path: '/',
      image: '/assets/hero/trenzura-everyday-elegance-01.jpg',
    }),
  component: Home,
})

function Home() {
  if (products.length === 0) {
    return <HomeEmptyCatalog />
  }

  const categoryTiles = productCategories.slice(0, 3).map((category) => {
    const product = products.find((item) => item.category === category) ?? products[0]
    return { category, product }
  })
  const newArrivals = products.slice(0, 3)
  const imageStoryProducts = products.slice(3, 7)
  const newArrivalsCollage = newArrivals.concat(products.slice(7, 8)).slice(0, 4)

  return (
    <main className="pb-24 sm:pb-0">
      <HomeHero />
      <HomeCategoryTiles categoryLabels={categoryLabels} tiles={categoryTiles} />

      <RecentlyViewedRail className="mx-auto max-w-[90rem] px-4 py-10 sm:px-6 lg:px-8 lg:py-14" limit={4} />

      <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-[90rem]">
          <div className="mb-8 flex flex-col justify-between gap-5 border-b border-[var(--color-line)] pb-6 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-medium text-[var(--color-muted)]">Loved by shoppers</p>
              <h2 className="mt-2 font-serif text-5xl font-normal leading-none text-[var(--color-ink)] sm:text-6xl">
                Best sellers
              </h2>
            </div>
            <Link
              to="/products"
              className="text-sm font-medium text-[var(--color-ink)] underline-offset-4 transition hover:underline"
            >
              View all products
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </div>
      </section>

      <HomeImageStory products={imageStoryProducts} />
      <HomeNewArrivals collageProducts={newArrivalsCollage} products={newArrivals} />
    </main>
  )
}
