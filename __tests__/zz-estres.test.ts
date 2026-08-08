import { describe, it, expect } from 'vitest'
import {
  ALL_CLUBS,
  LIGAS,
  PAISES_CARRERA,
  clubesDeLiga,
  findClub,
  findLiga,
  nivelDeLiga,
  simulateSeason,
  advancePlayer,
  makeRng,
  marketValueFor,
  sortearTalento,
  nextContinentalFrom,
  retirementStory,
  trofeoDeCopaNacional,
  MAX_SEASONS,
  type CareerState,
} from '@/lib/career-engine'
import { textoDeBloques, bloqueDe, lineaDePuesto } from '@/lib/reto-bloques'
import { leerCarrera } from '@/lib/carrera-guardada'
import { encodeCarrera, decodeCarrera, urlDeCarrera } from '@/lib/career-link'
import { buildCareerCardData } from '@/lib/career-store'

/**
 * La corrida de estrés: cientos de carreras completas contra invariantes que NUNCA pueden
 * romperse, sin importar la semilla, el club de arranque ni el puesto.
 *
 * Los tests de los otros archivos comprueban reglas concretas ("un arquero no hace goles"). Este
 * comprueba que el motor no produzca estados imposibles en ninguna de las miles de combinaciones
 * que un jugador real sí va a encontrar: 470 clubes × 15 temporadas × 4 puestos. Es la red que
 * agarra lo que ningún caso escrito a mano previó.
 */

const PUESTOS = ['GK', 'CB', 'CM', 'ST']

function nuevaCarrera(clubId: string, posicion: string, semilla: number): CareerState {
  const club = findClub(clubId)!
  return {
    player: {
      name: 'Test',
      number: 10,
      position: posicion,
      nationality: club.pais ?? 'Argentina',
      flag: '🇦🇷',
      ovr: 58 + (semilla % 18),
      age: 16 + (semilla % 3),
      marketValueM: marketValueFor(60, 17),
    },
    clubId,
    startYear: 2026,
    seasonsPlayed: 0,
    totals: { matchesPlayed: 0, goals: 0, assists: 0 },
    trophies: {},
    clubHistory: [clubId],
    history: [],
    pendingOffers: [],
    nextContinental: 'sudamericana',
    milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
    finished: false,
    talento: sortearTalento(makeRng(semilla)),
  } as CareerState
}

/** Corre una carrera entera resolviendo las ofertas como lo hace el botón de "simular todo". */
function correrCarrera(clubId: string, posicion: string, semilla: number) {
  let s = nuevaCarrera(clubId, posicion, semilla)
  const rng = makeRng(semilla || 1)
  for (let i = 0; i < MAX_SEASONS; i++) {
    if (s.pendingOffers.length > 0) {
      const mejor = [...s.pendingOffers].sort((a, b) => b.strength - a.strength)[0]
      const actual = findClub(s.clubId)
      if (mejor && actual && mejor.strength > actual.strength) {
        s = {
          ...s,
          clubId: mejor.clubId,
          ligaActualId: undefined,
          clubHistory: s.clubHistory.includes(mejor.clubId) ? s.clubHistory : [...s.clubHistory, mejor.clubId],
          pendingOffers: [],
        }
      } else {
        s = { ...s, pendingOffers: [] }
      }
    }
    const { season, trophiesWon, offers } = simulateSeason(s, rng)
    const trophies = { ...s.trophies }
    trophiesWon.forEach((id) => (trophies[id] = (trophies[id] || 0) + 1))
    s = {
      ...s,
      player: advancePlayer(s, season),
      seasonsPlayed: s.seasonsPlayed + 1,
      totals: {
        matchesPlayed: s.totals.matchesPlayed + season.matchesPlayed,
        goals: s.totals.goals + season.goals,
        assists: s.totals.assists + season.assists,
      },
      trophies,
      history: [...s.history, season],
      pendingOffers: offers,
      nextContinental: nextContinentalFrom(season),
      ligaActualId: season.nuevaLigaId ?? s.ligaActualId,
      finished: s.seasonsPlayed + 1 >= MAX_SEASONS,
    }
  }
  return s
}

