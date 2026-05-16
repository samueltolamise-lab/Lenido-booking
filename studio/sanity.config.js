import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './schemas'

export default defineConfig({
  name: 'lenido-studio',
  title: 'Le Nido — Content Studio',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'YOUR_PROJECT_ID',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Le Nido Content')
          .items([
            // Singleton: Site Settings
            S.listItem()
              .title('⚙️  Site Settings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
              ),

            S.divider(),

            // Properties list
            S.listItem()
              .title('🏠 Properties')
              .schemaType('property')
              .child(S.documentTypeList('property').title('Properties')),

            // Reviews list
            S.listItem()
              .title('⭐ Reviews')
              .schemaType('review')
              .child(S.documentTypeList('review').title('Guest Reviews')),
          ]),
    }),

    visionTool(), // GROQ query explorer — useful for debugging
  ],

  schema: {
    types: schemaTypes,
  },
})
