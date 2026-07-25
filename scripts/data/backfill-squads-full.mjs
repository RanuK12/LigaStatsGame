// Backfill de completitud: agrega a cada squad TODOS los jugadores reales cuyo período
// en ese club incluye la temporada y que faltaban (el scraping cargó rosters parciales).
// No usa fuentes externas: usa los datos que ya están en players.json.
//   node scripts/data/backfill-squads-full.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PLAYERS = path.join(ROOT, 'data', 'players.json')
const SQUADS = path.join(ROOT, 'data', 'squads.json')
const NOW = 2026
const CAP = 32 // tope razonable de plantel por temporada (con transferencias)

const players = JSON.parse(fs.readFileSync(PLAYERS, 'utf8'))
const byId = {}
players.forEach((p) => (byId[p.id] = p))

let sq = JSON.parse(fs.readFileSync(SQUADS, 'utf8'))
const wrapped = !Array.isArray(sq)
const arr = wrapped ? sq.squads || Object.values(sq).find(Array.isArray) : sq

function stintIncludes(p, clubId, year) {
  return (p.clubs || []).some((c) => {
    if (c.id !== clubId) return false
    const ys = String(c.years).match(/\d{4}/g)
    if (!ys) return false
    const nums = ys.map(Number)
    const max = /actualidad|present|hoy/i.test(c.years) ? NOW : Math.max(...nums)
    return year >= Math.min(...nums) - 1 && year <= max + 1
  })
}

// index jugadores por club
const byClub = {}
players.forEach((p) => (p.clubs || []).forEach((c) => (byClub[c.id] = byClub[c.id] || []).push(p)))

let added = 0
// Todas las posiciones deben tener cobertura mínima antes de rellenar por rating.
const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST']
const MIN_PER_POS = 2
const playsPos = (p, pos) => p.position === pos || (p.positions || []).includes(pos)

for (const s of arr) {
  const year = Number(s.season)
  if (!year) continue
  const inSquad = new Set(s.playerIds || [])
  const seen = new Set()
  const eligible = (byClub[s.clubId] || [])
    .filter((p) => stintIncludes(p, s.clubId, year) && !inSquad.has(p.id))
    .filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))

  const addPlayer = (p) => {
    if (inSquad.has(p.id)) return false
    if ((s.playerIds || []).length >= CAP) return false
    s.playerIds.push(p.id)
    inSquad.add(p.id)
    added++
    return true
  }
  const count = (pos) => (s.playerIds || []).filter((pid) => byId[pid] && playsPos(byId[pid], pos)).length

  // 1) Garantizar cobertura mínima por posición (mete a los laterales/arqueros que faltan)
  for (const pos of POSITIONS) {
    for (const p of eligible) {
      if (count(pos) >= MIN_PER_POS) break
      if (playsPos(p, pos)) addPlayer(p)
    }
  }
  // 2) Rellenar el resto por rating hasta el tope
  for (const p of eligible) addPlayer(p)
}

fs.writeFileSync(SQUADS, JSON.stringify(wrapped ? sq : arr, null, 2))

let broken = 0
const sizes = arr.map((s) => (s.playerIds || []).length)
for (const s of arr) for (const pid of s.playerIds || []) if (!byId[pid]) broken++
const gkCount = arr.filter((s) => (s.playerIds || []).some((pid) => byId[pid]?.position === 'GK')).length

console.log(`Jugadores agregados a squads: ${added}`)
console.log(`Tamaño de squad min/prom/max: ${Math.min(...sizes)} / ${(sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(0)} / ${Math.max(...sizes)}`)
console.log(`Squads con <15: ${sizes.filter((n) => n < 15).length} | con GK: ${gkCount}/${arr.length} | refs rotas: ${broken}`)
