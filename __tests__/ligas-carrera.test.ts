import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import {
  LIGAS,
  LIGA_CLUBS,
  PAISES_CARRERA,
  ALL_CLUBS,
  findClub,
  findLiga,
  ligaVecina,
  clubesDeLiga,
  simulateSeason,
  advancePlayer,
  makeRng,
  type CareerState,
} from '@/lib/career-engine'

describe('ligas del modo carrera', () => {
  it('están los siete países con sus divisiones y su copa', () => {
    expect(PAISES_CARRERA.map((p) => p.nombre).sort()).toEqual(
      ['Argentina', 'Brasil', 'Chile', 'Colombia', 'Paraguay', 'Perú', 'Uruguay'],
    )
    for (const p of PAISES_CARRERA) {
      expect(p.ligaIds.length).toBeGreaterThanOrEqual(2)
      expect(p.copa).toBeTruthy()
      expect(p.plazas.libertadores).toBeGreaterThan(0)
    }
  })

  it('cada liga tiene formato, clubes y estructura de ascenso', () => {
    for (const l of LIGAS) {
      expect(['liga', 'semestral', 'playoff']).toContain(l.formato)
      expect(l.clubIds.length).toBeGreaterThan(5)
      expect(l.division).toBeGreaterThanOrEqual(1)
      expect(l.asciende + l.desciende).toBeGreaterThan(0)
    }
  })

  it('de la primera no se asciende y de la última no se desciende', () => {
    for (const l of LIGAS) {
      if (l.division === 1) expect(ligaVecina(l.id, 'arriba')).toBeUndefined()
      const abajo = ligaVecina(l.id, 'abajo')
      if (abajo) expect(abajo.division).toBeGreaterThan(l.division)
    }
  })

  it('ningún club está duplicado en toda la base', () => {
    const ids = ALL_CLUBS.map((c) => c.id)
    expect(ids.length).toBe(new Set(ids).size)
    // Y ninguna liga lista dos veces al mismo: Wikidata tiene DOS entidades llamadas "Clube de
    // Regatas do Flamengo" y las dos caían en el mismo id, así que Flamengo salía repetido en
    // la pantalla de elección.
    for (const l of LIGAS) expect(new Set(l.clubIds).size).toBe(l.clubIds.length)
  })

  /**
   * Wikidata pone P118 ("liga") en los JUGADORES además de en los clubes: la Série A devolvía
   * 40 entidades y diez eran Vinícius Júnior, Toni Kroos y compañía, que salían en la pantalla
   * de elección como si fueran equipos. Lo vi mirando una captura, no un test: este existe para
   * que no haya que volver a mirarla.
   */
  it('no hay personas listadas como clubes', () => {
    const PERSONAS = [
      'vinicius', 'vinícius', 'toni kroos', 'richarlison', 'oscar', 'ribamar',
      'breno lopes', 'talles magno', 'deivid', 'jailson',
    ]
    const sospechosos = LIGA_CLUBS.filter((c) => {
      const n = (c.nombreLargo ?? c.name).toLowerCase()
      return PERSONAS.some((p) => n === p || n.startsWith(p + ' '))
    })
    expect(sospechosos.map((c) => c.name)).toEqual([])
    // Un club siempre trae algo que una persona no tiene: año de fundación, estadio o ciudad.
    const sinSeñalDeClub = LIGA_CLUBS.filter((c) => !c.ciudad && !c.division)
    expect(sinSeñalDeClub).toEqual([])
  })

  it('los clubes de liga traen todo lo que la pantalla necesita', () => {
    for (const c of LIGA_CLUBS) {
      expect(c.name).toBeTruthy()
      // 24 es el techo del nombre corto: entra en la tarjeta de la lista de clubes.
      expect(c.name.length).toBeLessThanOrEqual(24)
      // El escudo es el REAL si lo bajamos de Commons, y el generado si no. Los dos valen: lo
      // que no puede pasar es que apunte a un archivo que no existe.
      expect(c.escudo).toMatch(/^\/logos\/(ligas\/[a-z0-9-]+\.svg|carrera\/[a-z0-9-]+\.png)$/)
      expect(existsSync(`public${c.escudo}`), `falta el archivo ${c.escudo}`).toBe(true)
      expect(c.colors?.length).toBe(2)
      expect(c.strength).toBeGreaterThanOrEqual(45)
      expect(c.strength).toBeLessThanOrEqual(85)
      expect(findLiga(c.ligaId!)).toBeDefined()
    }
  })

  /**
   * El coeficiente de país tiene que notarse. Si la Série A brasileña no le gana a la División
   * Profesional paraguaya, irse a Brasil no significa nada y el mapa entero sobra.
   */
  it('la primera de Brasil es más fuerte que la de Paraguay', () => {
    const media = (id: string) => {
      const c = clubesDeLiga(id)
      return c.reduce((a, x) => a + x.strength, 0) / c.length
    }
    expect(media('br-1')).toBeGreaterThan(media('py-1'))
    expect(media('uy-1')).toBeGreaterThan(media('uy-2'))
    expect(media('ar-2')).toBeGreaterThan(media('ar-3'))
  })

  it('los grandes son los más fuertes de su liga', () => {
    for (const [ligaId, esperado] of [
      ['uy-1', 'club-nacional-de-football'],
      ['br-1', 'sociedade-esportiva-palmeiras'],
      ['co-1', 'millonarios-futbol-club'],
    ] as const) {
      expect(clubesDeLiga(ligaId)[0].id).toBe(esperado)
    }
  })
})

