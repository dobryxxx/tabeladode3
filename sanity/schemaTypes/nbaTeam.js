import {defineField, defineType} from 'sanity'

export const nbaTeam = defineType({
  name: 'nbaTeam',
  title: 'Time da NBA',
  type: 'document',
  fields: [
    defineField({
      name: 'nome',
      title: 'Nome do time',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'nome', maxLength: 80},
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'sigla',
      title: 'Sigla',
      type: 'string',
      description: 'Ex.: BOS, LAL, OKC.',
      validation: (Rule) => Rule.max(4)
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'imageWithAlt'
    }),
    defineField({
      name: 'logoUrl',
      title: 'URL da logo',
      type: 'url',
      description: 'Alternativa temporária caso a logo ainda não tenha sido enviada ao Sanity.'
    }),
    defineField({
      name: 'corPrimaria',
      title: 'Cor principal',
      type: 'string',
      description: 'Opcional. Use hexadecimal, por exemplo #552583.'
    }),
    defineField({
      name: 'conferencia',
      title: 'Conferência',
      type: 'string',
      options: {
        list: [
          {title: 'Leste', value: 'Leste'},
          {title: 'Oeste', value: 'Oeste'}
        ],
        layout: 'radio'
      }
    })
  ],
  preview: {
    select: {
      title: 'nome',
      subtitle: 'sigla',
      media: 'logo'
    }
  }
})
