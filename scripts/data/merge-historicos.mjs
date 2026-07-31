// Mete los planteles históricos ya cruzados (data/historicos/cruzados.json) al juego.
//
// No confundir con scripts/merge-historical.mjs: ese es del residuo viejo squads_historical.json,
// que a pesar del nombre son los mismos 2015-2025 con otros slugs.
//
// Es ADITIVO e IDEMPOTENTE:
//   · no toca el rating ni el id de ningún jugador que ya está en la base;
//   · no borra ni reordena ninguno de los planteles actuales;
//   · correrlo dos veces deja el mismo resultado (reemplaza sus propias entradas anteriores).
//
// Reglas de entrada, en el mismo espíritu que el cruce: lo que no está respaldado, no entra.
//   · el equipo necesita 11 jugadores con 2+ fuentes y al menos un arquero;
//   · si el club ya tiene esa temporada en squads.json, gana la que ya estaba (es dato actual,
//     no scrapeado) y el histórico se saltea;
//   · el club tiene que existir en clubs.json, o no habría escudo ni nombre que mostrar.
//
//   node scripts/data/merge-historicos.mjs [--dry]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'data')
const dry = process.argv.includes('--dry')

// Bonus de época (PLAN_CRECIMIENTO §5.5.4): estos planteles tienen que sentirse un premio, pero
// si arrasan siempre dejan de serlo. +2 solo a los jugadores nuevos —a los que ya están en la
// base no se les toca el rating, que es compartido con los demás planteles— y techo de 85 para
// que ningún desconocido termine por encima de las leyendas curadas a mano.
const BONUS_EPOCA = 2
const TECHO_NUEVO = 85

const leer = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
const players = leer('players.json')
const squads = leer('squads.json')
const clubs = leer('clubs.json')
const { equipos } = JSON.parse(fs.readFileSync(path.join(DATA, 'historicos', 'cruzados.json'), 'utf8'))

// Idempotencia real: lo que dejó una corrida anterior de este script se descarta y se vuelve a
// calcular. Si no, los jugadores de una fusión vieja quedarían para siempre.
const playersBase = players.filter((p) => !p.historico)
const porId = new Map(playersBase.map((p) => [p.id, p]))
const clubPorId = new Map(clubs.map((c) => [c.id, c]))

// ── Reconocer a los nuestros ──
// El cruce contra Wikidata ya intenta esto, pero se apoya en los años de club que tenemos
// cargados, y de los jugadores modernos solo tenemos 2015 en adelante: Marcos Rojo en el
// Estudiantes 2009 quedaba "fuera de ventana" y entraba como jugador nuevo, duplicado y con OVR
// calculado a mano en vez del nuestro. Acá se cierra con la EDAD, que no depende de qué años de
// club tengamos cargados.
const sinAcentos = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '')
const normNombre = (s) => sinAcentos(s).toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim()
const porNombre = new Map()
for (const p of playersBase) {
  const k = normNombre(p.name)
  if (!porNombre.has(k)) porNombre.set(k, [])
  porNombre.get(k).push(p)
}

const anioNacimiento = (p) => Number(String(p.birthDate || '').slice(0, 4)) || null

/** ¿Ese nombre en la base es la misma persona que jugó esa temporada? La edad lo decide. */
function mismoJugador(nombre, season, clubId) {
  const cands = porNombre.get(normNombre(nombre)) || []
  if (cands.length === 0) return null
  const anio = Number(season)
  // Nombre completo único en la base Y ese club entre los suyos: es él, sin más preguntas. Hace
  // falta porque muchas fechas de nacimiento de la base son de relleno (nacido en 1995 un jugador
  // que ya jugaba en 2007) y la regla de edad, sola, lo rechazaría.
  const delClub = cands.filter((p) => (p.clubs || []).some((c) => c.id === clubId))
  if (delClub.length === 1) return delClub[0]
  const plausible = cands.filter((p) => {
    const nac = anioNacimiento(p)
    if (!nac) return true // sin fecha de nacimiento no se puede descartar; el nombre completo alcanza
    const edad = anio - nac
    return edad >= 16 && edad <= 42
  })
  // Con homónimos plausibles no se adivina: gana el que tenga ese club entre los suyos.
  if (plausible.length > 1) return plausible.find((p) => (p.clubs || []).some((c) => c.id === clubId)) || null
  return plausible[0] || null
}

/** Años que cubre un período de club cargado en la base ("2006-2014", "1996"). */
function cubreTemporada(club, anio) {
  const años = String(club.years || '').match(/\d{4}/g)
  if (!años) return false
  const desde = Number(años[0])
  const hasta = Number(años[años.length - 1])
  return anio >= desde && anio <= hasta
}
// Las entradas que dejó una corrida anterior de este mismo script: se reemplazan, no se duplican.
const squadsBase = squads.filter((s) => !s.historico)
const temporadasOcupadas = new Set(squadsBase.map((s) => `${s.clubId}|${s.season}`))

const decadaDe = (season) => `${Math.floor(Number(season) / 10) * 10}s`

/** Las mismas líneas que usa validate-dataset.mjs para decidir si un plantel es jugable. */
const grupo = (pos) =>
  pos === 'GK' ? 'gk'
  : ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos) ? 'def'
  : ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos) ? 'mid'
  : ['LW', 'RW', 'ST', 'CF'].includes(pos) ? 'att' : 'unknown'

const nuevosSquads = []
const nuevosPlayers = []
const saltados = []

