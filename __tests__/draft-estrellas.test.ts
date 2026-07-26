import { describe, it, expect } from 'vitest'
import { spinSquadWithPity, squadHasStarFor, updatePity, STAR_PITY_SPINS } from '@/lib/game-engine'
import { normalizePlayers, normalizeSquads } from '@/lib/data-normalizers'
import playersData from '@/data/players.json'
import squadsData from '@/data/squads.json'

const players = normalizePlayers(playersData as unknown[])
const squads = normalizeSquads(squadsData as unknown[])

describe('estrellas en el draft', () => {
  it('la garantía trae un plantel con estrella para el puesto', () => {
    const pos = 'ST'
    const drafted = new Set<string>()
    const elegibles = squads.filter((s) => s.playerIds.length >= 11)
    const conEstrella = elegibles.filter((s) => squadHasStarFor(s, players, pos, drafted))
    expect(conEstrella.length).toBeGreaterThan(0)

    const pity = { consecutiveLow: 0, pityActive: false, spinsSinEstrella: STAR_PITY_SPINS }
    for (let i = 0; i < 15; i++) {
      const sq = spinSquadWithPity(elegibles, players, pity, { position: pos, drafted })
      expect(squadHasStarFor(sq, players, pos, drafted)).toBe(true)
    }
  })

  it('el contador se reinicia al fichar una estrella y crece si no', () => {
    const base = { consecutiveLow: 0, lastRatings: [], pityActive: false, spinsSinEstrella: 3 }
    expect(updatePity(base, 90, true).spinsSinEstrella).toBe(0)
    expect(updatePity(base, 70, false).spinsSinEstrella).toBe(4)
  })
})
