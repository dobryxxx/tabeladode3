import {defineArrayMember, defineField, defineType} from 'sanity'

export const glossaryTerm = defineType({
  name: 'glossaryTerm',
  title: 'Termo do Glossário',
  type: 'document',
  fields: [
    defineField({name: 'termo', title: 'Termo', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'termo', maxLength: 96}, validation: (Rule) => Rule.required()}),
    defineField({name: 'definicaoCurta', title: 'Definição curta', type: 'text', rows: 2, validation: (Rule) => Rule.required()}),
    defineField({name: 'explicacaoCompleta', title: 'Explicação completa', type: 'text', rows: 5}),
    defineField({
      name: 'categoria',
      title: 'Categoria',
      type: 'string',
      options: {
        list: [
          'Fundamentos',
          'Estatísticas',
          'Táticas',
          'Regras',
          'Posições',
          'Arremessos',
          'Defesa',
          'Ataque',
          'Draft/Scouting',
          'Termos avançados'
        ]
      },
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'nivel',
      title: 'Nível',
      type: 'string',
      options: {
        list: [
          {title: 'Básico', value: 'basico'},
          {title: 'Intermediário', value: 'intermediario'},
          {title: 'Avançado', value: 'avancado'}
        ],
        layout: 'radio'
      },
      initialValue: 'basico'
    }),
    defineField({name: 'tags', title: 'Tags', type: 'array', of: [defineArrayMember({type: 'string'})], options: {layout: 'tags'}}),
    defineField({name: 'exemploUso', title: 'Exemplo de uso', type: 'text', rows: 2}),
    defineField({name: 'destaque', title: 'Destaque', type: 'boolean', initialValue: false}),
    defineField({name: 'ordem', title: 'Ordem', type: 'number'}),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          {title: 'Publicado', value: 'publicado'},
          {title: 'Oculto', value: 'oculto'}
        ],
        layout: 'radio'
      },
      initialValue: 'publicado'
    })
  ],
  orderings: [
    {title: 'Termo A-Z', name: 'termoAsc', by: [{field: 'termo', direction: 'asc'}]},
    {title: 'Ordem editorial', name: 'ordemAsc', by: [{field: 'ordem', direction: 'asc'}]}
  ],
  preview: {
    select: {title: 'termo', subtitle: 'categoria'}
  }
})
