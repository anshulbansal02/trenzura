import { FileText } from 'lucide-react'
import { defineField, defineType } from 'sanity'

export const staticPage = defineType({
  name: 'staticPage',
  title: 'Static page',
  type: 'document',
  icon: FileText,
  fields: [
    defineField({
      name: 'slug',
      title: 'Page',
      type: 'string',
      options: {
        list: [
          { title: 'About', value: 'about' },
          { title: 'Contact', value: 'contact' },
          { title: 'Shipping & Returns', value: 'shipping-returns' },
          { title: 'Terms', value: 'terms' },
          { title: 'Privacy', value: 'privacy' },
        ],
        layout: 'radio',
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'simpleRichText',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      validation: (rule) => rule.max(70),
    }),
    defineField({
      name: 'seoDescription',
      title: 'SEO description',
      type: 'text',
      rows: 2,
      validation: (rule) => rule.max(160),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'slug',
    },
  },
})
