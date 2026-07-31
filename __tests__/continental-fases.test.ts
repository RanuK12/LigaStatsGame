import { describe, it, expect } from 'vitest'
import { simulateContinentalTournament, LIBERTADORES_CLUBS, SUDAMERICANA_CLUBS } from '@/lib/copa-libertadores'
import { formations } from '@/lib/game-engine'
import type { Player, Squad } from '@/lib/types'

// Antes la "fase de grupos" eran tres partidos sueltos que no eliminaban a nadie: podías perder
// los tres y jugar los octavos igual. Estos tests fijan que las fases sean de verdad.
function once(rating: number): Player[] {
  const puestos = ['GK', 'LB', 'CB', 'CB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'ST', 'RW']
  return puestos.map((pos, i) => ({
    id: `p${i}`, name: `Jugador ${i}`, position: pos, positions: [pos], rating,
    legendary: false, clubs: [], goalsClub: 0, capsClub: 0,
  } as unknown as Player))
}

const squad = { id: 's', clubId: 'boca-juniors', season: '2024', competition: 'Liga', label: 'Boca 2024', playerIds: [] } as unknown as Squad

const jugar = (rating: number, tipo: 'libertadores' | 'sudamericana' = 'libertadores') =>
  simulateContinentalTournament(once(rating), squad, formations['4-3-3'], 100, tipo)

describe('copas continentales', () => {
  it('la fase de grupos se juega ida y vuelta y ordena una tabla de cuatro', () => {
    const r = jugar(75)
    expect(r.groupTable).toHaveLength(4)
    const fechas = r.rounds!.filter((x) => x.round.startsWith('Fase de Grupos'))
    expect(fechas).toHaveLength(6)
    // La tabla tiene que estar ordenada por puntos
    const pts = r.groupTable!.map((f) => f.pts)
    expect([...pts].sort((a, b) => b - a)).toEqual(pts)
    // Y el puesto informado tiene que ser el de la tabla
    expect(r.groupTable![r.groupPos! - 1].name).toBe('Boca 2024')
  })

  it('salir tercero o cuarto del grupo te deja afuera, no te pasa a octavos', () => {
    let huboEliminadoEnGrupos = false
    for (let i = 0; i < 60 && !huboEliminadoEnGrupos; i++) {
      const r = jugar(52) // equipo flojo contra el continente: alguna vez tiene que quedar afuera
      if (r.eliminatedRound === 'Fase de Grupos') {
        huboEliminadoEnGrupos = true
        expect(r.groupPos).toBeGreaterThan(2)
        expect(r.rounds!.some((x) => x.round.includes('Octavos'))).toBe(false)
      }
    }
    expect(huboEliminadoEnGrupos).toBe(true)
  })

  it('las llaves son a doble partido y la final a partido único', () => {
    let vistoConFinal = false
    for (let i = 0; i < 60 && !vistoConFinal; i++) {
      const r = jugar(95)
      const finales = r.rounds!.filter((x) => x.round === 'Final Única')
      if (finales.length === 1) {
        vistoConFinal = true
        for (const llave of ['Octavos de Final', 'Cuartos de Final', 'Semifinal']) {
          expect(r.rounds!.filter((x) => x.round.startsWith(llave))).toHaveLength(2)
        }
      }
    }
    expect(vistoConFinal).toBe(true)
  })

  it('el campeón siempre es alguien: vos o un club del cuadro', () => {
    const nombres = new Set([...LIBERTADORES_CLUBS, ...SUDAMERICANA_CLUBS].map((c) => c.name))
    for (let i = 0; i < 40; i++) {
      const r = jugar(70, i % 2 === 0 ? 'libertadores' : 'sudamericana')
      expect(r.isChampion ? r.champion === 'Boca 2024' : nombres.has(r.champion)).toBe(true)
    }
  })

  it('la Sudamericana se gana más seguido que la Libertadores con el mismo equipo', () => {
    const gana = (tipo: 'libertadores' | 'sudamericana') => {
      let n = 0
      for (let i = 0; i < 200; i++) if (jugar(78, tipo).isChampion) n++
      return n
    }
    expect(gana('sudamericana')).toBeGreaterThan(gana('libertadores'))
  })

  it('todos los clubes del cuadro tienen escudo propio', () => {
    for (const c of [...LIBERTADORES_CLUBS, ...SUDAMERICANA_CLUBS]) {
      expect(c.id).toMatch(/^[a-z0-9-]+$/)
      expect(c.colors).toHaveLength(2)
    }
  })
})
