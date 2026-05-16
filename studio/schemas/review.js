import { defineField, defineType } from 'sanity'

export const review = defineType({
  name: 'review',
  title: 'Guest Review',
  type: 'document',

  fields: [
    defineField({
      name: 'guestName',
      title: 'Guest Name',
      type: 'string',
      description: 'e.g. Adaeze O. — use initials for the surname for privacy.',
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'guestOrigin',
      title: 'Guest Origin',
      type: 'string',
      description: 'e.g. "Abuja" or "UK Diaspora" — shown under the review.',
    }),

    defineField({
      name: 'property',
      title: 'Property',
      type: 'reference',
      to: [{ type: 'property' }],
      description: 'Which property did this guest stay at?',
    }),

    defineField({
      name: 'stayMonth',
      title: 'Stay Month',
      type: 'string',
      description: 'e.g. "Nov 2024" — shown under the guest name.',
    }),

    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      options: {
        list: [
          { title: '⭐⭐⭐⭐⭐  5 stars', value: 5 },
          { title: '⭐⭐⭐⭐  4 stars',  value: 4 },
          { title: '⭐⭐⭐  3 stars',    value: 3 },
        ],
        layout: 'radio',
      },
      initialValue: 5,
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'review',
      title: 'Review Text',
      type: 'text',
      rows: 4,
      validation: (R) => R.required().min(20),
    }),

    defineField({
      name: 'visible',
      title: 'Show on website',
      type: 'boolean',
      description: 'Toggle off to hide this review without deleting it.',
      initialValue: true,
    }),

    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first. e.g. 1 = first, 2 = second.',
      initialValue: 99,
    }),
  ],

  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Newest First',
      name: 'newestFirst',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],

  preview: {
    select: {
      title: 'guestName',
      subtitle: 'review',
      rating: 'rating',
      visible: 'visible',
    },
    prepare({ title, subtitle, rating, visible }) {
      const stars = '★'.repeat(rating || 5)
      return {
        title: `${visible === false ? '🔴 ' : ''}${title} — ${stars}`,
        subtitle: subtitle?.slice(0, 80) + (subtitle?.length > 80 ? '…' : ''),
      }
    },
  },
})
