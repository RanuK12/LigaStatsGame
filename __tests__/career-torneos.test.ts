import { describe, it, expect } from 'vitest'
import {
  simulateSeason, makeRng, advancePlayer, nextContinentalFrom, playsMundialClubesFrom,
  MAX_SEASONS, TROPHY_META, type CareerState,
} from '@/lib/career-engine'

function base(seed: number): CareerState {
  return {
    player: { name: 'Test', number: 10, position: 'ST', nationality: 'Argentina', flag: '🇦🇷', ovr: 84, age: 24, marketValueM: 40 },
    clubId: 'river-plate', startYear: 2026, seasonsPlayed: 0,
    totals: { matchesPlayed: 0, goals: 0, assists: 0 },
    trophies: {}, clubHistory: ['river-plate'], history: [], pendingOffers: [],
    nextContinental: 'libertadores',
    milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
    finished: false, talento: 'destacado',
  }
}

describe('Libertadores y Mundial de Clubes', () => {
  it('ganar la continental habilita el Mundial de Clubes del año siguiente', () => {
    let vistoMundial = false
    let ganadoMundial = false
    let clasificaciones = 0

    for (let seed = 0; seed < 60 && !ganadoMundial; seed++) {
      let s = base(seed)
      const rng = makeRng(seed * 11 + 5)
      for (let i = 0; i < MAX_SEASONS; i++) {
        const { season, trophiesWon } = simulateSeason(s, rng)
        if (season.clasificoLibertadores) clasificaciones++
        if (season.mundialClubes) vistoMundial = true
        if (season.mundialClubesGanado) {
          ganadoMundial = true
          expect(trophiesWon).toContain('mundial-clubes')
        }
        // El Mundial solo se juega si el año anterior se ganó la continental
        if (season.mundialClubes) expect(s.playsMundialClubes).toBe(true)
        const trophies = { ...s.trophies }
        trophiesWon.forEach((t) => (trophies[t] = (trophies[t] || 0) + 1))
        s = {
          ...s, player: advancePlayer(s, season), seasonsPlayed: s.seasonsPlayed + 1,
          history: [...s.history, season], trophies,
          nextContinental: nextContinentalFrom(season),
          playsMundialClubes: playsMundialClubesFrom(season),
        }
      }
    }

    expect(clasificaciones).toBeGreaterThan(0)
    expect(vistoMundial).toBe(true)
    expect(ganadoMundial).toBe(true)
  })

  it('el Mundial de Clubes tiene su trofeo en la vitrina', () => {
    expect(TROPHY_META['mundial-clubes']).toBeTruthy()
    expect(TROPHY_META['libertadores'].name).toBe('Libertadores')
  })
})
