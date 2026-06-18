import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createClient} from '@sanity/client'

const RANK_MIN = 1
const RANK_MAX = 60

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const studioDir = path.resolve(__dirname, '..')
const writeMode = process.argv.includes('--write')

async function readEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return
      const [key, ...rest] = trimmed.split('=')
      if (!process.env[key]) process.env[key] = rest.join('=').trim()
    })
  } catch {
    // env file is optional
  }
}

function publishedId(id = '') {
  return String(id).replace(/^drafts\./, '')
}

await readEnvFile(path.join(studioDir, '.env'))
await readEnvFile(path.join(studioDir, '.env.migration'))

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'eaeyiq4k'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_AUTH_TOKEN

if (!token) {
  throw new Error('SANITY_AUTH_TOKEN ausente. Adicione o token em sanity/.env ou sanity/.env.migration.')
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2025-05-13',
  useCdn: false,
  perspective: 'raw',
  token
})

const documents = await client.fetch(`*[_type == "draftProspect"] {
  _id,
  nome,
  rankingGeral,
  status,
  ocultoNoGuia
}`)

const publishedById = new Map()
const draftsById = new Map()

documents.forEach((document) => {
  const id = publishedId(document._id)
  if (document._id.startsWith('drafts.')) draftsById.set(id, document)
  else publishedById.set(id, document)
})

const ids = new Set([...publishedById.keys(), ...draftsById.keys()])
const effectiveDocuments = [...ids].map((id) => ({
  ...publishedById.get(id),
  ...draftsById.get(id),
  publishedId: id
}))

const visible = effectiveDocuments
  .filter((document) => (
    document.status === 'publicado'
    && document.ocultoNoGuia !== true
    && Number.isInteger(document.rankingGeral)
    && document.rankingGeral >= RANK_MIN
    && document.rankingGeral <= RANK_MAX
    && publishedById.has(document.publishedId)
  ))
  .sort((a, b) => a.rankingGeral - b.rankingGeral)

const rankCounts = new Map()
visible.forEach((document) => {
  rankCounts.set(document.rankingGeral, (rankCounts.get(document.rankingGeral) || 0) + 1)
})

const missingRanks = []
const duplicateRanks = []
for (let rank = RANK_MIN; rank <= RANK_MAX; rank += 1) {
  const count = rankCounts.get(rank) || 0
  if (count === 0) missingRanks.push(rank)
  if (count > 1) duplicateRanks.push(rank)
}

if (visible.length !== RANK_MAX || missingRanks.length || duplicateRanks.length) {
  console.error(`Esperados ${RANK_MAX} prospectos, um por ranking de ${RANK_MIN} a ${RANK_MAX}.`)
  console.error(`Encontrados: ${visible.length}`)
  if (missingRanks.length) console.error(`Rankings ausentes: ${missingRanks.join(', ')}`)
  if (duplicateRanks.length) console.error(`Rankings duplicados: ${duplicateRanks.join(', ')}`)
  process.exit(1)
}

const visibleIds = new Set(visible.map((document) => document.publishedId))
const changes = documents
  .map((document) => {
    const shouldBeHidden = !visibleIds.has(publishedId(document._id))
    return {
      ...document,
      shouldBeHidden,
      changes: document.ocultoNoGuia !== shouldBeHidden
    }
  })
  .filter((document) => document.changes)

console.log(writeMode ? 'Modo escrita (--write)' : 'Dry-run: nada sera escrito.')
console.log(`Visiveis no Guia: ${visible.length}`)
console.log(`Documentos a atualizar: ${changes.length}`)
console.log('')
console.log('Ranking | Nome')
console.log('--- | ---')
visible.forEach((document) => console.log(`#${document.rankingGeral} | ${document.nome}`))

const becomingHidden = changes.filter((document) => document.shouldBeHidden)
const becomingVisible = changes.filter((document) => !document.shouldBeHidden)

console.log('')
console.log(`Alteracoes para oculto: ${becomingHidden.length}`)
becomingHidden.forEach((document) => {
  console.log(`- ${document.nome || document._id} (${document._id})`)
})
console.log(`Alteracoes para visivel: ${becomingVisible.length}`)
becomingVisible.forEach((document) => {
  console.log(`- #${document.rankingGeral} ${document.nome || document._id} (${document._id})`)
})

if (!writeMode) {
  console.log('')
  console.log('Revise o resultado. Rode novamente com --write para atualizar somente ocultoNoGuia.')
  process.exit(0)
}

let transaction = client.transaction()
changes.forEach((document) => {
  transaction = transaction.patch(document._id, {
    set: {ocultoNoGuia: document.shouldBeHidden}
  })
})

await transaction.commit()
console.log('')
console.log(`Sincronizacao concluida: ${changes.length} documento(s) atualizado(s).`)
