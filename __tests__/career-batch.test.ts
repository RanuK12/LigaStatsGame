import { describe, it, expect } from 'vitest'
import { simulateSeason, makeRng, advancePlayer, findClub, type CareerState } from '@/lib/career-engine'

function nueva(): CareerState {
  return {
    player: { name: 'Test', number: 10, position: 'ST', nationality: 'Argentina', flag: '🇦🇷', ovr: 72, age: 20, marketValueM: 5 },
    clubId: 'banfield', startYear: 2026, seasonsPlayed: 0,
    totals: { matchesPlayed: 0, goals: 0, assists: 0 },
    trophies: {}, clubHistory: ['banfield'], history: [], pendingOffers: [],
    nextContinental: 'sudamericana',
    milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
    finished: false,
  }
}

// Reproduce el lazo de "simular 5 años": las ofertas se resuelven solas y NO frenan el lote.
describe('simulación en lote', () => {
  it('simula las 5 temporadas aunque aparezcan ofertas', () => {
    let state = nueva()
    const rng = makeRng(7)
    for (let i = 0; i < 5; i++) {
      if (state.pendingOffers.length > 0) {
        const actual = findClub(state.clubId)!
        const mejor = [...state.pendingOffers].sort((a, b) => b.strength - a.strength)[0]
        state = mejor.strength > actual.strength
          ? { ...state, clubId: mejor.clubId, pendingOffers: [] }
          : { ...state, pendingOffers: [] }
      }
      const { season, offers } = simulateSeason(state, rng)
      state = {
        ...state,
        player: advancePlayer(state, season),
        seasonsPlayed: state.seasonsPlayed + 1,
        history: [...state.history, season],
        pendingOffers: offers,
      }
    }
    expect(state.history).toHaveLength(5)
    expect(state.seasonsPlayed).toBe(5)
  })
})
