import siteContent from '../generated/site-content.json'
import { formatPrice } from './format'
import { shippingConfig } from './shipping'

export type StorefrontLink = {
  label: string
  url: string
}

export type StorefrontImage = {
  alt: string
  url: string
}

export type HomePageContent = {
  bestSellersSection: SectionContent
  categorySection: SectionContent
  hero: {
    primaryCta: StorefrontLink
    screenReaderTitle: string
    slides: StorefrontImage[]
    styleFinderLabel: string
  }
  imageStory: SectionContent & {
    copy: string
  }
  newArrivalsSection: SectionContent
  seo: {
    description: string
    image?: StorefrontImage
    title: string
  }
}

export type SiteSettingsContent = {
  announcement: {
    desktopText: string
    mobileText: string
  }
  benefits: Array<{
    copy: string
    icon: 'bag' | 'returns' | 'shield' | 'truck'
    title: string
  }>
  bottomNote: string
  copyrightLine: string
  footerDescription: string
  footerEyebrow: string
  footerHeadline: string
  footerSections: Array<{
    links: StorefrontLink[]
    title: string
  }>
  footerShortCopy: string
  headerLinks: StorefrontLink[]
  socialLinks: StorefrontLink[]
}

export type StaticPageSlug = 'about' | 'contact' | 'privacy' | 'shipping-returns' | 'terms'

export type StaticPageContent = {
  body: unknown[]
  eyebrow: string
  seoDescription: string
  seoTitle: string
  slug: StaticPageSlug
  title: string
}

type SectionContent = {
  eyebrow: string
  heading: string
  link: StorefrontLink
}

const defaultHomePage: HomePageContent = {
  seo: {
    title: 'Trenzura | Short Tops, Kurtis and Co-ord Sets',
    description:
      'Shop printed short tops, kurtis, and coordinated sets for everyday plans, festive lunches, and easy occasion wear.',
    image: {
      url: '/assets/hero/trenzura-everyday-elegance-01.jpg',
      alt: 'Trenzura everyday elegance campaign.',
    },
  },
  hero: {
    screenReaderTitle: 'Trenzura - Everyday ethnic wear for the modern woman',
    primaryCta: { label: 'Shop new arrivals', url: '/products?sort=newest' },
    styleFinderLabel: 'Find my style',
    slides: [
      {
        url: '/assets/hero/trenzura-everyday-elegance-01.jpg',
        alt: 'Trenzura everyday elegance campaign featuring kurtis, co-ord sets, short tops, and up to 20 percent off the new collection.',
      },
      {
        url: '/assets/hero/trenzura-rooted-tradition-01.jpg',
        alt: 'Trenzura rooted in tradition campaign with a woman wearing a dusty blush printed kurti.',
      },
      {
        url: '/assets/hero/trenzura-rooted-tradition-02.jpg',
        alt: 'Trenzura rooted in tradition campaign with a woman wearing a yellow floral ethnic top.',
      },
    ],
  },
  categorySection: {
    eyebrow: 'Kurtis crafted for every mood',
    heading: 'Shop by style',
    link: { label: 'View all', url: '/products' },
  },
  bestSellersSection: {
    eyebrow: 'Loved by shoppers',
    heading: 'Best sellers',
    link: { label: 'View all products', url: '/products' },
  },
  imageStory: {
    eyebrow: 'The cotton edit',
    heading: 'Color, print, repeat',
    copy: 'Pick easy silhouettes with enough polish for everyday plans, festive lunches, and weekend dressing.',
    link: { label: 'Shop new arrivals', url: '/products?sort=newest' },
  },
  newArrivalsSection: {
    eyebrow: 'Latest arrivals',
    heading: 'New arrivals, ready to wear',
    link: { label: 'Shop offers', url: '/products?sort=discount-desc' },
  },
}

