import { describe, it, expect } from 'vitest'
import { mapEspnEvent, LEAGUES } from '@/lib/live-scores'

const lpf = { name: 'Primera División Argentina', icon: '🇦🇷', rank: 0 }

describe('live-scores (ESPN)', () => {
  it('mapea un partido terminado con su resultado', () => {
    const m = mapEspnEvent(
      {
        id: '1',
        date: '2026-07-25T22:15Z',
        competitions: [
          {
            competitors: [
              { homeAway: 'home', score: '0', team: { displayName: 'River Plate', logo: 'r.png' } },
              { homeAway: 'away', score: '1', team: { displayName: 'Barracas Central' } },
            ],
            status: { type: { state: 'post', shortDetail: 'FT' } },
          },
        ],
      },
      lpf,
    )!
    expect(m.status).toBe('FINAL')
    expect(m.homeTeam).toBe('River Plate')
    expect(m.homeScore).toBe(0)
    expect(m.awayScore).toBe(1)
    expect(m.leagueName).toBe('Primera División Argentina')
  })

  it('mapea un partido en vivo con el minuto', () => {
    const m = mapEspnEvent(
      {
        id: '2',
        competitions: [
          {
            competitors: [
              { homeAway: 'home', score: '1', team: { displayName: 'Estudiantes' } },
              { homeAway: 'away', score: '0', team: { displayName: 'Independiente' } },
            ],
            status: { displayClock: "28'", type: { state: 'in', shortDetail: "28'" } },
          },
        ],
      },
      lpf,
    )!
    expect(m.status).toBe('LIVE')
    expect(m.minute).toBe("28'")
  })

  it('mapea un partido por jugar con horario y sin resultado', () => {
    const m = mapEspnEvent(
      {
        id: '3',
        date: '2026-07-28T22:00Z',
        competitions: [
          {
            competitors: [
              { homeAway: 'home', team: { displayName: 'Banfield' } },
              { homeAway: 'away', team: { displayName: 'Sarmiento' } },
            ],
            status: { type: { state: 'pre', shortDetail: 'Scheduled' } },
          },
        ],
      },
      lpf,
    )!
    expect(m.status).toBe('UPCOMING')
    expect(m.homeScore).toBeUndefined()
    expect(m.time).toMatch(/^\d{2}:\d{2}$/)
  })

  it('descarta eventos sin los dos equipos', () => {
    expect(mapEspnEvent({ id: '4', competitions: [{ competitors: [] }] }, lpf)).toBeNull()
  })

  it('sigue las ligas que le importan al hincha argentino', () => {
    const slugs = LEAGUES.map((l) => l.slug)
    expect(slugs).toContain('arg.1')
    expect(slugs).toContain('conmebol.libertadores')
    expect(slugs).toContain('uefa.champions')
    // La Primera División argentina va primera en la agenda
    expect(LEAGUES.find((l) => l.slug === 'arg.1')!.rank).toBe(0)
  })
})
