import { describe, it, expect } from 'vitest'
import { leagueTab, mapEvent } from '@/lib/live-scores'

describe('live-scores mapping', () => {
  it('maps league names to tabs', () => {
    expect(leagueTab('Argentinian Primera División')).toBe('lpf')
    expect(leagueTab('Argentinian Liga Profesional')).toBe('lpf')
    expect(leagueTab('Copa Libertadores')).toBe('libertadores')
    expect(leagueTab('Copa Sudamericana')).toBe('libertadores')
    expect(leagueTab('Spanish La Liga')).toBe('europe')
    expect(leagueTab('English Premier League')).toBe('europe')
    expect(leagueTab('UEFA Champions League')).toBe('europe')
    expect(leagueTab('American USL Championship')).toBeNull()
    expect(leagueTab(null)).toBeNull()
  })

  it('ignores events from untracked leagues', () => {
    expect(mapEvent({ strLeague: 'MLS', strHomeTeam: 'A', strAwayTeam: 'B' })).toBeNull()
  })

  it('maps a finished event', () => {
    const m = mapEvent({
      idEvent: '1',
      strLeague: 'Spanish La Liga',
      strHomeTeam: 'Real Madrid',
      strAwayTeam: 'Barcelona',
      intHomeScore: '2',
      intAwayScore: '1',
      strStatus: 'FT',
    })!
    expect(m.status).toBe('FINAL')
    expect(m.homeScore).toBe(2)
    expect(m.awayScore).toBe(1)
    expect(m.league).toBe('europe')
  })

  it('maps a live event with minute from progress', () => {
    const m = mapEvent({
      strLeague: 'Copa Libertadores',
      strHomeTeam: 'Flamengo',
      strAwayTeam: 'River Plate',
      intHomeScore: '1',
      intAwayScore: '0',
      strStatus: '2H',
      strProgress: '67',
    })!
    expect(m.status).toBe('LIVE')
    expect(m.minute).toBe("67'")
  })

  it('maps an upcoming event with time', () => {
    const m = mapEvent({
      strLeague: 'Argentinian Primera División',
      strHomeTeam: 'Boca',
      strAwayTeam: 'River',
      intHomeScore: null,
      intAwayScore: null,
      strStatus: 'NS',
      strTime: '21:30:00',
    })!
    expect(m.status).toBe('UPCOMING')
    expect(m.time).toBe('21:30')
    expect(m.homeScore).toBeUndefined()
  })
})
