import {defineArrayMember, defineField, defineType} from 'sanity'

export const ranking = defineType({
  name: 'ranking',
  title: 'Ranking',
  type: 'document',
  fields: [
    defineField({name: 'titulo', title: 'Título do ranking', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'titulo', maxLength: 96}, validation: (Rule) => Rule.required()}),
    defineField({name: 'descricao', title: 'Descrição', type: 'text', rows: 3}),
    defineField({name: 'capa', title: 'Imagem/capa', type: 'imageWithAlt'}),
    defineField({name: 'imageUrl', title: 'URL da capa migrada', type: 'url'}),
    defineField({name: 'localImagePath', title: 'Caminho local da capa', type: 'string'}),
    defineField({
      name: 'categoria',
      title: 'Categoria do ranking',
      type: 'string',
      options: {
        list: [
          {title: 'Masculino', value: 'masculino'},
          {title: 'Feminino', value: 'feminino'},
          {title: 'Draft', value: 'draft'},
          {title: 'Editorial livre', value: 'editorial'}
        ]
      },
      initialValue: 'masculino'
    }),
    defineField({name: 'data', title: 'Data', type: 'date'}),
    defineField({name: 'autor', title: 'Autor', type: 'reference', to: [{type: 'author'}]}),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'}
    }),
    defineField({
      name: 'relacionados',
      title: 'Conteúdos relacionados (Colmeia)',
      type: 'array',
      description: 'Ligue este conteúdo a outros que se relacionam. Eles aparecem conectados na Colmeia.',
      of: [defineArrayMember({type: 'reference', to: [{type: 'post'}, {type: 'draftProspect'}, {type: 'glossaryTerm'}, {type: 'ranking'}, {type: 'tip'}, {type: 'tweetCard'}]})]
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Publicado', value: 'publicado'},
          {title: 'Rascunho/oculto', value: 'rascunho'}
        ],
        layout: 'radio'
      },
      initialValue: 'publicado'
    }),
    defineField({name: 'destaqueHome', title: 'Destaque na home', type: 'boolean', initialValue: false}),
    defineField({
      name: 'itens',
      title: 'Itens do ranking',
      type: 'array',
      description: 'Arraste os itens para reorganizar ou ajuste o campo Posição.',
      of: [{type: 'rankingItem'}],
      validation: (Rule) => Rule.required().min(1)
    })
  ],
  orderings: [
    {title: 'Data', name: 'dataDesc', by: [{field: 'data', direction: 'desc'}]}
  ],
  preview: {
    select: {title: 'titulo', subtitle: 'categoria', media: 'capa'}
  }
})
