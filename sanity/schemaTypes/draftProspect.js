import {defineArrayMember, defineField, defineType} from 'sanity'

export const draftProspect = defineType({
  name: 'draftProspect',
  title: 'Prospecto do Draft',
  type: 'document',
  groups: [
    {name: 'identidade', title: 'Identidade', default: true},
    {name: 'ranking', title: 'Ranking'},
    {name: 'scouting', title: 'Scouting'}
  ],
  fields: [
    defineField({name: 'nome', title: 'Nome do jogador', type: 'string', group: 'identidade', validation: (Rule) => Rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', group: 'identidade', options: {source: 'nome', maxLength: 100}, validation: (Rule) => Rule.required()}),
    defineField({name: 'foto', title: 'Foto do jogador', type: 'imageWithAlt', group: 'identidade'}),
    defineField({name: 'imageUrl', title: 'URL da foto migrada', type: 'url', group: 'identidade'}),
    defineField({name: 'localImagePath', title: 'Caminho local da foto', type: 'string', group: 'identidade'}),
    defineField({name: 'rankingGeral', title: 'Ranking geral', type: 'number', group: 'ranking', validation: (Rule) => Rule.required().min(1)}),
    defineField({name: 'tier', title: 'Tier', type: 'string', group: 'ranking'}),
    defineField({name: 'posicao', title: 'Posição', type: 'string', group: 'identidade'}),
    defineField({name: 'time', title: 'Time / universidade / liga', type: 'string', group: 'identidade'}),
    defineField({name: 'idade', title: 'Idade', type: 'string', group: 'identidade'}),
    defineField({name: 'altura', title: 'Altura', type: 'string', group: 'identidade'}),
    defineField({name: 'peso', title: 'Peso', type: 'string', group: 'identidade'}),
    defineField({name: 'pais', title: 'País', type: 'string', group: 'identidade'}),
    defineField({name: 'envergadura', title: 'Envergadura', type: 'string', group: 'identidade'}),
    defineField({name: 'classeDraft', title: 'Classe do draft/ano', type: 'string', group: 'ranking', initialValue: '2026'}),
    defineField({name: 'arquetipoDefensivo', title: 'Arquétipo defensivo', type: 'string', group: 'scouting'}),
    defineField({name: 'arquetipoOfensivo', title: 'Arquétipo ofensivo', type: 'string', group: 'scouting'}),
    defineField({name: 'motivoEscolha', title: 'Por que vale a pena uma escolha?', type: 'text', rows: 4, group: 'scouting'}),
    defineField({name: 'espelho', title: 'Espelho', type: 'string', group: 'scouting'}),
    defineField({name: 'tetoPiso', title: 'Teto vs piso', type: 'text', rows: 3, group: 'scouting'}),
    defineField({name: 'pontosFortes', title: 'Pontos fortes', type: 'array', group: 'scouting', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'pontosFracos', title: 'Pontos fracos', type: 'array', group: 'scouting', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'comparacao', title: 'Comparação', type: 'string', group: 'scouting'}),
    defineField({name: 'teto', title: 'Teto', type: 'string', group: 'scouting'}),
    defineField({name: 'piso', title: 'Piso', type: 'string', group: 'scouting'}),
    defineField({name: 'funcaoProjetada', title: 'Função projetada', type: 'string', group: 'scouting'}),
    defineField({name: 'encaixes', title: 'Melhores encaixes', type: 'array', group: 'scouting', of: [defineArrayMember({type: 'string'})]}),
    defineField({name: 'stats', title: 'Estatísticas', type: 'text', rows: 3, group: 'scouting'}),
    defineField({name: 'observacoes', title: 'Observações', type: 'text', rows: 3, group: 'scouting'}),
    defineField({name: 'resumo', title: 'Resumo/scouting curto', type: 'text', rows: 3, group: 'scouting'}),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      group: 'scouting',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'}
    }),
    defineField({name: 'destaqueGuia', title: 'Destaque no Guia', type: 'boolean', group: 'ranking', initialValue: false}),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      group: 'ranking',
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
    {title: 'Ranking geral', name: 'rankingAsc', by: [{field: 'rankingGeral', direction: 'asc'}]},
    {title: 'Nome', name: 'nomeAsc', by: [{field: 'nome', direction: 'asc'}]}
  ],
  preview: {
    select: {title: 'nome', rank: 'rankingGeral', posicao: 'posicao', media: 'foto'},
    prepare({title, rank, posicao, media}) {
      return {title: rank ? `#${rank} ${title}` : title, subtitle: posicao || 'Sem posição', media}
    }
  }
})
