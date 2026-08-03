import { describe, it, expect } from 'vitest'
import { simulateSeason, makeRng, advancePlayer, findClub } from '@/lib/career-engine'
import type { SeasonResult, CareerState } from '@/lib/career-engine'
import {
  idolatriaDeClub,
  idolatriaPorClub,
  clubDeLaVida,
  nivelPara,
  NIVELES,
} from '@/lib/career-idolatria'

function temporada(clubId: string, over: Partial<SeasonResult> = {}): SeasonResult {
  return {
    year: 2026,
    age: 20,
    clubId,
    clubName: clubId,
    matchesPlayed: 30,
    goals: 0,
    assists: 0,
    ovr: 70,
    marketValueM: 5,
    liga: false,
    copaArgentina: false,
    continental: null,
    continentalWon: false,
    rating: 7,
    topScorer: false,
    highlights: [],
    cronica: '',
    ...over,
  }
}

function carrera(history: SeasonResult[], clubId: string): CareerState {
  return {
    player: { name: 'X', number: 10, position: 'CAM', nationality: 'Argentina', flag: '🇦🇷', ovr: 70, age: 25, marketValueM: 5 },
    clubId,
    startYear: 2026,
    seasonsPlayed: history.length,
    totals: { matchesPlayed: 0, goals: 0, assists: 0 },
    trophies: {},
    clubHistory: [],
    history,
    pendingOffers: [],
    nextContinental: 'libertadores',
    milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
    finished: false,
  }
}

