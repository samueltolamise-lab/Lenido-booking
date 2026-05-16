import { defineField, defineType } from 'sanity'

export const property = defineType({
  name: 'property',
  title: 'Property',
  type: 'document',

  fields: [
    defineField({
      name: 'name',
      title: 'Property Name',
      type: 'string',
      description: 'e.g. Le Nido Lekki 01',
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Property ID (slug)',
      type: 'slug',
      description: 'Used in URLs and the booking system. e.g. lekki-01',
      options: { source: 'name', maxLength: 64 },
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'active',
      title: 'Show on website',
      type: 'boolean',
      description: 'Uncheck to hide this property without deleting it.',
      initialValue: true,
    }),

    defineField({
      name: 'type',
      title: 'Unit Type',
      type: 'string',
      options: {
        list: [
          { title: 'Studio',      value: 'Studio' },
          { title: '1 Bedroom',   value: '1 Bedroom' },
          { title: '2 Bedrooms',  value: '2 Bedrooms' },
          { title: '3 Bedrooms',  value: '3 Bedrooms' },
        ],
        layout: 'radio',
      },
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g. Lekki Phase 1, Lagos',
      validation: (R) => R.required(),
    }),

    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Short, punchy subtitle shown on the property card.',
      validation: (R) => R.required().max(80),
    }),

    defineField({
      name: 'description',
      title: 'Full Description',
      type: 'text',
      rows: 5,
      description: 'Shown on the property detail page.',
      validation: (R) => R.required(),
    }),

    // Specs
    defineField({
      name: 'bedrooms',
      title: 'Bedrooms',
      type: 'number',
      description: 'Use 0 for a studio.',
      validation: (R) => R.required().min(0),
      initialValue: 0,
    }),

    defineField({
      name: 'bathrooms',
      title: 'Bathrooms',
      type: 'number',
      validation: (R) => R.required().min(1),
      initialValue: 1,
    }),

    defineField({
      name: 'maxGuests',
      title: 'Max Guests',
      type: 'number',
      validation: (R) => R.required().min(1),
      initialValue: 2,
    }),

    // Amenities
    defineField({
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Add one amenity per item. e.g. "High-Speed WiFi"',
      options: { layout: 'tags' },
    }),

    // Pricing
    defineField({
      name: 'pricing',
      title: 'Pricing (NGN)',
      type: 'object',
      fields: [
        defineField({
          name: 'night',
          title: 'Nightly Rate (₦)',
          type: 'number',
          validation: (R) => R.required().min(0),
        }),
        defineField({
          name: 'week',
          title: 'Weekly Rate (₦)',
          type: 'number',
          description: 'Optional — leave blank to hide.',
        }),
        defineField({
          name: 'month',
          title: 'Monthly Rate (₦)',
          type: 'number',
          description: 'Optional — leave blank to hide.',
        }),
      ],
    }),

    // Images
    defineField({
      name: 'images',
      title: 'Photos',
      type: 'array',
      of: [
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'e.g. "Living room" — optional but helpful for accessibility.',
            }),
          ],
        },
      ],
      description: 'First photo is used as the main listing image. Upload in landscape (16:9 preferred).',
      validation: (R) => R.min(1).error('Please upload at least one photo.'),
      options: { layout: 'grid' },
    }),

    // iCal
    defineField({
      name: 'icalUrl',
      title: 'iCal URL (Airbnb / Booking.com sync)',
      type: 'url',
      description: 'Paste your Airbnb or Booking.com iCal export URL here to block already-booked dates.',
    }),
  ],

  preview: {
    select: {
      title: 'name',
      subtitle: 'tagline',
      media: 'images.0',
      active: 'active',
    },
    prepare({ title, subtitle, media, active }) {
      return {
        title: `${active === false ? '🔴 ' : '🟢 '}${title}`,
        subtitle,
        media,
      }
    },
  },
})
