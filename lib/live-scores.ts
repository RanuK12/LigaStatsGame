/**
 * Partidos reales para la agenda del Home, 100% del lado del cliente (export estático).
 *
 * Fuente: scoreboard público de ESPN
 * (`site.api.espn.com/apis/site/v2/sports/soccer/<liga>/scoreboard?dates=YYYYMMDD`).
 * Es gratis, no pide API key y responde con CORS abierto. Reemplaza a TheSportsDB, que con
 * la key libre '3' devolvía apenas un puñado de partidos y se comía fechas enteras de la
 * Liga Profesional (faltaban River, Talleres y compañía).
 *
 * ESPN agrupa por el día LOCAL de la competencia, que es lo que espera el hincha
 * ("los partidos de anoche"), y trae estado en vivo con minuto.
 */

export type LeagueTab = 'lpf' | 'libertadores' | 'europe'

/** Ligas que seguimos: slug de ESPN + cómo se muestran en la agenda. */
export const LEAGUES: { slug: string; name: string; icon: string; rank: number; tab: LeagueTab }[] = [
  { slug: 'arg.1', name: 'Primera División Argentina', icon: '🇦🇷', rank: 0, tab: 'lpf' },
  { slug: 'arg.copa_lpf', name: 'Copa de la Liga Profesional', icon: '🇦🇷', rank: 0, tab: 'lpf' },
  { slug: 'arg.copa', name: 'Copa Argentina', icon: '🏅', rank: 1, tab: 'lpf' },
  { slug: 'arg.2', name: 'Primera Nacional', icon: '🇦🇷', rank: 6, tab: 'lpf' },
  { slug: 'conmebol.libertadores', name: 'Copa Libertadores', icon: '🏆', rank: 1, tab: 'libertadores' },
  { slug: 'conmebol.sudamericana', name: 'Copa Sudamericana', icon: '🥇', rank: 2, tab: 'libertadores' },
  { slug: 'bra.1', name: 'Brasileirão', icon: '🇧🇷', rank: 5, tab: 'libertadores' },
  { slug: 'uefa.champions', name: 'Champions League', icon: '⭐', rank: 2, tab: 'europe' },
  { slug: 'uefa.europa', name: 'Europa League', icon: '🎖️', rank: 4, tab: 'europe' },
  { slug: 'esp.1', name: 'LaLiga', icon: '🇪🇸', rank: 3, tab: 'europe' },
  { slug: 'eng.1', name: 'Premier League', icon: '🏴', rank: 3, tab: 'europe' },
  { slug: 'ita.1', name: 'Serie A', icon: '🇮🇹', rank: 4, tab: 'europe' },
  { slug: 'ger.1', name: 'Bundesliga', icon: '🇩🇪', rank: 4, tab: 'europe' },
  { slug: 'fra.1', name: 'Ligue 1', icon: '🇫🇷', rank: 4, tab: 'europe' },
  { slug: 'fifa.world', name: 'Copa del Mundo', icon: '🌍', rank: 0, tab: 'europe' },
]

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

/** Partido de agenda: además del cruce, cómo y dónde mostrar su liga. */
export interface AgendaMatch {
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
  leagueName: string
  leagueIcon: string
  leagueRank: number
  kickoff?: string
}

interface EspnCompetitor {
  homeAway?: string
  score?: string
  team?: { displayName?: string; shortDisplayName?: string; name?: string; logo?: string }
}
interface EspnEvent {
  id?: string
  date?: string
  competitions?: {
    competitors?: EspnCompetitor[]
    status?: { displayClock?: string; type?: { state?: string; shortDetail?: string; detail?: string } }
  }[]
}

const STATUS_ORDER: Record<Match['status'], number> = { LIVE: 0, UPCOMING: 1, FINAL: 2 }

function toScore(v: string | null | undefined): number | undefined {
  if (v === null || v === undefined || v === '') return undefined
  const n = parseInt(v, 10)
  return Number.isNaN(n) ? undefined : n
}

function localTime(iso: string | undefined): string | undefined {
  if (!iso) return undefined
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })
}

