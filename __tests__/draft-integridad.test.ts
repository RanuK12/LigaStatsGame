import { describe, it, expect } from 'vitest'
import { normalizePlayers, normalizeSquads } from '@/lib/data-normalizers'
import { getSquadTier } from '@/lib/game-engine'
import playersData from '@/data/players.json'
import squadsData from '@/data/squads.json'
import type { Player, Squad } from '@/lib/types'

const players = normalizePlayers(playersData as unknown[]) as Player[]
const squads = normalizeSquads(squadsData as unknown[]).filter((s) => s.playerIds.length >= 11) as Squad[]

describe('los tiers de la ruleta', () => {
  /**
   * El bug: el 100 % de los 206 planteles era "legendario", así que la ruleta festejaba en cada
   * giro — que es lo mismo que no festejar nunca.
   *
   * Causa: los umbrales (avg >= 64) se fijaron cuando los OVR eran más bajos. Después se
   * recalcularon los OVR con datos reales de FIFA y los planteles pasaron a ir de 70 a 79, con
   * media 73,9: TODOS quedaron arriba del umbral y nadie se enteró.
   *
   * Este test existe para que la próxima vez que se toquen los OVR, esto salte.
   */
  it('la ruleta no puede dar legendario siempre', () => {
    const conteo = { legendario: 0, elite: 0, comun: 0 }
    for (const s of squads) conteo[getSquadTier(s, players).tier] += 1
    const n = squads.length

    expect(conteo.legendario / n, 'sale legendario demasiado seguido').toBeLessThan(0.3)
    expect(conteo.legendario, 'no sale legendario nunca').toBeGreaterThan(0)
    // Y el común tiene que ser la mayoría: si no, el premio deja de serlo.
    expect(conteo.comun / n).toBeGreaterThan(0.4)
    // Los tres escalones tienen que existir de verdad.
    expect(conteo.elite).toBeGreaterThan(5)
  })

  it('los planteles históricos son legendarios por definición', () => {
    const historicos = squads.filter((s) => (s as Squad & { historico?: boolean }).historico)
    expect(historicos.length).toBeGreaterThan(30)
    for (const h of historicos) {
      expect(getSquadTier(h, players).tier, `${h.label} no es legendario`).toBe('legendario')
    }
  })

  it('un plantel del montón no es legendario', () => {
    const flojos = squads
      .filter((s) => !(s as Squad & { historico?: boolean }).historico)
      .map((s) => ({ s, t: getSquadTier(s, players) }))
      .sort((a, b) => a.t.avg - b.t.avg)
      .slice(0, 20)
    for (const { s, t } of flojos) {
      expect(t.tier, `${s.label} (OVR ${t.avg}) salió legendario`).toBe('comun')
    }
  })
})
