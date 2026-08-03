import { describe, it, expect } from 'vitest'
import { simulateSeason, makeRng, advancePlayer, retirementStory, type CareerState } from '@/lib/career-engine'
import { buildCareerCardData } from '@/lib/career-store'
import { encodeCarrera, decodeCarrera, urlDeCarrera, type CarreraCompartida } from '@/lib/career-link'

function carreraJugada(semillas = 12): CareerState {
  let s: CareerState = {
    player: { name: 'Thiago Fernández', number: 10, position: 'CAM', nationality: 'Argentina', flag: '🇦🇷', ovr: 74, age: 19, marketValueM: 6 },
    clubId: 'velez', startYear: 2026, seasonsPlayed: 0,
    totals: { matchesPlayed: 0, goals: 0, assists: 0 },
    trophies: {}, clubHistory: ['velez'], history: [], pendingOffers: [],
    nextContinental: 'libertadores',
    milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
    finished: false,
  }
  const rng = makeRng(19)
  for (let i = 0; i < semillas; i++) {
    const { season } = simulateSeason(s, rng)
    s = {
      ...s,
      player: advancePlayer(s, season),
      seasonsPlayed: s.seasonsPlayed + 1,
      history: [...s.history, season],
      totals: {
        matchesPlayed: s.totals.matchesPlayed + season.matchesPlayed,
        goals: s.totals.goals + season.goals,
        assists: s.totals.assists + season.assists,
      },
      trophies: {
        ...s.trophies,
        ...(season.liga ? { lpf: (s.trophies.lpf || 0) + 1 } : {}),
        ...(season.continentalWon ? { libertadores: (s.trophies.libertadores || 0) + 1 } : {}),
      },
      pendingOffers: [],
    }
  }
  return s
}

function paquete(s: CareerState): CarreraCompartida {
  return {
    card: buildCareerCardData(s),
    temporadas: s.seasonsPlayed,
    leyenda: { nombre: 'Juan Román Riquelme', parecido: 78 },
    pie: retirementStory(s),
  }
}

describe('link de la carrera', () => {
  it('lo que entra es lo que sale', () => {
    const c = paquete(carreraJugada())
    const vuelta = decodeCarrera(encodeCarrera(c))
    expect(vuelta).not.toBeNull()
    expect(vuelta!.card.playerName).toBe(c.card.playerName)
    expect(vuelta!.card.goals).toBe(c.card.goals)
    expect(vuelta!.card.matchesPlayed).toBe(c.card.matchesPlayed)
    expect(vuelta!.card.clubs.map((x) => x.id)).toEqual(c.card.clubs.map((x) => x.id))
    expect(vuelta!.card.trophies).toEqual(c.card.trophies)
    expect(vuelta!.temporadas).toBe(c.temporadas)
    expect(vuelta!.leyenda).toEqual(c.leyenda)
    expect(vuelta!.pie).toBe(c.pie)
  })

  it('sobreviven los acentos y las banderas', () => {
    const c = paquete(carreraJugada())
    c.card.playerName = 'Ramiro Núñez'
    c.card.nationalityFlag = '🇦🇷'
    const vuelta = decodeCarrera(encodeCarrera(c))!
    expect(vuelta.card.playerName).toBe('Ramiro Núñez')
    expect(vuelta.card.nationalityFlag).toBe('🇦🇷')
  })

  it('el escudo se arma del id: no viaja en el link', () => {
    const c = paquete(carreraJugada())
    const vuelta = decodeCarrera(encodeCarrera(c))!
    expect(vuelta.card.clubs[0].logoUrl).toBe(`/logos/clubs/${vuelta.card.clubs[0].id}.png`)
  })

  /**
   * El límite real no es el de un navegador (que aguanta decenas de miles) sino el de las apps
   * de mensajería, que cortan los links largos al previsualizarlos. Con 2 KB estamos cómodos; si
   * un cambio en la ficha lo empuja más arriba, este test avisa antes de que se rompa en X.
   */
  it('la URL de una carrera larga queda por debajo de 2 KB', () => {
    const url = urlDeCarrera(paquete(carreraJugada(15)))
    expect(url.startsWith('https://gambetafutbol.games/c/?c=')).toBe(true)
    expect(url.length).toBeLessThan(2048)
  })

  it('la URL no lleva caracteres que haya que escapar', () => {
    const param = urlDeCarrera(paquete(carreraJugada())).split('?c=')[1]
    expect(param).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('un link roto devuelve null en vez de romper la página', () => {
    expect(decodeCarrera('')).toBeNull()
    expect(decodeCarrera('no-es-base64-valido!!!')).toBeNull()
    expect(decodeCarrera(btoa('{"v":"9","n":"X"}'))).toBeNull() // versión desconocida
    expect(decodeCarrera(btoa('{"v":"1"}'))).toBeNull() // sin nombre
    // Y uno cortado a la mitad, que es lo que pasa cuando se copia mal.
    const entero = encodeCarrera(paquete(carreraJugada()))
    expect(decodeCarrera(entero.slice(0, Math.floor(entero.length / 2)))).toBeNull()
  })
})
