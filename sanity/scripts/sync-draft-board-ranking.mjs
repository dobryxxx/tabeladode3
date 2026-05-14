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

await readEnvFile(path.join(studioDir, '.env'))
await readEnvFile(path.join(studioDir, '.env.migration'))

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'eaeyiq4k'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_AUTH_TOKEN

if (writeMode && !token) {
  throw new Error('SANITY_AUTH_TOKEN ausente. Para usar --write, adicione no sanity/.env ou sanity/.env.migration antes de rodar.')
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

let board
try {
  board = await client.fetch(`*[_id == "draftGuideSettings"][0].draftBoard[] {
    "id": prospecto->_id,
    "nome": prospecto->nome,
    "rankingAtual": prospecto->rankingGeral
  }`)
} catch (error) {
  if (!writeMode) {
    console.warn('Leitura com token falhou. Tentando dry-run com leitura publica sem token.')
    try {
      client = publicClient
      board = await client.fetch(`*[_id == "draftGuideSettings"][0].draftBoard[] {
        "id": prospecto->_id,
        "nome": prospecto->nome,
        "rankingAtual": prospecto->rankingGeral
      }`)
    } catch (publicError) {
      console.error('Nao foi possivel ler a ordem do Guia no Sanity.')
      console.error('Confira se o dataset esta publico ou se SANITY_AUTH_TOKEN e valido.')
      console.error(publicError.message)
      process.exit(1)
    }
  } else {
  console.error('Nao foi possivel ler a ordem do Guia no Sanity.')
  console.error('Confira se SANITY_AUTH_TOKEN e valido e tem permissao de leitura/escrita.')
  console.error(error.message)
  process.exit(1)
  }
}

if (!Array.isArray(board) || !board.length) {
  console.log('Nenhuma ordem cadastrada em draftGuideSettings.draftBoard.')
  console.log('Crie/organize a lista em Sanity > Guia do Draft > Ordem do Guia.')
  process.exit(0)
}

const changes = board
  .map((item, index) => ({
    id: item.id,
    nome: item.nome || item.id,
    rankingAtual: item.rankingAtual,
    rankingNovo: index + 1
  }))
  .filter((item) => item.id && Number(item.rankingAtual) !== item.rankingNovo)

console.log(`Prospectos na lista ordenada: ${board.length}`)
console.log(`Prospectos que seriam sincronizados: ${changes.length}`)
if (changes.length) console.table(changes.slice(0, 50))

if (!writeMode) {
  console.log('\nDry-run concluido. Nada foi escrito.')
  console.log('Para sincronizar rankingGeral: node scripts/sync-draft-board-ranking.mjs --write')
  process.exit(0)
}

const batchSize = 25
for (let index = 0; index < changes.length; index += batchSize) {
  const batch = changes.slice(index, index + batchSize)
  let transaction = client.transaction()
  batch.forEach((item) => {
    transaction = transaction.patch(item.id, {set: {rankingGeral: item.rankingNovo}})
  })
  await transaction.commit()
  console.log(`Sincronizados ${Math.min(index + batch.length, changes.length)}/${changes.length}`)
}

console.log('rankingGeral sincronizado com a ordem arrastável do Guia do Draft.')
