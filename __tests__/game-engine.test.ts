import { describe, it, expect } from 'vitest'
import {
  canPlayHere,
  calculateTeamScore,
  calculateFullTeamScore,
  generateShareText,
  formations,
  POS_LABELS,
  POS_SHORT,
  simulateSeasonMatchByMatch,
  simulateCopaArgentinaMatchByMatch,
  validateSquadFormation,
} from '@/lib/game-engine'
import type { Player, Squad, FormationConfig } from '@/lib/types'

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

  it('da chemistry bonus solo por posiciones exactas (GK y ST coinciden)', () => {
    const team = formation433.positions.map((slot, i) => {
      if (i === 0) return makePlayer({ position: 'GK', rating: 80, positions: ['GK'] })
      // Ponemos LW en todos los slots no-GK — LW no coincide con ningún slot excepto LW
      return makePlayer({ position: 'LW', rating: 80, positions: ['LW'] })
    })
    // Coincidencias exactas: GK (slot 0) → +2, LW (slot 8, el slot LW) → +2
    // Total chem = 4, avg = 80, score = 84
    expect(calculateFullTeamScore(team, formation433)).toBe(84)
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
  it('tiene las 4 formaciones definidas', () => {
    expect(Object.keys(formations)).toEqual(['4-3-3', '4-4-2', '4-2-3-1', '3-5-2'])
  })

  it.each(['4-3-3', '4-4-2', '4-2-3-1', '3-5-2'])('%s tiene exactamente 11 posiciones', (id) => {
    expect(formations[id].positions).toHaveLength(11)
  })

  it.each(['4-3-3', '4-4-2', '4-2-3-1', '3-5-2'])('%s tiene un GK en la primera posición', (id) => {
    expect(formations[id].positions[0].pos).toBe('GK')
  })
})

// ── simulateSeasonMatchByMatch ─────────────────────────────────
describe('simulateSeasonMatchByMatch()', () => {
  it('devuelve schedule, table, playerPos y champion con datos reales', () => {
    const squad: Squad = {
      id: 's1',
      clubId: 'c1',
      season: '2000',
      competition: 'arg1',
      label: 'Test Squad',
      playerIds: ['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11'],
    }
    const allSquads: Squad[] = [
      squad,
      { id:'s2', clubId:'c2', season:'2000', competition:'arg1', label:'Opp1', playerIds:['p12','p13','p14','p15','p16','p17','p18','p19','p20','p21','p22'] },
      { id:'s3', clubId:'c3', season:'2000', competition:'arg1', label:'Opp2', playerIds:['p23','p24','p25','p26','p27','p28','p29','p30','p31','p32','p33'] },
      { id:'s4', clubId:'c4', season:'2000', competition:'arg1', label:'Opp3', playerIds:['p34','p35','p36','p37','p38','p39','p40','p41','p42','p43','p44'] },
    ]
    const players: Player[] = []
    for (let i = 1; i <= 44; i++) {
      players.push(makePlayer({ id:`p${i}`, rating:80, position:'ST', positions:['ST'] }))
    }
    const result = simulateSeasonMatchByMatch(players.slice(0,11), squad, allSquads, players, formations['4-3-3'])
    expect(result.schedule.length).toBeGreaterThan(0)
    expect(result.table.length).toBeGreaterThan(0)
    expect(result.playerPos).toBeGreaterThanOrEqual(1)
    expect(typeof result.champion).toBe('string')
  })

  it('playerPos es 1 si el equipo es el más fuerte', () => {
    const squad: Squad = {
      id:'s1', clubId:'c1', season:'2000', competition:'arg1', label:'Strong', playerIds:['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11'],
    }
    const allSquads: Squad[] = [
      squad,
      { id:'s2', clubId:'c2', season:'2000', competition:'arg1', label:'Weak1', playerIds:['p12','p13','p14','p15','p16','p17','p18','p19','p20','p21','p22'] },
      { id:'s3', clubId:'c3', season:'2000', competition:'arg1', label:'Weak2', playerIds:['p23','p24','p25','p26','p27','p28','p29','p30','p31','p32','p33'] },
    ]
    const players: Player[] = []
    for (let i = 1; i <= 33; i++) {
      players.push(makePlayer({ id:`p${i}`, rating:99, position:'ST', positions:['ST'] }))
    }
    const result = simulateSeasonMatchByMatch(players.slice(0,11), squad, allSquads, players, formations['4-3-3'])
    expect(result.playerPos).toBe(1)
  })
})

