import { Dialog } from '@base-ui/react/dialog'
import { Link } from '@tanstack/react-router'
import { Sparkles, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { productSizes } from '../../data/products'
import { formatPrice, joinClasses } from '../../lib/format'
import {
  getDefaultStyleFinderAnswers,
  getStyleFinderResults,
  type StyleFinderAnswers,
  type StyleFinderBudget,
  type StyleFinderOccasion,
  type StyleFinderPreference,
} from '../../lib/style-finder'
import { ProductMedia } from './ProductMedia'

type StyleFinderProps = {
  triggerClassName?: string
  triggerLabel?: string
  triggerVariant?: 'primary' | 'secondary'
}

const occasionOptions: Array<{
  label: string
  value: StyleFinderOccasion
}> = [
  { label: 'Any plan', value: 'any' },
  { label: 'Everyday', value: 'everyday' },
  { label: 'Work', value: 'work' },
  { label: 'Small function', value: 'function' },
  { label: 'Gift', value: 'gift' },
]

const preferenceOptions: Array<{
  label: string
  value: StyleFinderPreference
}> = [
  { label: 'No preference', value: 'any' },
  { label: 'Short kurti', value: 'short' },
  { label: 'Long kurti', value: 'long' },
  { label: 'Coordinated set', value: 'set' },
]

const budgetOptions: Array<{
  label: string
  value: StyleFinderBudget
}> = [
  { label: 'Any budget', value: 'any' },
  { label: 'Under Rs.1,500', value: 'under-1500' },
  { label: 'Under Rs.2,000', value: 'under-2000' },
]

export function StyleFinder({
  triggerClassName,
  triggerLabel = 'Help me choose',
  triggerVariant = 'secondary',
}: StyleFinderProps) {
  const [open, setOpen] = useState(false)
  const [answers, setAnswers] = useState<StyleFinderAnswers>(getDefaultStyleFinderAnswers)
  const results = useMemo(() => getStyleFinderResults(answers), [answers])
  const triggerClasses =
    triggerClassName ??
    (triggerVariant === 'primary'
      ? 'fashion-button-primary h-12 px-5'
      : 'fashion-button-secondary h-12 gap-2 px-5')

  function updateAnswer(nextAnswers: Partial<StyleFinderAnswers>) {
    setAnswers((currentAnswers) => ({
      ...currentAnswers,
      ...nextAnswers,
    }))
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        render={
          <button type="button" className={triggerClasses} />
        }
      >
        <Sparkles className="size-4" aria-hidden="true" />
        {triggerLabel}
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-sm transition duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex min-h-svh items-end justify-center p-0 sm:items-center sm:p-6">
          <Dialog.Popup className="max-h-[100svh] w-full overflow-y-auto rounded-t-[1.35rem] border border-[var(--color-line)] bg-[var(--color-paper)] shadow-2xl shadow-stone-950/25 outline-none transition duration-200 data-[ending-style]:translate-y-4 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-4 data-[starting-style]:opacity-0 sm:max-h-[90svh] sm:max-w-5xl sm:rounded-[1.35rem] sm:data-[ending-style]:scale-[0.98] sm:data-[starting-style]:scale-[0.98]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-5 border-b border-[var(--color-line)] bg-[var(--color-paper)]/94 px-5 py-4 backdrop-blur sm:px-6">
              <div>
                <Dialog.Title className="font-serif text-2xl text-[var(--color-ink)]">
                  Help me choose
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm leading-6 text-[var(--color-muted)]">
                  Pick a few preferences and we will show the closest matches from the current
                  collection.
                </Dialog.Description>
              </div>
              <Dialog.Close
                aria-label="Close style finder"
                className="grid size-10 shrink-0 place-items-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] transition hover:border-[#b58b91] hover:text-[var(--color-rouge)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2"
              >
                <X className="size-4" aria-hidden="true" />
              </Dialog.Close>
            </div>

            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[320px_1fr]">
              <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                <OptionGroup
                  label="Shopping for"
                  options={occasionOptions}
                  value={answers.occasion}
                  onChange={(occasion) => updateAnswer({ occasion })}
                />
                <OptionGroup
                  label="Preferred style"
                  options={preferenceOptions}
                  value={answers.preference}
                  onChange={(preference) => updateAnswer({ preference })}
                />
                <OptionGroup
                  label="Budget"
                  options={budgetOptions}
                  value={answers.budget}
                  onChange={(budget) => updateAnswer({ budget })}
                />
                <OptionGroup
                  label="Size"
                  options={[
                    { label: 'Any size', value: 'any' },
                    ...productSizes.map((size) => ({ label: size, value: size })),
                  ]}
                  value={answers.size}
                  onChange={(size) => updateAnswer({ size })}
                />
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {results.length} {results.length === 1 ? 'match' : 'matches'}
                    </p>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      Ranked from your preferences and product details.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnswers(getDefaultStyleFinderAnswers())}
                    className="text-sm font-semibold text-[var(--color-muted)] underline decoration-[var(--color-line)] underline-offset-4 transition hover:text-[var(--color-rouge)]"
                  >
                    Reset
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {results.map(({ product, reasons }) => (
                    <Link
                      key={product.productId}
                      to="/products/$slug"
                      params={{ slug: product.slug }}
                      onClick={() => setOpen(false)}
                      className="group rounded-[1rem] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 transition hover:shadow-lg hover:shadow-stone-950/10"
                    >
                      <ProductMedia product={product} className="aspect-[3/4]" hoverZoom />
                      <div className="mt-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-ink)]">
                              {product.title}
                            </p>
                            <p className="mt-1 text-sm text-[var(--color-muted)]">
                              {product.categoryLabel}
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-[var(--color-ink)]">
                            {formatPrice(product.sellingPricePaise)}
                          </p>
                        </div>
                        <ul className="mt-3 space-y-1.5 text-xs leading-5 text-[var(--color-muted)]">
                          {reasons.map((reason) => (
                            <li key={reason} className="flex gap-2">
                              <span className="mt-2 size-1 rounded-full bg-[var(--color-rouge)]" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

type OptionGroupProps<T extends string> = {
  label: string
  onChange: (value: T) => void
  options: Array<{ label: string; value: T }>
  value: T
}

function OptionGroup<T extends string>({
  label,
  onChange,
  options,
  value,
}: OptionGroupProps<T>) {
  return (
    <div>
      <p className="text-sm font-semibold text-[var(--color-ink)]">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option.value === value

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(option.value)}
              className={joinClasses(
                'min-h-9 rounded-full border px-3 text-sm font-semibold transition duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-rouge)] focus-visible:ring-offset-2',
                isSelected
                  ? 'border-[var(--color-rouge)] bg-[var(--color-rouge)] text-[var(--color-paper)]'
                  : 'border-[var(--color-line)] bg-[var(--color-paper)] text-[var(--color-ink)] hover:border-[var(--color-rouge)] hover:bg-white',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
