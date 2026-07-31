import { describe, it, expect } from 'vitest'
import { spinSquadWithPity, getSquadTier, HISTORICO_CHANCE } from '@/lib/game-engine'
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
  it('sale uno de cada cuatro giros, aunque sean pocos contra muchos', () => {
    // La proporción real del juego: 36 históricos contra 170 actuales. Sorteando parejo saldrían
    // en el 17 % de los giros, y con peso 0,4 caían al 8 %: en un draft de once no veías ninguno.
    const squads = [
      ...Array.from({ length: 170 }, (_, i) => squad(`actual-${i}`, `club-${i}`, false)),
      ...Array.from({ length: 36 }, (_, i) => squad(`hist-${i}`, `histclub-${i}`, true)),
    ]
    const GIROS = 6000
    let historicos = 0
    for (let i = 0; i < GIROS; i++) {
      if (spinSquadWithPity(squads, SIN_JUGADORES, SIN_PITY).historico) historicos++
    }
    const proporcion = historicos / GIROS
    expect(proporcion).toBeGreaterThan(HISTORICO_CHANCE - 0.04)
    expect(proporcion).toBeLessThan(HISTORICO_CHANCE + 0.06)
  })

  it('en un draft de once giros salen unos tres planteles históricos', () => {
    const squads = [
      ...Array.from({ length: 170 }, (_, i) => squad(`actual-${i}`, `club-${i}`, false)),
      ...Array.from({ length: 36 }, (_, i) => squad(`hist-${i}`, `histclub-${i}`, true)),
    ]
    let total = 0
    const DRAFTS = 500
    for (let d = 0; d < DRAFTS; d++) {
      const usados = new Set<string>()
      for (let giro = 0; giro < 11; giro++) {
        const sq = spinSquadWithPity(squads, SIN_JUGADORES, SIN_PITY, undefined, usados)
        usados.add(sq.clubId)
        if (sq.historico) total++
      }
    }
    const porDraft = total / DRAFTS
    expect(porDraft).toBeGreaterThan(2)
    expect(porDraft).toBeLessThan(4.5)
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
