const hiddenTypes = new Set([
  'homeSettings',
  'siteSettings',
  'draftGuideSettings',
  'draftReviewSettings',
  'colmeiaSettings',
  'post',
  'tip',
  'tweetCard',
  'conexao',
  'draftProspect',
  'nbaTeam',
  'ranking',
  'glossaryTerm',
  'category',
  'author'
])

const draftGuideDocument = (S, year) =>
  S.listItem()
    .title('Ordem do Guia')
    .schemaType('draftGuideSettings')
    .child(
      S.document()
        .schemaType('draftGuideSettings')
        .documentId(year === '2026' ? 'draftGuideSettings' : `draftGuideSettings${year}`)
        .initialValueTemplate('draftGuideSettings-year', {year})
        .title(`Ordem do Guia ${year}`)
    )

const draftReviewDocument = (S, year) =>
  S.listItem()
    .title('Review do Draft')
    .schemaType('draftReviewSettings')
    .child(
      S.document()
        .schemaType('draftReviewSettings')
        .documentId(year === '2026' ? 'draftReviewSettings' : `draftReviewSettings${year}`)
        .initialValueTemplate('draftReviewSettings-year', {year})
        .title(`Review do Draft ${year}`)
    )

const draftProspectsList = (S, year) =>
  S.listItem()
    .title('Prospectos')
    .schemaType('draftProspect')
    .child(
      S.documentTypeList('draftProspect')
        .title(`Prospectos do Draft ${year}`)
        .filter('_type == "draftProspect" && string(classeDraft) == $year')
        .params({year})
        .initialValueTemplates([
          S.initialValueTemplateItem('draftProspect-year', {year})
        ])
    )

const draftYearSection = (S, year, hasReview = true) =>
  S.listItem()
    .title(year)
    .child(
      S.list()
        .title(`Draft ${year}`)
        .items([
          draftGuideDocument(S, year),
          ...(hasReview ? [draftReviewDocument(S, year)] : []),
          draftProspectsList(S, year)
        ])
    )

export const deskStructure = (S) =>
  S.list()
    .title('Tabelado de 3')
    .items([
      S.listItem()
        .title('Publicações')
        .schemaType('post')
        .child(S.documentTypeList('post').title('Publicações')),
      S.listItem()
        .title('Dicas')
        .schemaType('tip')
        .child(S.documentTypeList('tip').title('Dicas')),
      S.listItem()
        .title('Tweets')
        .schemaType('tweetCard')
        .child(S.documentTypeList('tweetCard').title('Cards de Tweet')),
      S.listItem()
        .title('Conexoes')
        .schemaType('conexao')
        .child(S.documentTypeList('conexao').title('Conexoes editoriais')),
      S.listItem()
        .title('Guia do Draft')
        .schemaType('draftProspect')
        .child(
          S.list()
            .title('Guia do Draft')
            .items([
              draftYearSection(S, '2025'),
              draftYearSection(S, '2026'),
              draftYearSection(S, '2027', false)
            ])
        ),
      S.listItem()
        .title('Rankings')
        .schemaType('ranking')
        .child(S.documentTypeList('ranking').title('Rankings')),
      S.listItem()
        .title('Glossário')
        .schemaType('glossaryTerm')
        .child(S.documentTypeList('glossaryTerm').title('Termos do Glossário')),
      S.divider(),
      S.listItem()
        .title('Categorias')
        .schemaType('category')
        .child(S.documentTypeList('category').title('Categorias')),
      S.listItem()
        .title('Autores')
        .schemaType('author')
        .child(S.documentTypeList('author').title('Autores')),
      S.listItem()
        .title('Times da NBA')
        .schemaType('nbaTeam')
        .child(S.documentTypeList('nbaTeam').title('Times da NBA')),
      S.divider(),
      S.listItem()
        .title('Configurações da Home')
        .schemaType('homeSettings')
        .child(
          S.document()
            .schemaType('homeSettings')
            .documentId('homeSettings')
            .title('Configurações da Home')
        ),
      S.listItem()
        .title('Configurações gerais')
        .schemaType('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
            .title('Configurações gerais')
        ),
      S.listItem()
        .title('Configuracoes da Colmeia')
        .schemaType('colmeiaSettings')
        .child(
          S.document()
            .schemaType('colmeiaSettings')
            .documentId('colmeiaSettings')
            .title('Configuracoes da Colmeia')
        ),
      S.divider(),
      ...S.documentTypeListItems().filter((item) => !hiddenTypes.has(item.getId()))
    ])
