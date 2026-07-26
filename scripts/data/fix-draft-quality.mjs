// Arreglos de calidad del draft:
//  1) Dedup insensible a acentos (Kevin Zenón == Kevin Zenon) uniendo clubes.
//  2) Re-poda de squads SIN la tolerancia +1 de año (evita jugadores en clubes que ya dejaron).
//  3) Desinfla el top de OVRs no-legendarios (había demasiados 85+), protegiendo leyendas.
//   node scripts/data/fix-draft-quality.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PLAYERS = path.join(ROOT, 'data', 'players.json')
const SQUADS = path.join(ROOT, 'data', 'squads.json')
const NOW = 2026

let players = JSON.parse(fs.readFileSync(PLAYERS, 'utf8'))
let sq = JSON.parse(fs.readFileSync(SQUADS, 'utf8'))
const wrapped = !Array.isArray(sq)
const arr = wrapped ? sq.squads || Object.values(sq).find(Array.isArray) : sq

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const clubIds = (p) => new Set((p.clubs || []).map((c) => c.id))

// ---------- 1) Dedup insensible a acentos (mismo nombre normalizado + club compartido) ----------
const remap = {} // idViejo -> idNuevo
const byNorm = {}
for (const p of players) (byNorm[norm(p.name)] = byNorm[norm(p.name)] || []).push(p)
let merged = 0
const removed = new Set()
for (const group of Object.values(byNorm)) {
  if (group.length < 2) continue
  // ancla = el que tiene más clubes (más info)
  group.sort((a, b) => (b.clubs || []).length - (a.clubs || []).length)
  const anchor = group[0]
  const aClubs = clubIds(anchor)
  for (let i = 1; i < group.length; i++) {
    const dup = group[i]
    // solo unir si comparten al menos un club (misma persona)
    if (![...clubIds(dup)].some((id) => aClubs.has(id))) continue
    // unir clubes que falten
    for (const c of dup.clubs || []) if (!(anchor.clubs || []).some((x) => x.id === c.id && x.years === c.years)) anchor.clubs.push(c)
    anchor.rating = Math.max(anchor.rating || 0, dup.rating || 0)
    anchor.legendary = anchor.legendary || dup.legendary
    remap[dup.id] = anchor.id
    removed.add(dup.id)
    merged++
  }
}
players = players.filter((p) => !removed.has(p.id))
// remap refs en squads
for (const s of arr) s.playerIds = [...new Set((s.playerIds || []).map((id) => remap[id] || id))]

// ---------- 3) Desinflar OVRs no-legendarios (top comprimido) ----------
let deflated = 0
for (const p of players) {
  if (p.legendary) continue
  if ((p.rating || 0) > 80) {
    const nr = Math.round(80 + (p.rating - 80) * 0.5)
    if (nr !== p.rating) { p.rating = nr; deflated++ }
  }
}

// ---------- 2) Re-poda de squads sin tolerancia +1 (jugador debe pertenecer ese año) ----------
const byId = {}
players.forEach((p) => (byId[p.id] = p))
function stint(p, clubId) {
  const s = (p.clubs || []).filter((c) => c.id === clubId && c.years)
  if (!s.length) return null
  let min = Infinity, max = -Infinity
  for (const c of s) {
    const ys = String(c.years).match(/\d{4}/g)
    if (!ys) continue
    const nums = ys.map(Number)
    min = Math.min(min, ...nums)
    max = Math.max(max, /actualidad|present|hoy/i.test(c.years) ? NOW : Math.max(...nums))
  }
  return min === Infinity ? null : { min, max }
}
let pruned = 0
for (const s of arr) {
  const y = Number(s.season)
  if (!y) continue
  s.playerIds = (s.playerIds || []).filter((pid) => {
    const p = byId[pid]
    if (!p) return false
    const st = stint(p, s.clubId)
    // Debe pertenecer ese año: [min-1 (pre-fichaje) .. max] SIN +1 arriba (ya se fue).
    if (st && (y < st.min - 1 || y > st.max)) { pruned++; return false }
    return true
  })
}

fs.writeFileSync(PLAYERS, JSON.stringify(players))
fs.writeFileSync(SQUADS, JSON.stringify(wrapped ? sq : arr, null, 2))

const sizes = arr.map((s) => (s.playerIds || []).length)
let broken = 0
for (const s of arr) for (const pid of s.playerIds || []) if (!byId[pid]) broken++
console.log(`Dedup por acento: ${merged} fusionados (${players.length} jugadores)`)
console.log(`OVR desinflados: ${deflated}`)
console.log(`Refs de squad podadas (sin +1): ${pruned}`)
console.log(`Squad min/prom/max: ${Math.min(...sizes)}/${(sizes.reduce((a, b) => a + b, 0) / sizes.length).toFixed(0)}/${Math.max(...sizes)} | refs rotas: ${broken}`)
const hi = players.filter((p) => p.rating >= 85).length
console.log(`Jugadores >=85 ahora: ${hi} (antes 100)`)