/** Traduce un evento de ESPN a nuestro partido de agenda. */
export function mapEspnEvent(
  ev: EspnEvent,
  league: { name: string; icon: string; rank: number },
): AgendaMatch | null {
  const comp = ev.competitions?.[0]
  const home = comp?.competitors?.find((c) => c.homeAway === 'home') || comp?.competitors?.[0]
  const away = comp?.competitors?.find((c) => c.homeAway === 'away') || comp?.competitors?.[1]
  const homeName = home?.team?.displayName || home?.team?.name
  const awayName = away?.team?.displayName || away?.team?.name
  if (!homeName || !awayName) return null

  const state = comp?.status?.type?.state // 'pre' | 'in' | 'post'
  const status: AgendaMatch['status'] = state === 'post' ? 'FINAL' : state === 'in' ? 'LIVE' : 'UPCOMING'

  return {
    id: ev.id || `${homeName}-${awayName}-${ev.date ?? ''}`,
    homeTeam: homeName,
    awayTeam: awayName,
    homeLogo: home?.team?.logo,
    awayLogo: away?.team?.logo,
    homeScore: toScore(home?.score),
    awayScore: toScore(away?.score),
    status,
    minute: status === 'LIVE' ? comp?.status?.displayClock || comp?.status?.type?.shortDetail : undefined,
    time: status === 'UPCOMING' ? localTime(ev.date) : undefined,
    leagueName: league.name,
    leagueIcon: league.icon,
    leagueRank: league.rank,
    kickoff: ev.date,
  }
}

async function fetchLeagueDay(
  league: (typeof LEAGUES)[number],
  date: string,
): Promise<AgendaMatch[]> {
  const day = date.replace(/-/g, '')
  try {
    const r = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/${league.slug}/scoreboard?dates=${day}`,
    )
    if (!r.ok) return []
    const json = await r.json()
    const events: EspnEvent[] = json?.events || []
    return events.map((ev) => mapEspnEvent(ev, league)).filter((m): m is AgendaMatch => m !== null)
  } catch {
    return []
  }
}

/** Todos los partidos de una fecha (YYYY-MM-DD) en las ligas que seguimos. */
export async function fetchDayAll(date: string): Promise<AgendaMatch[]> {
  const perLeague = await Promise.all(LEAGUES.map((l) => fetchLeagueDay(l, date)))
  const seen = new Set<string>()
  const out: AgendaMatch[] = []
  for (const list of perLeague) {
    for (const m of list) {
      if (seen.has(m.id)) continue
      seen.add(m.id)
      out.push(m)
    }
  }
  out.sort(
    (a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
      (a.kickoff || '').localeCompare(b.kickoff || ''),
  )
  return out
}

function toMatch(m: AgendaMatch, tab: LeagueTab): Match {
  return {
    id: m.id,
    homeTeam: m.homeTeam,
    awayTeam: m.awayTeam,
    homeLogo: m.homeLogo,
    awayLogo: m.awayLogo,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: m.status,
    minute: m.minute,
    time: m.time,
    league: tab,
    competition: m.leagueName,
  }
}

/** Partidos de UNA fecha, ya clasificados por pestaña (lpf / libertadores / europa). */
export async function fetchScoresForDate(date: string): Promise<Match[]> {
  const perLeague = await Promise.all(
    LEAGUES.map(async (l) => (await fetchLeagueDay(l, date)).map((m) => toMatch(m, l.tab))),
  )
  const matches = perLeague.flat()
  matches.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  return matches
}

function ymd(offsetDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Ayer + hoy: lo que va arriba de todo en el Home. */
export async function fetchLiveScores(): Promise<Match[]> {
  const days = [ymd(-1), ymd(0)]
  const batches = await Promise.all(days.map((d) => fetchScoresForDate(d)))
  const seen = new Set<string>()
  const matches: Match[] = []
  for (const batch of batches) {
    for (const m of batch) {
      if (seen.has(m.id)) continue
      seen.add(m.id)
      matches.push(m)
    }
  }
  matches.sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status])
  return matches
}
