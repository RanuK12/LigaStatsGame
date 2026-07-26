import { describe, it, expect } from 'vitest'
import { simulateSeason, makeRng, advancePlayer, type CareerState } from '@/lib/career-engine'

function state(position: string, ovr = 75): CareerState {
  return {
    player: { name: 'Test', number: 1, position, nationality: 'Argentina', flag: '🇦🇷', ovr, age: 24, marketValueM: 10 },
    clubId: 'river-plate', startYear: 2026, seasonsPlayed: 0,
    totals: { matchesPlayed: 0, goals: 0, assists: 0 },
    trophies: {}, clubHistory: ['river-plate'], history: [], pendingOffers: [],
    nextContinental: 'libertadores',
    milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
    finished: false,
  }
}

describe('carrera por puesto', () => {
  it('un arquero no hace goles ni asistencias, ni con la decisión de definición', () => {
    for (let i = 0; i < 60; i++) {
      const { season } = simulateSeason(state('GK'), makeRng(i), 'train_finishing')
      expect(season.goals).toBe(0)
      expect(season.assists).toBe(0)
      expect(season.cleanSheets).toBeGreaterThan(0)
      expect(season.penaltiesSaved).toBeGreaterThanOrEqual(0)
      expect(season.cleanSheets!).toBeLessThanOrEqual(season.matchesPlayed)
    }
  })

  it('un defensor hace pocos goles y ve muchas más tarjetas que un arquero', () => {
    let defGoals = 0, defYellow = 0, gkYellow = 0
    for (let i = 0; i < 60; i++) {
      const d = simulateSeason(state('CB'), makeRng(i)).season
      const g = simulateSeason(state('GK'), makeRng(i)).season
      defGoals += d.goals; defYellow += d.yellowCards || 0; gkYellow += g.yellowCards || 0
      expect(d.goals).toBeLessThan(8)
    }
    expect(defYellow).toBeGreaterThan(gkYellow * 2)
    expect(defGoals).toBeGreaterThan(0)
  })
})