describe('estrés del modo carrera', () => {
  /** 240 carreras completas: 4 puestos × 12 clubes de distinto nivel × 5 semillas. */
  const clubesMuestra = [
    'boca-juniors', 'river-plate', 'velez', 'aldosivi',
    ...clubesDeLiga('ar-3f').slice(0, 2).map((c) => c.id),
    ...clubesDeLiga('ar-2').slice(0, 2).map((c) => c.id),
    ...clubesDeLiga('br-1').slice(0, 2).map((c) => c.id),
    ...clubesDeLiga('uy-1').slice(0, 1).map((c) => c.id),
    ...clubesDeLiga('pe-2').slice(0, 1).map((c) => c.id),
    ...clubesDeLiga('mx-1').slice(0, 1).map((c) => c.id),
  ].filter(Boolean)

  const SEMILLAS = [7, 101, 999, 31337, 424242]

  it('240 carreras completas no producen ni un estado imposible', () => {
    let corridas = 0
    for (const clubId of clubesMuestra) {
      for (const pos of PUESTOS) {
        for (const semilla of SEMILLAS) {
          const s = correrCarrera(clubId, pos, semilla)
          corridas++

          expect(s.seasonsPlayed, `${clubId}/${pos}/${semilla}`).toBe(MAX_SEASONS)
          expect(s.history).toHaveLength(MAX_SEASONS)
          expect(s.finished).toBe(true)

          // El jugador no puede rejuvenecer ni salirse de la escala.
          expect(s.player.age).toBeGreaterThanOrEqual(16 + MAX_SEASONS - 1)
          expect(s.player.ovr).toBeGreaterThanOrEqual(1)
          expect(s.player.ovr).toBeLessThanOrEqual(99)
          expect(Number.isFinite(s.player.marketValueM)).toBe(true)
          expect(s.player.marketValueM).toBeGreaterThanOrEqual(0)

          // Ningún acumulado puede ser negativo ni NaN.
          for (const [k, v] of Object.entries(s.totals)) {
            expect(Number.isFinite(v), `${k} en ${clubId}/${pos}`).toBe(true)
            expect(v).toBeGreaterThanOrEqual(0)
          }

          // El club siempre existe y la trayectoria no tiene repetidos consecutivos.
          expect(findClub(s.clubId), `club ${s.clubId}`).toBeDefined()
          expect(new Set(s.clubHistory).size).toBe(s.clubHistory.length)

          for (const t of s.history) {
            expect(t.matchesPlayed).toBeGreaterThanOrEqual(0)
            expect(t.matchesPlayed).toBeLessThanOrEqual(70)
            expect(t.goals).toBeGreaterThanOrEqual(0)
            expect(t.assists).toBeGreaterThanOrEqual(0)
            expect(t.cleanSheets ?? 0).toBeLessThanOrEqual(t.matchesPlayed)
            // Los penales enfrentados se calculan pero no se guardan en la temporada —la ficha
            // muestra los atajados y nada más—, así que acá lo que se puede comprobar es que
            // solo un arquero ataje: en cualquier otro puesto `penaltiesFaced` vale 0 y el
            // `Math.min` del motor deja los atajados en 0.
            if (pos !== 'GK') expect(t.penaltiesSaved ?? 0).toBe(0)
            expect(t.penaltiesSaved ?? 0).toBeLessThanOrEqual(t.matchesPlayed)
            expect(Number.isFinite(t.ovr)).toBe(true)
            expect(t.rating).toBeGreaterThan(0)
            expect(t.rating).toBeLessThanOrEqual(10)
          }
        }
      }
    }
    expect(corridas).toBeGreaterThanOrEqual(200)
  })

  it('un arquero nunca sale goleador y un delantero nunca atrapa penales', () => {
    for (const semilla of [3, 88, 5150, 90210]) {
      for (const clubId of ['boca-juniors', 'aldosivi']) {
        const arq = correrCarrera(clubId, 'GK', semilla)
        const del = correrCarrera(clubId, 'ST', semilla)
        expect(arq.totals.goals).toBeLessThan(del.totals.goals + 1)
        expect(del.history.every((t) => (t.penaltiesSaved ?? 0) === 0)).toBe(true)
        expect(arq.history.some((t) => (t.cleanSheets ?? 0) > 0)).toBe(true)
      }
    }
  })

  it('la historia del retiro sale siempre y nombra al jugador', () => {
    for (const semilla of [11, 222, 3333, 44444, 555555]) {
      const s = correrCarrera('river-plate', 'CM', semilla)
      const texto = retirementStory(s)
      expect(texto.length).toBeGreaterThan(20)
      expect(texto).not.toContain('{n}')
      expect(texto).not.toContain('undefined')
    }
  })

  it('la ficha y el link sobreviven a cualquier carrera', () => {
    for (const semilla of [17, 404, 8080, 123456]) {
      for (const pos of PUESTOS) {
        const s = correrCarrera('velez', pos, semilla)
        const card = buildCareerCardData(s)
        expect(card.playerName).toBeTruthy()
        expect(card.clubs.length).toBeGreaterThan(0)
        expect(card.marketValue).toMatch(/^€/)

        const url = urlDeCarrera({ card, temporadas: s.seasonsPlayed })
        expect(url.length, `url de ${pos}/${semilla}`).toBeLessThan(2000)
        const vuelta = decodeCarrera(encodeCarrera({ card, temporadas: s.seasonsPlayed }))
        expect(vuelta!.card.playerName).toBe(card.playerName)
        expect(vuelta!.card.goals).toBe(card.goals)
        expect(vuelta!.temporadas).toBe(s.seasonsPlayed)
      }
    }
  })
})

