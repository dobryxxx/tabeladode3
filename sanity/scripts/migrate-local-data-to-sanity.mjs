import fs from 'node:fs/promises'
import path from 'node:path'
import vm from 'node:vm'
import {fileURLToPath} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const studioDir = path.resolve(__dirname, '..')
const rootDir = path.resolve(studioDir, '..')
const writeMode = process.argv.includes('--write')
const previewPath = path.join(studioDir, 'migration-preview.json')

const warnings = []
const skipped = []
const duplicates = []
const neutralOldDate = '2000-01-01T00:00:00.000Z'

function readEnvFile(filePath) {
  return fs.readFile(filePath, 'utf8')
    .then((content) => {
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return
        const [key, ...rest] = trimmed.split('=')
        if (!process.env[key]) process.env[key] = rest.join('=').trim()
      })
    })
    .catch(() => {})
}

function slugify(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stableKey(prefix, index) {
  return `${prefix}-${String(index).padStart(3, '0')}`
}

function compactObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => {
      if (value === undefined || value === null || value === '') return false
      if (Array.isArray(value) && value.length === 0) return false
      return true
    })
  )
}

function imageFields(value) {
  if (!value) return {}
  const image = String(value)
  if (/^https?:\/\//i.test(image)) return {imageUrl: image}
  return {localImagePath: image.replace(/\\/g, '/')}
}

function portableTextFrom(value) {
  if (!value) return []

  if (Array.isArray(value) && value.some((item) => item?._type === 'block')) return value

  const paragraphs = Array.isArray(value)
    ? value
    : String(value).split(/\n{2,}/)

  return paragraphs
    .map((paragraph) => String(paragraph || '').trim())
    .filter(Boolean)
    .map((paragraph, index) => ({
      _key: stableKey('block', index),
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _key: stableKey('span', index),
          _type: 'span',
          marks: [],
          text: paragraph
        }
      ]
    }))
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

async function readGlossary() {
  try {
    const source = await fs.readFile(path.join(rootDir, 'js/glossario.js'), 'utf8')
    const match = source.match(/const\s+glossario\s*=\s*(\[[\s\S]*?\n\]);/)
    if (!match) throw new Error('array glossario nao encontrado')
    const sandbox = {}
    vm.createContext(sandbox)
    vm.runInContext(`globalThis.__glossario = ${match[1]};`, sandbox)
    return sandbox.__glossario || []
  } catch (error) {
    warnings.push(`Nao foi possivel extrair glossario local: ${error.message}`)
    return []
  }
}

function makeCategory(name, tipo = 'geral') {
  const nome = String(name || '').trim()
  if (!nome) return null
  const slug = slugify(nome)
  return compactObject({
    _id: `category-${slug}`,
    _type: 'category',
    nome,
    slug: {_type: 'slug', current: slug},
    tipo
  })
}

function makeAuthor(name) {
  const nome = String(name || '').trim()
  if (!nome) return null
  const slug = slugify(nome)
  return {
    _id: `author-${slug}`,
    _type: 'author',
    nome,
    slug: {_type: 'slug', current: slug}
  }
}

