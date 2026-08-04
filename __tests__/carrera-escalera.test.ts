import { describe, it, expect } from 'vitest'
import {
  simulateSeason,
  advancePlayer,
  makeRng,
  findClub,
  findLiga,
  clubesDeLiga,
  nivelDeLiga,
  etiquetaDeNivel,
  LIGAS,
  type CareerState,
} from '@/lib/career-engine'

/** El nivel del club donde juega, para poder ver si la carrera SUBE. */
function nivelDe(clubId: string): number {
  const c = findClub(clubId)
  if (!c) return 0
  if (c.region === 'euro') return 100 + (c.strength - 82) * 2
  return c.ligaId ? nivelDeLiga(c.ligaId) : Math.max(5, Math.min(100, (c.strength - 50) * 3))
}

/**
 * Una carrera jugada aceptando siempre la mejor oferta, que es lo que haría alguien que quiere
 * llegar lo más arriba posible.
 */
function carreraAmbiciosa(clubId: string, semilla: number, ovr = 66, temporadas = 15) {
  let s: CareerState = {
    player: { name: 'T', number: 9, position: 'ST', nationality: 'Argentina', flag: '🇦🇷', ovr, age: 18, marketValueM: 1 },
    clubId, startYear: 2026, seasonsPlayed: 0,
    totals: { matchesPlayed: 0, goals: 0, assists: 0 },
    trophies: {}, clubHistory: [clubId], history: [], pendingOffers: [],
    nextContinental: 'sudamericana',
    milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
    finished: false,
  }
  const rng = makeRng(semilla)
  const recorrido: { clubId: string; nivel: number }[] = [{ clubId, nivel: nivelDe(clubId) }]
  for (let i = 0; i < temporadas; i++) {
    if (s.pendingOffers.length > 0) {
      const mejor = [...s.pendingOffers].sort((a, b) => b.strength - a.strength)[0]
      if (mejor.strength > findClub(s.clubId)!.strength) {
        s = { ...s, clubId: mejor.clubId, ligaActualId: undefined, clubHistory: [...s.clubHistory, mejor.clubId] }
        recorrido.push({ clubId: mejor.clubId, nivel: nivelDe(mejor.clubId) })
      }
      s = { ...s, pendingOffers: [] }
    }
    const { season, offers } = simulateSeason(s, rng)
    s = {
      ...s,
      player: advancePlayer(s, season),
      seasonsPlayed: s.seasonsPlayed + 1,
      history: [...s.history, season],
      pendingOffers: offers,
      ligaActualId: season.nuevaLigaId ?? s.ligaActualId,
    }
  }
  return { estado: s, recorrido }
}

describe('nivel de liga', () => {
  it('ordena las ligas como corresponde', () => {
    const n = (id: string) => nivelDeLiga(id)
    // La primera de Brasil por encima de todas; el Federal A al fondo.
    expect(n('br-1')).toBeGreaterThan(n('ar-1'))
    expect(n('ar-1')).toBeGreaterThan(n('pe-1'))
    // Y en cada país, primera por encima de segunda.
    for (const pais of ['Argentina', 'Uruguay', 'Chile', 'Colombia', 'Perú', 'Paraguay', 'Brasil']) {
      const ls = LIGAS.filter((l) => l.pais === pais).sort((a, b) => a.division - b.division)
      for (let i = 1; i < ls.length; i++) {
        expect(n(ls[i - 1].id), `${pais}: ${ls[i - 1].nombre} vs ${ls[i].nombre}`).toBeGreaterThan(n(ls[i].id))
      }
    }
  })

  it('usa toda la escala, no un rango apretado', () => {
    const todos = LIGAS.map((l) => nivelDeLiga(l.id))
    expect(Math.max(...todos)).toBeGreaterThanOrEqual(95)
    expect(Math.min(...todos)).toBeLessThanOrEqual(15)
  })

  it('cada nivel tiene su etiqueta', () => {
    expect(etiquetaDeNivel(100)).toBe('Elite')
    expect(etiquetaDeNivel(70)).toBe('Alta')
    expect(etiquetaDeNivel(50)).toBe('Media')
    expect(etiquetaDeNivel(30)).toBe('Baja')
    expect(etiquetaDeNivel(8)).toBe('Amateur')
  })
})

