// Enriquece stats de CARRERA desde Wikidata (fuente estructurada, accesible) para poder
// construir un OVR data-driven al estilo FIFA. Por jugador suma partidos (P1350) y goles
// (P1351) en los qualifiers de P54 (equipos), y separa la selección argentina (Q79800).
// Verifica que la entidad sea futbolista (P106 = Q937857) para no matchear homónimos.
//
// Cacheado y RESUMIBLE: guarda en data/wikidata-stats-cache.json (id -> stats). Re-correrlo
// saltea lo ya resuelto. No toca players.json (eso lo hace recompute-ovr.mjs).
//   node scripts/data/enrich-wikidata-stats.mjs [--limit N]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const players = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'players.json'), 'utf8'))
const CACHE = path.join(ROOT, 'data', 'wikidata-stats-cache.json')
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {}

const args = process.argv.slice(2)
const LIMIT = (() => { const i = args.indexOf('--limit'); return i >= 0 ? parseInt(args[i + 1], 10) : Infinity })()

const UA = { 'User-Agent': 'Gambeta-stats/1.0 (+https://gambetafutbol.games)' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const ARG_SENIOR = new Set(['Q79800']) // selección argentina mayor
const amt = (q) => { const a = q?.datavalue?.value?.amount; return a == null ? null : Math.abs(+a) }

async function fetchStats(name) {
  const s = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(name)}&language=es&type=item&limit=3&format=json&origin=*`,
    { headers: UA },
  )
  const sj = await s.json()
  const cands = (sj.search || []).map((c) => c.id)
  if (!cands.length) return { found: false }
  const e = await fetch(
    `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${cands.join('|')}&props=claims&format=json&origin=*`,
    { headers: UA },
  )
  const ej = await e.json()
  for (const id of cands) {
    const claims = ej.entities?.[id]?.claims || {}
    const occ = (claims.P106 || []).map((x) => x.mainsnak?.datavalue?.value?.id)
    if (!occ.includes('Q937857')) continue // no es futbolista -> homónimo
    let apps = 0, goals = 0, ntCaps = 0, ntGoals = 0
    for (const t of claims.P54 || []) {
      const teamId = t.mainsnak?.datavalue?.value?.id
      const q = t.qualifiers || {}
      const m = amt(q.P1350?.[0]), g = amt(q.P1351?.[0])
      if (m != null) apps += m
      if (g != null) goals += g
      if (ARG_SENIOR.has(teamId)) { if (m != null) ntCaps += m; if (g != null) ntGoals += g }
    }
    return { found: true, qid: id, apps, goals, ntCaps, ntGoals }
  }
  return { found: false }
}

const todo = players.filter((p) => !(p.id in cache)).slice(0, LIMIT)
console.log(`A resolver: ${todo.length} (cacheados: ${Object.keys(cache).length}/${players.length})`)
let done = 0, hits = 0
for (const p of todo) {
  try {
    const r = await fetchStats(p.fullName || p.name)
    cache[p.id] = r
    if (r.found && (r.apps > 0 || r.goals > 0)) hits++
  } catch { cache[p.id] = { found: false, error: true } }
  done++
  if (done % 50 === 0) {
    fs.writeFileSync(CACHE, JSON.stringify(cache))
    console.log(`  ${done}/${todo.length} (con stats: ${hits})`)
  }
  await sleep(130)
}
fs.writeFileSync(CACHE, JSON.stringify(cache))
console.log(`Listo. Resueltos ${done}, con stats reales ${hits}. Cache total: ${Object.keys(cache).length}`)
