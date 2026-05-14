import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createClient} from '@sanity/client'

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

function stableKey(id = '', index = 0) {
  const clean = String(id || `prospect-${index}`)
    .replace(/^draftProspect-/, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .slice(0, 80)
  return `draftBoardItem-${String(index + 1).padStart(3, '0')}-${clean}`
}

function refIdFromItem(item = {}) {
  return item.prospecto?._ref || item.prospecto?._id || item._ref || item._id || ''
}

await readEnvFile(path.join(studioDir, '.env'))
await readEnvFile(path.join(studioDir, '.env.migration'))

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'eaeyiq4k'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_AUTH_TOKEN

if (writeMode && !token) {
  throw new Error('SANITY_AUTH_TOKEN ausente. Para usar --write, adicione no sanity/.env ou sanity/.env.migration.')
}

function makeClient(authToken = token) {
  return createClient({
    projectId,
    dataset,
    apiVersion: '2025-05-13',
    useCdn: false,
    token: authToken || undefined
  })
}

let client = makeClient()

const publicClient = createClient({
  projectId,
  dataset,
  apiVersion: '2025-05-13',
  useCdn: false
})

let prospects = []
let settings = null

async function fetchDraftBoardData(activeClient) {
  prospects = await activeClient.fetch(`*[_type == "draftProspect" && status == "publicado"] | order(coalesce(rankingGeral, rank, ordem, 9999) asc, nome asc) {
    _id,
    nome,
    rankingGeral,
    rank,
    ordem,
    posicao,
    "foto": foto.asset->url
  }`)

  settings = await activeClient.fetch(`*[_id == "draftGuideSettings"][0] {
    _id,
    _type,
    titulo,
    draftBoard[] {
      _key,
      _type,
      observacao,
      prospecto
    }
  }`)
}

try {
  await fetchDraftBoardData(client)
} catch (error) {
  if (!writeMode) {
    console.warn('Leitura com token falhou. Tentando dry-run com leitura publica sem token.')
    try {
      client = publicClient
      await fetchDraftBoardData(client)
    } catch (publicError) {
      console.error('Nao foi possivel ler prospectos/ordem do Guia no Sanity.')
      console.error('Confira se o dataset esta publico ou se SANITY_AUTH_TOKEN e valido.')
      console.error(publicError.message)
      process.exit(1)
    }
  } else {
  console.error('Nao foi possivel ler prospectos/ordem do Guia no Sanity.')
  console.error('Confira se SANITY_AUTH_TOKEN e valido e tem permissao de leitura/escrita.')
  console.error(error.message)
  process.exit(1)
  }
}

const existingItems = Array.isArray(settings?.draftBoard) ? settings.draftBoard : []
const existingRefs = new Set()
const duplicateRefs = []
const preservedItems = []

existingItems.forEach((item, index) => {
  const ref = refIdFromItem(item)
  if (!ref) return
  if (existingRefs.has(ref)) {
    duplicateRefs.push(ref)
    return
  }
  existingRefs.add(ref)
  preservedItems.push({
    _key: item._key || stableKey(ref, index),
    _type: 'draftBoardItem',
    prospecto: {
      _type: 'reference',
      _ref: ref
    },
    ...(item.observacao ? {observacao: item.observacao} : {})
  })
})

const missingProspects = prospects.filter((prospect) => !existingRefs.has(prospect._id))
const newItems = missingProspects.map((prospect, index) => ({
  _key: stableKey(prospect._id, preservedItems.length + index),
  _type: 'draftBoardItem',
  prospecto: {
    _type: 'reference',
    _ref: prospect._id
  }
}))

const nextDraftBoard = [...preservedItems, ...newItems]
const nextDocument = {
  _id: 'draftGuideSettings',
  _type: 'draftGuideSettings',
  titulo: settings?.titulo || 'Ordem do Guia do Draft',
  draftBoard: nextDraftBoard
}

console.log('\nSeed da ordem do Guia do Draft')
console.table({
  prospectosPublicadosEncontrados: prospects.length,
  itensJaNaLista: preservedItems.length,
  prospectosAdicionadosAoFinal: newItems.length,
  duplicadosRemovidosDaListaExistente: duplicateRefs.length,
  totalFinalNaLista: nextDraftBoard.length,
  documentoExistia: Boolean(settings?._id),
  modo: writeMode ? 'write' : 'dry-run'
})

if (missingProspects.length) {
  console.log('\nPrimeiros prospectos que seriam adicionados ao final:')
  console.table(missingProspects.slice(0, 20).map((prospect, index) => ({
    ordemFinal: preservedItems.length + index + 1,
    nome: prospect.nome,
    rankingAtual: prospect.rankingGeral || prospect.rank || prospect.ordem || ''
  })))
}

if (duplicateRefs.length) {
  console.log('\nDuplicados removidos da lista existente:')
  console.log([...new Set(duplicateRefs)].slice(0, 50).join('\n'))
}

if (!writeMode) {
  console.log('\nDry-run concluido. Nada foi escrito no Sanity.')
  console.log('Para aplicar: node scripts/seed-draft-board-order.mjs --write')
  process.exit(0)
}

await client.createOrReplace(nextDocument)

console.log('\nOrdem do Guia do Draft atualizada no Sanity.')
console.log('Abra Sanity Studio > Guia do Draft > Ordem do Guia para arrastar os prospectos.')
