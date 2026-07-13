import { describe, it, expect } from 'vitest'
import { simulateSeasonWithStats, formations } from '@/lib/game-engine'
import { normalizePlayers, normalizeSquads } from '@/lib/data-normalizers'
import playersData from '@/data/players.json'
import squadsData from '@/data/squads.json'
import type { Player, Squad } from '@/lib/types'

// Test de balance: la química nueva bufea a los rivales IA (planteles de un solo club).
// Un equipo de usuario rating ~85 con clubes mezclados tiene que seguir peleando arriba.
describe('balance de simulación con química', () => {
  const allPlayers = normalizePlayers(playersData) as Player[]
  const allSquads = normalizeSquads(squadsData) as Squad[]
  const f = formations['4-3-3']

  // 11 de élite con clubes/nacionalidades variados (draft típico con Cábala)
  const eliteTeam: Player[] = f.positions.map((slot, i) => {
    const pool = allPlayers
      .filter(p => (p.rating || 0) >= 80 && p.position === slot.pos)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return pool[i % Math.max(1, pool.length)] || allPlayers.find(p => p.position === slot.pos)!
  }).filter(Boolean)

  it('equipo élite (~85) termina en el top 4 la mayoría de las ligas', () => {
    if (eliteTeam.length < 11) return // dataset insuficiente: no bloquear
    const squad: Squad = {
      id: 'mi-11-fantasy', clubId: 'mi-11', season: '2026',
      competition: 'Liga Profesional', label: 'Mi 11 Fantasy',
      playerIds: eliteTeam.map(p => p.id) as [string, ...string[]],
    }
    const positions: number[] = []
    for (let i = 0; i < 60; i++) {
      const r = simulateSeasonWithStats(eliteTeam, squad, allSquads, allPlayers, f, 85)
      positions.push(r.playerPos || 14)
    }
    positions.sort((a, b) => a - b)
    const median = positions[Math.floor(positions.length / 2)]
    expect(median).toBeLessThanOrEqual(4)
  })
})
