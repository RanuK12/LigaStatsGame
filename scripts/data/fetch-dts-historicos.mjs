// Los DT argentinos de los últimos 40 años, cruzados contra TRES fuentes.
//
//   node scripts/data/fetch-dts-historicos.mjs        → data/derived/dts.json
//   node scripts/data/fetch-dts-historicos.mjs --ver  → muestra el cruce y no escribe
//
// Mismo criterio que los planteles históricos del juego: un dato entra si lo confirman al menos
// dos fuentes independientes, y queda registrado CUÁLES lo confirmaron. Nada escrito de memoria.
//
// Las tres fuentes, y por qué hacen falta las tres:
//   A · Wikidata (P6087, "entrenador de"). Desparejísima: Bielsa tiene 12 equipos con fechas y
//       Bianchi tiene CERO. Sirve para confirmar, no como base.
//   B · Wikipedia en español (ficha del artículo). Tiene el debut y el retiro como entrenador.
//   C · Wikipedia en inglés, tabla "Team | From | To". Es la más estructurada y la más completa:
//       es la que trae la carrera club por club con fechas.
//
// Lo primero que se probó fue preguntarle a Wikidata "dame los entrenadores argentinos y sus
// clubes". Devuelve basura —selecciones y juveniles como clubes, entidades tipo "2020 LA Galaxy
// season", y a Lionel Messi listado como club de un técnico— y encima le faltan los grandes.
// Preguntando club por club sale mejor pero solo trae al técnico ACTUAL: Gallardo, Úbeda,
// Costas. De historia, nada.
//
// La lista de nombres de abajo NO es el dato: es a quién hay que ir a buscar. Los clubes y los
// años salen de las fuentes, igual que `data/historicos/candidatos.json` para los planteles.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const SALIDA = path.join(ROOT, 'data', 'derived', 'dts.json')
const UA = { 'User-Agent': 'GambetaGame/1.0 (https://gambetafutbol.games)' }
const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

/** A quiénes ir a buscar. Los datos de cada uno los ponen las fuentes, no esta lista. */
const A_BUSCAR = [
  'Carlos Bianchi', 'Carlos Bilardo', 'César Luis Menotti', 'Marcelo Bielsa', 'Alfio Basile',
  'Ricardo La Volpe', 'Héctor Cúper', 'Diego Simeone', 'Marcelo Gallardo', 'Gerardo Martino',
  'Miguel Ángel Russo', 'Ricardo Gareca', 'Edgardo Bauza', 'Jorge Sampaoli', 'Mauricio Pochettino',
  'Ramón Díaz', 'Daniel Passarella', 'Óscar Washington Tabárez', 'José Pekerman', 'Néstor Pekerman',
  'Julio César Falcioni', 'Gustavo Alfaro', 'Eduardo Berizzo', 'Matías Almeyda', 'Hernán Crespo',
  'Gabriel Heinze', 'Diego Maradona', 'Sebastián Beccacece', 'Martín Demichelis', 'Gustavo Quinteros',
  'Ariel Holan', 'Antonio Mohamed', 'Guillermo Barros Schelotto', 'Jorge Almirón', 'Eduardo Domínguez',
  'Gustavo Costas', 'Néstor Gorosito', 'Rubén Darío Insúa', 'Gabriel Milito', 'Fernando Gago',
  'Lionel Scaloni', 'Mauricio Pellegrino', 'Luis Zubeldía', 'Facundo Sava', 'Diego Cocca',
]

const NO_ES_CLUB = /national|selecci|sub-?\d|u-?\d\d|olympic|women|federation|asociaci/i
const norm = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/\b(club|atletico|atlético|deportivo|de|del|fc|cf|ac|sc|the)\b/g, '')
    .replace(/[^a-z0-9]/g, '').trim()

const anioDe = (t) => {
  const m = String(t).match(/(19\d\d|20\d\d)/)
  return m ? Number(m[1]) : null
}

async function traer(url) {
  for (let i = 1; i <= 3; i++) {
    try {
      const r = await fetch(url, { headers: UA })
      if (r.ok) return await r.text()
      if (r.status === 404) return null
    } catch { /* reintenta */ }
    await dormir(i * 2500)
  }
  return null
}

