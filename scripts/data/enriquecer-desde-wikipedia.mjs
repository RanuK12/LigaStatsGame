// Llena la base con lo que dice la ficha de cada jugador en la Wikipedia en español.
//
// El agujero, medido el 15/8 sobre 3.758 jugadores: 95 % sin goles de club, 94 % sin partidos,
// 39 % sin fecha de nacimiento. La ruleta muestra "Goles Club: 0" para casi todos, y —peor— el
// OVR de los 2.500 que no matchean con el dataset de FIFA se calcula con esas stats vacías, así
// que a todos les toca el mismo número: la mitad de la base vive entre 72 y 75.
//
// El camino, sin scrapear nada raro y sin claves:
//   1. Wikidata da los 7.619 futbolistas argentinos que tienen artículo en es.wikipedia, con su
//      fecha de nacimiento. Se cruzan con los nuestros por nombre + año.
//   2. La API de Wikipedia devuelve el wikitexto de a 50 títulos; de ahí sale la ficha
//      (scripts/data/wiki-ficha.mjs): partidos, goles, internacionalidades, altura, peso, puesto.
//   3. Se escribe SOLO lo que falta. Un dato que ya está en la base no se pisa.
//
// Todo queda cacheado en data/cache/, así que la segunda corrida no vuelve a pedir nada.
//
//   node scripts/data/enriquecer-desde-wikipedia.mjs [--dry] [--limite N]
import fs from 'node:fs'
import path from 'node:path'
import { fichasDeWikipedia } from './wiki-ficha.mjs'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'data')
const CACHE = path.join(DATA, 'cache')
const UA = { 'User-Agent': 'GambetaBot/1.0 (https://gambetafutbol.games; datos del juego)' }

const dry = process.argv.includes('--dry')
// Segundo pase: a los que no salen del directorio de Wikidata se los busca por nombre. El
// directorio se apoya en que el jugador tenga cargada la nacionalidad y la ocupación en
// Wikidata, y a los del ascenso y a los pibes muchas veces les falta. Medido sobre 20 al azar:
// siete tienen artículo igual.
const buscar = process.argv.includes('--buscar')
const limite = Number((process.argv.find((a) => a.startsWith('--limite=')) || '').split('=')[1] || 0)

const norm = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()

/** Claves de cruce: el nombre entero y apellido con inicial, que es como difieren las fuentes. */
function claves(nombre) {
  const w = norm(nombre).split(' ').filter(Boolean)
  if (w.length === 0) return []
  const k = new Set([w.join(' ')])
  if (w.length >= 2) {
    k.add(`${w[0]} ${w[w.length - 1]}`)
    k.add(`${w[0][0]} ${w[w.length - 1]}`)
  }
  return [...k]
}

async function sparql(query) {
  const u = 'https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(query)
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(u, { headers: UA })
      if (r.ok) return (await r.json()).results.bindings
    } catch { /* reintenta */ }
    await new Promise((res) => setTimeout(res, i * 5000))
  }
  return []
}

/** Los futbolistas argentinos con artículo en español. Se pide por décadas para no timeoutear. */
async function directorioWikidata() {
  const f = path.join(CACHE, 'wikidata-futbolistas-ar.json')
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'))
  const salida = []
  for (let desde = 1900; desde <= 2010; desde += 10) {
    const hasta = desde + 10
    const filas = await sparql(`
      SELECT ?j ?jLabel ?nac ?art WHERE {
        ?j wdt:P106 wd:Q937857 ; wdt:P27 wd:Q414 ; wdt:P569 ?nac .
        FILTER(YEAR(?nac) >= ${desde} && YEAR(?nac) < ${hasta})
        ?art schema:about ?j ; schema:isPartOf <https://es.wikipedia.org/> .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
      }`)
    for (const b of filas) {
      salida.push({
        qid: b.j.value.split('/').pop(),
        nombre: b.jLabel.value,
        nacimiento: b.nac.value.slice(0, 10),
        titulo: decodeURIComponent(b.art.value.split('/wiki/').pop()).replace(/_/g, ' '),
      })
    }
    console.log(`  ${desde}-${hasta}: ${filas.length}`)
    await new Promise((r) => setTimeout(r, 1200))
  }
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(f, JSON.stringify(salida, null, 1))
  return salida
}

const players = JSON.parse(fs.readFileSync(path.join(DATA, 'players.json'), 'utf8'))

console.log('Directorio de Wikidata…')
const directorio = await directorioWikidata()
console.log(`  ${directorio.length} futbolistas argentinos con artículo\n`)

const porClave = new Map()
for (const d of directorio) {
  for (const k of claves(d.nombre)) {
    if (!porClave.has(k)) porClave.set(k, [])
    porClave.get(k).push(d)
  }
}

/** El artículo de un jugador nuestro, si el cruce es inequívoco. */
function articuloDe(p) {
  const año = Number(String(p.birthDate || '').slice(0, 4)) || null
  const vistos = new Map()
  for (const k of claves(p.name)) for (const d of porClave.get(k) || []) vistos.set(d.qid, d)
  let cands = [...vistos.values()]
  if (cands.length === 0) return null
  // El año de nacimiento desempata; si no lo tenemos y hay varios, no se elige a dedo.
  if (año) {
    const mismos = cands.filter((d) => Math.abs(Number(d.nacimiento.slice(0, 4)) - año) <= 1)
    if (mismos.length) cands = mismos
  }
  if (cands.length > 1) {
    const exactos = cands.filter((d) => norm(d.nombre) === norm(p.name))
    if (exactos.length === 1) cands = exactos
  }
  return cands.length === 1 ? cands[0] : null
}

const objetivo = []
const sinCruce = []
for (const p of players) {
  const d = articuloDe(p)
  if (d) objetivo.push({ p, d })
  else sinCruce.push(p)
}
console.log(`Cruzados con Wikipedia: ${objetivo.length}/${players.length}`)

