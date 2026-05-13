import {defineField, defineType} from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'Categoria',
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
    defineField({name: 'descricao', title: 'Descrição', type: 'text', rows: 3}),
    defineField({
      name: 'tipo',
      title: 'Usada em',
      type: 'string',
      options: {
        list: [
          {title: 'Blog', value: 'blog'},
          {title: 'Guia do Draft', value: 'draft'},
          {title: 'Rankings', value: 'rankings'},
          {title: 'Glossário', value: 'glossario'},
          {title: 'Geral', value: 'geral'}
        ]
      },
      initialValue: 'geral'
    }),
    defineField({
      name: 'cor',
      title: 'Cor/acento',
      type: 'string',
      description: 'Opcional. Use hexadecimal, por exemplo #BA4E25.'
    })
  ],
  preview: {
    select: {
      title: 'nome',
      subtitle: 'tipo'
    }
  }
})
