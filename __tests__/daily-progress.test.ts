import { describe, it, expect, beforeEach } from 'vitest'
import { bonusForStreak, DAILY_BASE_ELO, DAILY_MAX_ELO, claimDailyBonus, completadoHoy, loadDaily } from '@/lib/daily-progress'

// El entorno de tests es node: alcanza con un localStorage en memoria.
const store = new Map<string, string>()
globalThis.localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size
  },
} as Storage

describe('reto diario → ELO', () => {
  beforeEach(() => store.clear())

  it('el bono crece con la racha y tiene techo', () => {
    expect(bonusForStreak(1)).toBe(DAILY_BASE_ELO)
    expect(bonusForStreak(3)).toBe(DAILY_BASE_ELO + 6)
    expect(bonusForStreak(50)).toBe(DAILY_MAX_ELO)
  })

  it('se cobra una sola vez por día', () => {
    const primero = claimDailyBonus()
    expect(primero?.elo).toBe(DAILY_BASE_ELO)
    expect(primero?.streak).toBe(1)
    expect(completadoHoy()).toBe(true)
    expect(claimDailyBonus()).toBeNull()
    expect(loadDaily().totalElo).toBe(DAILY_BASE_ELO)
  })
})
