import { describe, it, expect } from 'vitest'
import {
  simulateSeason, makeRng, advancePlayer, findClub, topeTraspaso,
  MAX_SEASONS, ALL_CLUBS, sortearTalento, type CareerState,
} from '@/lib/career-engine'

function nueva(position: string, seed: number): CareerState {
  return {
    player: { name: 'Test', number: 10, position, nationality: 'Argentina', flag: '🇦🇷', ovr: 60, age: 17, marketValueM: 0.3 },
    clubId: 'banfield', startYear: 2026, seasonsPlayed: 0,
    totals: { matchesPlayed: 0, goals: 0, assists: 0 },
    trophies: {}, clubHistory: ['banfield'], history: [], pendingOffers: [],
    nextContinental: 'sudamericana',
    milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
    finished: false,
    talento: sortearTalento(makeRng(seed + 999)),
  }
}

function correr(position: string, seed: number) {
  let s = nueva(position, seed)
  const rng = makeRng(seed)
  const ofertas: { region: string; valorM: number; clubId: string }[] = []
  for (let i = 0; i < MAX_SEASONS; i++) {
    if (s.pendingOffers.length) {
      s.pendingOffers.forEach((o) => ofertas.push({ region: o.region, valorM: o.valueM, clubId: o.clubId }))
      const actual = findClub(s.clubId)!
      const mejor = [...s.pendingOffers].sort((a, b) => b.strength - a.strength)[0]
      s = mejor.strength > actual.strength
        ? { ...s, clubId: mejor.clubId, clubHistory: [...s.clubHistory, mejor.clubId], pendingOffers: [] }
        : { ...s, pendingOffers: [] }
    }
    const { season, offers } = simulateSeason(s, rng)
    s = { ...s, player: advancePlayer(s, season), seasonsPlayed: s.seasonsPlayed + 1, history: [...s.history, season], pendingOffers: offers }
  }
  return { peak: Math.max(...s.history.map((h) => h.nextOvr ?? h.ovr)), ofertas, talento: s.talento }
}

describe('balance del modo carrera', () => {
  it('ninguna oferta supera lo que ese club puede pagar', () => {
    for (let seed = 0; seed < 40; seed++) {
      const { ofertas } = correr(seed % 2 ? 'ST' : 'CB', seed * 13 + 3)
      for (const o of ofertas) {
        const club = ALL_CLUBS.find((c) => c.id === o.clubId)!
        // Un club argentino no puede aparecer ofreciendo cifras europeas
        expect(o.valorM).toBeLessThanOrEqual(topeTraspaso(club))
        if (o.region !== 'euro') expect(o.valorM).toBeLessThanOrEqual(25)
      }
    }
  })

  it('llegar a leyenda es raro: la mayoría se queda en jugador de liga', () => {
    const picos: number[] = []
    for (let seed = 0; seed < 120; seed++) picos.push(correr(['GK', 'CB', 'CM', 'ST'][seed % 4], seed * 7 + 1).peak)
    picos.sort((a, b) => a - b)
    const mediana = picos[Math.floor(picos.length / 2)]
    const leyendas = picos.filter((p) => p >= 90).length / picos.length

    // El jugador típico termina siendo bueno, no un fenómeno
    expect(mediana).toBeGreaterThanOrEqual(74)
    expect(mediana).toBeLessThanOrEqual(84)
    // Pero llegar a 90+ tiene que ser posible y poco común (si es 0 se pierde la ilusión;
    // si es habitual se pierde el realismo)
    expect(leyendas).toBeGreaterThan(0)
    expect(leyendas).toBeLessThan(0.15)
  })
})
