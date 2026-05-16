import { Link, createFileRoute } from '@tanstack/react-router'

import { HomeBenefits } from '../components/home/HomeBenefits'
import { HomeCategoryTiles } from '../components/home/HomeCategoryTiles'
import { HomeEmptyCatalog } from '../components/home/HomeEmptyCatalog'
import { HomeHero } from '../components/home/HomeHero'
import { HomeImageStory } from '../components/home/HomeImageStory'
import { HomeNewArrivals } from '../components/home/HomeNewArrivals'
import { HomeTrustBar } from '../components/home/HomeTrustBar'
import { ProductGrid } from '../components/product/ProductGrid'
import { RecentlyViewedRail } from '../components/product/RecentlyViewed'
import {
  categoryLabels,
  featuredProducts,
  productCategories,
  productPriceRange,
  products,
} from '../data/products'
import { getProductImage } from '../lib/product-images'
import { createPageMeta } from '../lib/seo'

export const Route = createFileRoute('/')({
  head: () =>
    createPageMeta({
      title: 'Trenzura | Short Tops, Kurtis and Co-ord Sets',
      description:
        'Shop printed short tops, kurtis, and coordinated sets for everyday plans, festive lunches, and easy occasion wear.',
      path: '/',
      image: products[0] ? getProductImage(products[0], 0) : undefined,
    }),
  component: Home,
})

function Home() {
  if (products.length === 0) {
    return <HomeEmptyCatalog />
  }

  const heroProduct = products[0]
  const categoryTiles = productCategories.slice(0, 3).map((category) => {
    const product = products.find((item) => item.category === category) ?? products[0]
    return { category, product }
  })
  const newArrivals = products.slice(0, 3)
  const imageStoryProducts = products.slice(3, 7)
  const heroGallery = [
    products[1] ?? heroProduct,
    heroProduct,
    products[3] ?? products[2] ?? heroProduct,
  ]
  const newArrivalsCollage = newArrivals.concat(products.slice(7, 8)).slice(0, 4)

  return (
    <main className="pb-24 sm:pb-0">
      <HomeHero gallery={heroGallery} minPricePaise={productPriceRange.min} />
      <HomeTrustBar />
      <HomeCategoryTiles categoryLabels={categoryLabels} tiles={categoryTiles} />

      <RecentlyViewedRail className="fashion-container py-8 lg:py-12" limit={4} />

      <section className="fashion-container py-8 lg:py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="fashion-eyebrow">Loved by shoppers</p>
            <h2 className="fashion-display mt-2 text-2xl sm:text-3xl">
              Best sellers
            </h2>
          </div>
          <Link
            to="/products"
            className="text-sm font-semibold text-[var(--color-ink)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-rouge)] hover:decoration-[var(--color-rouge)]"
          >
            View all products
          </Link>
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      <HomeImageStory products={imageStoryProducts} />
      <HomeNewArrivals collageProducts={newArrivalsCollage} products={newArrivals} />
      <HomeBenefits />
    </main>
  )
}
