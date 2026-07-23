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

export interface CareerClub {
  id: string
  name: string
  strength: number
  continental: boolean
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
    colors: c.colors,
  }))

export const SUDAM_CLUBS: CareerClub[] = CONTINENTAL_CLUBS.filter(
  (c) => !ARG_CLUBS.some((a) => a.id === c.id),
).map((c) => ({ id: c.id, name: c.name, strength: c.strength.overall, continental: true }))

export const ALL_CLUBS: CareerClub[] = [...ARG_CLUBS, ...SUDAM_CLUBS]

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
  continental: 'libertadores' | 'sudamericana' | null
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
  lpf: { name: 'Liga Profesional', icon: '⭐' },
  'copa-arg': { name: 'Copa Argentina', icon: '🥛' },
  libertadores: { name: 'Libertadores', icon: '🏆' },
  sudamericana: { name: 'Sudamericana', icon: '🥇' },
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

  // Competition outcomes: club strength + a small player influence
  const influence = (ovr - 75) / 300
  const ligaP = clamp((club.strength - 70) / 30 + influence, 0.03, 0.55)
  const copaP = clamp((club.strength - 68) / 34 + influence, 0.04, 0.5)
  const contType = state.nextContinental
  const contP = clamp((club.strength - 74) / 42 + influence, 0.02, 0.4)

  const liga = rng() < ligaP
  const copaArgentina = rng() < copaP
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

  const highlights: string[] = []
  if (liga) highlights.push(`🏆 Campeón de la Liga Profesional con ${club.name}`)
  if (continentalWon) highlights.push(`🌎 Levantaste la ${contType === 'libertadores' ? 'Copa Libertadores' : 'Copa Sudamericana'}`)
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

  const count = 1 + Math.floor(rng() * 3) // 1..3
  const candidates = ALL_CLUBS.filter(
    (c) => c.id !== state.clubId && c.strength >= current.strength - 1,
  ).sort(() => rng() - 0.5)

  return candidates.slice(0, count).map((c) => ({
    clubId: c.id,
    clubName: c.name,
    strength: c.strength,
    valueM: Math.max(1, Math.round(value * (1.1 + rng() * 0.6))),
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
