// Matchea nuestros jugadores contra el índice FIFA (data/fifa-index.json) con score de
// confianza. NO pisa nada: solo escribe el mapeo id-nuestro -> fifaId en
// data/ovr-source-cache.json, y los dudosos a data/reports/fifa-match-review.json.
//   node scripts/data/match-fifa.mjs [--limit N] [--dry]
//
// Nuestros birthDate scrapeados fallan seguido (Boselli figura 1999, nació 1985): la fecha
// SUMA confianza pero no descarta un candidato.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const players = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'players.json'), 'utf8'))
const fifa = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'fifa-index.json'), 'utf8'))
const CACHE = path.join(ROOT, 'data', 'ovr-source-cache.json')
const REVIEW = path.join(ROOT, 'data', 'reports', 'fifa-match-review.json')
const DRY = process.argv.includes('--dry')
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) || '').split('=')[1] || 0)

const MIN_SCORE = 4
const MIN_MARGIN = 2
// Con el nombre completo exacto alcanza una señal más (posición) para aceptar: en un dataset
// de 49.699 jugadores el homónimo exacto es raro y además se exige margen sobre el 2º.
const accepted = (best, margin) => margin >= MIN_MARGIN && (best.s >= MIN_SCORE || (best.s >= 3 && best.ev.includes('nombre-completo')))

const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const toks = (s) => norm(s).split(' ').filter(Boolean)
const keysOf = (full) => {
  const t = toks(full)
  if (!t.length) return []
  const k = [t.join(' ')]
  if (t.length > 2) k.push(`${t[0]} ${t[t.length - 1]}`)
  if (t.length > 1) k.push(`${t[0][0]} ${t[t.length - 1]}`) // formato short_name: "l messi"
  return k
}

// ---------- índice invertido de FIFA ----------
const byKey = new Map()
for (const [id, e] of Object.entries(fifa)) {
  const ks = new Set([...keysOf(e.n), ...keysOf(e.s)])
  for (const k of ks) {
    if (!byKey.has(k)) byKey.set(k, [])
    byKey.get(k).push(id)
  }
}

const clubTokens = (name) => toks(name).filter((t) => t.length >= 4 && !['club', 'atletico', 'atlético', 'deportivo', 'juniors', 'united', 'city'].includes(t))

function score(p, e) {
  const ev = []
  let s = 0
  const pFull = norm(p.fullName || p.name)
  const pName = norm(p.name)
  if (pFull === norm(e.n) || pName === norm(e.n)) { s += 2; ev.push('nombre-completo') }
  const pd = p.birthDate || ''
  // 1387 de 1432 birthDate son el placeholder "-06-15" del scraper (y el año también suele
  // estar mal: Julián Álvarez figura 1997, nació 2000) → esos solo suman de refilón.
  const fake = pd.endsWith('-06-15')
  if (pd && e.d) {
    if (!fake && pd.slice(0, 10) === e.d.slice(0, 10)) { s += 4; ev.push('dob-exacta') }
    else if (pd.slice(0, 4) === e.d.slice(0, 4)) { s += fake ? 1 : 3; ev.push('dob-año') }
    else if (!fake && Math.abs(Number(pd.slice(0, 4)) - Number(e.d.slice(0, 4))) === 1) { s += 1; ev.push('dob-±1') }
  }
  if (p.nationality && norm(p.nationality) === norm(e.nat)) { s += 2; ev.push('nacionalidad') }
  const ct = clubTokens(e.club)
  if (ct.length && (p.clubs || []).some((c) => { const mine = clubTokens(c.name || c.id); return ct.some((t) => mine.includes(t)) })) { s += 2; ev.push('club') }
  const pos = toks(e.pos).map((x) => x.toUpperCase())
  if (p.position && (pos.includes(p.position) || (p.positions || []).some((x) => pos.includes(x)))) { s += 1; ev.push('posicion') }
  return { s, ev }
}

const cache = {}
const review = []
const stats = { match: 0, ambiguo: 0, bajo: 0, 'sin-candidato': 0 }
const list = LIMIT ? players.slice(0, LIMIT) : players
for (const p of list) {
  const ids = new Set()
  for (const k of [...keysOf(p.fullName || p.name), ...keysOf(p.name)]) for (const id of byKey.get(k) || []) ids.add(id)
  if (!ids.size) { stats['sin-candidato']++; continue }
  const scored = [...ids].map((id) => ({ id, ...score(p, fifa[id]) })).sort((a, b) => b.s - a.s)
  const best = scored[0]
  const margin = best.s - (scored[1]?.s ?? -99)
  if (accepted(best, margin)) {
    cache[p.id] = { fifaId: best.id, score: best.s, evidence: best.ev }
    stats.match++
  } else {
    stats[best.s >= MIN_SCORE ? 'ambiguo' : 'bajo']++
    review.push({
      id: p.id, name: p.name, birthDate: p.birthDate || null, rating: p.rating,
      motivo: best.s >= MIN_SCORE ? 'ambiguo' : 'score-bajo',
      candidatos: scored.slice(0, 3).map((c) => ({ fifaId: c.id, name: fifa[c.id].n, dob: fifa[c.id].d, club: fifa[c.id].club, overall: fifa[c.id].ov, score: c.s, evidence: c.ev })),
    })
  }
}

console.log(`Jugadores: ${list.length} | ${JSON.stringify(stats)}`)
const dist = {}
Object.values(cache).forEach((c) => (dist[c.score] = (dist[c.score] || 0) + 1))
console.log('Score de los aceptados:', Object.entries(dist).sort((a, b) => a[0] - b[0]).map(([k, v]) => `${k}:${v}`).join(' '))
console.log('Muestra:')
Object.entries(cache).slice(0, 8).forEach(([id, c]) => console.log(`  ${id} -> ${fifa[c.fifaId].n} (${fifa[c.fifaId].d}, OVR ${fifa[c.fifaId].ov}) score ${c.score} [${c.evidence}]`))

if (DRY) { console.log('\n[dry-run] no se escribió nada.'); process.exit(0) }
fs.writeFileSync(CACHE, JSON.stringify(cache, null, 0))
fs.mkdirSync(path.dirname(REVIEW), { recursive: true })
fs.writeFileSync(REVIEW, JSON.stringify(review, null, 2))
console.log(`\n${CACHE} (${Object.keys(cache).length}) | ${REVIEW} (${review.length} para revisión)`)
