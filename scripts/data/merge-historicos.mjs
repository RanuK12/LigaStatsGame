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

const porId = new Map(players.map((p) => [p.id, p]))
const clubPorId = new Map(clubs.map((c) => [c.id, c]))
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
  // Mismo criterio de "jugable" que npm run audit:data, para no meter planteles que el propio
  // auditor del repo marque como rotos: arquero, tres del fondo, tres del medio y un delantero.
  const linea = eq.jugadores.reduce((acc, j) => {
    acc[grupo(j.position)] = (acc[grupo(j.position)] || 0) + 1
    return acc
  }, {})
  const falta = !linea.gk ? 'sin arquero'
    : (linea.def || 0) < 3 ? `solo ${linea.def || 0} defensores`
    : (linea.mid || 0) < 3 ? `solo ${linea.mid || 0} mediocampistas`
    : (linea.att || 0) < 1 ? 'sin delanteros' : null
  if (falta) { saltados.push(`${eq.clubId} ${eq.season}: ${falta}`); continue }

  for (const j of eq.jugadores) {
    if (porId.has(j.id)) continue // ya está en la base: se reusa, no se duplica ni se le toca nada
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
    nuevosPlayers.push(nuevo)
  }

  nuevosSquads.push({
    id: `${eq.clubId}-${eq.season}`,
    clubId: eq.clubId,
    season: eq.season,
    competition: 'Histórico',
    label: `${club.shortName} ${eq.season}`,
    playerIds: eq.jugadores.map((j) => j.id),
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
fs.writeFileSync(path.join(DATA, 'players.json'), JSON.stringify([...players, ...nuevosPlayers]))
fs.writeFileSync(path.join(DATA, 'squads.json'), JSON.stringify([...squadsBase, ...nuevosSquads], null, 2))
console.log(`\nplayers.json: ${players.length} → ${players.length + nuevosPlayers.length}`)
console.log(`squads.json: ${squadsBase.length} → ${squadsBase.length + nuevosSquads.length}`)
console.log('Backups en data/players.json.bak y data/squads.json.bak')
