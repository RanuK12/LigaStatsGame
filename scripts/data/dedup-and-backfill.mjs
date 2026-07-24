// Dedup robusto de MISMA PERSONA + backfill de titulares en squads.
//  1) Une entradas con el mismo nombre que comparten al menos un club (mismo jugador
//     cargado 2+ veces con rating/años distintos). Conserva la mejor y remapea las refs
//     de squads para no romper nada.
//  2) Backfill: cada squad debe tener un arquero titular real (el mejor GK cuyo período
//     en ese club incluye la temporada), no solo un suplente.
//   node scripts/data/dedup-and-backfill.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const PLAYERS = path.join(ROOT, 'data', 'players.json')
const SQUADS = path.join(ROOT, 'data', 'squads.json')
const NOW = 2026

let players = JSON.parse(fs.readFileSync(PLAYERS, 'utf8'))
let sqRaw = JSON.parse(fs.readFileSync(SQUADS, 'utf8'))
const wrapped = !Array.isArray(sqRaw)
const squads = wrapped ? sqRaw.squads || Object.values(sqRaw).find(Array.isArray) : sqRaw

const REFERENCED = new Set()
for (const s of squads) for (const pid of s.playerIds || []) REFERENCED.add(pid)

const clubIds = (p) => new Set((p.clubs || []).map((c) => c.id).filter((id) => id && id !== 'argentina'))
const shareClub = (a, b) => {
  const A = clubIds(a)
  for (const c of clubIds(b)) if (A.has(c)) return true
  return false
}
const completeness = (p) => (p.clubs?.length || 0) * 1000 + (p.rating || 0)

// ── 1) Dedup misma persona (name + shared club) ──
const remap = {} // idViejo -> idNuevo
const byName = {}
for (const p of players) (byName[p.name] ||= []).push(p)

const keep = new Set()
for (const [, group] of Object.entries(byName)) {
  // Cluster dentro del grupo de nombre: unir los que comparten club
  const clusters = []
  for (const p of group) {
    let placed = false
    for (const cl of clusters) {
      if (cl.some((q) => shareClub(p, q))) {
        cl.push(p)
        placed = true
        break
      }
    }
    if (!placed) clusters.push([p])
  }
  for (const cl of clusters) {
    // elegir representante: referenciado por squad primero, luego más completo
    const rep =
      cl.find((p) => REFERENCED.has(p.id)) ||
      [...cl].sort((a, b) => completeness(b) - completeness(a))[0]
    keep.add(rep.id)
    for (const p of cl) if (p.id !== rep.id) remap[p.id] = rep.id
  }
}

const removed = players.length - keep.size
players = players.filter((p) => keep.has(p.id))
const byId = {}
players.forEach((p) => (byId[p.id] = p))

// remapear refs de squads
for (const s of squads) {
  s.playerIds = [...new Set((s.playerIds || []).map((pid) => remap[pid] || pid))].filter((pid) => byId[pid])
}

// ── 2) Backfill de arquero titular por squad ──
function stintIncludes(p, clubId, year) {
  const stints = (p.clubs || []).filter((c) => c.id === clubId && c.years)
  for (const c of stints) {
    const ys = String(c.years).match(/\d{4}/g)
    if (!ys) continue
    const nums = ys.map(Number)
    const min = Math.min(...nums)
    const max = /actualidad|present|hoy/i.test(c.years) ? NOW : Math.max(...nums)
    if (year >= min - 1 && year <= max + 1) return true
  }
  return false
}

let gkAdded = 0
for (const s of squads) {
  const year = Number(s.season)
  if (!year) continue
  const gks = (s.playerIds || []).map((pid) => byId[pid]).filter((p) => p && p.position === 'GK')
  const bestExisting = Math.max(0, ...gks.map((g) => g.rating || 0))
  // candidato: mejor GK del club cuyo período incluye la temporada
  const candidates = players
    .filter((p) => p.position === 'GK' && stintIncludes(p, s.clubId, year) && !(s.playerIds || []).includes(p.id))
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
  const best = candidates[0]
  // agregar si no hay GK, o si el mejor candidato supera claramente al que hay (titular real)
  if (best && (gks.length === 0 || best.rating > bestExisting + 1)) {
    s.playerIds.push(best.id)
    gkAdded++
  }
}

fs.writeFileSync(PLAYERS, JSON.stringify(players))
fs.writeFileSync(SQUADS, JSON.stringify(wrapped ? sqRaw : squads, null, 2))

// verificar refs
let broken = 0
for (const s of squads) for (const pid of s.playerIds || []) if (!byId[pid]) broken++

console.log(`Duplicados de misma persona unidos: ${removed} (quedan ${players.length})`)
console.log(`Arqueros titulares backfilleados: ${gkAdded}`)
console.log(`Refs rotas: ${broken}`)
