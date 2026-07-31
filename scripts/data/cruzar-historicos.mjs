// Cruza tres fuentes independientes para decidir qué es verdad antes de tocar el juego.
//
// Ninguna fuente sola alcanza: Wikidata devolvió "Boca" como campeón de la Libertadores 2018,
// que ganó River. Lo que una fuente afirma sola es una hipótesis; lo que dos afirman es un dato.
//
//   FUENTE A · Wikidata (P54 + P413 + P1350/P1351): estructurada, buena para planteles y stats,
//              floja para palmarés.
//   FUENTE B · Wikipedia en español (artículo del club y de la temporada): buena para hitos y
//              para el plantel escrito en prosa.
//   FUENTE C · nuestra propia base (data/players.json, 2.939 jugadores ya curados y con OVR
//              calculado): la que más confianza tiene para los jugadores que ya conocemos.
//
// Reglas del cruce:
//   · HITO del equipo → confirmado si Wikipedia lo menciona con ese año. Si no, queda "sin
//     confirmar" y el equipo entra igual pero con el hito marcado para revisión humana.
//   · JUGADOR en el plantel → entra si lo respaldan AL MENOS DOS fuentes.
//   · OVR → si el jugador ya está en nuestra base, manda nuestro rating (ya es data-driven).
//     Si es nuevo, se calcula con la MISMA fórmula de recompute-ovr.mjs sobre las stats de
//     Wikidata. Nunca a ojo.
//
//   node scripts/data/cruzar-historicos.mjs [--limit N]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DIR = path.join(ROOT, 'data', 'historicos')
const UA = { 'User-Agent': 'GambetaGame/1.0 (https://gambetafutbol.games)' }
const dormir = (ms) => new Promise(r => setTimeout(r, ms))
const clamp = (n, a, b) => Math.max(a, Math.min(b, n))

const argLimit = process.argv.indexOf('--limit')
const limite = argLimit >= 0 ? Number(process.argv[argLimit + 1]) : Infinity

// ── normalización de nombres: "Juan Román Riquelme" == "juan roman riquelme" ──
const norm = (s) => (s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()

/** Apellido + inicial, para cruzar "C. Tevez" con "Carlos Tevez" sin unir homónimos distintos. */
const clave = (s) => {
  const p = norm(s).split(' ').filter(Boolean)
  return p.length < 2 ? p.join('') : `${p[0][0]}|${p[p.length - 1]}`
}

// ── FUENTE C: nuestra base ──
const nuestros = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'players.json'), 'utf8'))
const porClave = new Map()
for (const p of nuestros) {
  const k = clave(p.name)
  if (!porClave.has(k)) porClave.set(k, [])
  porClave.get(k).push(p)
}

/** Años en que un jugador de nuestra base estuvo en actividad, según lo que tenemos cargado. */
function ventanaActiva(p) {
  const años = []
  const m = /(\d{4})\s*[-–]\s*(\d{4})?/.exec(String(p.activeYears || ''))
  if (m) { años.push(Number(m[1])); años.push(Number(m[2] || 2026)) }
  for (const c of p.clubs || []) {
    const mm = /(\d{4})(?:\s*[-–]\s*(\d{4}))?/.exec(String(c.years || ''))
    if (mm) { años.push(Number(mm[1])); años.push(Number(mm[2] || mm[1])) }
  }
  return años.length ? [Math.min(...años), Math.max(...años)] : null
}

/**
 * El mismo jugador, no un homónimo de otra época.
 *
 * Apellido + inicial alcanza para cruzar "C. Tevez" con "Carlos Tevez", pero mete a Milton
 * Delgado (debutó en 2023) en el Boca 2000 y le pega su OVR actual. Se exige además que la
 * carrera del jugador incluya esa temporada, con un margen de un año por datos redondeados.
 */
function deNuestraBase(nombre, season) {
  const candidatos = porClave.get(clave(nombre)) || []
  const año = Number(season)
  return candidatos.find(p => {
    const v = ventanaActiva(p)
    return v && año >= v[0] - 1 && año <= v[1] + 1
  }) || null
}

