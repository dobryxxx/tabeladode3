import {defineArrayMember, defineField, defineType} from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Publicação',
  type: 'document',
  groups: [
    {name: 'conteudo', title: 'Conteúdo', default: true},
    {name: 'editorial', title: 'Editorial'},
    {name: 'home', title: 'Destaques'}
  ],
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      group: 'conteudo',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'conteudo',
      options: {source: 'titulo', maxLength: 120},
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'resumo',
      title: 'Resumo',
      type: 'text',
      rows: 3,
      group: 'conteudo',
      description: 'Resumo curto usado nos cards, hero e topo da página do artigo.',
      validation: (Rule) => Rule.max(280)
    }),
    defineField({
      name: 'imagem',
      title: 'Imagem principal',
      type: 'imageWithAlt',
      group: 'conteudo'
    }),
    defineField({
      name: 'imageUrl',
      title: 'URL da imagem migrada',
      type: 'url',
      group: 'conteudo',
      description: 'Uso temporário para imagens externas migradas. Depois pode ser substituída por asset do Sanity.'
    }),
    defineField({
      name: 'localImagePath',
      title: 'Caminho local da imagem',
      type: 'string',
      group: 'conteudo',
      description: 'Uso temporário para caminhos locais, como img/...'
    }),
    defineField({
      name: 'categoria',
      title: 'Categoria',
      type: 'reference',
      to: [{type: 'category'}],
      group: 'editorial'
    }),
    defineField({
      name: 'autor',
      title: 'Autor',
      type: 'reference',
      to: [{type: 'author'}],
      group: 'editorial'
    }),
    defineField({
      name: 'dataPublicacao',
      title: 'Data de publicação',
      type: 'datetime',
      group: 'editorial',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'tempoLeitura',
      title: 'Tempo de leitura',
      type: 'string',
      group: 'editorial',
      initialValue: '5 min de leitura'
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'editorial',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'}
    }),
    defineField({
      name: 'destaqueHome',
      title: 'Destaque na home/Por Escrito',
      type: 'boolean',
      group: 'home',
      initialValue: false
    }),
    defineField({
      name: 'posicaoDestaque',
      title: 'Posição de destaque',
      type: 'string',
      group: 'home',
      description: 'Principal = hero grande. Lateral = cards menores do topo.',
      options: {
        list: [
          {title: 'Sem destaque', value: 'none'},
          {title: 'Principal', value: 'principal'},
          {title: 'Lateral', value: 'lateral'}
        ]
      },
      initialValue: 'none'
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'editorial',
      options: {
        list: [
          {title: 'Publicado', value: 'publicado'},
          {title: 'Rascunho/oculto', value: 'rascunho'}
        ],
        layout: 'radio'
      },
      initialValue: 'publicado'
    }),
    defineField({
      name: 'corpo',
      title: 'Corpo do texto',
      type: 'blockContent',
      group: 'conteudo'
    })
  ],
  orderings: [
    {
      title: 'Mais recentes',
      name: 'dataPublicacaoDesc',
      by: [{field: 'dataPublicacao', direction: 'desc'}]
    }
  ],
  preview: {
    select: {
      title: 'titulo',
      date: 'dataPublicacao',
      media: 'imagem'
    },
    prepare({title, date, media}) {
      return {
        title,
        subtitle: date ? new Date(date).toLocaleDateString('pt-BR') : 'Sem data',
        media
      }
    }
  }
})
