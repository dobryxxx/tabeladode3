import {defineField, defineType} from 'sanity'

export const author = defineType({
  name: 'author',
  title: 'Autor',
  type: 'document',
  fields: [
    defineField({
      name: 'nome',
      title: 'Nome',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'nome', maxLength: 96},
      validation: (Rule) => Rule.required()
    }),
    defineField({name: 'foto', title: 'Foto', type: 'imageWithAlt'}),
    defineField({name: 'bio', title: 'Bio curta', type: 'text', rows: 3}),
    defineField({name: 'funcao', title: 'Cargo/função', type: 'string'}),
    defineField({
      name: 'redes',
      title: 'Links sociais',
      type: 'array',
      of: [{type: 'socialLink'}]
    })
  ],
  preview: {
    select: {
      title: 'nome',
      subtitle: 'funcao',
      media: 'foto'
    }
  }
})
