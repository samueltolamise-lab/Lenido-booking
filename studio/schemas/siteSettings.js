import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',

  // Prevent creating multiple site settings documents
  __experimental_actions: ['update', 'publish'],

  fields: [
    // ── Brand ──────────────────────────────────────
    defineField({
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      initialValue: 'Le Nido by Bondd',
    }),

    defineField({
      name: 'tagline',
      title: 'Hero Tagline',
      type: 'string',
      description: 'Large headline in the hero. Line break with a newline.',
      initialValue: 'Feel at home, wherever you land.',
    }),

    defineField({
      name: 'heroSubtitle',
      title: 'Hero Subtitle',
      type: 'text',
      rows: 2,
      initialValue: 'Curated serviced apartments in Lekki for business travellers, diaspora returnees, and Lagos explorers.',
    }),

    defineField({
      name: 'heroImage',
      title: 'Hero Background Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'Full-width background photo behind the hero headline. Landscape, high-resolution.',
    }),

    // ── Contact ──────────────────────────────────────
    defineField({
      name: 'whatsappNumber',
      title: 'WhatsApp Number',
      type: 'string',
      description: 'International format without +. e.g. 2348012345678',
      initialValue: '2348000000000',
    }),

    defineField({
      name: 'whatsappGreeting',
      title: 'WhatsApp Pre-filled Message',
      type: 'string',
      initialValue: "Hi, I'd like to enquire about a stay at Le Nido",
    }),

    defineField({
      name: 'email',
      title: 'Contact Email',
      type: 'string',
      description: 'Optional — shown in the footer if provided.',
    }),

    // ── Trust Bar ──────────────────────────────────────
    defineField({
      name: 'trustBar',
      title: 'Trust Bar Stats',
      type: 'array',
      description: 'The 4 stat boxes shown under the hero. Keep it to exactly 4.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'value', title: 'Value', type: 'string', description: 'e.g. "200+" or "4.9 ★"' }),
            defineField({ name: 'label', title: 'Label', type: 'string', description: 'e.g. "Stays completed"' }),
          ],
          preview: {
            select: { title: 'value', subtitle: 'label' },
          },
        },
      ],
      validation: (R) => R.max(4),
    }),

    // ── Perks ──────────────────────────────────────
    defineField({
      name: 'perks',
      title: '"Why Book Direct?" Perks',
      type: 'array',
      description: 'The feature cards in the dark green section.',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'icon',        title: 'Emoji Icon',   type: 'string', description: 'e.g. 💸' }),
            defineField({ name: 'title',       title: 'Title',        type: 'string' }),
            defineField({ name: 'description', title: 'Description',  type: 'text', rows: 2 }),
          ],
          preview: {
            select: { title: 'title', subtitle: 'description' },
            prepare({ title, subtitle }) {
              return { title, subtitle: subtitle?.slice(0, 60) }
            },
          },
        },
      ],
    }),
  ],

  preview: {
    prepare() {
      return { title: '⚙️  Site Settings' }
    },
  },
})
