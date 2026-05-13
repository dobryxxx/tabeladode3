import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes/index.js'
import {deskStructure} from './structure/deskStructure.js'

export default defineConfig({
  name: 'default',
  title: 'Tabelado de 3',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'eaeyiq4k',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',
  plugins: [
    structureTool({structure: deskStructure}),
    visionTool()
  ],
  schema: {
    types: schemaTypes
  }
})
