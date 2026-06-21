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
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      {
        id: 'draftGuideSettings-year',
        title: 'Ordem do Guia por ano',
        schemaType: 'draftGuideSettings',
        parameters: [{name: 'year', title: 'Ano', type: 'string'}],
        value: ({year}) => ({titulo: `Ordem do Guia do Draft ${year}`})
      },
      {
        id: 'draftReviewSettings-year',
        title: 'Review do Draft por ano',
        schemaType: 'draftReviewSettings',
        parameters: [{name: 'year', title: 'Ano', type: 'string'}],
        value: ({year}) => ({
          titulo: `Review do Draft ${year}`,
          subtitulo: 'Cada escolha, um pitaco.'
        })
      },
      {
        id: 'draftProspect-year',
        title: 'Prospecto por classe',
        schemaType: 'draftProspect',
        parameters: [{name: 'year', title: 'Ano', type: 'string'}],
        value: ({year}) => ({classeDraft: year, status: 'publicado', ocultoNoGuia: false})
      }
    ]
  }
})