for (const eq of equipos) {
  const club = clubPorId.get(eq.clubId)
  if (!eq.listo) { saltados.push(`${eq.clubId} ${eq.season}: plantel incompleto`); continue }
  if (!club) { saltados.push(`${eq.clubId} ${eq.season}: el club no está en clubs.json`); continue }
  if (temporadasOcupadas.has(`${eq.clubId}|${eq.season}`)) {
    saltados.push(`${eq.clubId} ${eq.season}: esa temporada ya está en el juego`)
    continue
  }
  const ids = []
  const nuevosDelEquipo = []

  // Los ídolos del plantel salen de NUESTRA base, no de Wikidata. Wikidata no tiene la carrera de
  // clubes de Verón (su ítem no registra un solo P54), así que el Estudiantes campeón de América
  // se armaba sin Verón. Lo mismo Riquelme, Palermo, Tevez, Francescoli. Nuestra base sí los
  // tiene, con el club y los años: son la fuente más confiable que hay para esto.
  for (const p of playersBase) {
    if ((p.clubs || []).some((c) => c.id === eq.clubId && cubreTemporada(c, Number(eq.season)))) {
      ids.push(p.id)
    }
  }

  for (const j of eq.jugadores) {
    if (porId.has(j.id)) { ids.push(j.id); continue } // ya es de la base: se reusa tal cual
    // Antes de crearlo como jugador nuevo, ver si no es uno nuestro que el cruce no reconoció.
    const nuestro = mismoJugador(j.name, eq.season, eq.clubId)
    if (nuestro) { ids.push(nuestro.id); continue }
    ids.push(j.id)
    const nuevo = {
      id: j.id,
      name: j.name,
      fullName: j.name,
      birthDate: '',
      position: j.position,
      positions: [j.position],
      nationality: 'Argentina',
      preferredFoot: 'N/D',
      clubs: [{ id: club.id, name: club.name, years: eq.season }],
      capsNationalTeam: 0,
      goalsNationalTeam: 0,
      capsClub: 0,
      goalsClub: 0,
      assistsClub: 0,
      trophies: [],
      image: '',
      marketValue: 'N/D',
      activeYears: eq.season,
      decade: decadaDe(eq.season),
      rating: Math.min(j.rating + BONUS_EPOCA, TECHO_NUEVO),
      legendary: false,
      historico: true,
      qid: j.qid,
    }
    porId.set(nuevo.id, nuevo)
    nuevosDelEquipo.push(nuevo)
  }

  // El plantel final es el que se mide, no el que salió del cruce: reconocer a los nuestros
  // cambia posiciones (Enzo Pérez venía de arquero) y sumar a los ídolos cambia las líneas.
  const plantel = [...new Set(ids)]
  const linea = plantel.reduce((acc, id) => {
    const p = porId.get(id)
    if (p) acc[grupo(p.position)] = (acc[grupo(p.position)] || 0) + 1
    return acc
  }, {})
  // Mismo criterio de "jugable" que npm run audit:data, para no meter planteles que el propio
  // auditor del repo marque como rotos: arquero, tres del fondo, tres del medio y un delantero.
  const falta = plantel.length < 11 ? `solo ${plantel.length} jugadores`
    : !linea.gk ? 'sin arquero'
    : (linea.def || 0) < 3 ? `solo ${linea.def || 0} defensores`
    : (linea.mid || 0) < 3 ? `solo ${linea.mid || 0} mediocampistas`
    : (linea.att || 0) < 1 ? 'sin delanteros' : null
  if (falta) {
    // El equipo no entra, así que sus jugadores tampoco: si no, quedarían sueltos en la base.
    for (const p of nuevosDelEquipo) porId.delete(p.id)
    saltados.push(`${eq.clubId} ${eq.season}: ${falta}`)
    continue
  }
  nuevosPlayers.push(...nuevosDelEquipo)

  nuevosSquads.push({
    id: `${eq.clubId}-${eq.season}`,
    clubId: eq.clubId,
    season: eq.season,
    competition: 'Histórico',
    label: `${club.shortName} ${eq.season}`,
    playerIds: plantel,
    hito: eq.hito,
    hitoConfirmado: !!eq.hitoConfirmado,
    historico: true,
  })
}

console.log(`${nuevosSquads.length} planteles históricos · ${nuevosPlayers.length} jugadores nuevos`)
if (saltados.length) {
  console.log(`\nSalteados (${saltados.length}):`)
  saltados.forEach((s) => console.log('  - ' + s))
}
const sinConfirmar = nuevosSquads.filter((s) => !s.hitoConfirmado)
if (sinConfirmar.length) {
  console.log(`\nHitos que Wikipedia no confirmó, entran igual pero el texto es para revisar (${sinConfirmar.length}):`)
  sinConfirmar.forEach((s) => console.log(`  - ${s.id}: ${s.hito}`))
}

if (dry) { console.log('\n--dry: no se escribió nada'); process.exit(0) }

// Copia de seguridad antes de tocar los dos archivos que sostienen el juego.
for (const f of ['players.json', 'squads.json']) {
  fs.copyFileSync(path.join(DATA, f), path.join(DATA, `${f}.bak`))
}

// Cada archivo con el formato que ya tenía: players.json va minificado (2,3 MB) y squads.json
// indentado. Cambiarlo llenaría el diff de ruido.
fs.writeFileSync(path.join(DATA, 'players.json'), JSON.stringify([...playersBase, ...nuevosPlayers]))
fs.writeFileSync(path.join(DATA, 'squads.json'), JSON.stringify([...squadsBase, ...nuevosSquads], null, 2))
console.log(`\nplayers.json: ${playersBase.length} → ${playersBase.length + nuevosPlayers.length}`)
console.log(`squads.json: ${squadsBase.length} → ${squadsBase.length + nuevosSquads.length}`)
console.log('Backups en data/players.json.bak y data/squads.json.bak')
