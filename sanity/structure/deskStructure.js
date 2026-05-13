const singletonTypes = new Set(['homeSettings', 'siteSettings'])

export const deskStructure = (S) =>
  S.list()
    .title('Tabelado de 3')
    .items([
      S.listItem()
        .title('Publicações')
        .schemaType('post')
        .child(S.documentTypeList('post').title('Publicações')),
      S.listItem()
        .title('Guia do Draft')
        .schemaType('draftProspect')
        .child(S.documentTypeList('draftProspect').title('Prospectos do Draft')),
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
      ...S.documentTypeListItems().filter((item) => !singletonTypes.has(item.getId()))
    ])