describe('la escalera de la carrera', () => {
  /**
   * Lo que pidió Emilio: de un club del ascenso no te llama Boca de una. Primero uno mejor de
   * tu categoría, después la de arriba, después otro país. Sin esto los 470 clubes son
   * intercambiables y no hay ninguna carrera que construir.
   */
  it('desde el Federal A no llega una oferta de Primera de golpe', () => {
    const chico = clubesDeLiga('ar-3f').slice(-1)[0]
    const nivelChico = nivelDeLiga('ar-3f')
    let sobresaltos = 0
    let total = 0
    for (const semilla of [3, 17, 41, 63, 88, 102, 131]) {
      const { recorrido } = carreraAmbiciosa(chico.id, semilla, 62)
      for (let i = 1; i < recorrido.length; i++) {
        total += 1
        // Un salto de más de 70 puntos de nivel en UN pase es el que no puede pasar: es irse
        // del Federal A a la Série A sin escalas.
        if (recorrido[i].nivel - recorrido[i - 1].nivel > 70) sobresaltos += 1
      }
    }
    expect(nivelChico).toBeLessThan(20)
    expect(sobresaltos, `${sobresaltos} de ${total} pases fueron un salto imposible`).toBe(0)
  })

  it('una carrera larga desde abajo SUBE de nivel', () => {
    // Si la escalera está bien puesta, quien arranca abajo y acepta las mejores ofertas termina
    // más arriba de donde empezó. Si no sube nunca, la escalera es una jaula.
    let subieron = 0
    for (const semilla of [5, 23, 44, 71, 99]) {
      const { recorrido } = carreraAmbiciosa(clubesDeLiga('ar-2')[0].id, semilla, 70)
      if (recorrido[recorrido.length - 1].nivel > recorrido[0].nivel) subieron += 1
    }
    expect(subieron, 'ninguna carrera desde la Primera Nacional subió de nivel').toBeGreaterThanOrEqual(3)
  })

  it('un crack salta más rápido que un jugador del montón', () => {
    const club = clubesDeLiga('ar-2')[10]
    const alturaFinal = (ovr: number) => {
      const semillas = [7, 19, 33, 52, 77]
      return (
        semillas.reduce((a, s) => {
          const { recorrido } = carreraAmbiciosa(club.id, s, ovr)
          return a + recorrido[recorrido.length - 1].nivel
        }, 0) / semillas.length
      )
    }
    expect(alturaFinal(80)).toBeGreaterThan(alturaFinal(62))
  })

  it('nadie deja la primera división por una tercera', () => {
    for (const semilla of [11, 29, 47]) {
      const { recorrido } = carreraAmbiciosa(clubesDeLiga('ar-1')[3].id, semilla, 78)
      for (let i = 1; i < recorrido.length; i++) {
        const caida = recorrido[i - 1].nivel - recorrido[i].nivel
        expect(caida, `cayó ${caida} puntos de nivel en un pase`).toBeLessThanOrEqual(25)
      }
    }
  })

  /**
   * Europa es el último escalón, no un atajo. El filtro de clubes europeos tenía un `return`
   * ANTES del cálculo de nivel y se salteaba la escalera entera: un OVR 78 jugando en el Torneo
   * Federal A recibía oferta del Manchester United sin haber pisado una primera división.
   */
  it('no se salta del ascenso a Europa', () => {
    for (const semilla of [3, 17, 29, 41, 63]) {
      const chico = clubesDeLiga('ar-3f').slice(-3)[0]
      const { recorrido } = carreraAmbiciosa(chico.id, semilla, 74)
      // Antes de pisar Europa hay que haber jugado en una liga de nivel alto.
      const primeraEuropa = recorrido.findIndex((r) => (findClub(r.clubId)?.region ?? '') === 'euro')
      if (primeraEuropa <= 0) continue
      const previo = recorrido[primeraEuropa - 1]
      expect(previo.nivel, `saltó a Europa desde nivel ${previo.nivel}`).toBeGreaterThanOrEqual(60)
    }
  })

  /**
   * La escalera no puede ser una jaula: si desde abajo casi nunca llega una oferta, arrancar en
   * el Ascenso deja de ser una elección y pasa a ser un castigo.
   */
  it('desde cualquier categoría llegan ofertas', () => {
    for (const [ligaId, ovr] of [['ar-3f', 62], ['ar-3', 68], ['ar-2', 72]] as const) {
      let conPase = 0
      const semillas = [3, 17, 29, 41, 63, 88, 102, 131, 150, 177]
      for (const semilla of semillas) {
        const club = clubesDeLiga(ligaId).slice(-3)[0]
        const { recorrido } = carreraAmbiciosa(club.id, semilla, ovr)
        if (recorrido.length > 1) conPase += 1
      }
      expect(conPase, `desde ${ligaId} solo ${conPase}/10 carreras tuvieron un pase`).toBeGreaterThanOrEqual(7)
    }
  })

  it('cada club de liga sabe en qué escalón está', () => {
    for (const l of LIGAS) {
      const n = nivelDeLiga(l.id)
      expect(n).toBeGreaterThan(0)
      expect(n).toBeLessThanOrEqual(100)
      expect(findLiga(l.id)).toBeDefined()
    }
  })
})
