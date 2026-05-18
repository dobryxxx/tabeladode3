import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createClient} from '@sanity/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const studioDir = path.resolve(__dirname, '..')

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

await readEnvFile(path.join(studioDir, '.env'))
await readEnvFile(path.join(studioDir, '.env.migration'))

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'eaeyiq4k'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_AUTH_TOKEN

function makeClient(authToken = token) {
  return createClient({
    projectId,
    dataset,
    apiVersion: '2025-05-13',
    useCdn: false,
    token: authToken || undefined
  })
}

const query = `*[_type == "draftGuideSettings"][0]{
  _id,
  _type,
  title,
  titulo,
  draftBoard[0...10]{
    _key,
    _type,
    ordemPreview,
    nomeSnapshot,
    posicaoSnapshot,
    rankingSnapshot,
    tierSnapshot,
    fotoSnapshotUrl,
    prospecto->{_id, nome, posicao, rankingGeral, tier}
  },
  "total": count(draftBoard)
}`

async function fetchSettings(client) {
  return client.fetch(query)
}

let source = token ? 'token' : 'public'
let settings = null

try {
  settings = await fetchSettings(makeClient())
} catch (error) {
  if (!token) throw error
  console.warn('Leitura com token falhou. Tentando leitura publica sem token.')
  source = 'public'
  settings = await fetchSettings(makeClient(null))
}

if (!settings) {
  console.log(JSON.stringify({
    exists: false,
    source,
    message: 'Documento draftGuideSettings nao encontrado.'
  }, null, 2))
  process.exit(0)
}

const items = Array.isArray(settings.draftBoard) ? settings.draftBoard : []
const reportItems = items.map((item, index) => ({
  index: index + 1,
  key: item._key,
  ordemPreview: item.ordemPreview ?? null,
  nomeSnapshot: item.nomeSnapshot || null,
  posicaoSnapshot: item.posicaoSnapshot || null,
  rankingSnapshot: item.rankingSnapshot ?? null,
  tierSnapshot: item.tierSnapshot || null,
  fotoSnapshotUrl: item.fotoSnapshotUrl || null,
  hasProspectRef: Boolean(item.prospecto?._id),
  prospectId: item.prospecto?._id || null,
  prospectName: item.prospecto?.nome || null,
  prospectPosition: item.prospecto?.posicao || null,
  prospectRanking: item.prospecto?.rankingGeral ?? null,
  prospectTier: item.prospecto?.tier || null,
  hasNomeSnapshot: Boolean(item.nomeSnapshot),
  hasOrdemPreview: Number.isFinite(Number(item.ordemPreview)),
  referenceResolves: Boolean(item.prospecto?._id && item.prospecto?.nome)
}))

console.log('\nDebug draftGuideSettings')
console.log(JSON.stringify({
  source,
  exists: true,
  id: settings._id,
  type: settings._type,
  title: settings.title || settings.titulo || null,
  total: settings.total || 0,
  first10Summary: {
    withProspect: reportItems.filter((item) => item.hasProspectRef).length,
    withNomeSnapshot: reportItems.filter((item) => item.hasNomeSnapshot).length,
    withOrdemPreview: reportItems.filter((item) => item.hasOrdemPreview).length,
    referenceResolves: reportItems.filter((item) => item.referenceResolves).length
  },
  first10: reportItems
}, null, 2))