function dedupeById(docs, label) {
  const map = new Map()
  docs.forEach((doc) => {
    if (!doc?._id) return
    if (map.has(doc._id)) duplicates.push(`${label}: ${doc._id}`)
    map.set(doc._id, {...map.get(doc._id), ...doc})
  })
  return [...map.values()]
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

function normalizeDate(value, fallback = neutralOldDate) {
  return parseDate(value) || fallback
}

function preparePosts(posts) {
  const docs = []
  const categories = []
  const authors = []

  posts.forEach((post, index) => {
    const titulo = post.titulo || post.title
    if (!titulo) {
      skipped.push(`post sem titulo no indice ${index}`)
      return
    }

    const slug = slugify(post.slug || post.link || titulo)
    if (!slug) {
      skipped.push(`post sem slug valido: ${titulo}`)
      return
    }

    const categoria = post.categoria || post.category || 'ultimas'
    const autor = post.autor || post.author || 'Tabelado de 3'
    const posicaoDestaque = post.destaque ? 'principal' : post.lateral ? 'lateral' : 'none'
    const dataPublicacao = parseDate(post.data || post.date || post.publishedAt || post.createdAt || post.originalDate || post.pubDate)
    if (!dataPublicacao) {
      warnings.push(`post ${slug} sem data original confiavel; usando fallback neutro ${neutralOldDate}`)
    }

    categories.push(makeCategory(categoria, 'blog'))
    authors.push(makeAuthor(autor))

    docs.push(compactObject({
      _id: `post-${slug}`,
      _type: 'post',
      titulo,
      slug: {_type: 'slug', current: slug},
      resumo: post.resumo || post.excerpt || post.description,
      ...imageFields(post.imagem || post.image || post.mainImage),
      categoria: {_type: 'reference', _ref: `category-${slugify(categoria)}`},
      autor: {_type: 'reference', _ref: `author-${slugify(autor)}`},
      dataPublicacao: dataPublicacao || neutralOldDate,
      tempoLeitura: post.tempoLeitura || post.readingTime,
      tags: Array.isArray(post.tags) ? post.tags : [],
      destaqueHome: Boolean(post.destaque),
      posicaoDestaque,
      status: 'publicado',
      corpo: portableTextFrom(post.corpo || post.body || post.content || post.text)
    }))
  })

  return {
    docs: dedupeById(docs, 'posts'),
    categories: dedupeById(categories.filter(Boolean), 'categorias de posts'),
    authors: dedupeById(authors.filter(Boolean), 'autores')
  }
}

function prepareDraftProspects(prospects) {
  const map = new Map()

  prospects.forEach((prospect, index) => {
    const nome = prospect.nome || prospect.name
    if (!nome) {
      skipped.push(`prospect sem nome no indice ${index}`)
      return
    }

    const slug = slugify(prospect.slug || nome)
    const doc = compactObject({
      _id: `draftProspect-${slug}`,
      _type: 'draftProspect',
      nome,
      slug: {_type: 'slug', current: slug},
      ...imageFields(prospect.foto || prospect.image || prospect.photo),
      rankingGeral: Number(prospect.rank || prospect.ranking || prospect.rankingGeral || index + 1),
      tier: prospect.tier || prospect.alcance,
      posicao: prospect.posicao || prospect.position,
      time: prospect.time || prospect.team || prospect.school || prospect.college || prospect.liga,
      pais: prospect.pais || prospect.country,
      idade: prospect.idade || prospect.age,
      altura: prospect.altura || prospect.height,
      peso: prospect.peso || prospect.weight,
      envergadura: prospect.envergadura || prospect.wingspan,
      classeDraft: prospect.classeDraft || prospect.draftClass || '2026',
      arquetipoDefensivo: prospect.arquetipoDefensivo,
      arquetipoOfensivo: prospect.arquetipoOfensivo,
      motivoEscolha: prospect.motivoEscolha,
      espelho: prospect.espelho || prospect.comparison || prospect.comparacao,
      tetoPiso: prospect.tetoPiso,
      resumo: prospect.resumo || prospect.summary || prospect.bio,
      pontosFortes: prospect.pontosFortes || prospect.strengths,
      pontosFracos: prospect.pontosFracos || prospect.weaknesses,
      comparacao: prospect.comparacao || prospect.comparison,
      teto: prospect.teto || prospect.ceiling,
      piso: prospect.piso || prospect.floor,
      funcaoProjetada: prospect.funcaoProjetada || prospect.projectedRole || prospect.role,
      encaixes: prospect.encaixes || prospect.bestFits,
      stats: typeof prospect.stats === 'string' ? prospect.stats : prospect.stats ? JSON.stringify(prospect.stats) : undefined,
      observacoes: prospect.observacoes || prospect.notes,
      tags: Array.isArray(prospect.tags) ? prospect.tags : [],
      destaqueGuia: Boolean(prospect.destaque),
      status: 'publicado'
    })

    if (map.has(doc._id)) duplicates.push(`draftProspect: ${doc._id}`)
    map.set(doc._id, {...map.get(doc._id), ...doc})
  })

  return [...map.values()].sort((a, b) => a.rankingGeral - b.rankingGeral)
}

function prepareDraftGuideSettings(prospects) {
  return {
    _id: 'draftGuideSettings',
    _type: 'draftGuideSettings',
    titulo: 'Ordem do Guia do Draft',
    draftBoard: prospects
      .slice()
      .sort((a, b) => a.rankingGeral - b.rankingGeral)
      .map((prospect, index) => ({
        _key: stableKey('draftBoardItem', index),
        _type: 'draftBoardItem',
        prospecto: {
          _type: 'reference',
          _ref: prospect._id
        }
      }))
  }
}

function prepareGlossaryTerms(terms) {
  const docs = []
  const categories = []

  terms.forEach((term, index) => {
    const termo = term.termo || term.term
    if (!termo) {
      skipped.push(`termo de glossario sem nome no indice ${index}`)
      return
    }

    const slug = slugify(term.slug || termo)
    const categoria = term.categoria || term.category || 'Termos avancados'
    categories.push(makeCategory(categoria, 'glossario'))

    docs.push(compactObject({
      _id: `glossaryTerm-${slug}`,
      _type: 'glossaryTerm',
      termo,
      slug: {_type: 'slug', current: slug},
      definicaoCurta: term.definicaoCurta || term.definition || term.definicao || '',
      explicacaoCompleta: term.explicacaoCompleta || term.description || term.explanation || term.definicao,
      categoria,
      nivel: term.nivel || term.level || 'basico',
      tags: Array.isArray(term.tags) ? term.tags : [],
      exemploUso: term.exemploUso || term.example,
      destaque: Boolean(term.destaque || term.featured),
      ordem: Number(term.ordem || term.order || index + 1),
      status: 'publicado'
    }))
  })

  return {
    docs: dedupeById(docs, 'glossario'),
    categories: dedupeById(categories.filter(Boolean), 'categorias de glossario')
  }
}

function starCount(value = '') {
  if (typeof value === 'number') return value
  return (String(value).match(/★/g) || []).length
}

function prepareRankings(rankingsDisponiveis = [], rankings = []) {
  const docs = []
  const categories = []

  rankingsDisponiveis.forEach((meta) => {
    const titulo = meta.titulo || meta.title
    if (!titulo) {
      skipped.push(`ranking sem titulo: ${JSON.stringify(meta)}`)
      return
    }

    const slug = slugify(meta.slug || titulo)
    const categoria = slug === 't20f' ? 'feminino' : 'masculino'
    const itens = rankings
      .filter((item) => item.rankingSlug === meta.slug)
      .sort((a, b) => Number(a.ordem || 999) - Number(b.ordem || 999))
      .map((item, index) => compactObject({
        _key: stableKey('rankingItem', index),
        _type: 'rankingItem',
        posicao: Number(String(item.posicao || item.rank || index + 1).replace(/[^0-9]/g, '')) || index + 1,
        nome: item.nome || item.name,
        ...imageFields(item.imagem || item.foto || item.image),
        descricao: item.descricao || item.comment || item.comentario,
        tier: item.tier,
        nota: starCount(item.estrelas || item.score || item.nota),
        posicaoQuadra: item.categoria,
        time: item.time,
        alturaNascimento: item.bio2,
        linkRelacionado: item.link
      }))
      .filter((item) => item.nome)

    if (!itens.length) warnings.push(`ranking ${slug} sem itens locais vinculados`)
    categories.push(makeCategory(categoria, 'rankings'))

    docs.push(compactObject({
      _id: `ranking-${slug}`,
      _type: 'ranking',
      titulo,
      slug: {_type: 'slug', current: slug},
      descricao: meta.descricao || `Ranking editorial ${titulo} do Tabelado de 3.`,
      ...imageFields(meta.imagem || meta.capa || meta.image),
      categoria,
      data: meta.data || new Date().toISOString().slice(0, 10),
      status: 'publicado',
      destaqueHome: Boolean(meta.destaque || slug === 't25m'),
      itens
    }))
  })

  return {
    docs: dedupeById(docs, 'rankings'),
    categories: dedupeById(categories.filter(Boolean), 'categorias de rankings')
  }
}

function prepareTips(tips = []) {
  const docs = []
  const categories = []

  tips.forEach((tip, index) => {
    const title = tip.title || tip.titulo
    if (!title) {
      skipped.push(`dica sem titulo no indice ${index}`)
      return
    }

    const slug = slugify(tip.slug || title)
    const category = tip.category || tip.categoria || 'Geral'
    categories.push(makeCategory(category, 'dicas'))

    const url = tip.externalUrl || tip.link || tip.url
    if (url && !/^https?:\/\//i.test(String(url))) {
      warnings.push(`dica ${slug} usa link interno/local (${url}); mantenha esse link no fallback local ou troque por URL completa no Sanity`)
    }

    docs.push(compactObject({
      _id: `tip-${slug}`,
      _type: 'tip',
      title,
      slug: {_type: 'slug', current: slug},
      excerpt: tip.excerpt || tip.resumo || tip.description || tip.descricao,
      category,
      ...imageFields(tip.mainImage || tip.image || tip.imagem || tip.imageUrl || tip.localImagePath),
      externalUrl: url && /^https?:\/\//i.test(String(url)) ? String(url) : undefined,
      linkLabel: tip.linkLabel || tip.cta || 'Acessar dica',
      body: portableTextFrom(tip.body || tip.corpo || tip.content || tip.description || tip.descricao),
      tags: Array.isArray(tip.tags) ? tip.tags : [],
      publishedAt: normalizeDate(tip.publishedAt || tip.data || tip.date),
      featured: Boolean(tip.featured || tip.destaque),
      order: Number.isFinite(Number(tip.order || tip.ordem)) ? Number(tip.order || tip.ordem) : index + 1,
      status: 'publicado'
    }))
  })

  return {
    docs: dedupeById(docs, 'dicas'),
    categories: dedupeById(categories.filter(Boolean), 'categorias de dicas')
  }
}

async function loadLocalData() {
  const postsJson = await readJson('data/posts.json', {posts: []})
  const conteudoExports = await readJsExports('js/conteudo.js', ['posts'])
  const draftExports = await readJsExports('js/draft-data.js', ['draftProspects'])
  const tipExports = await readJsExports('js/dicas-data.js', ['dicasLocais'])
  const rankingExports = await readJsExports('js/rankings.js', ['rankingsDisponiveis', 'rankings'])
  const glossary = await readGlossary()

  const posts = dedupeById(
    [...(postsJson.posts || []), ...(conteudoExports.posts || [])]
      .map((post) => ({...post, _id: `post-${slugify(post.slug || post.link || post.titulo || post.title)}`})),
    'posts locais'
  ).map(({_id, ...post}) => post)

  return {
    posts,
    draftProspects: draftExports.draftProspects || [],
    tips: tipExports.dicasLocais || [],
    glossary,
    rankingsDisponiveis: rankingExports.rankingsDisponiveis || [],
    rankings: rankingExports.rankings || []
  }
}

async function buildMigration() {
  const local = await loadLocalData()
  const preparedPosts = preparePosts(local.posts)
  const preparedTips = prepareTips(local.tips)
  const preparedDraft = prepareDraftProspects(local.draftProspects)
  const preparedDraftSettings = prepareDraftGuideSettings(preparedDraft)
  const preparedGlossary = prepareGlossaryTerms(local.glossary)
  const preparedRankings = prepareRankings(local.rankingsDisponiveis, local.rankings)

  const categories = dedupeById([
    ...preparedPosts.categories,
    ...preparedTips.categories,
    ...preparedGlossary.categories,
    ...preparedRankings.categories
  ], 'categorias')

  const authors = preparedPosts.authors

  const documents = dedupeById([
    ...categories,
    ...authors,
    ...preparedPosts.docs,
    ...preparedTips.docs,
    ...preparedDraft,
    preparedDraftSettings,
    ...preparedGlossary.docs,
    ...preparedRankings.docs
  ], 'documentos')

  return {
    local,
    groups: {
      categories,
      authors,
      posts: preparedPosts.docs,
      tips: preparedTips.docs,
      draftProspects: preparedDraft,
      draftGuideSettings: [preparedDraftSettings],
      glossaryTerms: preparedGlossary.docs,
      rankings: preparedRankings.docs
    },
    documents
  }
}

async function writeDocuments(documents) {
  const token = process.env.SANITY_AUTH_TOKEN
  if (!token) {
    throw new Error('SANITY_AUTH_TOKEN ausente. Adicione no sanity/.env ou no ambiente antes de usar --write.')
  }

  const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'eaeyiq4k'
  const dataset = process.env.SANITY_STUDIO_DATASET || 'production'
  const {createClient} = await import('@sanity/client')
  const client = createClient({projectId, dataset, token, apiVersion: '2025-05-13', useCdn: false})

  const batchSize = 25
  for (let index = 0; index < documents.length; index += batchSize) {
    const batch = documents.slice(index, index + batchSize)
    let transaction = client.transaction()
    batch.forEach((doc) => {
      transaction = transaction.createOrReplace(doc)
    })
    await transaction.commit()
    console.log(`Importados ${Math.min(index + batch.length, documents.length)}/${documents.length}`)
  }
}

function printSummary(migration) {
  const {local, groups, documents} = migration
  const summary = {
    mode: writeMode ? 'write' : 'dry-run',
    found: {
      posts: local.posts.length,
      tips: local.tips.length,
      draftProspects: local.draftProspects.length,
      glossaryTerms: local.glossary.length,
      rankingMetas: local.rankingsDisponiveis.length,
      rankingItems: local.rankings.length
    },
    prepared: {
      categories: groups.categories.length,
      authors: groups.authors.length,
      posts: groups.posts.length,
      tips: groups.tips.length,
      draftProspects: groups.draftProspects.length,
      draftGuideSettings: groups.draftGuideSettings.length,
      glossaryTerms: groups.glossaryTerms.length,
      rankings: groups.rankings.length,
      totalDocuments: documents.length
    },
    skipped: skipped.length,
    duplicates: duplicates.length,
    warnings: warnings.length
  }

  console.log('\nResumo da migracao local -> Sanity')
  console.table(summary.found)
  console.table(summary.prepared)
  console.log(`Ignorados: ${skipped.length}`)
  console.log(`Duplicados detectados: ${duplicates.length}`)
  console.log(`Avisos: ${warnings.length}`)

  if (skipped.length) console.log('\nIgnorados:\n- ' + skipped.join('\n- '))
  if (duplicates.length) console.log('\nDuplicados:\n- ' + duplicates.slice(0, 30).join('\n- '))
  if (warnings.length) console.log('\nAvisos:\n- ' + warnings.slice(0, 30).join('\n- '))
}

await readEnvFile(path.join(studioDir, '.env'))
const migration = await buildMigration()

await fs.writeFile(previewPath, JSON.stringify({
  generatedAt: new Date().toISOString(),
  writeMode,
  summary: {
    documents: migration.documents.length,
    categories: migration.groups.categories.length,
    authors: migration.groups.authors.length,
    posts: migration.groups.posts.length,
    tips: migration.groups.tips.length,
    draftProspects: migration.groups.draftProspects.length,
    draftGuideSettings: migration.groups.draftGuideSettings.length,
    glossaryTerms: migration.groups.glossaryTerms.length,
    rankings: migration.groups.rankings.length
  },
  warnings,
  skipped,
  duplicates,
  documents: migration.documents
}, null, 2))

printSummary(migration)
console.log(`\nPreview salvo em ${path.relative(rootDir, previewPath)}`)

if (writeMode) {
  await writeDocuments(migration.documents)
  console.log('\nMigracao real concluida com createOrReplace.')
} else {
  console.log('\nDry-run concluido. Nada foi escrito no Sanity.')
  console.log('Para importar de verdade: node scripts/migrate-local-data-to-sanity.mjs --write')
}
