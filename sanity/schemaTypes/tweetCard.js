import {defineArrayMember, defineField, defineType} from 'sanity'

export const tweetCard = defineType({
  name: 'tweetCard',
  title: 'Card de Tweet',
  type: 'document',
  fields: [
    defineField({
      name: 'titulo',
      title: 'Titulo',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'url',
      description: 'Cole a URL publica do tweet/X post. Nao ha integracao automatica com API.'
    }),
    defineField({
      name: 'autorNome',
      title: 'Nome do autor',
      type: 'string'
    }),
    defineField({
      name: 'autorHandle',
      title: 'Handle do autor',
      type: 'string',
      description: 'Exemplo: @tabeladode3'
    }),
    defineField({
      name: 'texto',
      title: 'Texto',
      type: 'text',
      rows: 5
    }),
    defineField({
      name: 'data',
      title: 'Data',
      type: 'date'
    }),
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
    })
  ],
  preview: {
    select: {
      title: 'titulo',
      handle: 'autorHandle'
    },
    prepare({title, handle}) {
      return {
        title: title || 'Tweet sem titulo',
        subtitle: handle || 'Sem handle'
      }
    }
  }
})