describe('estrés de los datos del juego', () => {
  it('los 409 clubes de las ligas están completos y sin id repetido', () => {
    const vistos = new Set<string>()
    for (const c of ALL_CLUBS) {
      expect(c.id, 'club sin id').toBeTruthy()
      expect(c.name, `club ${c.id} sin nombre`).toBeTruthy()
      expect(c.strength, `fuerza de ${c.id}`).toBeGreaterThan(0)
      expect(c.strength).toBeLessThanOrEqual(100)
      expect(vistos.has(c.id), `id repetido: ${c.id}`).toBe(false)
      vistos.add(c.id)
    }
    expect(vistos.size).toBeGreaterThan(400)
  })

  it('toda liga tiene clubes, nivel válido y país conocido', () => {
    const paises = new Set(PAISES_CARRERA.map((p) => p.nombre))
    for (const l of LIGAS) {
      const clubes = clubesDeLiga(l.id)
      expect(clubes.length, `${l.id} sin clubes`).toBeGreaterThan(0)
      const n = nivelDeLiga(l.id)
      expect(n, `nivel de ${l.id}`).toBeGreaterThan(0)
      expect(n).toBeLessThanOrEqual(100)
      expect(findLiga(l.id)).toBeDefined()
      // Arabia no es un país del modo carrera pero sí una liga de destino.
      if (l.pais !== 'Arabia Saudita') {
        expect(paises.has(l.pais), `país desconocido: ${l.pais}`).toBe(true)
      }
    }
  })

  it('cada país tiene su copa nacional con trofeo dibujado', () => {
    for (const p of PAISES_CARRERA) {
      const t = trofeoDeCopaNacional(p.nombre)
      expect(t.name, `copa de ${p.nombre}`).toBeTruthy()
      expect(t.icon).toMatch(/^\/logos\/trofeos\/.+\.svg$/)
    }
  })
})

describe('estrés del resultado en bloques', () => {
  it('mil grillas al azar salen siempre bien formadas', () => {
    const rng = makeRng(2026)
    for (let i = 0; i < 1000; i++) {
      const jugadores = Array.from({ length: 11 }, (_, j) => ({
        rating: 45 + Math.floor(rng() * 55),
        linea: lineaDePuesto(['GK', 'CB', 'LB', 'CM', 'CAM', 'ST', 'LW'][j % 7]),
      }))
      const texto = textoDeBloques({
        numero: i,
        titulo: 'Reto',
        jugadores,
        puntaje: 40 + rng() * 55,
        campeon: rng() > 0.8,
        racha: Math.floor(rng() * 9),
      })
      const filas = texto.split('\n')
      // Encabezado + entre 1 y 4 filas de grilla + cierre.
      expect(filas.length).toBeGreaterThanOrEqual(3)
      expect(filas.length).toBeLessThanOrEqual(6)
      expect(filas.every((f) => f.length > 0)).toBe(true)
      // La grilla tiene exactamente los once cuadraditos y nada más.
      const grilla = filas.slice(1, -1).join('')
      expect(grilla).toMatch(/^[🟩🟨🟧⬜]+$/u)
      expect([...grilla]).toHaveLength(11)
      expect(texto).not.toContain('NaN')
      expect(texto).not.toContain('undefined')
    }
  })

  it('el color nunca se sale de los cuatro, con cualquier número', () => {
    for (let r = -20; r <= 120; r++) {
      expect(['🟩', '🟨', '🟧', '⬜']).toContain(bloqueDe(r))
    }
  })
})

describe('estrés del guardado de la carrera', () => {
  it('ninguna basura en el localStorage rompe el home', () => {
    const basura = [
      null, '', '{', '[]', 'null', '{"state":null}', '{"state":{}}',
      '{"state":{"career":null}}', '{"state":{"career":{}}}',
      '{"state":{"career":{"player":null}}}',
      '{"career":{"player":{"name":"x"}}}',
      JSON.stringify({ state: { career: { player: { name: 'x' }, finished: true } } }),
    ]
    for (const b of basura) {
      expect(() => leerCarrera(b)).not.toThrow()
      expect(leerCarrera(b), `entrada: ${b}`).toBeNull()
    }
  })

  it('una carrera guardada real se lee entera', () => {
    const s = correrCarrera('boca-juniors', 'ST', 77)
    const crudo = JSON.stringify({ state: { career: { ...s, finished: false } }, version: 2 })
    const leida = leerCarrera(crudo)
    expect(leida).not.toBeNull()
    expect(leida!.nombre).toBe(s.player.name)
    expect(leida!.temporadas).toBe(s.seasonsPlayed)
    expect(findClub(leida!.clubId)).toBeDefined()
  })
})
