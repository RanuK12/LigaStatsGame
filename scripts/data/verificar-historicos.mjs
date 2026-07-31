// Verifica los candidatos a plantel histórico ANTES de meterlos al juego.
//
// Dos cosas por equipo:
//   1. que el club exista en Wikidata con su QID (buscado, no adivinado);
//   2. que el plantel de esa temporada sea ARMABLE: al menos 11 futbolistas con período
//      registrado que incluya ese año (P54 con qualifier P580/P582).
//
// El hito en sí (campeón de tal cosa) no lo puede confirmar Wikidata de forma fiable: su palmarés
// está incompleto y con errores — devuelve "Boca 2018" para una Libertadores que ganó River. Así
// que el hito queda como texto a revisar por un humano, y lo que decide si el equipo ENTRA es que
// el plantel se pueda armar de verdad.
//
//   node scripts/data/verificar-historicos.mjs [--limit N]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DIR = path.join(ROOT, 'data', 'historicos')
const ENTRADA = path.join(DIR, 'candidatos.json')
const SALIDA = path.join(DIR, 'verificados.json')
const CACHE_QID = path.join(DIR, 'qids.json')

const UA = { 'User-Agent': 'GambetaGame/1.0 (https://gambetafutbol.games)' }
const limite = Number(process.argv.find(a => a.startsWith('--limit'))?.split('=')[1] || process.argv[process.argv.indexOf('--limit') + 1]) || Infinity

const dormir = (ms) => new Promise(r => setTimeout(r, ms))

async function qidDeClub(nombre) {
  const u = `https://www.wikidata.org/w/api.php?action=wbsearchentities&format=json&language=es&type=item&limit=8&search=${encodeURIComponent(nombre)}`
  const j = await (await fetch(u, { headers: UA })).json()
  // El club, no la sección de básquet ni el equipo femenino ni un artículo de noticias.
  const malo = /women|femenin|basketball|básquet|volley|wikinews|noticias|futsal/i
  const bueno = (j.search || []).find(s => !malo.test(`${s.label} ${s.description || ''}`))
  return bueno ? { qid: bueno.id, label: bueno.label, desc: bueno.description || '' } : null
}

async function plantelDe(qid, anio) {
  const Q = `
  SELECT ?jugador ?jugadorLabel ?desde ?hasta WHERE {
    ?jugador wdt:P106 wd:Q937857 ; p:P54 ?st .
    ?st ps:P54 wd:${qid} ; pq:P580 ?desde .
    OPTIONAL { ?st pq:P582 ?hasta . }
    FILTER(YEAR(?desde) <= ${anio})
    FILTER(!BOUND(?hasta) || YEAR(?hasta) >= ${anio})
    SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
  } LIMIT 120`
  // El endpoint público falla cada tanto por carga. Un 500 suelto no significa que el equipo no
  // exista, así que se reintenta antes de descartarlo: si no, se pierden planteles buenos.
  let j = null
  for (let intento = 1; intento <= 3 && !j; intento++) {
    const r = await fetch('https://query.wikidata.org/sparql?format=json&query=' + encodeURIComponent(Q), { headers: UA })
    if (r.ok) { j = await r.json(); break }
    if (intento < 3) await dormir(intento * 4000)
  }
  if (!j) return null
  return j.results.bindings
    .map(b => ({
      qid: b.jugador.value.split('/').pop(),
      nombre: b.jugadorLabel.value,
      desde: Number((b.desde?.value || '').slice(0, 4)) || null,
      hasta: b.hasta ? Number(b.hasta.value.slice(0, 4)) : null,
    }))
    // Un jugador sin apellido reconocible ("El Suplente") no es un jugador.
    .filter(p => /\s/.test(p.nombre) && !/^Q\d+$/.test(p.nombre))
}

const { equipos } = JSON.parse(fs.readFileSync(ENTRADA, 'utf8'))
const qids = fs.existsSync(CACHE_QID) ? JSON.parse(fs.readFileSync(CACHE_QID, 'utf8')) : {}

// Reanudable: la sesión anterior verificó 42 equipos y se cortó al ampliar la lista. Volver a
// pedirle a Wikidata lo que ya está no aporta nada y castiga un endpoint público compartido.
const clave = (e) => `${e.clubId}|${e.season}`
const forzar = process.argv.includes('--forzar')
const previos = !forzar && fs.existsSync(SALIDA)
  ? new Map(JSON.parse(fs.readFileSync(SALIDA, 'utf8')).equipos.map(e => [clave(e), e]))
  : new Map()
const salida = []
const guardar = () => fs.writeFileSync(SALIDA, JSON.stringify({ generado: new Date().toISOString(), equipos: salida }, null, 2))

for (const eq of equipos.slice(0, limite)) {
  const previo = previos.get(clave(eq))
  // Solo se saltea lo que salió bien: un fallo de red merece otra oportunidad.
  if (previo?.verificado) { salida.push(previo); continue }

  if (!qids[eq.wiki]) {
    qids[eq.wiki] = await qidDeClub(eq.wiki)
    fs.mkdirSync(DIR, { recursive: true })
    fs.writeFileSync(CACHE_QID, JSON.stringify(qids, null, 2))
    await dormir(400)
  }
  const club = qids[eq.wiki]
  if (!club) {
    console.log(`✗ ${eq.clubId} ${eq.season}: no encontré el club en Wikidata ("${eq.wiki}")`)
    salida.push({ ...eq, verificado: false, motivo: 'club no encontrado' })
    continue
  }

  const plantel = await plantelDe(club.qid, Number(eq.season))
  await dormir(900) // el endpoint público es compartido: no lo apuremos

  if (!plantel) {
    console.log(`✗ ${eq.clubId} ${eq.season}: la consulta de plantel falló`)
    salida.push({ ...eq, qid: club.qid, verificado: false, motivo: 'consulta fallida' })
    continue
  }
  if (plantel.length < 11) {
    console.log(`✗ ${eq.clubId} ${eq.season}: solo ${plantel.length} jugadores (hacen falta 11)`)
    salida.push({ ...eq, qid: club.qid, verificado: false, motivo: `plantel incompleto (${plantel.length})`, plantel })
    continue
  }
  console.log(`✓ ${eq.clubId} ${eq.season}: ${plantel.length} jugadores · ${club.label}`)
  salida.push({ ...eq, qid: club.qid, clubWikidata: club.label, verificado: true, plantel })
  guardar() // el progreso sobrevive a un corte de sesión
}

guardar()
const ok = salida.filter(e => e.verificado).length
console.log(`\n${ok}/${salida.length} equipos con plantel armable → ${path.relative(ROOT, SALIDA)}`)
