// Trae los CLUBES de las ligas jugables del modo carrera desde Wikidata.
//
// Para el modo carrera no hacen falta planteles: hace falta la lista de clubes, su fuerza y la
// estructura del campeonato. El plantel solo lo necesita el draft, que es y sigue siendo
// argentino de Primera.
//
// Cubre el ascenso argentino y las ligas de Uruguay, Chile, Colombia, Perú, Paraguay y Brasil,
// con primera y segunda división donde existan, que es lo que permite el arranque "de pibe del
// Ascenso" que es el gancho de El Ídolo.
//
// LOS QID ESTÁN VERIFICADOS, NO ADIVINADOS. Buscar "Primera División de Uruguay" en Wikidata
// devuelve, entre otras cosas, un artículo sobre lavado de cerebro. Cada uno de estos se validó
// contando cuántos clubes le cuelgan por P118; el que da cero no entra.
//
//   node scripts/data/fetch-ligas.mjs [--liga <id>] [--forzar]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DIR = path.join(ROOT, 'data', 'ligas')
const SALIDA = path.join(DIR, 'clubes.json')
const UA = { 'User-Agent': 'GambetaGame/1.0 (https://gambetafutbol.games)' }

export const LIGAS = [
  // Argentina. La Primera ya está en clubs.json con sus planteles; acá va el ascenso.
  { id: 'ar-2', qid: 'Q934724', pais: 'Argentina', iso: 'AR', bandera: '🇦🇷', nombre: 'Primera Nacional', division: 2 },
  { id: 'ar-3', qid: 'Q1146403', pais: 'Argentina', iso: 'AR', bandera: '🇦🇷', nombre: 'Primera B Metropolitana', division: 3 },
  { id: 'ar-3f', qid: 'Q17446411', pais: 'Argentina', iso: 'AR', bandera: '🇦🇷', nombre: 'Torneo Federal A', division: 3 },

  { id: 'uy-1', qid: 'Q287453', pais: 'Uruguay', iso: 'UY', bandera: '🇺🇾', nombre: 'Primera División', division: 1 },
  { id: 'uy-2', qid: 'Q1033083', pais: 'Uruguay', iso: 'UY', bandera: '🇺🇾', nombre: 'Segunda División', division: 2 },

  { id: 'cl-1', qid: 'Q606832', pais: 'Chile', iso: 'CL', bandera: '🇨🇱', nombre: 'Primera División', division: 1 },
  { id: 'cl-2', qid: 'Q2686290', pais: 'Chile', iso: 'CL', bandera: '🇨🇱', nombre: 'Primera B', division: 2 },

  { id: 'co-1', qid: 'Q1033349', pais: 'Colombia', iso: 'CO', bandera: '🇨🇴', nombre: 'Categoría Primera A', division: 1 },
  { id: 'co-2', qid: 'Q635198', pais: 'Colombia', iso: 'CO', bandera: '🇨🇴', nombre: 'Categoría Primera B', division: 2 },

  { id: 'pe-1', qid: 'Q606652', pais: 'Perú', iso: 'PE', bandera: '🇵🇪', nombre: 'Liga 1', division: 1 },
  { id: 'pe-2', qid: 'Q507576', pais: 'Perú', iso: 'PE', bandera: '🇵🇪', nombre: 'Liga 2', division: 2 },

  { id: 'py-1', qid: 'Q954911', pais: 'Paraguay', iso: 'PY', bandera: '🇵🇾', nombre: 'División Profesional', division: 1 },
  { id: 'py-2', qid: 'Q786925', pais: 'Paraguay', iso: 'PY', bandera: '🇵🇾', nombre: 'División Intermedia', division: 2 },

  { id: 'br-1', qid: 'Q206813', pais: 'Brasil', iso: 'BR', bandera: '🇧🇷', nombre: 'Série A', division: 1 },
  { id: 'br-2', qid: 'Q610175', pais: 'Brasil', iso: 'BR', bandera: '🇧🇷', nombre: 'Série B', division: 2 },
]

const args = process.argv.slice(2)
const forzar = args.includes('--forzar')
const soloLiga = args.includes('--liga') ? args[args.indexOf('--liga') + 1] : null

const dormir = (ms) => new Promise((r) => setTimeout(r, ms))

