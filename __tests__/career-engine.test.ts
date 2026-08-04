import { describe, it, expect } from 'vitest'
import {
  makeRng,
  simulateSeason,
  advancePlayer,
  marketValueFor,
  nextContinentalFrom,
  findClub,
  ALL_CLUBS,
  ARG_CLUBS,
  nationalTeamSeason,
  type CareerState,
} from '@/lib/career-engine'

function baseState(overrides: Partial<CareerState> = {}): CareerState {
  return {
    player: { name: 'Test', number: 9, position: 'ST', nationality: 'Argentina', flag: '🇦🇷', ovr: 78, age: 22, marketValueM: marketValueFor(78, 22) },
    clubId: 'river-plate',
    startYear: 2026,
    seasonsPlayed: 0,
    totals: { matchesPlayed: 0, goals: 0, assists: 0 },
    trophies: {},
    clubHistory: ['river-plate'],
    history: [],
    pendingOffers: [],
    nextContinental: 'libertadores',
    milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
    finished: false,
    ...overrides,
  }
}

describe('career-engine', () => {
  it('club strength derivation covers all clubs within bounds', () => {
    expect(ALL_CLUBS.length).toBeGreaterThan(30)
    // El piso bajó de 60 a 50 cuando entraron el ascenso y las ligas de los otros países: un
    // club de la Primera B Metropolitana no puede valer lo mismo que uno de Primera, y esa
    // diferencia es justamente lo que hace que ascender se sienta. Lo que sigue sin poder pasar
    // es que las categorías se pisen, así que el test ahora mira eso.
    for (const c of ALL_CLUBS) {
      expect(c.strength).toBeGreaterThanOrEqual(50)
      expect(c.strength).toBeLessThanOrEqual(90)
    }
    const rango = (div: number) => {
      const v = ALL_CLUBS.filter((c) => c.division === div).map((c) => c.strength)
      return { min: Math.min(...v), max: Math.max(...v) }
    }
    expect(rango(1).min).toBeGreaterThan(rango(2).min)
    expect(rango(2).min).toBeGreaterThan(rango(3).min)
    expect(rango(1).max).toBeGreaterThan(rango(2).max)
    // National team entry must be excluded from the club pool.
    expect(ARG_CLUBS.some((c) => c.id === 'argentina')).toBe(false)
  })

  it('simulateSeason is deterministic for a given seed', () => {
    const s = baseState()
    const a = simulateSeason(s, makeRng(12345))
    const b = simulateSeason(s, makeRng(12345))
    expect(a.season).toEqual(b.season)
    expect(a.trophiesWon).toEqual(b.trophiesWon)
    expect(a.offers).toEqual(b.offers)
  })

  it('produces sane season stats', () => {
    const { season } = simulateSeason(baseState(), makeRng(7))
    // Los partidos ya no son fijos: dependen de la titularidad (nivel vs club, edad, si
    // recién llegaste). Lo que sí tiene que cumplirse es que sea un número de temporada real.
    expect(season.matchesPlayed).toBeGreaterThanOrEqual(4)
    expect(season.matchesPlayed).toBeLessThanOrEqual(41)
    expect(season.goals).toBeGreaterThanOrEqual(0)
    expect(season.assists).toBeGreaterThanOrEqual(0)
    // A striker should out-score a defender on average across seeds.
  })

  it('offers only come from clubs that exist in the pool', () => {
    const { offers } = simulateSeason(baseState({ player: { ...baseState().player, ovr: 90 } }), makeRng(3))
    for (const o of offers) {
      expect(findClub(o.clubId)).toBeDefined()
      expect(o.clubId).not.toBe('river-plate')
      expect(o.valueM).toBeGreaterThan(0)
    }
  })

  it('advancePlayer ages the player and keeps OVR within bounds', () => {
    const s = baseState()
    const { season } = simulateSeason(s, makeRng(99))
    const next = advancePlayer(s, season)
    expect(next.age).toBe(s.player.age + 1)
    expect(next.ovr).toBeGreaterThanOrEqual(55)
    expect(next.ovr).toBeLessThanOrEqual(99)
    expect(next.marketValueM).toBe(marketValueFor(next.ovr, next.age))
  })

  it('market value falls for older players at equal OVR', () => {
    expect(marketValueFor(85, 33)).toBeLessThan(marketValueFor(85, 24))
  })

  it('winning the liga qualifies for Libertadores next year', () => {
    expect(nextContinentalFrom({ liga: true, continentalWon: false } as any)).toBe('libertadores')
    expect(nextContinentalFrom({ liga: false, continentalWon: false } as any)).toBe('sudamericana')
  })
})

describe('national team system', () => {
  const nt = (nationality: string, ovr: number, seed: number, wc = false) =>
    nationalTeamSeason({ nationality, ovr, performance: 0.7, year: wc ? 2026 : 2027, wasCalledUp: false, position: 'ST', rng: makeRng(seed) })

  it('a weak NT calls low-OVR players; a strong NT does not', () => {
    // Paraguay (débil): un 65 entra. Argentina (fuerte): un 65 no.
    let paraCalled = 0, argCalled = 0
    for (let i = 1; i <= 200; i++) {
      if (nt('Paraguay', 65, i).called) paraCalled++
      if (nt('Argentina', 65, i).called) argCalled++
    }
    expect(paraCalled).toBeGreaterThan(100)
    expect(argCalled).toBe(0)
  })

  it('caps and goals are non-negative and bounded', () => {
    const r = nt('Argentina', 88, 5, true)
    expect(r.caps).toBeGreaterThanOrEqual(0)
    expect(r.caps).toBeLessThan(40)
    expect(r.goals).toBeGreaterThanOrEqual(0)
  })

  it('World Cup year produces a WC highlight when called up', () => {
    const withWc = Array.from({ length: 30 }, (_, i) => nt('Argentina', 88, i + 1, true))
      .some((r) => r.highlights.some((h) => /Mundial|CAMPEÓN/.test(h)))
    expect(withWc).toBe(true)
  })
})
