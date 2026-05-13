import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import {fileURLToPath} from 'node:url'
import {createClient} from '@sanity/client'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const studioDir = path.resolve(__dirname, '..')
const rootDir = path.resolve(studioDir, '..')
const writeMode = process.argv.includes('--write')
const neutralOldDate = '2000-01-01T00:00:00.000Z'

const warnings = []
const missingLocalDate = []
const sourceConflicts = []
const knownBadDateOnly = new Set(['2026-05-13'])

function slugify(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function readEnvFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8')
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return
      const [key, ...rest] = trimmed.split('=')
      if (!process.env[key]) process.env[key] = rest.join('=').trim()
    })
  } catch {}
}

async function readJson(relativePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(rootDir, relativePath), 'utf8'))
  } catch (error) {
    warnings.push(`Nao foi possivel ler ${relativePath}: ${error.message}`)
    return fallback
  }
}

async function readJsExports(relativePath, exportNames) {
  try {
    const source = await fs.readFile(path.join(rootDir, relativePath), 'utf8')
    const exportObject = exportNames.map((name) => `${name}: typeof ${name} !== 'undefined' ? ${name} : undefined`).join(',')
    const sandbox = {console: {log() {}, warn() {}, error() {}}}
    vm.createContext(sandbox)
    vm.runInContext(`${source}\n;globalThis.__exports = {${exportObject}};`, sandbox, {filename: relativePath})
    return sandbox.__exports || {}
  } catch (error) {
    warnings.push(`Nao foi possivel ler ${relativePath}: ${error.message}`)
    return {}
  }
}