describe('idolatría', () => {
  it('arranca en "uno más" con una sola temporada', () => {
    const i = idolatriaDeClub([temporada('velez')], 'velez')
    expect(i.nivel.id).toBe('uno-mas')
    expect(i.temporadas).toBe(1)
  })

  it('la lealtad paga: quedarse rinde más que repartir las mismas temporadas', () => {
    const quedarse = Array.from({ length: 6 }, () => temporada('velez'))
    const saltar = [
      temporada('velez'), temporada('boca'), temporada('velez'),
      temporada('river'), temporada('velez'), temporada('lanus'),
    ]
    const a = idolatriaDeClub(quedarse, 'velez')
    const b = idolatriaDeClub(saltar, 'velez')
    expect(a.puntos).toBeGreaterThan(b.puntos)
    expect(a.rachaMasLarga).toBe(6)
    expect(b.rachaMasLarga).toBe(1)
  })

  it('la racha cuenta temporadas seguidas, no el total en el club', () => {
    // Tres temporadas en Vélez, pero partidas: 2 + 1. La racha es 2, no 3.
    const h = [temporada('velez'), temporada('velez'), temporada('boca'), temporada('velez')]
    expect(idolatriaDeClub(h, 'velez').rachaMasLarga).toBe(2)
    expect(idolatriaDeClub(h, 'velez').temporadas).toBe(3)
  })

  it('se llega a Leyenda con una carrera larga y ganadora en un solo club', () => {
    const h = Array.from({ length: 8 }, () =>
      temporada('velez', { goals: 14, liga: true }),
    )
    expect(idolatriaDeClub(h, 'velez').nivel.id).toBe('leyenda')
  })

  it('no se llega a Leyenda de paso: dos temporadas goleadoras no alcanzan', () => {
    const h = [temporada('velez', { goals: 30, liga: true }), temporada('velez', { goals: 30 })]
    expect(idolatriaDeClub(h, 'velez').nivel.id).not.toBe('leyenda')
  })

  it('el club de la vida es el de más puntos, no el último', () => {
    const h = [
      ...Array.from({ length: 6 }, () => temporada('velez', { goals: 10, liga: true })),
      temporada('boca'),
    ]
    const c = clubDeLaVida(carrera(h, 'boca'))
    expect(c?.clubId).toBe('velez')
  })

  it('lista un club por vez, sin repetidos', () => {
    const h = [temporada('velez'), temporada('boca'), temporada('velez')]
    const todas = idolatriaPorClub(carrera(h, 'velez'))
    expect(todas.map((i) => i.clubId).sort()).toEqual(['boca', 'velez'])
  })

  /**
   * Los casos de arriba usan temporadas escritas a mano. Este corre el MOTOR de verdad: si los
   * pesos estuvieran mal calibrados contra los goles y títulos que el juego produce, los tests
   * sintéticos pasarían igual y en la pantalla no se llegaría nunca a la estatua.
   */
  it('con el motor real, el fiel termina más ídolo que el mercenario', () => {
    function correr(fiel: boolean, semilla: number): number {
      let s: CareerState = {
        player: { name: 'T', number: 9, position: 'ST', nationality: 'Argentina', flag: '🇦🇷', ovr: 72, age: 20, marketValueM: 5 },
        clubId: 'banfield', startYear: 2026, seasonsPlayed: 0,
        totals: { matchesPlayed: 0, goals: 0, assists: 0 },
        trophies: {}, clubHistory: ['banfield'], history: [], pendingOffers: [],
        nextContinental: 'sudamericana',
        milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
        finished: false,
      }
      const rng = makeRng(semilla)
      for (let i = 0; i < 12; i++) {
        if (s.pendingOffers.length > 0) {
          const mejor = [...s.pendingOffers].sort((a, b) => b.strength - a.strength)[0]
          const actual = findClub(s.clubId)!
          s = fiel || mejor.strength <= actual.strength
            ? { ...s, pendingOffers: [] }
            : { ...s, clubId: mejor.clubId, pendingOffers: [] }
        }
        const { season, offers } = simulateSeason(s, rng)
        s = {
          ...s,
          player: advancePlayer(s, season),
          seasonsPlayed: s.seasonsPlayed + 1,
          history: [...s.history, season],
          pendingOffers: offers,
        }
      }
      return clubDeLaVida(s)?.puntos ?? 0
    }

    let fielGana = 0
    for (const semilla of [3, 11, 29, 47, 61, 73, 89, 101]) {
      if (correr(true, semilla) > correr(false, semilla)) fielGana += 1
    }
    expect(fielGana).toBeGreaterThanOrEqual(7)
  })

  it('con el motor real, una carrera larga y fiel llega a Leyenda', () => {
    let s: CareerState = {
      player: { name: 'T', number: 9, position: 'ST', nationality: 'Argentina', flag: '🇦🇷', ovr: 76, age: 19, marketValueM: 8 },
      clubId: 'river-plate', startYear: 2026, seasonsPlayed: 0,
      totals: { matchesPlayed: 0, goals: 0, assists: 0 },
      trophies: {}, clubHistory: ['river-plate'], history: [], pendingOffers: [],
      nextContinental: 'libertadores',
      milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
      finished: false,
    }
    const rng = makeRng(5)
    for (let i = 0; i < 14; i++) {
      s = { ...s, pendingOffers: [] } // no se mueve nunca
      const { season } = simulateSeason(s, rng)
      s = {
        ...s,
        player: advancePlayer(s, season),
        seasonsPlayed: s.seasonsPlayed + 1,
        history: [...s.history, season],
        pendingOffers: [],
      }
    }
    expect(clubDeLaVida(s)!.nivel.id).toBe('leyenda')
  })

  it('el progreso queda entre 0 y 1 y la Leyenda no tiene siguiente', () => {
    for (const p of [0, 39, 40, 99, 189, 299, 300, 5000]) {
      const n = nivelPara(p)
      expect(NIVELES.some((x) => x.id === n.id)).toBe(true)
    }
    const leyenda = idolatriaDeClub(
      Array.from({ length: 12 }, () => temporada('velez', { goals: 20, liga: true })),
      'velez',
    )
    expect(leyenda.siguiente).toBeNull()
    expect(leyenda.progreso).toBe(1)
  })
})
