import { describe, it, expect } from 'vitest'
import { rankFromElo, tournamentPoints, TIERS } from '@/lib/ranking'

describe('ranking', () => {
  it('maps ELO to the right tier', () => {
    expect(rankFromElo(500).tier.name).toBe('Bronce')
    expect(rankFromElo(1000).tier.name).toBe('Plata')
    expect(rankFromElo(1200).tier.name).toBe('Oro')
    expect(rankFromElo(1400).tier.name).toBe('Platino')
    expect(rankFromElo(1600).tier.name).toBe('Diamante')
    expect(rankFromElo(1800).tier.name).toBe('Leyenda')
  })

  it('assigns divisions III -> I within a tier', () => {
    // Oro: 1100..1300, span 66.6 -> III [1100..1166], II, I
    expect(rankFromElo(1110).division).toBe('III')
    expect(rankFromElo(1290).division).toBe('I')
    expect(rankFromElo(1800).division).toBe('') // Leyenda no tiene división
  })

  it('progress increases within a tier and toNext decreases', () => {
    const low = rankFromElo(1110)
    const high = rankFromElo(1290)
    expect(high.progressPct).toBeGreaterThan(low.progressPct)
    expect(high.toNext).toBeLessThan(low.toNext)
    expect(rankFromElo(1800).toNext).toBe(0)
  })

  it('tiers are ordered by ascending min ELO', () => {
    for (let i = 1; i < TIERS.length; i++) expect(TIERS[i].min).toBeGreaterThan(TIERS[i - 1].min)
  })

  it('champion and better placement score more', () => {
    const champ = tournamentPoints({ type: 'liga', pos: 1, totalTeams: 28, isChampion: true })
    const mid = tournamentPoints({ type: 'liga', pos: 14, totalTeams: 28, isChampion: false })
    const copaChamp = tournamentPoints({ type: 'copa', pos: 1, totalTeams: 28, isChampion: true })
    expect(champ).toBeGreaterThan(mid)
    expect(champ).toBeGreaterThan(copaChamp) // Liga vale más que Copa
  })

  it('resta puntos cuando el torneo sale mal', () => {
    const ultimo = tournamentPoints({ type: 'liga', pos: 28, totalTeams: 28, isChampion: false })
    const mitad = tournamentPoints({ type: 'liga', pos: 14, totalTeams: 28, isChampion: false })
    expect(ultimo).toBeLessThan(0)
    expect(Math.abs(mitad)).toBeLessThanOrEqual(10) // mitad de tabla: casi neutro
  })
})
