import clubsData from '@/data/clubs.json'
import { CONTINENTAL_CLUBS } from './copa-libertadores'

/**
 * Single-player career simulation.
 *
 * The Draft/Liga engine in `game-engine.ts` is squad-centric (needs a full XI +
 * formation), so it does not fit a career built around ONE player. This module is a
 * self-contained, deterministic (seedable) simulation that reuses the real club data:
 * `clubs.json` for Argentine clubs and `CONTINENTAL_CLUBS` for the continental pool.
 */

export type PositionCategory = 'GK' | 'DEF' | 'MID' | 'ATT'

export interface PositionOption {
  code: string
  label: string
  category: PositionCategory
}

export const POSITIONS: PositionOption[] = [
  { code: 'GK', label: 'Arquero', category: 'GK' },
  { code: 'CB', label: 'Defensor Central', category: 'DEF' },
  { code: 'LB', label: 'Lateral Izquierdo', category: 'DEF' },
  { code: 'RB', label: 'Lateral Derecho', category: 'DEF' },
  { code: 'CDM', label: 'Volante Central', category: 'MID' },
  { code: 'CM', label: 'Mediocampista', category: 'MID' },
  { code: 'CAM', label: 'Enganche', category: 'MID' },
  { code: 'LW', label: 'Extremo Izquierdo', category: 'ATT' },
  { code: 'RW', label: 'Extremo Derecho', category: 'ATT' },
  { code: 'CF', label: 'Segunda Punta', category: 'ATT' },
  { code: 'ST', label: 'Delantero Centro', category: 'ATT' },
]

export function positionCategory(code: string): PositionCategory {
  return POSITIONS.find((p) => p.code === code)?.category ?? 'MID'
}

export type Region = 'arg' | 'sudam' | 'euro'
export type ContinentalComp = 'libertadores' | 'sudamericana' | 'champions' | 'europa'

export interface CareerClub {
  id: string
  name: string
  strength: number
  continental: boolean
  region: Region
  flag?: string
  colors?: string[]
}

/** Argentine clubs from clubs.json, excluding the national team entry. */
export const ARG_CLUBS: CareerClub[] = (clubsData as any[])
  .filter((c) => c.id !== 'argentina')
  .map((c) => ({
    id: c.id,
    name: c.name,
    strength: argClubStrength(c.titles ?? 0, c.Libertadores ?? 0, c.id),
    continental: false,
    region: 'arg' as Region,
    colors: c.colors,
  }))

export const SUDAM_CLUBS: CareerClub[] = CONTINENTAL_CLUBS.filter(
  (c) => !ARG_CLUBS.some((a) => a.id === c.id),
).map((c) => ({ id: c.id, name: c.name, strength: c.strength.overall, continental: true, region: 'sudam' as Region }))

/** Elite europeo: el "salto a Europa". No dependen de ninguna base; son para la simulación. */
export const EURO_CLUBS: CareerClub[] = [
  { id: 'real-madrid', name: 'Real Madrid', strength: 90, continental: true, region: 'euro', flag: '🇪🇸' },
  { id: 'fc-barcelona', name: 'FC Barcelona', strength: 88, continental: true, region: 'euro', flag: '🇪🇸' },
  { id: 'manchester-city', name: 'Manchester City', strength: 90, continental: true, region: 'euro', flag: '🏴' },
  { id: 'liverpool', name: 'Liverpool', strength: 88, continental: true, region: 'euro', flag: '🏴' },
  { id: 'bayern-munich', name: 'Bayern Múnich', strength: 89, continental: true, region: 'euro', flag: '🇩🇪' },
  { id: 'paris-saint-germain', name: 'Paris Saint-Germain', strength: 87, continental: true, region: 'euro', flag: '🇫🇷' },
  { id: 'inter-milan', name: 'Inter de Milán', strength: 85, continental: true, region: 'euro', flag: '🇮🇹' },
  { id: 'juventus', name: 'Juventus', strength: 84, continental: true, region: 'euro', flag: '🇮🇹' },
  { id: 'manchester-united', name: 'Manchester United', strength: 83, continental: true, region: 'euro', flag: '🏴' },
  { id: 'atletico-madrid', name: 'Atlético Madrid', strength: 84, continental: true, region: 'euro', flag: '🇪🇸' },
  { id: 'chelsea', name: 'Chelsea', strength: 83, continental: true, region: 'euro', flag: '🏴' },
  { id: 'borussia-dortmund', name: 'Borussia Dortmund', strength: 82, continental: true, region: 'euro', flag: '🇩🇪' },
]

export const ALL_CLUBS: CareerClub[] = [...ARG_CLUBS, ...SUDAM_CLUBS, ...EURO_CLUBS]

export function findClub(id: string): CareerClub | undefined {
  return ALL_CLUBS.find((c) => c.id === id)
}

/** Derive a 64-84 strength for an Argentine club, preferring the continental rating when present. */
function argClubStrength(titles: number, libertadores: number, id: string): number {
  const cont = CONTINENTAL_CLUBS.find((c) => c.id === id)
  if (cont) return cont.strength.overall
  return clamp(Math.round(64 + titles * 0.4 + libertadores * 1.5), 64, 82)
}