// ── FUENTE B: Wikipedia en español ──
async function textoWiki(titulo) {
  const u = `https://es.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(titulo)}`
  try {
    const j = await (await fetch(u, { headers: UA })).json()
    const pages = j?.query?.pages || {}
    const first = Object.values(pages)[0]
    return first?.extract || ''
  } catch {
    return ''
  }
}

/**
 * Extractos de Wikipedia de MUCHOS títulos en una sola request (la API acepta hasta 50).
 *
 * Confirmar a un jugador contra el artículo general del club no sirve: ese artículo no nombra al
 * plantel entero, y por eso se caían planteles buenos. La confirmación fuerte es el artículo DEL
 * JUGADOR nombrando al club: es prosa escrita por otra gente, independiente de los datos
 * estructurados de donde salió el nombre.
 */
async function extractosDe(titulos) {
  const out = {}
  // La API devuelve UN solo extracto completo por request; con exintro permite 20. La
  // introducción alcanza: es donde el artículo de un futbolista nombra sus clubes.
  for (let i = 0; i < titulos.length; i += 20) {
    const tanda = titulos.slice(i, i + 20)
    const u = 'https://es.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&exintro=1&exlimit=max&redirects=1&titles='
      + encodeURIComponent(tanda.join('|'))
    try {
      const j = await (await fetch(u, { headers: UA })).json()
      const normaliz = {}
      for (const n of j?.query?.normalized || []) normaliz[n.to] = n.from
      for (const r of j?.query?.redirects || []) normaliz[r.to] = normaliz[r.from] || r.from
      for (const pg of Object.values(j?.query?.pages || {})) {
        const original = normaliz[pg.title] || pg.title
        out[original] = pg.extract || ''
      }
    } catch { /* la tanda que falle queda sin confirmar, no rompe el cruce */ }
    await dormir(350)
  }
  return out
}

/** Como norm() pero conservando los dígitos: para buscar años hacen falta. */
const normConNumeros = (s) => (s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim()

/**
 * ¿Wikipedia respalda el hito? Pide que el año aparezca en la MISMA oración que las palabras
 * fuertes del hito. Que el artículo de Boca nombre "2000" y nombre "Libertadores" en párrafos
 * distintos no prueba nada: los nombra por decenas.
 */
function hitoConfirmado(texto, hito, season) {
  if (!texto) return false
  const claves = normConNumeros(hito).split(' ').filter(w => w.length > 5)
  if (claves.length === 0) return false
  return normConNumeros(texto)
    .split(/(?<=\.)\s+/)
    .some(oracion => oracion.includes(season) && claves.filter(w => oracion.includes(w)).length >= 1)
}

// ── FUENTE A: Wikidata, posiciones y stats de una tanda de jugadores ──
async function datosDeJugadores(qids) {
  if (qids.length === 0) return {}
  const values = qids.map(q => `wd:${q}`).join(' ')
  const Q = `
  SELECT ?j ?posLabel ?apps ?goles ?caps ?art WHERE {
    VALUES ?j { ${values} }
    OPTIONAL { ?j wdt:P413 ?pos . }
    # El título del artículo en es.wikipedia sale de acá, no de adivinarlo desde la etiqueta:
    # "Óscar Córdoba" no es el título de su artículo y se perdían jugadores por eso.
    OPTIONAL { ?art schema:about ?j ; schema:isPartOf <https://es.wikipedia.org/> . }
    OPTIONAL { ?j p:P54 ?s1 . ?s1 pq:P1350 ?apps . }
    OPTIONAL { ?j p:P54 ?s2 . ?s2 pq:P1351 ?goles . }
    OPTIONAL { ?j p:P54 ?s3 . ?s3 ps:P54 wd:Q79800 ; pq:P1350 ?caps . }
    SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
  }`
  let j = null
  for (let i = 1; i <= 3 && !j; i++) {
    const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(Q), { headers: UA })
    if (r.ok) { j = await r.json(); break }
    await dormir(i * 4000)
  }
  if (!j) return {}
  const out = {}
  for (const b of j.results.bindings) {
    const id = b.j.value.split('/').pop()
    const cur = out[id] || { posiciones: new Set(), apps: 0, goles: 0, caps: 0, articulo: null }
    if (b.posLabel) cur.posiciones.add(b.posLabel.value)
    if (b.art && !cur.articulo) {
      cur.articulo = decodeURIComponent(b.art.value.split('/wiki/').pop()).replace(/_/g, ' ')
    }
    // Los qualifiers vienen repetidos por cada club: se toma el máximo, no la suma, para no
    // multiplicar partidos por la cantidad de filas del producto cartesiano.
    cur.apps = Math.max(cur.apps, Number(b.apps?.value) || 0)
    cur.goles = Math.max(cur.goles, Number(b.goles?.value) || 0)
    cur.caps = Math.max(cur.caps, Number(b.caps?.value) || 0)
    out[id] = cur
  }
  return out
}

