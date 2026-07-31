import { describe, it, expect } from 'vitest'
import { spinSquadWithPity } from '@/lib/game-engine'
import type { Player, Squad } from '@/lib/types'

// El bombo real tiene 170 planteles de solo 29 clubes: Boca entra con 12 temporadas y
// Central Córdoba con 1. Sorteando parejo salían dos y tres veces los mismos clubes en un mismo
// draft ("Godoy Cruz 2019... y ahora Godoy Cruz 2024"). Acá se reproduce esa desproporción.
function bombo(): Squad[] {
  const squads: Squad[] = []
  const grandes = ['boca-juniors', 'rosario-central', 'godoy-cruz']
  grandes.forEach(clubId => {
    for (let año = 2015; año <= 2026; año++) {
      squads.push({
        id: `${clubId}-${año}`, clubId, season: String(año),
        competition: 'Liga Profesional', label: `${clubId} ${año}`,
        playerIds: [`${clubId}-${año}-p`] as [string, ...string[]],
      })
    }
  })
  ;['platense', 'riestra', 'central-cordoba'].forEach(clubId => {
    squads.push({
      id: `${clubId}-2025`, clubId, season: '2025',
      competition: 'Liga Profesional', label: `${clubId} 2025`,
      playerIds: [`${clubId}-2025-p`] as [string, ...string[]],
    })
  })
  return squads
}

const SIN_PITY = { consecutiveLow: 0, pityActive: false, spinsSinEstrella: 0 }
const SIN_JUGADORES: Player[] = []

describe('el bombo no repite club dentro de un mismo draft', () => {
  it('con clubes frescos disponibles, nunca devuelve uno ya usado', () => {
    const squads = bombo()
    // 200 drafts de 6 giros: si el filtro fallara aunque sea una vez, salta acá.
    for (let intento = 0; intento < 200; intento++) {
      const usados = new Set<string>()
      for (let giro = 0; giro < 6; giro++) {
        const elegido = spinSquadWithPity(squads, SIN_JUGADORES, SIN_PITY, undefined, usados)
        expect(usados.has(elegido.clubId)).toBe(false)
        usados.add(elegido.clubId)
      }
      expect(usados.size).toBe(6)
    }
  })

  it('sin el registro de usados, los clubes SÍ se repiten (el defecto original)', () => {
    const squads = bombo()
    let huboRepetido = false
    for (let intento = 0; intento < 200 && !huboRepetido; intento++) {
      const vistos = new Set<string>()
      for (let giro = 0; giro < 6; giro++) {
        const elegido = spinSquadWithPity(squads, SIN_JUGADORES, SIN_PITY)
        if (vistos.has(elegido.clubId)) huboRepetido = true
        vistos.add(elegido.clubId)
      }
    }
    expect(huboRepetido).toBe(true)
  })

  it('si ya no quedan clubes frescos para ese puesto, igual devuelve un plantel', () => {
    const squads = bombo()
    const usados = new Set(squads.map(s => s.clubId))
    const elegido = spinSquadWithPity(squads, SIN_JUGADORES, SIN_PITY, undefined, usados)
    expect(elegido).toBeDefined()
    expect(squads).toContain(elegido)
  })
})
