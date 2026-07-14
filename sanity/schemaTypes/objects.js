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
        {title: 'ParÃ¡grafo', value: 'normal'},
        {title: 'TÃ­tulo 2', value: 'h2'},
        {title: 'TÃ­tulo 3', value: 'h3'},
        {title: 'CitaÃ§Ã£o', value: 'blockquote'}
      ],
      marks: {
        decorators: [
          {title: 'Negrito', value: 'strong'},
          {title: 'ItÃ¡lico', value: 'em'}
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
      description: 'Cole a URL pÃºblica do tweet/X post citado no texto.',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'comentario',
      title: 'ComentÃ¡rio editorial',
      type: 'text',
      rows: 3,
      description: 'Texto opcional para contextualizar o tweet dentro da matÃ©ria.'
    }),
    defineField({
      name: 'textoAlternativo',
      title: 'Texto alternativo',
      type: 'string',
      description: 'Resumo curto para acessibilidade ou caso o embed externo nÃ£o carregue.'
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
      name: 'ordemPreview',
      title: 'PosiÃ§Ã£o na lista',
      type: 'number',
      readOnly: true,
      description: 'Preenchido automaticamente pelo seed. Serve para deixar a lista legÃ­vel no Studio.'
    }),
    defineField({
      name: 'nomeSnapshot',
      title: 'Nome para preview',
      type: 'string',
      readOnly: true
    }),
    defineField({
      name: 'posicaoSnapshot',
      title: 'PosiÃ§Ã£o do jogador para preview',
      type: 'string',
      readOnly: true
    }),
    defineField({
      name: 'rankingSnapshot',
      title: 'Ranking original para preview',
      type: 'number',
      readOnly: true
    }),
    defineField({
      name: 'tierSnapshot',
      title: 'Tier para preview',
      type: 'string',
      readOnly: true
    }),
    defineField({
      name: 'fotoSnapshotUrl',
      title: 'URL da foto para preview',
      type: 'url',
      readOnly: true
    }),
    defineField({
      name: 'prospecto',
      title: 'Prospecto',
      type: 'reference',
      to: [{type: 'draftProspect'}],
      options: {
        filter: ({document}) => {
          const id = String(document?._id || '').replace(/^drafts\./, '')
          const year = id.match(/(2025|2026|2027)$/)?.[1] || '2026'
          return {filter: 'string(classeDraft) == $year', params: {year}}
        }
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'observacao',
      title: 'ObservaÃ§Ã£o interna',
      type: 'string',
      description: 'Opcional. NÃ£o aparece no site; serve sÃ³ para organizaÃ§Ã£o editorial.'
    })
  ],
  preview: {
    select: {
      ordem: 'ordemPreview',
      nome: 'nomeSnapshot',
      posicao: 'posicaoSnapshot',
      ranking: 'rankingSnapshot',
      tier: 'tierSnapshot',
      fotoUrl: 'fotoSnapshotUrl'
    },
    prepare({ordem, nome, posicao, ranking, tier}) {
      return {
        title: `${ordem ? `#${ordem} - ` : ''}${nome || 'Prospecto sem nome'}`,
        subtitle: [
          posicao,
          tier,
          ranking ? `Ranking original #${ranking}` : null
        ].filter(Boolean).join(' / ') || 'Sem posicao cadastrada'
      }
    }
  }
})

export const draftReviewPick = defineType({
  name: 'draftReviewPick',
  title: 'Escolha analisada',
  type: 'object',
  fields: [
    defineField({
      name: 'numeroEscolha',
      title: 'Numero da escolha',
      type: 'number',
      validation: (Rule) => Rule.required().integer().min(1)
    }),
    defineField({
      name: 'rodada',
      title: 'Rodada',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.required().integer().min(1).max(2)
    }),
    defineField({
      name: 'time',
      title: 'Franquia que fez a escolha',
      type: 'reference',
      to: [{type: 'nbaTeam'}],
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'prospecto',
      title: 'Jogador escolhido',
      type: 'reference',
      to: [{type: 'draftProspect'}],
      options: {
        filter: ({document}) => {
          const id = String(document?._id || '').replace(/^drafts\./, '')
          const year = id.match(/(2025|2026|2027)$/)?.[1] || '2026'
          return {filter: 'string(classeDraft) == $year', params: {year}}
        }
      },
      description: 'Pode ficar vazio enquanto a escolha ainda nao foi anunciada.'
    }),
    defineField({
      name: 'chamada',
      title: 'Veredito curto',
      type: 'string',
      description: 'Uma frase curta que resume a leitura da escolha.',
      validation: (Rule) => Rule.max(120)
    }),
    defineField({
      name: 'opiniao',
      title: 'Review da escolha',
      type: 'text',
      rows: 7,
      description: 'Analise editorial que aparece em destaque na pagina.'
    }),
    defineField({
      name: 'nota',
      title: 'Nota da escolha',
      type: 'number',
      description: 'Nota exibida no card da Inspecao. Se ficar vazio, o site mostra 10.',
      validation: (Rule) => Rule.min(0).max(10)
    })
  ],
  preview: {
    select: {
      numero: 'numeroEscolha',
      time: 'time.nome',
      prospecto: 'prospecto.nome',
      media: 'time.logo'
    },
    prepare({numero, time, prospecto, media}) {
      return {
        title: `${numero ? `${numero}. ` : ''}${time || 'Franquia nao definida'}`,
        subtitle: prospecto || 'Aguardando escolha',
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
      title: 'NÃºmero',
      type: 'string',
      description: 'Ex.: 01, 02, 03.'
    }),
    defineField({
      name: 'titulo',
      title: 'TÃ­tulo',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'descricao',
      title: 'DescriÃ§Ã£o',
      type: 'text',
      rows: 2
    }),
    defineField({
      name: 'cta',
      title: 'Texto do botÃ£o',
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
      title: 'PosiÃ§Ã£o',
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
      title: 'DescriÃ§Ã£o/comentÃ¡rio',
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
      title: 'PosiÃ§Ã£o em quadra',
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
      title: 'PublicaÃ§Ã£o relacionada',
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