/* ── Fuente C: Wikipedia en inglés, tabla "Team | From | To" ──────────────── */
async function fuenteIngles(nombre) {
  const h = await traer(`https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(nombre.replace(/ /g, '_'))}`)
  if (!h) return []
  const salida = []
  for (const t of h.match(/<table[^>]*wikitable[^>]*>[\s\S]*?<\/table>/g) ?? []) {
    if (!/>\s*Team\s*</.test(t) || !/>\s*From\s*</.test(t)) continue
    for (const fila of t.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? []) {
      const celdas = [...(fila.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g) ?? [])].map((c) =>
        c.replace(/<[^>]+>/g, '').replace(/&\w+;/g, ' ').replace(/\s+/g, ' ').trim(),
      )
      if (celdas.length < 3) continue
      const [equipo, desde, hasta] = celdas
      if (!equipo || equipo === 'Team' || NO_ES_CLUB.test(equipo)) continue
      const d = anioDe(desde)
      if (!d) continue
      salida.push({ club: equipo, desde: d, hasta: anioDe(hasta) })
    }
  }
  return salida
}

/* ── Fuente A: Wikidata P6087 ─────────────────────────────────────────────── */
async function fuenteWikidata(nombre) {
  const b = await traer(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=es&type=item&limit=1&search=${encodeURIComponent(nombre)}`,
  )
  if (!b) return []
  let qid = null
  try { qid = JSON.parse(b).search?.[0]?.id } catch { return [] }
  if (!qid) return []
  const q = `SELECT ?eqLabel ?d ?h WHERE { wd:${qid} p:P6087 ?s . ?s ps:P6087 ?eq . OPTIONAL{?s pq:P580 ?d} OPTIONAL{?s pq:P582 ?h} SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". } }`
  const r = await traer('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(q))
  if (!r) return []
  try {
    return JSON.parse(r).results.bindings
      .map((x) => ({ club: x.eqLabel?.value ?? '', desde: anioDe(x.d?.value), hasta: anioDe(x.h?.value) }))
      .filter((x) => x.club && !NO_ES_CLUB.test(x.club))
  } catch { return [] }
}

/* ── Fuente B: Wikipedia en español, tabla "Equipo | … | Temporada" ───────── */
/**
 * El artículo en español trae la trayectoria como entrenador en una tabla con cabecera
 * "Equipo | Div. | Temporada". El primer intento fue leer el texto plano buscando "1998-2004
 * Boca Juniors": no sirve —de Bianchi solo sacaba la palabra "Sucesor", de las cajas de
 * sucesión— y por eso ningún técnico se confirmaba.
 */
async function fuenteEspanol(nombre) {
  const h = await traer(`https://es.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(nombre.replace(/ /g, '_'))}`)
  if (!h) return []
  const salida = []
  // SOLO las tablas que vienen después de un título que hable de entrenador o director técnico.
  // El artículo trae la carrera COMO JUGADOR con la misma cabecera "Equipo | Div | Temporada", y
  // sin este corte se confirmaban clubes donde el tipo jugó y nunca dirigió: de Bianchi salían
  // Vélez y PSG —donde fue goleador— como si los hubiera dirigido.
  const desdeEntrenador = h.search(/<h[23][^>]*>[^<]*(entrenador|director t[ée]cnico|dt)\b/i)
  const zona = desdeEntrenador > 0 ? h.slice(desdeEntrenador) : ''
  for (const t of zona.match(/<table[^>]*>[\s\S]*?<\/table>/g) ?? []) {
    const celda = (c) => c.replace(/<[^>]+>/g, '').replace(/&\w+;/g, ' ').replace(/\s+/g, ' ').trim()
    const cab = [...(t.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g) ?? [])].slice(0, 8).map(celda)
    // La tabla de entrenador: tiene Equipo y Temporada. La de jugador también, y no molesta:
    // un club donde jugó y además dirigió lo confirman igual las otras dos fuentes.
    if (!cab.some((c) => /^equipo$/i.test(c)) || !cab.some((c) => /temporada/i.test(c))) continue
    // Las tablas usan `rowspan`: el nombre del club aparece UNA vez y las filas siguientes
    // arrancan con la temporada. Sin arrastrar el último club visto, casi ninguna fila sirve y
    // ningún técnico llegaba a dos fuentes.
    let ultimoClub = null
    for (const fila of t.match(/<tr[^>]*>[\s\S]*?<\/tr>/g) ?? []) {
      const celdas = [...(fila.match(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/g) ?? [])].map(celda)
      if (celdas.length < 2) continue
      const primera = celdas[0]
      // Si la primera celda no es un año, es el nombre del club de este bloque.
      if (primera && !/^\d/.test(primera) && !/^equipo$/i.test(primera) && primera.length > 2) {
        // El nombre viene con el país pegado y sin separador: "Stade de ReimsFRA Francia".
        // Es lo que hacía que NADA matcheara contra las otras dos fuentes.
        const limpio = primera.replace(/[A-Z]{3}\s+[A-ZÁÉÍÓÚ][a-záéíóúñ ]+$/, '').trim()
        ultimoClub = !limpio || /^total/i.test(limpio) || NO_ES_CLUB.test(limpio) ? null : limpio
      }
      if (!ultimoClub) continue
      const anio = celdas.map(anioDe).find(Boolean)
      if (!anio) continue
      salida.push({ club: ultimoClub, desde: anio, hasta: null })
    }
  }
  return salida
}

/* ── El cruce ─────────────────────────────────────────────────────────────── */

console.log(`Cruzando ${A_BUSCAR.length} técnicos contra tres fuentes…\n`)
const resultado = []
let sinDatos = 0

for (const [i, nombre] of A_BUSCAR.entries()) {
  const [c, a, b] = [await fuenteIngles(nombre), await fuenteWikidata(nombre), await fuenteEspanol(nombre)]
  await dormir(700)

  // Un paso por un club entra si DOS fuentes lo mencionan. Se compara por nombre normalizado
  // (sin "Club", "Atlético", tildes) porque cada fuente lo escribe distinto.
  const porClub = new Map()
  const sumar = (lista, fuente) => {
    for (const x of lista) {
      const k = norm(x.club)
      if (!k) continue
      const cur = porClub.get(k) ?? { club: x.club, fuentes: new Set(), desde: null, hasta: null }
      cur.fuentes.add(fuente)
      // Se toma el año más temprano y el más tardío que dé cualquier fuente.
      if (x.desde && (!cur.desde || x.desde < cur.desde)) cur.desde = x.desde
      if (x.hasta && (!cur.hasta || x.hasta > cur.hasta)) cur.hasta = x.hasta
      // El nombre más largo suele ser el completo ("Club Atlético Boca Juniors").
      if (x.club.length > cur.club.length) cur.club = x.club
      porClub.set(k, cur)
    }
  }
  sumar(c, 'en')
  sumar(a, 'wikidata')
  sumar(b, 'es')

  const confirmados = [...porClub.values()]
    .filter((x) => x.fuentes.size >= 2)
    .map((x) => ({ club: x.club, desde: x.desde, hasta: x.hasta, fuentes: [...x.fuentes].sort() }))
    .sort((p, q) => (p.desde ?? 9999) - (q.desde ?? 9999))

  const marca = `${String(i + 1).padStart(2)}/${A_BUSCAR.length}`
  if (confirmados.length === 0) {
    sinDatos++
    console.log(`${marca} ✗ ${nombre.padEnd(28)} en=${c.length} wd=${a.length} es=${b.length} → 0 confirmados`)
    continue
  }

  const anios = confirmados.flatMap((x) => [x.desde, x.hasta]).filter(Boolean)
  resultado.push({
    id: norm(nombre),
    nombre,
    clubes: confirmados,
    desde: Math.min(...anios),
    hasta: Math.max(...anios),
    dirigidos: confirmados.length,
  })
  console.log(
    `${marca} ✓ ${nombre.padEnd(28)} ${String(confirmados.length).padStart(2)} clubes confirmados · ${confirmados.slice(0, 4).map((x) => x.club).join(', ')}`,
  )
}

resultado.sort((a, b) => b.dirigidos - a.dirigidos)
console.log(`\n${resultado.length} técnicos con al menos un club confirmado por dos fuentes · ${sinDatos} sin datos suficientes`)

if (process.argv.includes('--ver')) process.exit(0)

fs.mkdirSync(path.dirname(SALIDA), { recursive: true })
fs.writeFileSync(
  SALIDA,
  JSON.stringify({ generado: new Date().toISOString().slice(0, 10), fuentes: ['en.wikipedia', 'wikidata', 'es.wikipedia'], dts: resultado }, null, 1),
)
console.log(`→ ${path.relative(ROOT, SALIDA)} · ${(fs.statSync(SALIDA).size / 1024).toFixed(1)} kB`)
