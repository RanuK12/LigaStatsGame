import { describe, it, expect } from 'vitest'
import {
  canPlayHere,
  calculateTeamScore,
  calculateFullTeamScore,
  generateShareText,
  formations,
  POS_LABELS,
  POS_SHORT,
} from '@/lib/game-engine'
import type { Player, FormationConfig } from '@/lib/types'

// ── Helpers ────────────────────────────────────────────────────
function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'test-1',
    name: 'Test Player',
    fullName: 'Test Player',
    birthDate: '1990-01-01',
    position: 'CM',
    positions: ['CM', 'CAM'],
    nationality: 'Argentina',
    height: 180,
    weight: 75,
    preferredFoot: 'right',
    clubs: [{ id: 'c1', name: 'Club Test', years: '2010-2015' }],
    capsNationalTeam: 10,
    goalsNationalTeam: 2,
    capsClub: 200,
    goalsClub: 40,
    assistsClub: 30,
    trophies: [],
    image: '',
    marketValue: '1M',
    activeYears: '2010-2020',
    decade: '2010s',
    rating: 80,
    legendary: false,
    ...overrides,
  }
}

const formation433 = formations['4-3-3']!

// ── POS_LABELS & POS_SHORT ─────────────────────────────────────
describe('POS_LABELS', () => {
  it('tiene labels en español para todas las posiciones', () => {
    expect(POS_LABELS.GK).toBe('POR')
    expect(POS_LABELS.CB).toBe('DEF')
    expect(POS_LABELS.ST).toBe('DC')
  })
})

describe('POS_SHORT', () => {
  it('tiene abreviaciones para todas las posiciones', () => {
    expect(POS_SHORT.GK).toBe('POR')
    expect(POS_SHORT.ST).toBe('DEL')
  })
})

// ── canPlayHere ────────────────────────────────────────────────
describe('canPlayHere()', () => {
  it('devuelve true si la posición primaria coincide', () => {
    const p = makePlayer({ position: 'GK' })
    expect(canPlayHere(p, 'GK')).toBe(true)
  })

  it('devuelve true si la posición está en positions[] secundarias', () => {
    const p = makePlayer({ position: 'CM', positions: ['CM', 'CAM'] })
    expect(canPlayHere(p, 'CAM')).toBe(true)
  })

  it('devuelve false si el jugador no puede jugar ahí', () => {
    const p = makePlayer({ position: 'GK', positions: ['GK'] })
    expect(canPlayHere(p, 'ST')).toBe(false)
  })

  it('usa positionCompatibility para posiciones compatibles (CB→LB)', () => {
    const cb = makePlayer({ position: 'CB', positions: ['CB', 'LB'] })
    expect(canPlayHere(cb, 'LB')).toBe(true)
  })

  it('usa positionCompatibility para laterales (LB→RB)', () => {
    const lb = makePlayer({ position: 'LB', positions: ['LB', 'RB'] })
    expect(canPlayHere(lb, 'RB')).toBe(true)
  })
})

// ── calculateTeamScore ─────────────────────────────────────────
describe('calculateTeamScore()', () => {
  it('devuelve 0 si el equipo está vacío', () => {
    expect(calculateTeamScore([], formation433)).toBe(0)
  })

  it('devuelve 0 si todos son null', () => {
    expect(calculateTeamScore([null, null], formation433)).toBe(0)
  })

  it('calcula el promedio de ratings de jugadores válidos', () => {
    const team = [
      makePlayer({ rating: 90 }),
      makePlayer({ rating: 70 }),
      null,
      makePlayer({ rating: 80 }),
    ]
    // (90 + 70 + 80) / 3 = 80
    expect(calculateTeamScore(team, formation433)).toBe(80)
  })

  it('usa rating default 50 si el jugador no tiene rating', () => {
    const team = [makePlayer({ rating: 0 })]
    expect(calculateTeamScore(team, formation433)).toBe(50)
  })
})

// ── calculateFullTeamScore ─────────────────────────────────────
describe('calculateFullTeamScore()', () => {
  it('devuelve 0 si hay menos de 11 jugadores', () => {
    const team = Array(10).fill(null).map(() => makePlayer())
    expect(calculateFullTeamScore(team, formation433)).toBe(0)
  })

  it('suma chemistry bonus por posición correcta', () => {
    // 11 jugadores todos en posición correcta (CM en slot CM)
    const team = formation433.positions.map((slot, i) => {
      // El primer slot (GK) necesita un GK
      if (i === 0) return makePlayer({ position: 'GK', rating: 80, positions: ['GK'] })
      if (i === 1) return makePlayer({ position: 'LB', rating: 80, positions: ['LB'] })
      if (i === 2) return makePlayer({ position: 'CB', rating: 80, positions: ['CB'] })
      if (i === 3) return makePlayer({ position: 'CB', rating: 80, positions: ['CB'] })
      if (i === 4) return makePlayer({ position: 'RB', rating: 80, positions: ['RB'] })
      return makePlayer({ position: slot.pos, rating: 80, positions: [slot.pos] })
    })
    const avg = 80
    const chem = 11 * 2 // 11 slots en posición correcta
    expect(calculateFullTeamScore(team, formation433)).toBe(Math.round(avg + chem))
  })

  it('no da chemistry bonus por posiciones incorrectas', () => {
    const team = formation433.positions.map((_, i) => {
      if (i === 0) return makePlayer({ position: 'GK', rating: 80, positions: ['GK'] })
      return makePlayer({ position: 'ST', rating: 80, positions: ['ST'] })
    })
    // Solo GK en posición correcta → 1 * 2 = 2 de chem
    const avg = 80
    expect(calculateFullTeamScore(team, formation433)).toBe(Math.round(avg + 2))
  })
})

// ── generateShareText ──────────────────────────────────────────
describe('generateShareText()', () => {
  it('genera texto para compartir con squad, score y formation', () => {
    const squad = { id: 's1', clubId: 'c1', season: '2000', competition: 'arg1', label: 'River Plate 2000', playerIds: ['a', 'b', 'c'] }
    const text = generateShareText(squad, 85, '4-3-3')
    expect(text).toContain('River Plate 2000')
    expect(text).toContain('85')
    expect(text).toContain('4-3-3')
    expect(text).toContain('Liga Argentina Fans')
  })
})

// ── formations ─────────────────────────────────────────────────
describe('formations', () => {
  it('tiene las 5 formaciones definidas', () => {
    expect(Object.keys(formations)).toEqual(['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-2-4'])
  })

  it.each(['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-2-4'])('%s tiene exactamente 11 posiciones', (id) => {
    expect(formations[id].positions).toHaveLength(11)
  })

  it.each(['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-2-4'])('%s tiene un GK en la primera posición', (id) => {
    expect(formations[id].positions[0].pos).toBe('GK')
  })
})
