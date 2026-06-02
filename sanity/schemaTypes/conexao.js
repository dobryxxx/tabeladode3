import {defineField, defineType} from 'sanity'

const tiposConectaveis = [
  {type: 'post'},
  {type: 'draftProspect'},
  {type: 'glossaryTerm'},
  {type: 'ranking'},
  {type: 'tip'},
  {type: 'tweetCard'}
]

export const conexao = defineType({
  name: 'conexao',
  title: 'Conexao editorial',
  type: 'document',
  fields: [
    defineField({
      name: 'de',
      title: 'De',
      type: 'reference',
      to: tiposConectaveis,
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'para',
      title: 'Para',
      type: 'reference',
      to: tiposConectaveis,
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'descricao',
      title: 'Descricao',
      type: 'string',
      validation: (Rule) => Rule.max(140)
    }),
    defineField({
      name: 'peso',
      title: 'Peso',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.min(1).max(5)
    })
  ],
  preview: {
    select: {
      dePost: 'de.titulo',
      deTip: 'de.title',
      deProspect: 'de.nome',
      deGlossario: 'de.termo',
      paraPost: 'para.titulo',
      paraTip: 'para.title',
      paraProspect: 'para.nome',
      paraGlossario: 'para.termo',
      peso: 'peso'
    },
    prepare(selection) {
      const de = selection.dePost || selection.deTip || selection.deProspect || selection.deGlossario || 'Origem'
      const para = selection.paraPost || selection.paraTip || selection.paraProspect || selection.paraGlossario || 'Destino'

      return {
        title: `${de} \u2192 ${para}`,
        subtitle: selection.peso ? `Peso ${selection.peso}` : undefined
      }
    }
  }
})
