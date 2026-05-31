import { Button } from '@base-ui/react/button'
import { Link } from '@tanstack/react-router'

import { StyleFinder } from '../product/StyleFinder'

const heroSlides = [
  {
    src: '/assets/hero/trenzura-everyday-elegance-01.jpg',
    alt: 'Trenzura everyday elegance campaign featuring kurtis, co-ord sets, short tops, and up to 20 percent off the new collection.',
  },
  {
    src: '/assets/hero/trenzura-rooted-tradition-01.jpg',
    alt: 'Trenzura rooted in tradition campaign with a woman wearing a dusty blush printed kurti.',
  },
  {
    src: '/assets/hero/trenzura-rooted-tradition-02.jpg',
    alt: 'Trenzura rooted in tradition campaign with a woman wearing a yellow floral ethnic top.',
  },
]

export function HomeHero() {
  return (
    <section>
      <div className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <h1 className="sr-only">Trenzura - Everyday ethnic wear for the modern woman</h1>
        <div className="relative aspect-[2/1] overflow-hidden bg-[#f5eadc] sm:aspect-[16/7] lg:aspect-[5/2] xl:max-h-[590px]">
          {heroSlides.map((slide, index) => (
            <img
              key={slide.src}
              src={slide.src}
              alt={slide.alt}
              className={`absolute inset-0 block h-full w-full object-cover object-center opacity-0 [animation:trenzura-hero-fade_15s_linear_infinite] [will-change:opacity] ${
                index === 0 ? 'motion-reduce:opacity-100' : 'motion-reduce:hidden'
              }`}
              style={{ animationDelay: `${index * 5}s` }}
              loading="eager"
              decoding="async"
            />
          ))}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10">
            <div className="mx-auto flex max-w-[90rem] justify-end px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
              <div className="pointer-events-auto flex flex-wrap justify-end gap-2">
                <Button
                  nativeButton={false}
                  render={
                    <Link
                      to="/products"
                      search={{ sort: 'newest' }}
                      className="inline-flex h-9 items-center justify-center bg-[var(--color-primary)] px-3 text-xs font-medium text-[var(--color-paper)] transition duration-150 ease-out hover:bg-[var(--color-primary-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 active:scale-[0.99] sm:h-10 sm:px-5 sm:text-sm"
                    />
                  }
                >
                  Shop new arrivals
                </Button>
                <StyleFinder
                  triggerLabel="Find my style"
                  triggerClassName="inline-flex h-9 items-center justify-center gap-2 border border-[var(--color-line)] bg-[var(--color-paper)] px-3 text-xs font-medium text-[var(--color-ink)] transition duration-150 ease-out hover:border-[var(--color-primary)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 active:scale-[0.99] sm:h-10 sm:px-5 sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
