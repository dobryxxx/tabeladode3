import {defineArrayMember, defineField, defineType} from 'sanity'

export const tip = defineType({
  name: 'tip',
  title: 'Dica',
  type: 'document',
  groups: [
    {name: 'conteudo', title: 'Conteudo', default: true},
    {name: 'link', title: 'Link e imagem'},
    {name: 'editorial', title: 'Organizacao'}
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Titulo',
      type: 'string',
      group: 'conteudo',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'conteudo',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'excerpt',
      title: 'Resumo',
      type: 'text',
      rows: 3,
      group: 'conteudo',
      description: 'Descricao curta da dica para aparecer nos cards.'
    }),
    defineField({
      name: 'category',
      title: 'Categoria',
      type: 'string',
      group: 'editorial',
      options: {
        list: [
          {title: 'Tecnica', value: 'Tecnica'},
          {title: 'Treino', value: 'Treino'},
          {title: 'Estudos', value: 'Estudos'},
          {title: 'Videos', value: 'Videos'},
          {title: 'Materiais', value: 'Materiais'},
          {title: 'Ferramentas', value: 'Ferramentas'},
          {title: 'Leitura', value: 'Leitura'},
          {title: 'Draft', value: 'Draft'},
          {title: 'NBA', value: 'NBA'},
          {title: 'Geral', value: 'Geral'}
        ],
        layout: 'dropdown'
      },
      initialValue: 'Geral'
    }),
    defineField({
      name: 'mainImage',
      title: 'Imagem principal',
      type: 'imageWithAlt',
      group: 'link'
    }),
    defineField({
      name: 'imageUrl',
      title: 'URL da imagem',
      type: 'url',
      group: 'link',
      description: 'Opcional: use quando a imagem ainda estiver hospedada fora do Sanity.'
    }),
    defineField({
      name: 'localImagePath',
      title: 'Caminho local da imagem',
      type: 'string',
      group: 'link',
      description: 'Opcional: caminho como img/... ou assets/uploads/... para compatibilidade.'
    }),
    defineField({
      name: 'externalUrl',
      title: 'Link externo',
      type: 'url',
      group: 'link',
      description: 'Cole aqui o link que sera aberto quando o visitante clicar na dica.'
    }),
    defineField({
      name: 'linkLabel',
      title: 'Texto do botao/link',
      type: 'string',
      group: 'link',
      description: 'Ex.: Acessar, Ver video, Ler material, Abrir link.',
      initialValue: 'Acessar dica'
    }),
    defineField({
      name: 'body',
      title: 'Descricao completa',
      type: 'blockContent',
      group: 'conteudo'
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
      name: 'publishedAt',
      title: 'Data de publicacao',
      type: 'datetime',
      group: 'editorial',
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'featured',
      title: 'Destaque',
      type: 'boolean',
      group: 'editorial',
      description: 'Use para colocar esta dica entre os principais destaques da pagina.',
      initialValue: false
    }),
    defineField({
      name: 'order',
      title: 'Ordem',
      type: 'number',
      group: 'editorial',
      description: 'Use numeros menores para aparecer primeiro.'
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
    })
  ],
  orderings: [
    {
      title: 'Destaques e ordem',
      name: 'featuredOrder',
      by: [
        {field: 'featured', direction: 'desc'},
        {field: 'order', direction: 'asc'},
        {field: 'publishedAt', direction: 'desc'}
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
      category: 'category',
      date: 'publishedAt',
      featured: 'featured',
      media: 'mainImage'
    },
    prepare({title, category, date, featured, media}) {
      const dateLabel = date ? new Date(date).toLocaleDateString('pt-BR') : 'Sem data'
      return {
        title,
        subtitle: `${featured ? 'Destaque | ' : ''}${category || 'Geral'} | ${dateLabel}`,
        media
      }
    }
  }
})
