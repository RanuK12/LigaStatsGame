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

// Clasificar a una copa continental es un premio; jugarla no puede salir más caro que no ir.
describe('puntos de las copas continentales', () => {
  it('irse en la fase de grupos suma poco, pero nunca resta', () => {
    const grupos = tournamentPoints({ type: 'libertadores', pos: 24, totalTeams: 32, isChampion: false })
    expect(grupos).toBeGreaterThan(0)
  })

  it('ganarla paga mucho más que quedar afuera en el grupo', () => {
    const campeon = tournamentPoints({ type: 'libertadores', pos: 1, totalTeams: 32, isChampion: true })
    const grupos = tournamentPoints({ type: 'libertadores', pos: 24, totalTeams: 32, isChampion: false })
    expect(campeon).toBeGreaterThan(grupos * 3)
  })

  it('la Libertadores paga más que la Sudamericana en el mismo puesto', () => {
    const lib = tournamentPoints({ type: 'libertadores', pos: 1, totalTeams: 32, isChampion: true })
    const sud = tournamentPoints({ type: 'sudamericana', pos: 1, totalTeams: 32, isChampion: true })
    expect(lib).toBeGreaterThan(sud)
  })

  it('en la liga, el fondo de la tabla sí resta', () => {
    expect(tournamentPoints({ type: 'liga', pos: 27, totalTeams: 28, isChampion: false })).toBeLessThan(0)
  })
})