describe('ascensos y descensos en el motor', () => {
  function carreraEn(clubId: string, semilla: number, temporadas = 12) {
    let s: CareerState = {
      player: { name: 'T', number: 9, position: 'ST', nationality: 'Argentina', flag: '🇦🇷', ovr: 68, age: 19, marketValueM: 2 },
      clubId, startYear: 2026, seasonsPlayed: 0,
      totals: { matchesPlayed: 0, goals: 0, assists: 0 },
      trophies: {}, clubHistory: [clubId], history: [], pendingOffers: [],
      nextContinental: 'sudamericana',
      milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
      finished: false,
    }
    const rng = makeRng(semilla)
    for (let i = 0; i < temporadas; i++) {
      const { season } = simulateSeason(s, rng)
      s = {
        ...s,
        player: advancePlayer(s, season),
        seasonsPlayed: s.seasonsPlayed + 1,
        history: [...s.history, season],
        pendingOffers: [],
        ligaActualId: season.nuevaLigaId ?? s.ligaActualId,
      }
    }
    return s
  }

  it('un club del ascenso sube y baja de categoría a lo largo de una carrera', () => {
    // El más fuerte de la Primera Nacional: en doce temporadas tiene que subir alguna vez.
    const fuerte = clubesDeLiga('ar-2')[0]
    let ascensos = 0
    for (const semilla of [3, 17, 41, 63, 88]) {
      ascensos += carreraEn(fuerte.id, semilla).history.filter((h) => h.ascendio).length
    }
    expect(ascensos).toBeGreaterThan(0)
  })

  it('cuando asciende, la liga del año siguiente es la de arriba', () => {
    const club = clubesDeLiga('ar-3')[0]
    for (const semilla of [5, 23, 44, 71, 99, 120]) {
      const s = carreraEn(club.id, semilla)
      const sube = s.history.find((h) => h.ascendio)
      if (!sube) continue
      expect(findLiga(sube.nuevaLigaId!)!.division).toBe(2)
      return
    }
    throw new Error('ninguna semilla produjo un ascenso: la probabilidad quedó en cero')
  })

  /**
   * No se asciende DESDE la primera. Si el club bajó antes, subir de vuelta sí vale: la primera
   * versión de este test daba por roto ese caso, que en realidad es el comportamiento correcto.
   */
  it('nadie asciende estando ya en la primera división', () => {
    for (const semilla of [11, 29, 47, 83]) {
      const s = carreraEn(clubesDeLiga('br-1')[0].id, semilla)
      let ligaId = 'br-1'
      for (const h of s.history) {
        if (h.ascendio) expect(findLiga(ligaId)!.division).toBeGreaterThan(1)
        ligaId = h.nuevaLigaId ?? ligaId
      }
    }
  })

  /** El más fuerte de la primera no puede vivir descendiendo: sería un mundo sin jerarquía. */
  it('el mejor de una liga desciende mucho menos que el peor', () => {
    const contar = (clubId: string) =>
      [3, 17, 41, 63, 88, 102].reduce(
        (a, s) => a + carreraEn(clubId, s).history.filter((h) => h.descendio).length,
        0,
      )
    const rivales = clubesDeLiga('br-1')
    expect(contar(rivales[0].id)).toBeLessThan(contar(rivales[rivales.length - 1].id))
  })

  it('la copa que se gana es la del país del club, no siempre la Copa Argentina', () => {
    const club = clubesDeLiga('uy-1')[0]
    for (const semilla of [7, 19, 33, 52, 77, 91, 108]) {
      const s = carreraEn(club.id, semilla)
      const copa = s.history.find((h) => h.copaArgentina)
      if (!copa) continue
      expect(copa.highlights.some((h) => h.includes('Copa Uruguay'))).toBe(true)
      return
    }
    throw new Error('ninguna semilla ganó la copa nacional en Uruguay')
  })

  it('findClub encuentra tanto los de siempre como los nuevos', () => {
    expect(findClub('boca-juniors')).toBeDefined()
    expect(findClub('real-madrid')).toBeDefined()
    expect(findClub('club-atletico-penarol')?.pais).toBe('Uruguay')
    expect(findClub('no-existe-este-club')).toBeUndefined()
  })
})
