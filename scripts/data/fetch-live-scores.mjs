// Sync real match data into public/data/live-scores.json for the Home widget.
// Runs server-side (GitHub Action / local) so there is NO CORS and NO API key needed.
//
//   node scripts/data/fetch-live-scores.mjs
//
// Source: Copero's public games endpoint (same feed that powers copero.com.ar). We only
// keep factual score/fixture data + their competition/team logo URLs. If the fetch fails
// or returns nothing, the existing committed file (seed) is left untouched.
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'public', 'data', 'live-scores.json')
const API = 'https://copero.com.ar/api/v2/games'

// competition.slug -> our widget tab
const COMP_TAB = new Map([
  ['liga-profesional', 'lpf'],
  ['copa-argentina', 'lpf'],
  ['libertadores', 'libertadores'],
  ['sudamericana', 'libertadores'],
  ['laliga', 'europe'],
  ['la-liga', 'europe'],
  ['premier-league', 'europe'],
  ['serie-a', 'europe'],
  ['bundesliga', 'europe'],
  ['ligue-1', 'europe'],
  ['champions-league', 'europe'],
  ['europa-league', 'europe'],
  ['conference-league', 'europe'],
])

function ymd(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function timeAR(iso) {
  try {
    return new Intl.DateTimeFormat('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Argentina/Buenos_Aires',
    }).format(new Date(iso))
  } catch {
    return undefined
  }
}

function mapGame(g) {
  const tab = COMP_TAB.get(g.competition?.slug)
  if (!tab || !g.home_team || !g.away_team) return null
  const st = g.status || {}
  if (st.postponed || st.cancelled || st.not_played) return null

  let status, time
  if (st.finished) status = 'FINAL'
  else if (st.started) status = 'LIVE'
  else {
    status = 'UPCOMING'
    time = timeAR(g.datetime_utc)
  }

  const homeScore = g.score?.home
  const awayScore = g.score?.away

  return {
    id: String(g.id),
    homeTeam: g.home_team.short_name || g.home_team.name,
    awayTeam: g.away_team.short_name || g.away_team.name,
    homeLogo: g.home_team.logo_url || undefined,
    awayLogo: g.away_team.logo_url || undefined,
    homeScore: typeof homeScore === 'number' ? homeScore : undefined,
    awayScore: typeof awayScore === 'number' ? awayScore : undefined,
    status,
    ...(status === 'LIVE' ? { minute: 'EN VIVO' } : {}),
    ...(time ? { time } : {}),
    league: tab,
    competition: g.competition?.short_name || g.competition?.name,
  }
}

async function main() {
  const dates = [ymd(-1), ymd(0), ymd(1)]
  const seen = new Set()
  const matches = []
  for (const d of dates) {
    try {
      const res = await fetch(`${API}?date=${d}&utc=2`, {
        headers: { 'User-Agent': 'Gambeta/1.0 (+https://gambetafutbol.games)' },
      })
      if (!res.ok) {
        console.warn(`skip ${d}: HTTP ${res.status}`)
        continue
      }
      const json = await res.json()
      for (const g of json.games || []) {
        const m = mapGame(g)
        if (m && !seen.has(m.id)) {
          seen.add(m.id)
          matches.push(m)
        }
      }
    } catch (e) {
      console.warn(`skip ${d}: ${e.message}`)
    }
  }

  if (matches.length === 0) {
    console.warn('No matches fetched; leaving existing live-scores.json untouched.')
    return
  }

  const order = { LIVE: 0, UPCOMING: 1, FINAL: 2 }
  const PER_TAB = 12
  const byTab = { lpf: [], libertadores: [], europe: [] }
  for (const m of matches) byTab[m.league]?.push(m)
  const trimmed = []
  for (const tab of Object.keys(byTab)) {
    byTab[tab].sort((a, b) => order[a.status] - order[b.status])
    trimmed.push(...byTab[tab].slice(0, PER_TAB))
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(trimmed, null, 2))
  console.log(`Wrote ${trimmed.length} matches to ${OUT} (${Object.entries(byTab).map(([t, a]) => `${t}:${Math.min(a.length, PER_TAB)}`).join(', ')})`)
}

main()
