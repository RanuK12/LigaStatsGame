// Enrich data/players.json missing fields. Idempotent: only touches players with gaps.
//
//   node scripts/data/enrich-players.mjs [--limit N] [--online] [--write]
//
//   (default)  dry run -> writes a sample to data/players.enriched.sample.json
//   --write    overwrite data/players.json in place (a .bak is created first)
//   --limit N  process at most N players needing enrichment (default 25)
//   --online   also fetch a photo URL from the Wikipedia REST API (rate-limited)
//
// Local derivations (no network): activeYears from clubs[].years, decade from activeYears.
// Photos: Wikipedia REST summary thumbnail (documented endpoint). marketValue/trophies are
// NOT reliably scrapable and are left untouched here (see plan). Progress caches to
// data/scrape_progress.json so re-runs skip players already looked up online.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'data')
const PLAYERS = path.join(DATA, 'players.json')
const PROGRESS = path.join(DATA, 'scrape_progress.json')

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const limit = (() => {
  const i = args.indexOf('--limit')
  return i >= 0 ? parseInt(args[i + 1], 10) || 25 : 25
})()
const online = has('--online')
const write = has('--write')

const players = JSON.parse(fs.readFileSync(PLAYERS, 'utf8'))
const progress = fs.existsSync(PROGRESS) ? JSON.parse(fs.readFileSync(PROGRESS, 'utf8')) : {}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function deriveActiveYears(p) {
  // Club years may be "1945-1968", "2017,2025" or a single "2025". Extract every
  // 4-digit year and take min..max; open-ended tokens map to the current year.
  const currentYear = new Date().getFullYear()
  let min = Infinity
  let max = -Infinity
  for (const r of (p.clubs || []).map((c) => c.years).filter(Boolean)) {
    const s = String(r)
    if (/actualidad|present|hoy/i.test(s) && currentYear > max) max = currentYear
    for (const m of s.matchAll(/(\d{4})/g)) {
      const y = parseInt(m[1], 10)
      if (y < min) min = y
      if (y > max) max = y
    }
  }
  if (min === Infinity) return null
  return min === max ? `${min}` : `${min}-${max}`
}

function deriveDecade(p, activeYears) {
  const src = activeYears || p.activeYears
  const m = src && String(src).match(/(\d{4})/)
  if (m) return `${Math.floor(parseInt(m[1], 10) / 10) * 10}s`
  if (p.birthDate) {
    const y = parseInt(String(p.birthDate).slice(0, 4), 10)
    if (!Number.isNaN(y)) return `${Math.floor((y + 20) / 10) * 10}s`
  }
  return null
}

async function fetchPhoto(name) {
  const title = encodeURIComponent(name.replace(/\s+/g, '_'))
  try {
    const res = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${title}`, {
      headers: { 'User-Agent': 'LigaStatsGame-enrich/1.0 (educational)' },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.thumbnail?.source || json.originalimage?.source || null
  } catch {
    return null
  }
}

function needsWork(p) {
  return (
    !p.activeYears ||
    !p.decade ||
    (online && (!p.image || p.image === '') && !progress[p.id]?.photoChecked)
  )
}

const touched = []
let processed = 0

// --cracks: priorizar fotos de estrellas (legendary + mayor rating) sin alterar el orden
// del archivo (se itera una copia ordenada; se escribe el array original).
const order = has('--cracks')
  ? [...players].sort((a, b) => (Number(b.legendary || 0) - Number(a.legendary || 0)) || ((b.rating || 0) - (a.rating || 0)))
  : players

for (const p of order) {
  if (processed >= limit) break
  if (!needsWork(p)) continue
  processed++

  let changed = false
  if (!p.activeYears) {
    const ay = deriveActiveYears(p)
    if (ay) {
      p.activeYears = ay
      changed = true
    }
  }
  if (!p.decade) {
    const dec = deriveDecade(p, p.activeYears)
    if (dec) {
      p.decade = dec
      changed = true
    }
  }
  if (online && (!p.image || p.image === '')) {
    const photo = await fetchPhoto(p.fullName || p.name)
    progress[p.id] = { ...(progress[p.id] || {}), photoChecked: true }
    if (photo) {
      p.image = photo
      changed = true
    }
    await sleep(400) // be polite to Wikipedia
  }

  if (changed) touched.push({ id: p.id, name: p.name, activeYears: p.activeYears, decade: p.decade, image: p.image || '' })
}

if (online) fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2))

if (write) {
  fs.copyFileSync(PLAYERS, `${PLAYERS}.bak`)
  fs.writeFileSync(PLAYERS, JSON.stringify(players))
  console.log(`Wrote ${touched.length} enriched players to players.json (backup at players.json.bak)`)
} else {
  const OUT = path.join(DATA, 'players.enriched.sample.json')
  fs.writeFileSync(OUT, JSON.stringify(touched, null, 2))
  console.log(`Dry run: ${touched.length} players enriched (of ${processed} processed). Sample -> ${OUT}`)
}
console.table(touched.slice(0, 10))
