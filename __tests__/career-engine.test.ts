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
    for (const c of ALL_CLUBS) {
      expect(c.strength).toBeGreaterThanOrEqual(60)
      expect(c.strength).toBeLessThanOrEqual(90)
    }
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
    expect(season.matchesPlayed).toBeGreaterThanOrEqual(26)
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
