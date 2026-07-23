/**
 * Real match data for the Home widget, client-side (static export friendly).
 *
 * Source: TheSportsDB `eventsday.php?d=<date>&s=Soccer`, mapped by LEAGUE NAME
 * (not fabricated league IDs). The free/test key ('3') is heavily scoped and returns
 * little; set NEXT_PUBLIC_SPORTSDB_KEY to a real key for full data. Any failure or
 * empty result falls back to the cached JSON in public/data/live-scores.json.
 */

export type LeagueTab = 'lpf' | 'libertadores' | 'europe'

export interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeLogo?: string
  awayLogo?: string
  homeScore?: number
  awayScore?: number
  status: 'FINAL' | 'LIVE' | 'UPCOMING'
  minute?: string
  time?: string
  league: LeagueTab
  competition?: string
}

interface SportsDbEvent {
  idEvent?: string
  strLeague?: string
  strHomeTeam?: string
  strAwayTeam?: string
  strHomeTeamBadge?: string
  strAwayTeamBadge?: string
  intHomeScore?: string | null
  intAwayScore?: string | null
  strStatus?: string | null
  strProgress?: string | null
  strTime?: string | null
}

const TAB_MATCHERS: { tab: LeagueTab; re: RegExp }[] = [
  { tab: 'lpf', re: /argentin.*(primera|liga profesional|liga argentina)/i },
  { tab: 'libertadores', re: /libertadores|sudamericana/i },
  { tab: 'europe', re: /(spanish )?la liga|english premier league|uefa champions league/i },
]

/** Map a TheSportsDB league name to one of our tabs, or null if not a tracked league. */
export function leagueTab(leagueName: string | undefined | null): LeagueTab | null {
  if (!leagueName) return null
  return TAB_MATCHERS.find((m) => m.re.test(leagueName))?.tab ?? null
}

const FINISHED = new Set(['FT', 'AET', 'PEN', 'Match Finished', 'Finished', 'AP'])
const LIVE = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'Live', 'In Play'])

function toScore(v: string | null | undefined): number | undefined {
  if (v === null || v === undefined || v === '') return undefined
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? undefined : n
}

/** Map a raw event to a Match, or null when it is not a tracked league. */
export function mapEvent(ev: SportsDbEvent): Match | null {
  const tab = leagueTab(ev.strLeague)
  if (!tab || !ev.strHomeTeam || !ev.strAwayTeam) return null

  const homeScore = toScore(ev.intHomeScore)
  const awayScore = toScore(ev.intAwayScore)
  const status = ev.strStatus ?? ''
  const progress = ev.strProgress ?? ''

  let matchStatus: Match['status']
  let minute: string | undefined
  let time: string | undefined

  if (FINISHED.has(status)) {
    matchStatus = 'FINAL'
  } else if (LIVE.has(status) || /^\d+/.test(progress)) {
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
    homeScore,
    awayScore,
    status: matchStatus,
    minute,
    time,
    league: tab,
  }
}

const STATUS_ORDER: Record<Match['status'], number> = { LIVE: 0, UPCOMING: 1, FINAL: 2 }

function ymd(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

/**
 * Fetch soccer events for yesterday+today and map the tracked leagues.
 * Returns [] on any failure so the caller can use the cached fallback.
 */
export async function fetchLiveScores(key?: string): Promise<Match[]> {
  const apiKey = key || process.env.NEXT_PUBLIC_SPORTSDB_KEY || '3'
  const days = [ymd(-1), ymd(0)]
  try {
    const batches = await Promise.all(
      days.map((d) =>
        fetch(`https://www.thesportsdb.com/api/v1/json/${apiKey}/eventsday.php?d=${d}&s=Soccer`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ),
    )
    const seen = new Set<string>()
    const matches: Match[] = []
    for (const batch of batches) {
      const events: SportsDbEvent[] = batch?.events || []
      for (const ev of events) {
        const m = mapEvent(ev)
        if (m && !seen.has(m.id)) {
          seen.add(m.id)
          matches.push(m)
        }
      }
    }
    matches.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
    return matches
  } catch {
    return []
  }
}