/**
 * Buscar el artículo por nombre, para los que el directorio no encontró.
 *
 * Se acepta solo si el título contiene el apellido: la búsqueda de Wikipedia siempre devuelve
 * algo —para "Jonás Luna" devuelve "25 de mayo"— y un artículo equivocado mete datos de otra
 * persona, que es peor que no tener datos.
 */
async function buscarArticulo(p) {
  const club = (p.clubs || [])[0]?.name || ''
  const u = 'https://es.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=3&srsearch='
    + encodeURIComponent(`${p.name} futbolista ${club}`)
  try {
    const j = await (await fetch(u, { headers: UA })).json()
    const apellido = norm(p.name).split(' ').pop()
    for (const r of j?.query?.search || []) {
      const t = norm(r.title)
      if (apellido.length > 3 && t.includes(apellido)) return { titulo: r.title, qid: null, nombre: r.title }
    }
  } catch { /* sin resultado */ }
  return null
}

if (buscar) {
  const cacheBusq = path.join(CACHE, 'wiki-busquedas.json')
  const previas = fs.existsSync(cacheBusq) ? JSON.parse(fs.readFileSync(cacheBusq, 'utf8')) : {}
  let nuevas = 0
  const pendientesBusqueda = sinCruce.filter((p) => !(p.id in previas))
  console.log(`Buscando artículo de ${pendientesBusqueda.length} jugadores sin cruce…`)
  for (const [i, p] of pendientesBusqueda.entries()) {
    previas[p.id] = await buscarArticulo(p)
    if (previas[p.id]) nuevas++
    if ((i + 1) % 100 === 0) {
      fs.writeFileSync(cacheBusq, JSON.stringify(previas))
      console.log(`  ${i + 1}/${pendientesBusqueda.length} · encontrados ${nuevas}`)
    }
    await new Promise((r) => setTimeout(r, 220))
  }
  fs.mkdirSync(CACHE, { recursive: true })
  fs.writeFileSync(cacheBusq, JSON.stringify(previas))
  for (const p of sinCruce) if (previas[p.id]) objetivo.push({ p, d: previas[p.id] })
  console.log(`  con artículo por búsqueda: ${Object.values(previas).filter(Boolean).length}`)
}

const aPedir = limite ? objetivo.slice(0, limite) : objetivo

// ── Fichas, con caché en disco ──
const fCache = path.join(CACHE, 'wiki-fichas.json')
const cache = fs.existsSync(fCache) ? JSON.parse(fs.readFileSync(fCache, 'utf8')) : {}
const pendientes = aPedir.map(({ d }) => d.titulo).filter((t) => !(t in cache))
console.log(`Fichas: ${aPedir.length - pendientes.length} en caché, ${pendientes.length} por pedir`)

if (pendientes.length) {
  let hechas = 0
  for (let i = 0; i < pendientes.length; i += 50) {
    const tanda = pendientes.slice(i, i + 50)
    const res = await fichasDeWikipedia(tanda)
    for (const t of tanda) cache[t] = res[t]?.ficha || null
    hechas += tanda.length
    fs.mkdirSync(CACHE, { recursive: true })
    fs.writeFileSync(fCache, JSON.stringify(cache))
    if (hechas % 250 === 0 || hechas === pendientes.length) console.log(`  ${hechas}/${pendientes.length}`)
  }
}

// ── Escribir lo que falta ──
const puesto = (texto) => {
  const t = norm(texto)
  if (/guardameta|portero|arquero/.test(t)) return 'GK'
  if (/lateral izquierdo/.test(t)) return 'LB'
  if (/lateral derecho/.test(t)) return 'RB'
  if (/defensa|defensor|zaguero/.test(t)) return 'CB'
  if (/volante defensivo|mediocentro defensivo/.test(t)) return 'CDM'
  if (/enganche|mediapunta|volante ofensivo/.test(t)) return 'CAM'
  if (/centrocampista|mediocampista|volante|mediocentro/.test(t)) return 'CM'
  if (/extremo|puntero/.test(t)) return 'RW'
  if (/delantero|atacante|goleador/.test(t)) return 'ST'
  return null
}

const suma = { birthDate: 0, height: 0, weight: 0, capsNationalTeam: 0, goalsNationalTeam: 0, goalsClub: 0, capsClub: 0, position: 0 }
let tocados = 0

for (const { p, d } of aPedir) {
  const f = cache[d.titulo]
  if (!f) continue
  let cambio = false
  const poner = (campo, valor) => {
    if (valor == null || valor === '' || valor === 0) return
    const actual = p[campo]
    if (actual != null && actual !== '' && actual !== 0) return // lo que ya está no se pisa
    p[campo] = valor
    suma[campo]++
    cambio = true
  }
  poner('birthDate', f.nacimiento)
  poner('height', f.altura)
  poner('weight', f.peso)
  poner('capsNationalTeam', f.caps)
  poner('goalsNationalTeam', f.golesSeleccion)
  poner('goalsClub', f.golesClub)
  poner('capsClub', f.partidosClub)
  if (!p.position) {
    const pos = puesto(f.posicion)
    if (pos) { p.position = pos; suma.position++; cambio = true }
  }
  if (cambio) { p.fuenteFicha = d.titulo; tocados++ }
}

console.log(`\n${tocados} jugadores enriquecidos`)
for (const [k, v] of Object.entries(suma)) if (v) console.log(`  ${k}: +${v}`)

if (dry) {
  console.log('\n--dry: no se escribió players.json')
} else {
  fs.writeFileSync(path.join(DATA, 'players.json'), JSON.stringify(players, null, 2))
  console.log('\nplayers.json actualizado')
}
