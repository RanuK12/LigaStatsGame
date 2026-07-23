// Sync real match data into public/data/live-scores.json (fallback for the Home widget).
// Run manually or on a daily cron / GitHub Action:  node scripts/data/fetch-live-scores.mjs
// Uses TheSportsDB. Set SPORTSDB_KEY to a real key (the '3' test key is heavily scoped).
import fs from 'node:fs'
import path from 'node:path'

const KEY = process.env.SPORTSDB_KEY || '3'
const OUT = path.join(process.cwd(), 'public', 'data', 'live-scores.json')

const TAB_MATCHERS = [
  { tab: 'lpf', re: /argentin.*(primera|liga profesional|liga argentina)/i },
  { tab: 'libertadores', re: /libertadores|sudamericana/i },
  { tab: 'europe', re: /(spanish )?la liga|english premier league|uefa champions league/i },
]
const FINISHED = new Set(['FT', 'AET', 'PEN', 'Match Finished', 'Finished', 'AP'])
const LIVE = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'Live', 'In Play'])

const leagueTab = (name) => (name ? TAB_MATCHERS.find((m) => m.re.test(name))?.tab ?? null : null)
const toScore = (v) => (v === null || v === undefined || v === '' ? undefined : (Number.isNaN(+v) ? undefined : +v))

function mapEvent(ev) {
  const tab = leagueTab(ev.strLeague)
  if (!tab || !ev.strHomeTeam || !ev.strAwayTeam) return null
  const status = ev.strStatus ?? ''
  const progress = ev.strProgress ?? ''
  let matchStatus, minute, time
  if (FINISHED.has(status)) matchStatus = 'FINAL'
  else if (LIVE.has(status) || /^\d+/.test(progress)) {
    matchStatus = 'LIVE'
    minute = /^\d+/.test(progress) ? `${progress.replace(/'+$/, '')}'` : status || 'EN VIVO'
  } else {
    matchStatus = 'UPCOMING'
    time = ev.strTime ? ev.strTime.slice(0, 5) : undefined
  }
  return {
    id: ev.idEvent || `${ev.strHomeTeam}-${ev.strAwayTeam}`,
    homeTeam: ev.strHomeTeam,
    awayTeam: ev.strAwayTeam,
    homeLogo: ev.strHomeTeamBadge || undefined,
    awayLogo: ev.strAwayTeamBadge || undefined,
    homeScore: toScore(ev.intHomeScore),
    awayScore: toScore(ev.intAwayScore),
    status: matchStatus,
    minute,
    time,
    league: tab,
  }
}

function ymd(offset) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

async function main() {
  const days = [ymd(-1), ymd(0)]
  const seen = new Set()
  const matches = []
  for (const d of days) {
    try {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/json/${KEY}/eventsday.php?d=${d}&s=Soccer`)
      if (!res.ok) continue
      const json = await res.json()
      for (const ev of json.events || []) {
        const m = mapEvent(ev)
        if (m && !seen.has(m.id)) {
          seen.add(m.id)
          matches.push(m)
        }
      }
    } catch (e) {
      console.warn(`skip ${d}: ${e.message}`)
    }
  }
  const order = { LIVE: 0, UPCOMING: 1, FINAL: 2 }
  matches.sort((a, b) => order[a.status] - order[b.status])
  fs.mkdirSync(path.dirname(OUT), { recursive: true })
  fs.writeFileSync(OUT, JSON.stringify(matches, null, 2))
  console.log(`Wrote ${matches.length} matches to ${OUT} (key=${KEY === '3' ? 'test' : 'custom'})`)
}

main()
