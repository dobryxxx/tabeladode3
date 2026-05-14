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
    defineField({
      name: 'mostrarGuiaDoDraft',
      title: 'Exibir página Guia do Draft',
      type: 'boolean',
      initialValue: true,
      description: 'Desative para esconder o link e mostrar uma tela de indisponibilidade no site.'
    }),
    defineField({
      name: 'mensagemGuiaOculto',
      title: 'Mensagem quando o Guia estiver oculto',
      type: 'text',
      rows: 2,
      initialValue: 'O Guia do Draft está temporariamente indisponível.'
    }),
    defineField({
      name: 'mostrarRankings',
      title: 'Exibir página Rankings',
      type: 'boolean',
      initialValue: true,
      description: 'Desative para esconder o link e mostrar uma tela de indisponibilidade no site.'
    }),
    defineField({
      name: 'mensagemRankingsOculto',
      title: 'Mensagem quando Rankings estiver oculto',
      type: 'text',
      rows: 2,
      initialValue: 'Os rankings estão temporariamente indisponíveis.'
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

export const draftGuideSettings = defineType({
  name: 'draftGuideSettings',
  title: 'Ordem do Guia do Draft',
  type: 'document',
  fields: [
    defineField({
      name: 'titulo',
      title: 'Título interno',
      type: 'string',
      initialValue: 'Ordem do Guia do Draft',
      validation: (Rule) => Rule.required()
    }),
    defineField({
      name: 'draftBoard',
      title: 'Prospectos em ordem',
      type: 'array',
      description: 'Arraste os prospectos para alterar a ordem exibida no site. A posição # usa esta ordem como fonte principal.',
      of: [defineArrayMember({type: 'draftBoardItem'})]
    })
  ],
  preview: {
    prepare() {
      return {title: 'Ordem do Guia do Draft'}
    }
  }
})
