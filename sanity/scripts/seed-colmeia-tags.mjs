import fs from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {createClient} from '@sanity/client'

const THRESHOLD = 60

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

function slugify(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

await readEnvFile(path.join(studioDir, '.env'))
await readEnvFile(path.join(studioDir, '.env.migration'))

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'eaeyiq4k'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
const token = process.env.SANITY_AUTH_TOKEN

if (writeMode && !token) {
  throw new Error('SANITY_AUTH_TOKEN ausente. Para usar --write, rode primeiro o dry-run e adicione o token no sanity/.env ou sanity/.env.migration.')
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

const contentsQuery = `*[_type in ["post", "draftProspect", "tip", "glossaryTerm", "ranking", "tweetCard"] && !(_id in path("drafts.**"))] {
  _id,
  _type,
  "titulo": coalesce(titulo, title, nome, termo, _id),
  "slug": coalesce(slug.current, _id),
  tags
}`

const settingsQuery = `*[_id == "colmeiaSettings"][0] {
  _id,
  tagsEstruturais
}`

let contents = []
let settings = null

async function fetchData(activeClient) {
  contents = await activeClient.fetch(contentsQuery)
  settings = await activeClient.fetch(settingsQuery)
}

try {
  await fetchData(client)
} catch (error) {
  if (!writeMode) {
    console.warn('Leitura com token falhou. Tentando dry-run com leitura publica sem token.')
    try {
      client = publicClient
      await fetchData(client)
    } catch (publicError) {
      console.error('Nao foi possivel ler conteudos/tags no Sanity.')
      console.error('Confira se o dataset esta publico ou se SANITY_AUTH_TOKEN e valido.')
      console.error(publicError.message)
      process.exit(1)
    }
  } else {
    console.error('Nao foi possivel ler conteudos/tags no Sanity.')
    console.error('Confira se SANITY_AUTH_TOKEN e valido e tem permissao de leitura/escrita.')
    console.error(error.message)
    process.exit(1)
  }
}

function tagsNormalizadas(tags = []) {
  if (!Array.isArray(tags)) return []

  const bySlug = new Map()
  tags.forEach((tag) => {
    const label = String(tag || '').trim()
    const slug = slugify(label)
    if (!slug || bySlug.has(slug)) return
    bySlug.set(slug, label)
  })

  return [...bySlug.entries()].map(([slug, label]) => ({slug, label}))
}

const totalContents = contents.length
const tagStats = new Map()

contents.forEach((content) => {
  tagsNormalizadas(content.tags).forEach(({slug, label}) => {
    if (!tagStats.has(slug)) {
      tagStats.set(slug, {
        slug,
        labels: new Map(),
        contentIds: new Set()
      })
    }

    const stat = tagStats.get(slug)
    stat.contentIds.add(content._id)
    stat.labels.set(label, (stat.labels.get(label) || 0) + 1)
  })
})

function labelMaisFrequente(labels = new Map()) {
  return [...labels.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'))
    .at(0)?.[0] || ''
}

const rows = [...tagStats.values()]
  .map((stat) => {
    const usos = stat.contentIds.size
    const percentual = totalContents ? (usos / totalContents) * 100 : 0

    return {
      slug: stat.slug,
      label: labelMaisFrequente(stat.labels),
      usos,
      percentual,
      sugerida: percentual >= THRESHOLD
    }
  })
  .sort((a, b) => b.usos - a.usos || a.label.localeCompare(b.label, 'pt-BR'))

const suggestedRows = rows.filter((row) => row.sugerida)
const suggestedSlugs = new Set(suggestedRows.map((row) => row.slug))
const suggestedLabels = suggestedRows.map((row) => row.label)

const orphans = contents
  .map((content) => {
    const tags = tagsNormalizadas(content.tags)
    const nonStructural = tags.filter((tag) => !suggestedSlugs.has(tag.slug))

    return {
      tipo: content._type,
      titulo: content.titulo || content._id,
      slug: content.slug || content._id,
      tags: tags.map((tag) => tag.label).join(', ') || '(sem tags)',
      semTagNaoEstrutural: nonStructural.length === 0
    }
  })
  .filter((content) => content.semTagNaoEstrutural)
  .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.titulo.localeCompare(b.titulo, 'pt-BR'))

console.log('\nSeed de tags estruturais da Colmeia')
console.table({
  totalConteudos: totalContents,
  tagsUnicas: rows.length,
  thresholdPercentual: THRESHOLD,
  sugestoesEstruturais: suggestedRows.length,
  modo: writeMode ? 'write' : 'dry-run'
})

console.log('\nTags analisadas:')
console.table(rows.map((row) => ({
  rotulo: row.label,
  usos: row.usos,
  percentual: `${row.percentual.toFixed(1)}%`,
  sugestao: row.sugerida ? 'estrutural' : ''
})))

console.log('\nConteudos que ficariam sem tag nao-estrutural:')
if (orphans.length) {
  console.table(orphans.map((content) => ({
    tipo: content.tipo,
    titulo: content.titulo,
    slug: content.slug,
    tags: content.tags
  })))
} else {
  console.log('Nenhum.')
}

if (!writeMode) {
  console.log('\nDry-run concluido. Nada foi escrito no Sanity.')
  console.log('Revise as sugestoes acima antes de aplicar: node scripts/seed-colmeia-tags.mjs --write')
  process.exit(0)
}

const existingTags = Array.isArray(settings?.tagsEstruturais) ? settings.tagsEstruturais : []
const unionBySlug = new Map()

existingTags.forEach((tag) => {
  const label = String(tag || '').trim()
  const slug = slugify(label)
  if (slug && !unionBySlug.has(slug)) unionBySlug.set(slug, label)
})

suggestedLabels.forEach((tag) => {
  const label = String(tag || '').trim()
  const slug = slugify(label)
  if (slug && !unionBySlug.has(slug)) unionBySlug.set(slug, label)
})

const nextTags = [...unionBySlug.values()]

await client
  .transaction()
  .createIfNotExists({
    _id: 'colmeiaSettings',
    _type: 'colmeiaSettings',
    tagsEstruturais: []
  })
  .patch('colmeiaSettings', {
    set: {
      tagsEstruturais: nextTags
    }
  })
  .commit()

console.log('\ncolmeiaSettings.tagsEstruturais atualizado no Sanity.')
console.table({
  tagsManuaisPreservadas: existingTags.length,
  sugestoesAdicionadas: nextTags.length - existingTags.length,
  totalFinal: nextTags.length
})
