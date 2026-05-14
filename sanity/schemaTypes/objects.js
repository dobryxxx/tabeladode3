import {defineArrayMember, defineField, defineType} from 'sanity'

export const imageWithAlt = defineType({
  name: 'imageWithAlt',
  title: 'Imagem com texto alternativo',
  type: 'image',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Texto alternativo',
      type: 'string',
      description: 'Descreva a imagem para acessibilidade e SEO.'
    })
  ]
})

export const blockContent = defineType({
  name: 'blockContent',
  title: 'Texto rico',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        {title: 'Parágrafo', value: 'normal'},
        {title: 'Título 2', value: 'h2'},
        {title: 'Título 3', value: 'h3'},
        {title: 'Citação', value: 'blockquote'}
      ],
      marks: {
        decorators: [
          {title: 'Negrito', value: 'strong'},
          {title: 'Itálico', value: 'em'}
        ],
        annotations: [
          {
            name: 'link',
            title: 'Link',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'URL',
                type: 'url'
              })
            ]
          }
        ]
      }
    }),
    defineArrayMember({
      type: 'imageWithAlt'
    }),
    defineArrayMember({
      type: 'tweetEmbed'
    })
  ]
})

export const tweetEmbed = defineType({
  name: 'tweetEmbed',
  title: 'Tweet incorporado',
  type: 'object',
  fields: [
    defineField({
      name: 'tweetUrl',
      title: 'URL do tweet',
      type: 'url',
      description: 'Cole a URL pública do tweet/X post citado no texto.',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'comentario',
      title: 'Comentário editorial',
      type: 'text',
      rows: 3,
      description: 'Texto opcional para contextualizar o tweet dentro da matéria.'
    }),
    defineField({
      name: 'textoAlternativo',
      title: 'Texto alternativo',
      type: 'string',
      description: 'Resumo curto para acessibilidade ou caso o embed externo não carregue.'
    })
  ],
  preview: {
    select: {
      title: 'comentario',
      subtitle: 'tweetUrl'
    },
    prepare({title, subtitle}) {
      return {
        title: title || 'Tweet citado',
        subtitle
      }
    }
  }
})

export const draftBoardItem = defineType({
  name: 'draftBoardItem',
  title: 'Prospecto ordenado',
  type: 'object',
  fields: [
    defineField({
      name: 'prospecto',
      title: 'Prospecto',
      type: 'reference',
      to: [{type: 'draftProspect'}],
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'observacao',
      title: 'Observação interna',
      type: 'string',
      description: 'Opcional. Não aparece no site; serve só para organização editorial.'
    })
  ],
  preview: {
    select: {
      title: 'prospecto.nome',
      rank: 'prospecto.rankingGeral',
      position: 'prospecto.posicao',
      media: 'prospecto.foto'
    },
    prepare({title, rank, position, media}) {
      return {
        title: title || 'Prospecto sem nome',
        subtitle: [rank ? `#${rank}` : null, position].filter(Boolean).join(' · '),
        media
      }
    }
  }
})

export const homeCard = defineType({
  name: 'homeCard',
  title: 'Card da home',
  type: 'object',
  fields: [
    defineField({
      name: 'numero',
      title: 'Número',
      type: 'string',
      description: 'Ex.: 01, 02, 03.'
    }),
    defineField({
      name: 'titulo',
      title: 'Título',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'descricao',
      title: 'Descrição',
      type: 'text',
      rows: 2
    }),
    defineField({
      name: 'cta',
      title: 'Texto do botão',
      type: 'string',
      initialValue: 'Entrar'
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'string',
      description: 'Ex.: por-escrito.html, guia-do-draft.html ou uma URL completa.',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'ordem',
      title: 'Ordem',
      type: 'number',
      validation: (Rule) => Rule.min(1)
    })
  ],
  preview: {
    select: {
      title: 'titulo',
      subtitle: 'link'
    }
  }
})

export const socialLink = defineType({
  name: 'socialLink',
  title: 'Rede social',
  type: 'object',
  fields: [
    defineField({name: 'nome', title: 'Nome', type: 'string'}),
    defineField({name: 'url', title: 'URL', type: 'url'})
  ]
})

export const rankingItem = defineType({
  name: 'rankingItem',
  title: 'Item do ranking',
  type: 'object',
  fields: [
    defineField({
      name: 'posicao',
      title: 'Posição',
      type: 'number',
      validation: (Rule) => Rule.required().min(1)
    }),
    defineField({
      name: 'nome',
      title: 'Nome',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'imagem',
      title: 'Imagem',
      type: 'imageWithAlt'
    }),
    defineField({
      name: 'imageUrl',
      title: 'URL da imagem migrada',
      type: 'url'
    }),
    defineField({
      name: 'localImagePath',
      title: 'Caminho local da imagem',
      type: 'string'
    }),
    defineField({
      name: 'descricao',
      title: 'Descrição/comentário',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'tier',
      title: 'Tier/categoria',
      type: 'string'
    }),
    defineField({
      name: 'nota',
      title: 'Nota/estrelas',
      type: 'number',
      validation: (Rule) => Rule.min(0).max(5)
    }),
    defineField({
      name: 'posicaoQuadra',
      title: 'Posição em quadra',
      type: 'string'
    }),
    defineField({
      name: 'time',
      title: 'Time/programa',
      type: 'string'
    }),
    defineField({
      name: 'alturaNascimento',
      title: 'Altura/nascimento',
      type: 'string'
    }),
    defineField({
      name: 'prospecto',
      title: 'Prospecto relacionado',
      type: 'reference',
      to: [{type: 'draftProspect'}]
    }),
    defineField({
      name: 'postRelacionado',
      title: 'Publicação relacionada',
      type: 'reference',
      to: [{type: 'post'}]
    }),
    defineField({
      name: 'linkRelacionado',
      title: 'Link relacionado',
      type: 'url'
    })
  ],
  preview: {
    select: {
      title: 'nome',
      subtitle: 'tier',
      media: 'imagem'
    },
    prepare({title, subtitle, media}) {
      return {title, subtitle, media}
    }
  }
})