// Posición de Wikidata (en español o inglés) → la del juego.
//
// La etiqueta en español de Wikidata para el arco es «guardameta», no «portero»: sin esa palabra
// acá, TODOS los arqueros nuevos se caían (posDelJuego devolvía null y el jugador se descartaba)
// y equipos enteros quedaban afuera por "sin arquero confirmado". El orden importa: lo más
// específico primero, porque gana la primera que matchea.
const MAPA_POS = [
  [/guardameta|portero|arquero|goalkeeper/i, 'GK'],
  [/lateral izquierdo|left.?back/i, 'LB'],
  [/lateral derecho|right.?back/i, 'RB'],
  [/defensa central|centre.?back|center.?back|defensor central/i, 'CB'],
  [/lateral|full.?back/i, 'RB'],
  [/defensa|defender|zaguero/i, 'CB'],
  [/pivote|mediocentro defensivo|centrocampista defensivo|mediocampista defensivo|volante defensivo|defensive midfielder/i, 'CDM'],
  [/mediapunta|enganche|centrocampista ofensivo|mediocampista ofensivo|volante ofensivo|attacking midfielder/i, 'CAM'],
  [/interior izquierdo|left midfielder/i, 'LM'],
  [/interior derecho|right midfielder/i, 'RM'],
  [/centrocampista|mediocampista|mediocentro|volante|interior|midfielder/i, 'CM'],
  [/extremo izquierdo|left winger/i, 'LW'],
  [/extremo derecho|right winger/i, 'RW'],
  [/extremo|winger|puntero/i, 'RW'],
  [/delantero centro|centrodelantero|striker/i, 'ST'],
  [/segundo delantero|forward|delantero|atacante/i, 'CF'],
]
function posDelJuego(posiciones) {
  for (const p of posiciones) {
    for (const [re, destino] of MAPA_POS) if (re.test(p)) return destino
  }
  return null
}

/** La MISMA fórmula de recompute-ovr.mjs: no se inventa un OVR nuevo para los históricos. */
function ovrDesdeStats({ apps = 0, goles = 0, caps = 0 }, pos) {
  if (apps === 0 && goles === 0) return null
  const cat = pos === 'GK' ? 'GK'
    : ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos) ? 'DEF'
    : ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos) ? 'MID' : 'ATT'
  let r = 66 + (clamp(apps, 0, 400) / 400) * 10
  r += (clamp(caps, 0, 60) / 60) * 10
  const gpg = goles / Math.max(apps, 1)
  if (cat === 'ATT') r += (clamp(gpg, 0, 0.5) / 0.5) * 8
  else if (cat === 'MID') r += (clamp(gpg, 0, 0.3) / 0.3) * 5
  else if (cat === 'DEF') r += (clamp(gpg, 0, 0.1) / 0.1) * 2
  return Math.round(clamp(r, 66, 90))
}

// ═══ CRUCE ═══
const { equipos } = JSON.parse(fs.readFileSync(path.join(DIR, 'verificados.json'), 'utf8'))
const aCruzar = equipos.filter(e => e.verificado).slice(0, limite)

// Reanudable, igual que la verificación: cada equipo son ~25 requests a Wikidata y Wikipedia, y
// una sesión que se corta a la mitad no puede costar empezar de cero.
const SALIDA = path.join(DIR, 'cruzados.json')
const claveEq = (e) => `${e.clubId}|${e.season}`
const forzar = process.argv.includes('--forzar')
const previos = !forzar && fs.existsSync(SALIDA)
  ? new Map(JSON.parse(fs.readFileSync(SALIDA, 'utf8')).equipos.map(e => [claveEq(e), e]))
  : new Map()