// ---------- Career state ----------

export interface Trophy {
  id: string
  name: string
  icon: string
  count: number
}

export interface TransferOffer {
  clubId: string
  clubName: string
  valueM: number
  strength: number
  region: Region
  flag?: string
}

export interface SeasonResult {
  year: number
  age: number
  clubId: string
  clubName: string
  matchesPlayed: number
  goals: number
  assists: number
  ovr: number
  marketValueM: number
  liga: boolean
  copaArgentina: boolean
  continental: ContinentalComp | null
  continentalWon: boolean
  rating: number // nota de la temporada 5.5 - 9.9
  topScorer: boolean
  highlights: string[] // momentos narrativos
}

export interface Milestones {
  nationalTeam: boolean
  balonDeOro: number
  goldenBoots: number
  worldCup: boolean
}

export interface CareerPlayer {
  name: string
  number: number
  position: string
  nationality: string
  flag: string
  ovr: number
  age: number
  marketValueM: number
}

export interface CareerState {
  player: CareerPlayer
  clubId: string
  startYear: number
  seasonsPlayed: number
  totals: { matchesPlayed: number; goals: number; assists: number }
  trophies: Record<string, number> // keyed by competition id
  clubHistory: string[] // club ids in order joined
  history: SeasonResult[]
  pendingOffers: TransferOffer[]
  nextContinental: 'libertadores' | 'sudamericana'
  milestones: Milestones
  finished: boolean
}

export const MAX_SEASONS = 15

export const TROPHY_META: Record<string, { name: string; icon: string }> = {
  lpf: { name: 'Liga', icon: '⭐' },
  'copa-arg': { name: 'Copa Argentina', icon: '🥛' },
  libertadores: { name: 'Libertadores', icon: '🏆' },
  sudamericana: { name: 'Sudamericana', icon: '🥇' },
  champions: { name: 'Champions League', icon: '🌟' },
  europa: { name: 'Europa League', icon: '🎖️' },
  mundial: { name: 'Mundial', icon: '🌍' },
}

// ---------- Deterministic RNG ----------

/** mulberry32 seeded PRNG so simulations are reproducible in tests. */
export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

// ---------- Derived metrics ----------

const GOAL_BASE: Record<PositionCategory, number> = { ATT: 14, MID: 6, DEF: 1.5, GK: 0 }
const ASSIST_BASE: Record<PositionCategory, number> = { ATT: 7, MID: 8, DEF: 2, GK: 0 }

export function marketValueFor(ovr: number, age: number): number {
  const base = Math.pow(clamp(ovr - 59, 1, 41) / 40, 2) * 180
  const ageFactor = age <= 27 ? 1 : Math.max(0.25, 1 - (age - 27) * 0.13)
  return clamp(Math.round(base * ageFactor), 0, 220)
}

/** OVR progression driven by age curve + season performance score (0..1). */
function nextOvr(ovr: number, age: number, performance: number): number {
  let delta: number
  if (age <= 21) delta = 1 + Math.round(performance * 2)
  else if (age <= 26) delta = Math.round(performance * 2)
  else if (age <= 29) delta = performance > 0.7 ? 1 : 0
  else if (age <= 32) delta = performance > 0.85 ? 0 : -1
  else delta = -2
  return clamp(ovr + delta, 55, 99)
}

/**
 * Simulate one season for the player. Pure: same (state, rng) -> same result.
 * Returns the season record plus the trophies won and any transfer offers generated.
 */
