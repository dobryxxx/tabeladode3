const hiddenTypes = new Set([
  'homeSettings',
  'siteSettings',
  'draftGuideSettings',
  'post',
  'tip',
  'draftProspect',
  'nbaTeam',
  'ranking',
  'glossaryTerm',
  'category',
  'author'
])

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
        .title('Guia do Draft')
        .schemaType('draftProspect')
        .child(
          S.list()
            .title('Guia do Draft')
            .items([
              S.listItem()
                .title('Ordem do Guia')
                .schemaType('draftGuideSettings')
                .child(
                  S.document()
                    .schemaType('draftGuideSettings')
                    .documentId('draftGuideSettings')
                    .title('Ordem do Guia do Draft')
                ),
              S.listItem()
                .title('Prospectos')
                .schemaType('draftProspect')
                .child(S.documentTypeList('draftProspect').title('Prospectos do Draft'))
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
      S.divider(),
      ...S.documentTypeListItems().filter((item) => !hiddenTypes.has(item.getId()))
    ])
