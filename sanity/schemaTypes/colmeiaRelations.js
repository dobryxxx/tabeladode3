export const tiposConteudoColmeia = [
  {type: 'post'},
  {type: 'glossaryTerm'},
  {type: 'ranking'},
  {type: 'tip'},
  {type: 'tweetCard'}
]

// Mantem os tipos legados validos para preservar referencias existentes.
// O filtro limita novas escolhas editoriais a artigos e tweets.
export const filtroConteudosColmeia = {
  filter: '_type in ["post", "tweetCard"]'
}

export const validarRelacionados = (Rule) =>
  Rule.unique().custom((references = [], context) => {
    const documentId = String(context.document?._id || '').replace(/^drafts\./, '')
    const hasSelfReference = references.some((reference) => reference?._ref === documentId)

    return hasSelfReference
      ? 'Um conteudo nao pode ser relacionado a ele mesmo.'
      : true
  })