// ── simulateCopaArgentinaMatchByMatch ──────────────────────────
describe('simulateCopaArgentinaMatchByMatch()', () => {
  it('devuelve rounds con estructura correcta', () => {
    const squad: Squad = {
      id:'s1', clubId:'c1', season:'2000', competition:'arg1', label:'CopaTeam', playerIds:['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11'],
    }
    const allSquads: Squad[] = [
      squad,
      { id:'s2', clubId:'c2', season:'2000', competition:'arg1', label:'Opp1', playerIds:['p12','p13','p14','p15','p16','p17','p18','p19','p20','p21','p22'] },
      { id:'s3', clubId:'c3', season:'2000', competition:'arg1', label:'Opp2', playerIds:['p23','p24','p25','p26','p27','p28','p29','p30','p31','p32','p33'] },
      { id:'s4', clubId:'c4', season:'2000', competition:'arg1', label:'Opp3', playerIds:['p34','p35','p36','p37','p38','p39','p40','p41','p42','p43','p44'] },
    ]
    const players: Player[] = []
    for (let i = 1; i <= 44; i++) {
      players.push(makePlayer({ id:`p${i}`, rating:80, position:'ST', positions:['ST'] }))
    }
    const result = simulateCopaArgentinaMatchByMatch(players.slice(0,11), squad, allSquads, players, formations['4-3-3'])
    expect(result.rounds.length).toBeGreaterThan(0)
    result.rounds.forEach(r => {
      expect(typeof r.round).toBe('string')
      expect(Array.isArray(r.matches)).toBe(true)
      r.matches.forEach((m: any) => {
        expect(typeof m.home).toBe('string')
        expect(typeof m.away).toBe('string')
        expect(typeof m.hg).toBe('number')
        expect(typeof m.ag).toBe('number')
        expect(typeof m.winner).toBe('string')
      })
    })
  })

  it('eliminated es false si el squad gana todos los partidos', () => {
    const squad: Squad = {
      id:'s1', clubId:'c1', season:'2000', competition:'arg1', label:'StrongCopa', playerIds:['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11'],
    }
    const allSquads: Squad[] = [
      squad,
      { id:'s2', clubId:'c2', season:'2000', competition:'arg1', label:'Weak1', playerIds:['p12','p13','p14','p15','p16','p17','p18','p19','p20','p21','p22'] },
      { id:'s3', clubId:'c3', season:'2000', competition:'arg1', label:'Weak2', playerIds:['p23','p24','p25','p26','p27','p28','p29','p30','p31','p32','p33'] },
    ]
    const players: Player[] = []
    for (let i = 1; i <= 33; i++) {
      players.push(makePlayer({ id:`p${i}`, rating:99, position:'ST', positions:['ST'] }))
    }
    const result = simulateCopaArgentinaMatchByMatch(players.slice(0,11), squad, allSquads, players, formations['4-3-3'])
    expect(result.eliminated).toBe(false)
  })
})

// ── validateSquadFormation ─────────────────────────────────────
describe('validateSquadFormation()', () => {
  it('devuelve isValid=true si el squad cubre los requisitos', () => {
    const squad: Squad = {
      id:'s1', clubId:'c1', season:'2000', competition:'arg1', label:'FullSquad', playerIds:['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11'],
    }
    const players: Player[] = [
      makePlayer({ id:'p1', position:'GK', positions:['GK'] }),
      makePlayer({ id:'p2', position:'LB', positions:['LB'] }),
      makePlayer({ id:'p3', position:'CB', positions:['CB'] }),
      makePlayer({ id:'p4', position:'CB', positions:['CB'] }),
      makePlayer({ id:'p5', position:'RB', positions:['RB'] }),
      makePlayer({ id:'p6', position:'CDM', positions:['CDM'] }),
      makePlayer({ id:'p7', position:'CM', positions:['CM'] }),
      makePlayer({ id:'p8', position:'CAM', positions:['CAM'] }),
      makePlayer({ id:'p9', position:'LW', positions:['LW'] }),
      makePlayer({ id:'p10', position:'ST', positions:['ST'] }),
      makePlayer({ id:'p11', position:'RW', positions:['RW'] }),
    ]
    const result = validateSquadFormation(squad, '4-3-3', players)
    expect(result.isValid).toBe(true)
    expect(result.missing).toEqual([])
  })

  it('devuelve isValid=false si faltan posiciones', () => {
    const squad: Squad = {
      id:'s1', clubId:'c1', season:'2000', competition:'arg1', label:'PartialSquad', playerIds:['p1','p2','p3','p4','p5'],
    }
    const players: Player[] = [
      makePlayer({ id:'p1', position:'GK', positions:['GK'] }),
      makePlayer({ id:'p2', position:'LB', positions:['LB'] }),
      makePlayer({ id:'p3', position:'CB', positions:['CB'] }),
      makePlayer({ id:'p4', position:'CB', positions:['CB'] }),
      makePlayer({ id:'p5', position:'RB', positions:['RB'] }),
    ]
    const result = validateSquadFormation(squad, '4-3-3', players)
    expect(result.isValid).toBe(false)
  })

  it('devuelve missing con las posiciones faltantes', () => {
    const squad: Squad = {
      id:'s1', clubId:'c1', season:'2000', competition:'arg1', label:'SinglePlayer', playerIds:['p1'],
    }
    const players: Player[] = [
      makePlayer({ id:'p1', position:'ST', positions:['ST'] }),
    ]
    const result = validateSquadFormation(squad, '4-3-3', players)
    expect(result.isValid).toBe(false)
    expect(result.missing.length).toBeGreaterThan(0)
    // At least one missing position should mention something like "GK"
    expect(result.missing.some(m => m.includes('GK'))).toBe(true)
  })
})
