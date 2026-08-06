import { describe, it, expect } from 'vitest'
import { tournamentPoints, plazaPorPuesto } from '@/lib/ranking'

describe('plaza continental por puesto en la Liga', () => {
  it('1° a 4° van a Libertadores', () => {
    expect([1, 2, 3, 4].map(plazaPorPuesto)).toEqual(
      ['libertadores', 'libertadores', 'libertadores', 'libertadores'],
    )
  })

  it('5° a 10° van a Sudamericana', () => {
    expect([5, 6, 7, 8, 9, 10].map(plazaPorPuesto)).toEqual(
      ['sudamericana', 'sudamericana', 'sudamericana', 'sudamericana', 'sudamericana', 'sudamericana'],
    )
  })

  it('del 11° para abajo no clasifica nadie', () => {
    expect([11, 14, 28].map(plazaPorPuesto)).toEqual([null, null, null])
  })
})

describe('cuánto vale cada torneo', () => {
  const campeon = (type: Parameters<typeof tournamentPoints>[0]['type']) =>
    tournamentPoints({ type, pos: 1, totalTeams: 16, isChampion: true })

  it('las copas continentales valen más que la liga, y la liga más que la copa local', () => {
    expect(campeon('libertadores')).toBeGreaterThan(campeon('sudamericana'))
    expect(campeon('sudamericana')).toBeGreaterThan(campeon('liga'))
    expect(campeon('liga')).toBeGreaterThan(campeon('copa'))
  })

  // Corregido el 2026-07-31. Antes este test pedía lo contrario: que un torneo flojo restara
  // también en las continentales. Medido con equipos drafteados de verdad, irse en la fase de
  // grupos de la Libertadores daba -73 puntos, o sea que jugar la copa que te ganaste salía más
  // caro que no clasificar nunca. Eso empuja a NO usar la plaza, que es justo al revés de lo que
  // el modo busca. La plaza es un premio: el peor resultado posible es cero, nunca un castigo.
  it('en las continentales el peor resultado es cero, nunca un castigo', () => {
    expect(tournamentPoints({ type: 'libertadores', pos: 16, totalTeams: 16, isChampion: false }))
      .toBeGreaterThanOrEqual(0)
    expect(tournamentPoints({ type: 'sudamericana', pos: 32, totalTeams: 32, isChampion: false }))
      .toBeGreaterThanOrEqual(0)
  })

  it('el castigo por descenso es solo de la liga', () => {
    // Mismo puesto y mismo total: la diferencia entre las dos bases no puede incluir el -20 del
    // descenso, porque en una copa de eliminación directa terminar abajo es quedar afuera, no
    // descender.
    const liga = tournamentPoints({ type: 'liga', pos: 26, totalTeams: 28, isChampion: false })
    const copa = tournamentPoints({ type: 'copa', pos: 26, totalTeams: 28, isChampion: false })
    const perf = 1 - (2 * 25) / 27
    expect(liga).toBe(Math.round(100 * perf - 20))
    expect(copa).toBe(Math.round(70 * perf))
  })
})
