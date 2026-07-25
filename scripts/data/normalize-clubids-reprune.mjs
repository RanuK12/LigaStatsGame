// Normaliza los IDs de club LPF que difieren entre players.json (variante) y squads.json
// (canónico), y re-poda anacronismos ahora que los IDs cruzan bien.
//   node scripts/data/normalize-clubids-reprune.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PLAYERS = path.join(ROOT, 'data', 'players.json')
const SQUADS = path.join(ROOT, 'data', 'squads.json')
const NOW = 2026

// Variante (en players.json) -> canónico (en clubs.json / squads.json). Mismo club real.
const FIX = {
  talleres: 'talleres-cba',
  gimnasia: 'gimnasia-lp',
  estudiantes: 'estudiantes-lp',
  union: 'union-sf',
  'atletico-tucuman': 'atl-tucuman',
  sarmiento: 'sarmiento-j',
}

const players = JSON.parse(fs.readFileSync(PLAYERS, 'utf8'))
let fixed = 0
for (const p of players) {
  for (const c of p.clubs || []) {
    if (FIX[c.id]) {
      c.id = FIX[c.id]
      fixed++
    }
  }
}
fs.writeFileSync(PLAYERS, JSON.stringify(players))

// Re-poda de anacronismos con IDs ya normalizados
const byId = {}
players.forEach((p) => (byId[p.id] = p))
let sq = JSON.parse(fs.readFileSync(SQUADS, 'utf8'))
const wrapped = !Array.isArray(sq)
const arr = wrapped ? sq.squads || Object.values(sq).find(Array.isArray) : sq

function stint(p, clubId) {
  const stints = (p.clubs || []).filter((c) => c.id === clubId && c.years)
  if (!stints.length) return null
  let min = Infinity,
    max = -Infinity
  for (const c of stints) {
    const ys = String(c.years).match(/\d{4}/g)
    if (!ys) continue
    const nums = ys.map(Number)
    min = Math.min(min, ...nums)
    max = Math.max(max, /actualidad|present|hoy/i.test(c.years) ? NOW : Math.max(...nums))
  }
  return min === Infinity ? null : { min, max }
}

let pruned = 0
const ex = []
for (const s of arr) {
  const y = Number(s.season)
  if (!y) continue
  s.playerIds = (s.playerIds || []).filter((pid) => {
    const p = byId[pid]
    if (!p) return true
    const st = stint(p, s.clubId)
    if (st && (y < st.min - 1 || y > st.max + 1)) {
      pruned++
      if (ex.length < 15) ex.push(`${s.id}: ${p.name} (${st.min}-${st.max})`)
      return false
    }
    return true
  })
}

fs.writeFileSync(SQUADS, JSON.stringify(wrapped ? sq : arr, null, 2))

let broken = 0
for (const s of arr) for (const pid of s.playerIds || []) if (!byId[pid]) broken++
const short = arr.filter((s) => (s.playerIds || []).length < 11).length

console.log(`IDs de club normalizados en players: ${fixed}`)
console.log(`Anacronismos podados (ahora con IDs cruzados): ${pruned}`)
ex.forEach((e) => console.log('  - ' + e))
console.log(`Refs rotas: ${broken} | squads con <11: ${short}`)
