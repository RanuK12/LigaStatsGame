import { describe, it, expect } from 'vitest'
import { normalizePlayers } from '@/lib/data-normalizers'
import { canPlayHere } from '@/lib/positions'
import { playerSchema } from '@/lib/types'
import playersData from '@/data/players.json'

// Mismos campos que emite scripts/data/build-public-data.mjs
const CORE_FIELDS = [
  'id', 'name', 'position', 'positions', 'rating', 'legendary',
  'nationality', 'clubs', 'goalsClub', 'capsClub', 'decade',
] as const

// Invariante del pipeline players-core: un jugador reducido a los campos core
// debe volver a validar como Player tras pasar por el normalizador del cliente.
describe('players-core pipeline', () => {
  it('una muestra reducida a campos core valida contra playerSchema', () => {
    const sample = (playersData as Record<string, unknown>[]).slice(0, 20)
    const stripped = sample.map(p => Object.fromEntries(CORE_FIELDS.map(f => [f, p[f]])))
    const normalized = normalizePlayers(stripped)
    expect(normalized).toHaveLength(sample.length)
    for (const player of normalized) {
      const parsed = playerSchema.safeParse(player)
      expect(parsed.success, JSON.stringify(parsed.success ? '' : parsed.error.issues[0])).toBe(true)
    }
  })

  // El arco es excluyente: había delanteros con positions:["GK"] que la ruleta ofrecía
  // para el arco (y arqueros elegibles en otros puestos).
  it('ningún jugador de campo queda elegible para el arco', () => {
    const all = normalizePlayers(playersData as unknown[])
    const intrusos = all.filter(p => p.position !== 'GK' && canPlayHere(p, 'GK'))
    const arquerosFueraDelArco = all.filter(p => p.position === 'GK' && canPlayHere(p, 'CB'))
    expect(intrusos).toHaveLength(0)
    expect(arquerosFueraDelArco).toHaveLength(0)
  })
})
