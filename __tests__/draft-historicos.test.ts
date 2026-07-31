import { describe, it, expect } from 'vitest'
import { spinSquadWithPity, getSquadTier, HISTORICO_PESO } from '@/lib/game-engine'
import type { Player, Squad } from '@/lib/types'

// Los planteles históricos (el Vélez del 94, el Boca de Bianchi) tienen que salir MENOS que los
// actuales: salir uno es el premio, y un premio que toca siempre deja de serlo.
function squad(id: string, clubId: string, historico: boolean): Squad {
  return {
    id, clubId, season: historico ? '1994' : '2025',
    competition: historico ? 'Histórico' : 'Liga Profesional',
    label: id, playerIds: [`${id}-p`] as [string, ...string[]],
    ...(historico ? { historico: true } : {}),
  }
}

const SIN_JUGADORES: Player[] = []
const SIN_PITY = { consecutiveLow: 0, pityActive: false }

describe('planteles históricos en el bombo', () => {
  it('salen menos seguido que los actuales, en la proporción del peso', () => {
    // Mitad y mitad en el bombo: con peso 0,4 el histórico tiene que quedar bien por debajo del
    // 50 % que le tocaría sorteando parejo.
    const squads = [
      ...Array.from({ length: 10 }, (_, i) => squad(`actual-${i}`, `club-${i}`, false)),
      ...Array.from({ length: 10 }, (_, i) => squad(`hist-${i}`, `histclub-${i}`, true)),
    ]
    const GIROS = 4000
    let historicos = 0
    for (let i = 0; i < GIROS; i++) {
      if (spinSquadWithPity(squads, SIN_JUGADORES, SIN_PITY).historico) historicos++
    }
    const proporcion = historicos / GIROS
    const esperada = HISTORICO_PESO / (1 + HISTORICO_PESO) // 0,4 contra 1 → ~0,286
    expect(proporcion).toBeGreaterThan(esperada - 0.05)
    expect(proporcion).toBeLessThan(esperada + 0.05)
  })

  it('pero salen: bajar la probabilidad no es sacarlos del bombo', () => {
    const squads = [squad('actual-0', 'club-0', false), squad('hist-0', 'histclub-0', true)]
    const salieron = new Set<string>()
    for (let i = 0; i < 200; i++) salieron.add(spinSquadWithPity(squads, SIN_JUGADORES, SIN_PITY).id)
    expect(salieron.size).toBe(2)
  })

  it('un plantel histórico es legendario aunque el promedio no dé', () => {
    const flojos: Player[] = [{ id: 'hist-0-p', rating: 45 } as Player]
    expect(getSquadTier(squad('hist-0', 'histclub-0', true), flojos).tier).toBe('legendario')
    expect(getSquadTier(squad('actual-0', 'club-0', false), [{ id: 'actual-0-p', rating: 45 } as Player]).tier).toBe('comun')
  })
})
