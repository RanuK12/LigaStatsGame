import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import {
  clubSchema,
  playerSchema,
  squadSchema,
  formatSchema,
  positionSchema,
} from '@/lib/types'
import clubsData from '@/data/clubs.json'
import playersData from '@/data/players.json'
import squadsData from '@/data/squads.json'

// ── formatSchema ───────────────────────────────────────────────
describe('formatSchema', () => {
  it('solo permite las 4 formaciones implementadas', () => {
    expect(formatSchema.options).toEqual(['4-3-3', '4-4-2', '4-2-3-1', '3-5-2'])
  })

  it('no permite 4-2-4 (no implementado)', () => {
    const result = formatSchema.safeParse('4-2-4')
    expect(result.success).toBe(false)
  })

  it('acepta todas las formaciones válidas', () => {
    for (const f of ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2']) {
      expect(formatSchema.safeParse(f).success).toBe(true)
    }
  })
})

// ── positionSchema ─────────────────────────────────────────────
describe('positionSchema', () => {
  it('acepta posiciones válidas', () => {
    const valid = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF']
    for (const pos of valid) {
      expect(positionSchema.safeParse(pos).success).toBe(true)
    }
  })

  it('rechaza posiciones inválidas', () => {
    expect(positionSchema.safeParse('XYZ').success).toBe(false)
    expect(positionSchema.safeParse('').success).toBe(false)
  })
})

// ── Validación de datos reales ─────────────────────────────────
describe('clubs.json', () => {
  it('todos los clubs pasan el schema', () => {
    const clubs = clubsData as unknown[]
    expect(clubs.length).toBeGreaterThan(0)
    for (let i = 0; i < clubs.length; i++) {
      const result = clubSchema.safeParse(clubs[i])
      if (!result.success) {
        throw new Error(`Club #${i} (${(clubs[i] as any)?.name || 'unknown'}): ${result.error.message}`)
      }
    }
  })

  it('cada club tiene campos obligatorios no vacíos', () => {
    const clubs = clubsData as any[]
    for (const club of clubs) {
      expect(club.id).toBeTruthy()
      expect(club.name).toBeTruthy()
      expect(club.colors?.length).toBeGreaterThan(0)
      expect(club.era?.length).toBeGreaterThan(0)
    }
  })
})

describe('players.json', () => {
  it('todos los players pasan el schema', () => {
    const players = playersData as unknown[]
    expect(players.length).toBeGreaterThan(0)
    for (let i = 0; i < players.length; i++) {
      const result = playerSchema.safeParse(players[i])
      if (!result.success) {
        throw new Error(`Player #${i} (${(players[i] as any)?.name || 'unknown'}): ${result.error.message}`)
      }
    }
  })

  it('cada player tiene campos críticos', () => {
    const players = playersData as any[]
    for (const p of players) {
      expect(p.id).toBeTruthy()
      expect(p.name).toBeTruthy()
      expect(p.position).toBeTruthy()
      expect(p.positions?.length).toBeGreaterThan(0)
      expect(p.clubs?.length).toBeGreaterThan(0)
      expect(p.rating).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('squads.json', () => {
  it('todos los squads pasan el schema', () => {
    const squads = squadsData as unknown[]
    expect(squads.length).toBeGreaterThan(0)
    for (let i = 0; i < squads.length; i++) {
      const result = squadSchema.safeParse(squads[i])
      if (!result.success) {
        throw new Error(`Squad #${i} (${(squads[i] as any)?.label || 'unknown'}): ${result.error.message}`)
      }
    }
  })

  it('cada squad tiene campos obligatorios', () => {
    const squads = squadsData as any[]
    for (const s of squads) {
      expect(s.id).toBeTruthy()
      expect(s.clubId).toBeTruthy()
      expect(s.season).toBeTruthy()
      expect(s.label).toBeTruthy()
      expect(s.playerIds?.length).toBeGreaterThan(0)
    }
  })
})