const defaultSiteSettings: SiteSettingsContent = {
  announcement: {
    mobileText: `Free shipping above ${formatPrice(shippingConfig.freeShippingThresholdPaise)} | 7-day returns`,
    desktopText: `Free shipping above ${formatPrice(
      shippingConfig.freeShippingThresholdPaise,
    )} | 7-day returns on eligible pieces`,
  },
  headerLinks: [
    { label: 'Home', url: '/' },
    { label: 'Shop', url: '/products' },
    { label: 'New In', url: '/products?sort=newest' },
    { label: 'Offers', url: '/products?sort=discount-desc' },
    { label: 'Blog', url: '/blog' },
    { label: 'Track Order', url: '/orders' },
  ],
  footerEyebrow: 'Trenzura',
  footerHeadline: 'Everyday Indian wear, kept straightforward.',
  footerDescription:
    'Short tops, kurtis, and coordinated sets with clear prices, size selection, secure checkout, and delivery details shown before payment.',
  footerShortCopy:
    'Everyday Indian wear with straightforward sizing, clear checkout, and eligible returns.',
  footerSections: [
    {
      title: 'Shop',
      links: [
        { label: 'All products', url: '/products' },
        { label: 'New arrivals', url: '/products?sort=newest' },
        { label: 'Offers', url: '/products?sort=discount-desc' },
      ],
    },
    {
      title: 'Company',
      links: [
        { label: 'About', url: '/about' },
        { label: 'Blog', url: '/blog' },
        { label: 'Contact', url: '/contact' },
        { label: 'Shipping & returns', url: '/shipping-returns' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Terms', url: '/terms' },
        { label: 'Privacy', url: '/privacy' },
        { label: 'Checkout', url: '/checkout' },
      ],
    },
  ],
  socialLinks: [
    { label: 'Instagram', url: 'https://www.instagram.com/trenzura' },
    { label: 'Facebook', url: 'https://www.facebook.com/trenzura' },
    { label: 'Pinterest', url: 'https://www.pinterest.com/trenzura' },
  ],
  benefits: [
    {
      icon: 'shield',
      title: 'Secure payments',
      copy: 'Pay safely with UPI, cards, wallets, and more.',
    },
    {
      icon: 'truck',
      title: 'Clear shipping',
      copy: `Free shipping above ${formatPrice(shippingConfig.freeShippingThresholdPaise)}.`,
    },
    {
      icon: 'returns',
      title: 'Returns',
      copy: '7-day returns on eligible pieces after delivery.',
    },
    {
      icon: 'bag',
      title: 'Order review',
      copy: 'Size, quantity, shipping, and total are shown before payment.',
    },
  ],
  copyrightLine: 'Trenzura. All rights reserved.',
  bottomNote: 'Clear sizing, secure payment, and eligible returns.',
}

const defaultStaticPages: Record<StaticPageSlug, StaticPageContent> = {
  about: {
    slug: 'about',
    eyebrow: 'About Trenzura',
    title: 'Everyday pieces with clear buying details.',
    seoTitle: 'About | Trenzura',
    seoDescription: 'Learn about Trenzura and our approach to everyday Indian wear.',
    body: [
      paragraph(
        'Trenzura focuses on wearable Indian styles such as short tops, kurtis, and coordinated sets. The catalog is kept direct: clear product photos, visible size selection, variant details, and pricing before checkout.',
      ),
      paragraph(
        'Orders are placed online through secure payment options. Shipping, return eligibility, size, quantity, and order totals are shown before payment.',
      ),
    ],
  },
  contact: {
    slug: 'contact',
    eyebrow: 'Contact',
    title: 'Help with orders and product questions.',
    seoTitle: 'Contact | Trenzura',
    seoDescription: 'Contact Trenzura for order, shipping, return, and product questions.',
    body: [
      heading('Order support'),
      paragraph(
        'Use the contact details shown on your order confirmation for order-specific help. Keep your order ID ready so the team can check payment, shipping, or return details.',
      ),
      heading('Product questions'),
      paragraph(
        'For size, fabric, or product-detail questions, share the product code from the product page so the exact variant can be reviewed.',
      ),
    ],
  },
  'shipping-returns': {
    slug: 'shipping-returns',
    eyebrow: 'Shipping & returns',
    title: 'Clear shipping and eligible returns.',
    seoTitle: 'Shipping & Returns | Trenzura',
    seoDescription: 'Shipping charges, dispatch timing, and return eligibility for Trenzura orders.',
    body: [
      heading('Shipping'),
      paragraph(
        `Orders usually ship in 1-2 business days after order confirmation. Shipping is free above ${formatPrice(
          shippingConfig.freeShippingThresholdPaise,
        )}. Below that, standard shipping is ${formatPrice(shippingConfig.standardShippingPaise)}.`,
      ),
      heading('Returns'),
      paragraph(
        'Eligible pieces can be returned within 7 days after delivery. Items should be unused, unwashed, and returned with original packaging and tags where applicable.',
      ),
      heading('Order review'),
      paragraph(
        'Size, quantity, shipping, and total amount are shown before payment so you can review the order before placing it.',
      ),
    ],
  },
  terms: {
    slug: 'terms',
    eyebrow: 'Terms',
    title: 'Terms for buying from Trenzura.',
    seoTitle: 'Terms | Trenzura',
    seoDescription: 'Terms for shopping on Trenzura.',
    body: [
      heading('Orders'),
      paragraph(
        'Orders are confirmed after successful payment and availability checks. Product price, size, quantity, shipping, and total are shown before payment.',
      ),
      heading('Shipping'),
      paragraph(
        `Shipping is free above ${formatPrice(
          shippingConfig.freeShippingThresholdPaise,
        )}. Orders below that amount use the shipping charge shown at checkout.`,
      ),
      heading('Returns'),
      paragraph(
        'Eligible pieces can be returned within 7 days after delivery when they are unused, unwashed, and returned with original packaging and tags where applicable.',
      ),
    ],
  },
  privacy: {
    slug: 'privacy',
    eyebrow: 'Privacy',
    title: 'Customer information is used to process orders.',
    seoTitle: 'Privacy | Trenzura',
    seoDescription: 'Privacy information for Trenzura customers.',
    body: [
      heading('Information we use'),
      paragraph(
        'We collect the details needed to place, confirm, ship, and support orders, including contact details, shipping address, selected items, and payment status. If you opt in at checkout, your phone number may also be used for WhatsApp order confirmation and shipping updates.',
      ),
      heading('Payments'),
      paragraph(
        'Payments are handled through the checkout provider. Trenzura does not store full card, UPI, wallet, or net-banking credentials in the storefront.',
      ),
      heading('Support'),
      paragraph(
        'Order and contact information may be used to respond to customer support requests, returns, shipping updates, and payment checks.',
      ),
    ],
  },
}

export function getSiteSettingsContent(): SiteSettingsContent {
  const settings = getRecord(getGeneratedContent().siteSettings)

  return {
    ...defaultSiteSettings,
    ...pickStrings(settings, [
      'footerEyebrow',
      'footerHeadline',
      'footerDescription',
      'footerShortCopy',
      'copyrightLine',
      'bottomNote',
    ]),
    announcement: {
      ...defaultSiteSettings.announcement,
      ...pickStrings(getRecord(settings.announcement), ['mobileText', 'desktopText']),
    },
    headerLinks: readLinks(settings.headerLinks, defaultSiteSettings.headerLinks),
    footerSections: readFooterSections(settings.footerSections, defaultSiteSettings.footerSections),
    socialLinks: readLinks(settings.socialLinks, defaultSiteSettings.socialLinks),
    benefits: readBenefits(settings.benefits, defaultSiteSettings.benefits),
  }
}

export function getHomePageContent(): HomePageContent {
  const home = getRecord(getGeneratedContent().homePage)

  return {
    ...defaultHomePage,
    seo: {
      ...defaultHomePage.seo,
      ...pickStrings(getRecord(home.seo), ['title', 'description']),
      image: readImage(getRecord(home.seo).image, null) ?? defaultHomePage.seo.image,
    },
    hero: {
      ...defaultHomePage.hero,
      ...pickStrings(getRecord(home.hero), ['screenReaderTitle', 'styleFinderLabel']),
      primaryCta: readLink(getRecord(home.hero).primaryCta, defaultHomePage.hero.primaryCta),
      slides: readImages(getRecord(home.hero).slides, defaultHomePage.hero.slides),
    },
    categorySection: readSection(home.categorySection, defaultHomePage.categorySection),
    bestSellersSection: readSection(home.bestSellersSection, defaultHomePage.bestSellersSection),
    imageStory: {
      ...defaultHomePage.imageStory,
      ...pickStrings(getRecord(home.imageStory), ['eyebrow', 'heading', 'copy']),
      link: readLink(getRecord(home.imageStory).link, defaultHomePage.imageStory.link),
    },
    newArrivalsSection: readSection(home.newArrivalsSection, defaultHomePage.newArrivalsSection),
  }
}

export function getStaticPageContent(slug: StaticPageSlug): StaticPageContent {
  const generatedContent = getGeneratedContent()
  const pages: unknown[] = Array.isArray(generatedContent.staticPages)
    ? generatedContent.staticPages
    : []
  const page = pages.find((item) => isRecord(item) && item.slug === slug)

  if (!isRecord(page)) return defaultStaticPages[slug]

  return {
    ...defaultStaticPages[slug],
    ...pickStrings(page, ['eyebrow', 'title', 'seoTitle', 'seoDescription']),
    body: Array.isArray(page.body) && page.body.length > 0 ? page.body : defaultStaticPages[slug].body,
  }
}

function getGeneratedContent(): Record<string, unknown> {
  return isRecord(siteContent) ? siteContent : {}
}

function readSection(value: unknown, fallback: SectionContent): SectionContent {
  const record = getRecord(value)

  return {
    ...fallback,
    ...pickStrings(record, ['eyebrow', 'heading']),
    link: readLink(record.link, fallback.link),
  }
}

function readFooterSections(value: unknown, fallback: SiteSettingsContent['footerSections']) {
  if (!Array.isArray(value)) return fallback

  const sections = value.flatMap((item) => {
    const section = getRecord(item)
    const title = readString(section.title)
    const links = readLinks(section.links, [])

    return title && links.length > 0 ? [{ title, links }] : []
  })

  return sections.length > 0 ? sections : fallback
}

function readBenefits(value: unknown, fallback: SiteSettingsContent['benefits']) {
  if (!Array.isArray(value)) return fallback

  const benefits = value.flatMap((item) => {
    const benefit = getRecord(item)
    const icon = readString(benefit.icon)
    const title = readString(benefit.title)
    const copy = readString(benefit.copy)

    if (!isBenefitIcon(icon) || !title || !copy) return []
    return [{ icon, title, copy }]
  })

  return benefits.length > 0 ? benefits : fallback
}

function readLinks(value: unknown, fallback: StorefrontLink[]): StorefrontLink[] {
  if (!Array.isArray(value)) return fallback

  const links = value.flatMap((item) => {
    const link = readLink(item, null)
    return link ? [link] : []
  })

  return links.length > 0 ? links : fallback
}

function readLink(value: unknown, fallback: StorefrontLink): StorefrontLink
function readLink(value: unknown, fallback: null): StorefrontLink | null
function readLink(value: unknown, fallback: StorefrontLink | null) {
  const record = getRecord(value)
  const label = readString(record.label)
  const url = readString(record.url)

  return label && url ? { label, url } : fallback
}

function readImages(value: unknown, fallback: StorefrontImage[]) {
  if (!Array.isArray(value)) return fallback

  const images = value.flatMap((item) => {
    const image = readImage(item, null)
    return image ? [image] : []
  })

  return images.length > 0 ? images : fallback
}

function readImage(value: unknown, fallback: StorefrontImage): StorefrontImage
function readImage(value: unknown, fallback: null | undefined): StorefrontImage | undefined
function readImage(value: unknown, fallback: StorefrontImage | null | undefined) {
  const record = getRecord(value)
  const url = readString(record.url)
  const alt = readString(record.alt)

  return url && alt ? { url, alt } : fallback
}

function pickStrings<T extends string>(record: Record<string, unknown>, keys: T[]) {
  const output = {} as Partial<Record<T, string>>

  for (const key of keys) {
    const value = readString(record[key])
    if (value) output[key] = value
  }

  return output
}

function paragraph(text: string) {
  return {
    _key: keyFromText(text),
    _type: 'block',
    style: 'normal',
    children: [{ _key: `${keyFromText(text)}-span`, _type: 'span', text, marks: [] }],
    markDefs: [],
  }
}

function heading(text: string) {
  return {
    _key: keyFromText(text),
    _type: 'block',
    style: 'h2',
    children: [{ _key: `${keyFromText(text)}-span`, _type: 'span', text, marks: [] }],
    markDefs: [],
  }
}

function keyFromText(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 48)
}

function getRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {}
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function isBenefitIcon(value: string | null): value is SiteSettingsContent['benefits'][number]['icon'] {
  return value === 'bag' || value === 'returns' || value === 'shield' || value === 'truck'
}
