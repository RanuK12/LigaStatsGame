// Pone las valoraciones en la escala real de la Liga Profesional.
//
// El problema, medido el 15/8 sobre 3.745 jugadores: la mitad de la base no tiene ninguna
// evidencia de nivel y quedó en 72-73, así que el 50 % del juego vive entre 72 y 75. Dentro de
// un plantel moderno el desvío típico es 2,7 puntos —Godoy Cruz 2023 tenía a los 28 jugadores
// dentro de 2— contra 5 en los históricos, que sí se sienten un draft.
//
// La referencia es el propio dataset de FIFA para la Liga Profesional (2.078 jugadores):
//
//     mínimo 49 · p25 61 · mediana 65 · p75 69 · p95 74 · máximo 82
//
// contra lo que teníamos: mediana 73, con los cuartiles en 72 y 75.
//
// Cómo se asigna cada número, por orden de fuerza de la evidencia:
//
//   1. Leyenda curada a mano  → no se toca. Están por encima de la liga a propósito: Maradona y
//      Messi no son jugadores de la Liga Profesional promedio.
//   2. Cruce con FIFA         → su valoración real. Eso YA es la escala de la liga.
//   3. Carrera con datos      → la fórmula de siempre (partidos, goles, selección), reanclada:
//      lo que antes salía 66-90 ahora sale 55-83, que es el rango real de la liga con su techo.
//   4. Sin ninguna evidencia  → el nivel de su plantel menos un margen, ajustado por edad. Un
//      jugador sin una sola huella —ni en FIFA, ni en Wikipedia, ni en Wikidata— no es un 73:
//      por definición no es de los que dejan rastro. Queda acotado entre 52 y 68.
//
// Nada de esto inventa diferencias entre dos jugadores igual de desconocidos: si comparten club
// y edad, comparten número. La variedad sale de la evidencia, no de un ruido.
//
//   node scripts/data/reescalar-ovr.mjs [--dry]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'data')
const dry = process.argv.includes('--dry')

const leer = (f) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'))
const players = leer('players.json')
const squads = leer('squads.json')
const fifa = leer('fifa-index.json')
const cache = leer('ovr-source-cache.json')

const clamp = (n, a, b) => Math.max(a, Math.min(b, n))
const mediana = (a) => (a.length ? [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)] : null)

// ── 1. La escala de la liga, medida y no supuesta ──
const liga = Object.values(fifa).filter((v) => v.league === 'Liga Profesional' && v.ov).map((v) => v.ov)
const pct = (p) => [...liga].sort((a, b) => a - b)[Math.floor((liga.length - 1) * p)]
const ESCALA = { min: Math.min(...liga), p25: pct(0.25), p50: pct(0.5), p75: pct(0.75), p95: pct(0.95), max: Math.max(...liga) }

// El techo de los que NO son leyenda: justo debajo de la leyenda más floja, para que ningún
// jugador de relleno le pase por arriba a una carta curada.
const leyendas = players.filter((p) => p.legendary)
const TECHO = Math.min(...leyendas.map((p) => p.rating)) - 1
const PISO = ESCALA.min

// ── 2. La valoración real de FIFA, cuando la hay ──
const NOW = 2026
const activos = new Set()
for (const s of squads) if (Number(s.season) >= 2023) for (const id of s.playerIds || []) activos.add(id)

function deFifa(p) {
  const e = fifa[cache[p.id]?.fifaId]
  if (!e) return null
  // El que ya no aparece en planteles recientes es su carta histórica: vale su pico.
  if (!activos.has(p.id) && e.lv < 23) return clamp(Math.max(e.peak || 0, e.ov), PISO, TECHO)
  const edadHoy = e.age ? e.age + (NOW - (1999 + e.lv)) : 0
  const umbral = p.position === 'GK' ? 35 : 33
  const decae = edadHoy > umbral ? Math.min(6, (edadHoy - umbral) * 0.7) : 0
  return clamp(Math.round(e.ov - decae), PISO, TECHO)
}

// ── 3. La carrera con datos, reanclada a la liga ──
const cat = (pos) =>
  pos === 'GK' ? 'GK'
  : ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos) ? 'DEF'
  : ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos) ? 'MID' : 'ATT'

function deCarrera(p) {
  const apps = p.capsClub || 0
  const goles = p.goalsClub || 0
  const caps = p.capsNationalTeam || 0
  if (!apps && !goles && !caps) return null
  // La misma forma de siempre, en 0-1: longevidad, selección y goles ponderados por puesto.
  let s = (clamp(apps, 0, 400) / 400) * 0.40
  s += (clamp(caps, 0, 60) / 60) * 0.38
  const gpg = goles / Math.max(apps, 1)
  const c = cat(p.position)
  const techoGpg = c === 'ATT' ? 0.5 : c === 'MID' ? 0.3 : c === 'DEF' ? 0.1 : 0.05
  s += (clamp(gpg, 0, techoGpg) / techoGpg) * 0.22
  // 0 → un titular flojo de la liga; 1 → el techo de los que no son leyenda.
  return Math.round(clamp(ESCALA.p25 + s * (TECHO - ESCALA.p25), PISO, TECHO))
}

