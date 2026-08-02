import { describe, it, expect } from 'vitest'
import { leyendaParecida } from '@/lib/career-legend'
import type { CareerState } from '@/lib/career-engine'

/**
 * La comparación con una leyenda es el titular de la ficha compartible, así que tiene que ser
 * defendible: un arquero no puede salir comparado con un nueve, y una carrera de 15 títulos y
 * OVR 95 no puede salir comparada con un ídolo de barrio.
 */
function carrera(over: Partial<CareerState> = {}): CareerState {
  return {
    player: { name: 'Test', number: 10, position: 'ST', nationality: 'Argentina', flag: '🇦🇷', ovr: 72, age: 20, marketValueM: 5 },
    clubId: 'banfield',
    startYear: 2026,
    seasonsPlayed: 10,
    totals: { matchesPlayed: 300, goals: 60, assists: 30 },
    trophies: {},
    clubHistory: ['banfield'],
    history: [],
    pendingOffers: [],
    nextContinental: 'sudamericana',
    milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
    finished: true,
    ...over,
  }
}

describe('a qué leyenda te pareciste', () => {
  it('siempre devuelve una, aunque la carrera sea un desastre', () => {
    const c = carrera({ seasonsPlayed: 2, totals: { matchesPlayed: 20, goals: 0, assists: 0 } })
    const r = leyendaParecida(c)
    expect(r.leyenda.nombre).toBeTruthy()
    expect(r.parecido).toBeGreaterThanOrEqual(0)
    expect(r.parecido).toBeLessThanOrEqual(100)
  })

  it('a un arquero solo lo compara con arqueros', () => {
    const c = carrera({
      player: { ...carrera().player, position: 'GK' },
      totals: { matchesPlayed: 400, goals: 0, assists: 0 },
    })
    expect(['Ubaldo Fillol', 'Sergio Goycochea']).toContain(leyendaParecida(c).leyenda.nombre)
  })

  it('a un jugador de campo nunca lo compara con un arquero', () => {
    for (const pos of ['ST', 'CM', 'CB', 'LW']) {
      const r = leyendaParecida(carrera({ player: { ...carrera().player, position: pos } }))
      expect(r.leyenda.categoria).not.toBe('GK')
    }
  })

  it('no ofrece a Maradona ni a Messi si no ganaste el Mundial', () => {
    const c = carrera({
      player: { ...carrera().player, ovr: 95 },
      trophies: { lpf: 6, libertadores: 3, champions: 3 },
      totals: { matchesPlayed: 500, goals: 300, assists: 150 },
      milestones: { nationalTeam: true, balonDeOro: 3, goldenBoots: 4, worldCup: false },
    })
    expect(['Diego Maradona', 'Lionel Messi']).not.toContain(leyendaParecida(c).leyenda.nombre)
  })

  it('no ofrece a Messi sin Balón de Oro, aunque hayas ganado el Mundial', () => {
    const c = carrera({
      player: { ...carrera().player, ovr: 96 },
      trophies: { lpf: 8, champions: 4 },
      totals: { matchesPlayed: 600, goals: 400, assists: 200 },
      milestones: { nationalTeam: true, balonDeOro: 0, goldenBoots: 0, worldCup: true },
    })
    expect(leyendaParecida(c).leyenda.nombre).not.toBe('Lionel Messi')
  })

  it('es determinística: la misma carrera da siempre la misma leyenda', () => {
    const c = carrera({ trophies: { lpf: 3 } })
    const primera = leyendaParecida(c).leyenda.nombre
    for (let i = 0; i < 20; i++) expect(leyendaParecida(c).leyenda.nombre).toBe(primera)
  })

  it('una carrera de leyenda no cae en el ídolo de barrio', () => {
    const c = carrera({
      player: { ...carrera().player, ovr: 97 },
      seasonsPlayed: 15,
      trophies: { lpf: 5, libertadores: 2, champions: 3 },
      clubHistory: ['boca-juniors', 'fc-barcelona', 'real-madrid'],
      totals: { matchesPlayed: 600, goals: 350, assists: 180 },
      milestones: { nationalTeam: true, balonDeOro: 5, goldenBoots: 3, worldCup: true },
    })
    const r = leyendaParecida(c)
    expect(['un ídolo de barrio', 'un histórico del Ascenso']).not.toContain(r.leyenda.nombre)
    expect(r.parecido).toBeGreaterThan(50)
  })

  it('una carrera que se quedó siempre en el mismo club argentino no sale comparada con uno de Europa', () => {
    const c = carrera({
      player: { ...carrera().player, position: 'CM', ovr: 84 },
      seasonsPlayed: 15,
      clubHistory: ['independiente'],
      trophies: { lpf: 4, libertadores: 2 },
      totals: { matchesPlayed: 500, goals: 90, assists: 120 },
    })
    const r = leyendaParecida(c)
    expect(r.leyenda.perfil.europa).toBeLessThan(0.5)
  })

  it('reparte: distintas carreras dan distintas leyendas', () => {
    const casos = [
      carrera({ player: { ...carrera().player, position: 'GK' } }),
      carrera({ player: { ...carrera().player, position: 'CB', ovr: 86 }, clubHistory: ['boca-juniors', 'inter-milan'], seasonsPlayed: 14 }),
      carrera({ player: { ...carrera().player, ovr: 90 }, trophies: { lpf: 2 }, totals: { matchesPlayed: 450, goals: 240, assists: 60 }, clubHistory: ['river-plate', 'juventus', 'inter-milan', 'chelsea'] }),
      carrera({ seasonsPlayed: 3, totals: { matchesPlayed: 40, goals: 4, assists: 2 } }),
    ]
    const nombres = new Set(casos.map((c) => leyendaParecida(c).leyenda.nombre))
    expect(nombres.size).toBeGreaterThanOrEqual(3)
  })
})