const resultado = []
const guardar = () => fs.writeFileSync(SALIDA, JSON.stringify({ generado: new Date().toISOString(), equipos: resultado }, null, 2))
const pendientes = aCruzar.filter(e => !previos.get(claveEq(e))?.listo)
console.log(`Cruzando ${pendientes.length} equipos (${aCruzar.length - pendientes.length} ya cruzados)\n`)

for (const eq of aCruzar) {
  const previo = previos.get(claveEq(eq))
  // Solo se saltea lo que quedó armable: un equipo que no llegó a 11 merece otro intento.
  if (previo?.listo) { resultado.push(previo); continue }

  const wiki = await textoWiki(eq.wiki)
  await dormir(300)
  const hitoOk = hitoConfirmado(wiki, eq.hito, eq.season)
  const wikiNorm = norm(wiki)

  const datos = await datosDeJugadores(eq.plantel.map(p => p.qid))
  await dormir(900)

  // Artículo propio de cada jugador: la confirmación independiente de que jugó en ese club.
  const titulos = [...new Set(Object.values(datos).map(d => d.articulo).filter(Boolean))]
  const fichas = await extractosDe(titulos)
  // El club se nombra de varias formas ("Vélez Sarsfield", "Vélez"); alcanza con la parte fuerte.
  const nombreClub = norm(eq.clubWikidata || eq.wiki).replace(/^(club|asociacion|atletico|deportivo|social|y|de|la|el)\s+/g, '')
  const claveClub = nombreClub.split(' ').filter(w => w.length > 4).pop() || nombreClub

  const jugadores = []
  // Wikidata devuelve una fila por período en el club: el mismo jugador puede venir dos o tres
  // veces. Sin esto, Chilavert entraba dos veces al mismo plantel.
  const vistos = new Set()
  for (const p of eq.plantel) {
    if (vistos.has(p.qid)) continue
    vistos.add(p.qid)
    const d = datos[p.qid] || { posiciones: new Set(), apps: 0, goles: 0, caps: 0 }
    const mio = deNuestraBase(p.nombre, eq.season)
    const apellido = norm(p.nombre).split(' ').pop()
    const ficha = norm((d.articulo && fichas[d.articulo]) || '')
    // Confirmado por prosa: su propio artículo nombra al club, o el del club lo nombra a él.
    const enWiki = (ficha && claveClub && ficha.includes(claveClub)) || (apellido.length > 3 && wikiNorm.includes(apellido))

    // Dos fuentes de tres: Wikidata siempre cuenta (de ahí salió), así que hace falta que lo
    // respalde nuestra base o el texto de Wikipedia.
    const fuentes = ['wikidata', mio ? 'base' : null, enWiki ? 'wikipedia' : null].filter(Boolean)
    if (fuentes.length < 2) continue

    const pos = mio?.position || posDelJuego(d.posiciones)
    if (!pos) continue // sin posición no se puede poner en la cancha

    // El OVR de nuestra base gana: ya está calculado con estas mismas stats y además curado.
    const rating = mio?.rating ?? ovrDesdeStats(d, pos)
    if (rating == null) continue

    jugadores.push({
      id: mio?.id || `hist-${p.qid.toLowerCase()}`,
      qid: p.qid,
      name: mio?.name || p.nombre,
      position: pos,
      rating,
      enNuestraBase: !!mio,
      fuentes,
    })
  }

  jugadores.sort((a, b) => b.rating - a.rating)
  const ok = jugadores.length >= 11
  console.log(
    `${ok ? '✓' : '✗'} ${eq.clubId} ${eq.season}: ${jugadores.length} jugadores con 2+ fuentes ` +
    `(${jugadores.filter(j => j.enNuestraBase).length} ya en la base) · hito ${hitoOk ? 'CONFIRMADO' : 'sin confirmar'}`,
  )
  resultado.push({ ...eq, plantel: undefined, hitoConfirmado: hitoOk, jugadores, listo: ok })
  guardar()
}

guardar()
const listos = resultado.filter(e => e.listo)
console.log(`\n${listos.length}/${resultado.length} equipos con plantel de 11+ cruzado`)
console.log(`${resultado.filter(e => e.hitoConfirmado).length} hitos confirmados por Wikipedia; el resto queda para revisión humana`)