async function sparql(query) {
  for (let intento = 1; intento <= 4; intento++) {
    try {
      const r = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, { headers: UA })
      if (r.ok) return (await r.json()).results.bindings
    } catch {
      /* el endpoint público se cae seguido; se reintenta */
    }
    if (intento < 4) await dormir(intento * 4000)
  }
  return null
}

/**
 * Los clubes de una liga, con lo que hace falta para mostrarlos y para calcular su fuerza.
 *
 * Los títulos se cuentan con P1346 (ganador de) sobre la liga en cuestión: es lo único que
 * distingue de forma objetiva a Peñarol de Boston River sin que nadie los ordene a mano.
 */
async function clubesDe(liga) {
  const filas = await sparql(`
    SELECT ?club ?clubLabel ?fundado ?estadioLabel ?ciudadLabel ?apodo (COUNT(DISTINCT ?t) AS ?titulos) WHERE {
      ?club wdt:P118 wd:${liga.qid} .
      OPTIONAL { ?club wdt:P571 ?fundado }
      OPTIONAL { ?club wdt:P115 ?estadio }
      OPTIONAL { ?club wdt:P159 ?ciudad }
      OPTIONAL { ?club wdt:P1449 ?apodo }
      OPTIONAL { ?t wdt:P3450 wd:${liga.qid} ; wdt:P1346 ?club }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    GROUP BY ?club ?clubLabel ?fundado ?estadioLabel ?ciudadLabel ?apodo`)
  if (!filas) return null

  const porQid = new Map()
  for (const b of filas) {
    const qid = b.club.value.split('/').pop()
    if (porQid.has(qid)) continue
    const nombre = b.clubLabel.value
    // Un QID sin etiqueta sale como "Q12345": eso no es un nombre y no se muestra.
    if (/^Q\d+$/.test(nombre)) continue
    porQid.set(qid, {
      qid,
      nombre,
      fundado: Number((b.fundado?.value || '').slice(0, 4)) || null,
      estadio: b.estadioLabel?.value || '',
      ciudad: b.ciudadLabel?.value || '',
      apodo: b.apodo?.value || '',
      titulos: Number(b.titulos?.value || 0),
    })
  }
  return [...porQid.values()]
}

function previo() {
  try {
    return JSON.parse(fs.readFileSync(SALIDA, 'utf8'))
  } catch {
    return { ligas: [] }
  }
}

async function main() {
  fs.mkdirSync(DIR, { recursive: true })
  const anterior = previo()
  const yaEstan = new Map(anterior.ligas.map((l) => [l.id, l]))

  const objetivo = soloLiga ? LIGAS.filter((l) => l.id === soloLiga) : LIGAS
  if (!objetivo.length) {
    console.error(`Liga desconocida. Opciones: ${LIGAS.map((l) => l.id).join(', ')}`)
    process.exit(1)
  }

  const salida = []
  for (const liga of objetivo) {
    if (yaEstan.has(liga.id) && !forzar) {
      salida.push(yaEstan.get(liga.id))
      console.log(`   · ${liga.pais} ${liga.nombre}: ya estaba (${yaEstan.get(liga.id).clubes.length})`)
      continue
    }
    const clubes = await clubesDe(liga)
    await dormir(1500)
    if (!clubes || clubes.length < 6) {
      console.log(`   ⚠ ${liga.pais} ${liga.nombre}: ${clubes ? clubes.length : 'sin respuesta'} — queda para la próxima`)
      if (yaEstan.has(liga.id)) salida.push(yaEstan.get(liga.id))
      continue
    }
    console.log(`   ✓ ${liga.pais} ${liga.nombre}: ${clubes.length} clubes`)
    salida.push({ ...liga, clubes: clubes.sort((a, b) => b.titulos - a.titulos || a.nombre.localeCompare(b.nombre, 'es')) })
  }

  // Las ligas que no se pidieron esta vez no se pierden.
  for (const [id, l] of yaEstan) if (!salida.some((s) => s.id === id)) salida.push(l)

  fs.writeFileSync(
    SALIDA,
    JSON.stringify(
      {
        generado: new Date().toISOString().slice(0, 10),
        fuente: 'Wikidata: P118 (liga), P1346 (ganador) sobre P3450',
        ligas: salida.sort((a, b) => a.id.localeCompare(b.id)),
      },
      null,
      1,
    ),
  )

  const total = salida.reduce((a, l) => a + l.clubes.length, 0)
  console.log(`\n${salida.length} ligas, ${total} clubes → data/ligas/clubes.json`)
}

main()
