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

  // El puesto es filtro duro, no un empujón: con el empujón, seis carreras simuladas de verdad
  // daban Ariel Ortega cuatro veces, una de ellas para un zaguero central.
  it('la leyenda es siempre del puesto del jugador', () => {
    const casos: [string, string][] = [
      ['GK', 'GK'],
      ['CB', 'DEF'],
      ['LB', 'DEF'],
      ['CM', 'MID'],
      ['CAM', 'MID'],
      ['ST', 'ATT'],
      ['LW', 'ATT'],
    ]
    for (const [pos, cat] of casos) {
      const r = leyendaParecida(carrera({ player: { ...carrera().player, position: pos } }))
      expect(r.leyenda.categoria, `${pos} salió comparado con ${r.leyenda.nombre}`).toBe(cat)
    }
  })

  it('cada puesto tiene a quién parecerse aunque la carrera sea floja', () => {
    for (const pos of ['GK', 'CB', 'CM', 'ST']) {
      const c = carrera({
        player: { ...carrera().player, position: pos, ovr: 62 },
        seasonsPlayed: 4,
        totals: { matchesPlayed: 60, goals: 2, assists: 1 },
      })
      expect(leyendaParecida(c).leyenda.nombre).toBeTruthy()
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

describe('el perfil de Europa se mide en temporadas, no en clubes', () => {
  // Contar clubes europeos y dividir por temporadas mezcla dos unidades: un central con quince
  // años que pasó por Chelsea, Liverpool y el City daba 3/15 = 0,2 y salía comparado con
  // Roberto Perfumo, cuya ficha dice que nunca se fue del país.
  it('una carrera con media vida en Europa no cae en un ídolo local', () => {
    const c = carrera({
      player: { ...carrera().player, position: 'CB', ovr: 90 },
      seasonsPlayed: 12,
      clubHistory: ['lanus', 'chelsea', 'liverpool'],
      trophies: { lpf: 2, champions: 1 },
      totals: { matchesPlayed: 420, goals: 18, assists: 20 },
      // Ocho de las doce temporadas en Europa.
      history: [
        ...Array.from({ length: 4 }, () => ({ clubId: 'lanus', ovr: 80 })),
        ...Array.from({ length: 4 }, () => ({ clubId: 'chelsea', ovr: 88 })),
        ...Array.from({ length: 4 }, () => ({ clubId: 'liverpool', ovr: 90 })),
      ] as CareerState['history'],
    })
    const r = leyendaParecida(c)
    expect(r.leyenda.perfil.europa).toBeGreaterThan(0.5)
  })

  it('una carrera entera en el país no cae en uno de Europa', () => {
    const c = carrera({
      player: { ...carrera().player, position: 'CB', ovr: 84 },
      seasonsPlayed: 12,
      clubHistory: ['lanus', 'river-plate'],
      trophies: { lpf: 3 },
      history: Array.from({ length: 12 }, () => ({ clubId: 'river-plate', ovr: 82 })) as CareerState['history'],
    })
    expect(leyendaParecida(c).leyenda.perfil.europa).toBeLessThan(0.4)
  })
})
