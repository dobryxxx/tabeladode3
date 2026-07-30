import {defineArrayMember, defineField, defineType} from 'sanity'
import {filtroConteudosColmeia, tiposConteudoColmeia, validarRelacionados} from './colmeiaRelations.js'
import {ColmeiaRelacionadosInput} from '../components/ColmeiaRelacionadosInput.jsx'

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
      description: 'Fonte oficial das conexoes da Colmeia. Relacione este tweet a artigos ou outros tweets.',
      of: [defineArrayMember({type: 'reference', to: tiposConteudoColmeia, options: filtroConteudosColmeia})],
      components: {input: ColmeiaRelacionadosInput},
      validation: validarRelacionados
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