function parseDate(value) {
  if (!value) return null
  const raw = String(value).trim()
  if (!raw) return null

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return new Date(`${iso[1]}-${iso[2]}-${iso[3]}T12:00:00.000Z`).toISOString()

  const brNumeric = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (brNumeric) {
    const [, day, month, year] = brNumeric
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00:00.000Z`).toISOString()
  }

  const months = {
    jan: '01', janeiro: '01',
    fev: '02', fevereiro: '02',
    mar: '03', marco: '03', março: '03',
    abr: '04', abril: '04',
    mai: '05', maio: '05',
    jun: '06', junho: '06',
    jul: '07', julho: '07',
    ago: '08', agosto: '08',
    set: '09', setembro: '09',
    out: '10', outubro: '10',
    nov: '11', novembro: '11',
    dez: '12', dezembro: '12'
  }

  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\./g, '')
  const textual = normalized.match(/^(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})$/)
  if (textual && months[textual[2]]) {
    return new Date(`${textual[3]}-${months[textual[2]]}-${textual[1].padStart(2, '0')}T12:00:00.000Z`).toISOString()
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()
  return null
}

function dateOnly(value) {
  if (!value) return ''
  const parsed = parseDate(value)
  return parsed ? parsed.slice(0, 10) : ''
}

function localDateFromPost(post) {
  return parseDate(post.data || post.date || post.publishedAt || post.createdAt || post.originalDate || post.pubDate)
}

async function loadLocalPostDates() {
  const postsJson = await readJson('data/posts.json', {posts: []})
  const conteudoExports = await readJsExports('js/conteudo.js', ['posts'])
  const sources = [
    {name: 'data/posts.json', posts: postsJson.posts || []},
    {name: 'js/conteudo.js', posts: conteudoExports.posts || []}
  ]
  const map = new Map()

  sources.forEach((source) => {
    source.posts.forEach((post, index) => {
      const slug = slugify(post.slug || post.link || post.titulo || post.title)
      if (!slug) return

      const originalDate = localDateFromPost(post)
      if (!originalDate) {
        missingLocalDate.push({slug, title: post.titulo || post.title || '', source: source.name, index})
        return
      }

      const previous = map.get(slug)
      if (previous && dateOnly(previous.originalDate) !== dateOnly(originalDate)) {
        sourceConflicts.push({
          slug,
          title: post.titulo || post.title || previous.title || '',
          kept: previous.source,
          keptDate: previous.originalDate,
          ignored: source.name,
          ignoredDate: originalDate
        })
        return
      }

      if (!previous) {
        map.set(slug, {
          slug,
          title: post.titulo || post.title || '',
          originalDate,
          source: source.name,
          rawDate: post.data || post.date || post.publishedAt || post.createdAt || post.originalDate || post.pubDate || ''
        })
      }
    })
  })

  return map
}

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10)
}

function isSafeToAutoFix(currentDate, targetDate) {
  const current = dateOnly(currentDate)
  const target = dateOnly(targetDate)
  if (!target) return false
  if (!current) return true
  if (current === target) return false
  if (current === todayDateOnly()) return true
  if (knownBadDateOnly.has(current)) return true
  if (current === dateOnly(neutralOldDate)) return true
  return false
}

async function fetchSanityPosts(client) {
  return client.fetch(`*[_type == "post"]{
    _id,
    titulo,
    "slug": slug.current,
    dataPublicacao,
    publishedAt,
    _updatedAt
  } | order(_updatedAt desc)`)
}

function buildClient() {
  const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'eaeyiq4k'
  const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
  const token = process.env.SANITY_AUTH_TOKEN

  if (writeMode && !token) {
    throw new Error('SANITY_AUTH_TOKEN ausente. Adicione no sanity/.env antes de usar --write.')
  }

  return createClient({
    projectId,
    dataset,
    token,
    apiVersion: '2025-05-13',
    useCdn: false
  })
}

async function patchCorrections(client, corrections) {
  for (let index = 0; index < corrections.length; index += 1) {
    const correction = corrections[index]
    await client.patch(correction._id).set({dataPublicacao: correction.after}).commit()
    console.log(`Corrigido ${index + 1}/${corrections.length}: ${correction.slug} ${correction.before || 'sem data'} -> ${correction.after}`)
  }
}

function printList(title, list, formatter, limit = 80) {
  if (!list.length) return
  console.log(`\n${title}`)
  list.slice(0, limit).forEach((item) => console.log(`- ${formatter(item)}`))
  if (list.length > limit) console.log(`... mais ${list.length - limit}`)
}

await readEnvFile(path.join(studioDir, '.env'))

const localDates = await loadLocalPostDates()
const client = buildClient()
const sanityPosts = await fetchSanityPosts(client)

const corrections = []
const manualReview = []
const sanityWithoutLocalDate = []
const alreadyOk = []

sanityPosts.forEach((post) => {
  const slug = slugify(post.slug || post.titulo)
  const local = localDates.get(slug)
  const currentDate = post.dataPublicacao || post.publishedAt || ''

  if (!local) {
    sanityWithoutLocalDate.push({
      _id: post._id,
      slug,
      title: post.titulo || '',
      currentDate
    })
    return
  }

  if (dateOnly(currentDate) === dateOnly(local.originalDate)) {
    alreadyOk.push(slug)
    return
  }

  const item = {
    _id: post._id,
    slug,
    title: post.titulo || local.title || '',
    before: currentDate || '',
    after: local.originalDate,
    source: local.source,
    rawDate: local.rawDate
  }

  if (isSafeToAutoFix(currentDate, local.originalDate)) corrections.push(item)
  else manualReview.push(item)
})

console.log('\nAuditoria de datas de publicacoes')
console.table({
  mode: writeMode ? 'write' : 'dry-run',
  sanityPosts: sanityPosts.length,
  localPostsWithValidDate: localDates.size,
  localPostsWithoutValidDate: missingLocalDate.length,
  alreadyOk: alreadyOk.length,
  wouldCorrect: corrections.length,
  manualReview: manualReview.length,
  sanityWithoutLocalDate: sanityWithoutLocalDate.length,
  sourceConflicts: sourceConflicts.length
})

printList(
  'Correcoes seguras detectadas (antes -> depois)',
  corrections,
  (item) => `${item.slug}: ${item.before || 'sem data'} -> ${item.after} [${item.source}]`
)

printList(
  'Divergencias que exigem revisao manual (nao serao alteradas automaticamente)',
  manualReview,
  (item) => `${item.slug}: Sanity ${item.before || 'sem data'} | local ${item.after} [${item.source}]`
)

printList(
  'Posts locais sem data original confiavel',
  missingLocalDate,
  (item) => `${item.slug} (${item.source})`
)

printList(
  'Posts no Sanity sem data local correspondente',
  sanityWithoutLocalDate,
  (item) => `${item.slug}: ${item.currentDate || 'sem data'}`
)

printList(
  'Conflitos de data entre fontes locais',
  sourceConflicts,
  (item) => `${item.slug}: mantendo ${item.keptDate} de ${item.kept}; ignorando ${item.ignoredDate} de ${item.ignored}`
)

if (warnings.length) {
  console.log('\nAvisos')
  warnings.forEach((warning) => console.log(`- ${warning}`))
}

if (writeMode) {
  await patchCorrections(client, corrections)
  console.log(`\nWrite concluido. Campos dataPublicacao corrigidos: ${corrections.length}.`)
} else {
  console.log('\nDry-run concluido. Nada foi escrito no Sanity.')
  console.log('Para corrigir de verdade: node scripts/fix-post-dates.mjs --write')
}