// ── 4. Sin evidencia: el nivel del plantel donde juega ──
// Primero se resuelven los que sí tienen evidencia, después se mide el nivel de cada plantel con
// ellos, y recién ahí se ubica a los desconocidos.
const nuevo = new Map()
for (const p of players) {
  if (p.legendary) { nuevo.set(p.id, p.rating); continue }
  const v = deFifa(p) ?? deCarrera(p)
  if (v != null) nuevo.set(p.id, v)
}

const nivelDelPlantel = new Map()
for (const s of squads) {
  const con = s.playerIds.map((id) => nuevo.get(id)).filter((v) => v != null)
  if (con.length >= 3) nivelDelPlantel.set(`${s.clubId}|${s.season}`, mediana(con))
}
const plantelesDe = new Map()
for (const s of squads) {
  for (const id of s.playerIds) {
    if (!plantelesDe.has(id)) plantelesDe.set(id, [])
    plantelesDe.get(id).push(`${s.clubId}|${s.season}`)
  }
}

/** La edad que tenía en esa temporada: un pibe de 18 y un tipo de 28 no valen lo mismo. */
function ajustePorEdad(p) {
  const nace = Number(String(p.birthDate || '').slice(0, 4))
  if (!nace) return 0
  const claves = plantelesDe.get(p.id) || []
  const años = claves.map((k) => Number(k.split('|')[1])).filter(Boolean)
  if (!años.length) return 0
  const edad = Math.round(años.reduce((a, b) => a + b, 0) / años.length) - nace
  if (edad < 20) return -3
  if (edad < 23) return -1
  if (edad <= 30) return 1
  if (edad <= 33) return 0
  return -2
}

// El desconocido queda por debajo de la mediana de su plantel: no dejar rastro en ninguna fuente
// es, en promedio, ser de los que menos juegan.
const MARGEN = 4
let porPlantel = 0, porDefecto = 0
for (const p of players) {
  if (nuevo.has(p.id)) continue
  const claves = plantelesDe.get(p.id) || []
  const niveles = claves.map((k) => nivelDelPlantel.get(k)).filter((v) => v != null)
  const base = niveles.length ? mediana(niveles) : ESCALA.p50
  niveles.length ? porPlantel++ : porDefecto++
  nuevo.set(p.id, Math.round(clamp(base - MARGEN + ajustePorEdad(p), ESCALA.min + 3, ESCALA.p75)))
}

// ── Informe ──
const banda = (v) => Math.floor(v / 5) * 5
const dist = (vals) => {
  const d = {}
  for (const v of vals) d[banda(v)] = (d[banda(v)] || 0) + 1
  return Object.entries(d).sort((a, b) => a[0] - b[0]).map(([b, n]) => `${b}-${+b + 4}:${n}`).join('  ')
}
const antes = players.map((p) => p.rating)
const despues = players.map((p) => nuevo.get(p.id))
const cuartiles = (vals) => {
  const s = [...vals].sort((a, b) => a - b)
  const q = (p) => s[Math.floor((s.length - 1) * p)]
  return `p25 ${q(0.25)} · mediana ${q(0.5)} · p75 ${q(0.75)} · p95 ${q(0.95)}`
}
const desvio = (vals) => {
  const m = vals.reduce((a, b) => a + b, 0) / vals.length
  return Math.sqrt(vals.reduce((a, b) => a + (b - m) ** 2, 0) / vals.length)
}
const sigmas = squads
  .map((s) => s.playerIds.map((id) => nuevo.get(id)).filter((v) => v != null))
  .filter((v) => v.length >= 11)
  .map(desvio)

console.log(`Escala de la Liga Profesional (${liga.length} jugadores en FIFA):`)
console.log(`  mínimo ${ESCALA.min} · p25 ${ESCALA.p25} · mediana ${ESCALA.p50} · p75 ${ESCALA.p75} · p95 ${ESCALA.p95} · máximo ${ESCALA.max}`)
console.log(`  techo de los que no son leyenda: ${TECHO}\n`)
console.log(`Origen del número: FIFA ${players.filter((p) => !p.legendary && deFifa(p) != null).length} · ` +
  `carrera ${players.filter((p) => !p.legendary && deFifa(p) == null && deCarrera(p) != null).length} · ` +
  `nivel del plantel ${porPlantel} · sin plantel ${porDefecto} · leyendas ${leyendas.length}\n`)
console.log(`ANTES    ${cuartiles(antes)}`)
console.log(`         ${dist(antes)}`)
console.log(`DESPUÉS  ${cuartiles(despues)}`)
console.log(`         ${dist(despues)}`)
console.log(`\nDesvío dentro del plantel: mediana ${mediana(sigmas).toFixed(1)} (antes 2,7)`)

if (dry) {
  console.log('\n--dry: no se escribió nada')
} else {
  for (const p of players) p.rating = nuevo.get(p.id)
  fs.writeFileSync(path.join(DATA, 'players.json'), JSON.stringify(players, null, 2))
  console.log('\nplayers.json actualizado')
}
