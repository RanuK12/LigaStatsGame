// Fotos de las leyendas (las que salen en la ruleta y en la carta de walkout).
//
//   node scripts/data/fetch-legend-photos.mjs [--dry] [--all]
//
// Fuente: Wikidata P18 (imagen del jugador) → archivo en Wikimedia Commons servido por
// Special:FilePath con ancho fijo. El QID sale del caché de stats
// (data/wikidata-stats-cache.json); si ahí no está, se busca por nombre y se verifica que
// la entidad sea un futbolista (P106 = Q937857) para no traer la foto de un homónimo.
//
// Por defecto solo toca leyendas sin foto; con --all incluye a los mejores 40 por rating.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PLAYERS = path.join(ROOT, 'data', 'players.json')
const CACHE = path.join(ROOT, 'data', 'wikidata-stats-cache.json')
const DRY = process.argv.includes('--dry')
const ALL = process.argv.includes('--all')
const WIDTH = 640
const FUTBOLISTA = 'Q937857'

const players = JSON.parse(fs.readFileSync(PLAYERS, 'utf8'))
const cache = JSON.parse(fs.readFileSync(CACHE, 'utf8'))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
// Wikidata corta con 429 si se la apura: reintento con espera creciente.
const api = async (params, intento = 0) => {
  const url = `https://www.wikidata.org/w/api.php?${new URLSearchParams({ format: 'json', ...params })}`
  const r = await fetch(url, { headers: { 'User-Agent': 'GambetaBot/1.0 (gambetafutbol.games)' } })
  if (r.status === 429 && intento < 4) {
    await sleep(2000 * (intento + 1))
    return api(params, intento + 1)
  }
  if (!r.ok) throw new Error(`wikidata ${r.status}`)
  return r.json()
}

const commonsUrl = (file) =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, '_'))}?width=${WIDTH}`

/** Busca el QID de un futbolista por nombre (verificando P106 = futbolista). */
async function findQid(name) {
  const s = await api({ action: 'wbsearchentities', search: name, language: 'es', uselang: 'es', limit: '5', type: 'item' })
  for (const hit of s.search || []) {
    const e = await api({ action: 'wbgetentities', ids: hit.id, props: 'claims' })
    const claims = e.entities?.[hit.id]?.claims
    const ocupaciones = (claims?.P106 || []).map((c) => c.mainsnak?.datavalue?.value?.id)
    if (ocupaciones.includes(FUTBOLISTA)) return { qid: hit.id, claims }
    await sleep(120)
  }
  return null
}

/** Última chance: la foto de la ficha de Wikipedia en español. */
async function wikipediaFoto(nombre) {
  try {
    const r = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(nombre.replace(/ /g, '_'))}`, {
      headers: { 'User-Agent': 'GambetaBot/1.0 (gambetafutbol.games)' },
    })
    if (!r.ok) return null
    const j = await r.json()
    return j?.originalimage?.source || j?.thumbnail?.source || null
  } catch {
    return null
  }
}

const objetivo = players.filter((p) => {
  if (p.image) return false
  return p.legendary || (ALL && (p.rating || 0) >= 85)
})

console.log(`Buscando foto para ${objetivo.length} jugadores...`)
let ok = 0
const fallos = []

for (const p of objetivo) {
  try {
    let qid = cache[p.id]?.qid || null
    let claims = null
    if (qid) {
      const e = await api({ action: 'wbgetentities', ids: qid, props: 'claims' })
      claims = e.entities?.[qid]?.claims || null
    }
    if (!claims) {
      const hit = await findQid(p.fullName || p.name)
      if (hit) { qid = hit.qid; claims = hit.claims }
    }
    const file = claims?.P18?.[0]?.mainsnak?.datavalue?.value
    // Sin P18 (pasa con algunos históricos): la foto de la Wikipedia en español.
    if (!file) {
      const url = await wikipediaFoto(p.fullName || p.name) || await wikipediaFoto(p.name)
      if (url) { p.image = url; ok++; console.log(`  ✓ ${p.name} → (Wikipedia es)`) }
      else fallos.push(p.name)
      await sleep(400)
      continue
    }
    const url = commonsUrl(file)
    const head = await fetch(url, { method: 'HEAD' })
    if (!head.ok) { fallos.push(`${p.name} (imagen ${head.status})`); await sleep(150); continue }
    p.image = url
    ok++
    console.log(`  ✓ ${p.name} → ${file}`)
  } catch (e) {
    fallos.push(`${p.name} (${e.message})`)
  }
  await sleep(700)
}

console.log(`\nCon foto nueva: ${ok} | sin resultado: ${fallos.length}`)
if (fallos.length) console.log('Sin foto:', fallos.join(', '))

if (DRY) { console.log('\n[dry-run] no se escribió nada.'); process.exit(0) }
fs.copyFileSync(PLAYERS, `${PLAYERS}.bak`)
fs.writeFileSync(PLAYERS, JSON.stringify(players))
console.log(`\nplayers.json actualizado (backup en players.json.bak). Correr: npm run build:data`)