export function simulateSeason(
  state: CareerState,
  rng: () => number,
): { season: SeasonResult; trophiesWon: string[]; offers: TransferOffer[] } {
  const club = findClub(state.clubId)!
  const cat = positionCategory(state.player.position)
  const ovr = state.player.ovr
  const age = state.player.age
  const year = state.startYear + state.seasonsPlayed

  // Availability / appearances
  const matchesPlayed = 26 + Math.floor(rng() * 16) // 26..41

  // Goal & assist output, scaled by OVR and appearances
  const ovrScale = clamp(ovr / 80, 0.6, 1.35)
  const apps = matchesPlayed / 38
  const goals = Math.max(0, Math.round(GOAL_BASE[cat] * ovrScale * apps * (0.6 + rng() * 0.9)))
  const assists = Math.max(0, Math.round(ASSIST_BASE[cat] * ovrScale * apps * (0.5 + rng() * 0.9)))

  // Competition outcomes: club strength + a small player influence.
  // Calibrado para ser realista y NO fácil: hasta un club grande gana la liga ~1 de cada
  // 5-6 temporadas, no siempre. Te lo tenés que ganar.
  const influence = (ovr - 75) / 300
  const ligaP = clamp((club.strength - 76) / 46 + influence * 0.6, 0.02, 0.32)
  const copaP = clamp((club.strength - 74) / 44 + influence * 0.6, 0.03, 0.3)
  // Competición continental según región del club. La Champions es la más difícil.
  const topTier = state.nextContinental === 'libertadores'
  const contType: ContinentalComp =
    club.region === 'euro' ? (topTier ? 'champions' : 'europa') : topTier ? 'libertadores' : 'sudamericana'
  const contHardness = contType === 'champions' ? 52 : contType === 'europa' ? 44 : 42
  const contP = clamp((club.strength - 74) / contHardness + influence, 0.02, 0.38)

  const liga = rng() < ligaP
  const copaArgentina = club.region === 'arg' && rng() < copaP // Copa Argentina solo en Arg
  const continentalWon = rng() < contP

  const trophiesWon: string[] = []
  if (liga) trophiesWon.push('lpf')
  if (copaArgentina) trophiesWon.push('copa-arg')
  if (continentalWon) trophiesWon.push(contType)

  // Performance score 0..1 relative to a strong season for the position
  const expected = (GOAL_BASE[cat] + ASSIST_BASE[cat]) * ovrScale || 1
  const performance = clamp((goals + assists) / (expected * 1.1), 0, 1)

  // Goleador del torneo (solo posiciones ofensivas, con algo de azar)
  const scorerThreshold = cat === 'ATT' ? 15 : cat === 'MID' ? 12 : 999
  const topScorer = goals >= scorerThreshold && rng() < 0.7

  const rating = clamp(Math.round((5.5 + performance * 3.6 + trophiesWon.length * 0.25) * 10) / 10, 5.5, 9.9)

  const CONT_NAME: Record<ContinentalComp, string> = {
    libertadores: 'Copa Libertadores',
    sudamericana: 'Copa Sudamericana',
    champions: 'Champions League',
    europa: 'Europa League',
  }
  const highlights: string[] = []
  if (liga) highlights.push(`🏆 Campeón de la Liga con ${club.name}`)
  if (continentalWon) highlights.push(`${TROPHY_META[contType]?.icon || '🌎'} Levantaste la ${CONT_NAME[contType]}`)
  if (copaArgentina) highlights.push(`🥛 Campeón de la Copa Argentina`)
  if (topScorer) highlights.push(`🥇 Goleador del torneo con ${goals} goles`)
  else if (goals >= 10 && cat === 'ATT') highlights.push(`⚽ Gran temporada: ${goals} goles`)
  if (cat !== 'ATT' && assists >= 10) highlights.push(`🎯 Temporada de ${assists} asistencias`)
  if (rating >= 9) highlights.push(`⭐ Figura del año (nota ${rating.toFixed(1)})`)

  const season: SeasonResult = {
    year,
    age,
    clubId: club.id,
    clubName: club.name,
    matchesPlayed,
    goals,
    assists,
    ovr,
    marketValueM: state.player.marketValueM,
    liga,
    copaArgentina,
    continental: contType,
    continentalWon,
    rating,
    topScorer,
    highlights,
  }

  // Generate transfer offers from stronger clubs when the season was good
  const offers = generateOffers(state, performance, rng)

  return { season, trophiesWon, offers }
}

function generateOffers(state: CareerState, performance: number, rng: () => number): TransferOffer[] {
  const current = findClub(state.clubId)!
  const value = state.player.marketValueM
  const offerChance = clamp(performance * 0.9 + (state.player.ovr - 75) / 100, 0, 0.95)
  if (rng() > offerChance) return []

  // El "salto a Europa" hay que ganárselo: solo con buen OVR y buena temporada.
  const canEurope = state.player.ovr >= 79 && performance >= 0.5
  const count = 1 + Math.floor(rng() * 3) // 1..3
  const candidates = ALL_CLUBS.filter((c) => {
    if (c.id === state.clubId) return false
    if (c.region === 'euro') return canEurope && c.strength >= current.strength - 4
    return c.strength >= current.strength - 1
  }).sort(() => rng() - 0.5)

  return candidates.slice(0, count).map((c) => ({
    clubId: c.id,
    clubName: c.name,
    strength: c.strength,
    region: c.region,
    flag: c.flag,
    valueM: Math.max(1, Math.round(value * (1.1 + rng() * 0.6) * (c.region === 'euro' ? 1.4 : 1))),
  }))
}

/** Advance the player one year and roll OVR/value from the just-played season. */
export function advancePlayer(state: CareerState, season: SeasonResult): CareerPlayer {
  const cat = positionCategory(state.player.position)
  const ovrScale = clamp(state.player.ovr / 80, 0.6, 1.35)
  const expected = (GOAL_BASE[cat] + ASSIST_BASE[cat]) * ovrScale || 1
  const performance = clamp((season.goals + season.assists) / (expected * 1.1), 0, 1)
  const age = state.player.age + 1
  const ovr = nextOvr(state.player.ovr, state.player.age, performance)
  return {
    ...state.player,
    age,
    ovr,
    marketValueM: marketValueFor(ovr, age),
  }
}

/** Whether qualifying for Libertadores next year (won liga / continental) or Sudamericana. */
export function nextContinentalFrom(season: SeasonResult): 'libertadores' | 'sudamericana' {
  return season.liga || season.continentalWon ? 'libertadores' : 'sudamericana'
}
