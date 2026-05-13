import {defineArrayMember, defineField, defineType} from 'sanity'

export const homeSettings = defineType({
  name: 'homeSettings',
  title: 'Configurações da Home',
  type: 'document',
  fields: [
    defineField({
      name: 'headline',
      title: 'Headline principal',
      type: 'string',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'subheadline',
      title: 'Subheadline',
      type: 'string'
    }),
    defineField({
      name: 'textoApoio',
      title: 'Texto de apoio',
      type: 'text',
      rows: 3
    }),
    defineField({
      name: 'cards',
      title: 'Cards principais da home',
      type: 'array',
      of: [defineArrayMember({type: 'homeCard'})],
      validation: (Rule) => Rule.min(1).max(8)
    }),
    defineField({
      name: 'postDestaque',
      title: 'Post em destaque',
      type: 'reference',
      to: [{type: 'post'}]
    }),
    defineField({
      name: 'rankingDestaque',
      title: 'Ranking em destaque',
      type: 'reference',
      to: [{type: 'ranking'}]
    }),
    defineField({
      name: 'guiaDraftDestaque',
      title: 'Prospecto/guia em destaque',
      type: 'reference',
      to: [{type: 'draftProspect'}]
    }),
    defineField({
      name: 'botaoPrincipal',
      title: 'Botão principal',
      type: 'homeCard'
    }),
    defineField({
      name: 'botaoSecundario',
      title: 'Botão secundário',
      type: 'homeCard'
    })
  ],
  preview: {
    prepare() {
      return {title: 'Configurações da Home'}
    }
  }
})

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Configurações gerais do site',
  type: 'document',
  fields: [
    defineField({name: 'nomeSite', title: 'Nome do site', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'descricao', title: 'Descrição', type: 'text', rows: 3}),
    defineField({name: 'logo', title: 'Logo', type: 'imageWithAlt'}),
    defineField({
      name: 'linksPrincipais',
      title: 'Links principais',
      type: 'array',
      of: [defineArrayMember({type: 'homeCard'})]
    }),
    defineField({name: 'emailContato', title: 'E-mail de contato', type: 'email'}),
    defineField({
      name: 'redesSociais',
      title: 'Redes sociais',
      type: 'array',
      of: [defineArrayMember({type: 'socialLink'})]
    })
  ],
  preview: {
    select: {title: 'nomeSite', subtitle: 'emailContato', media: 'logo'}
  }
})
