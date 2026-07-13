import { describe, it, expect } from 'vitest';
import { buildMatchChronicle, type BuildChronicleInput } from '../lib/chronicle';
import type { Player } from '../lib/types';

// rng determinista simple (LCG)
function seededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function fakePlayer(id: string, name: string, position: string): Player {
  return { id, name, position, positions: [], rating: 80 } as unknown as Player;
}

const team: Player[] = [
  fakePlayer('gk', 'Fillol', 'GK'),
  fakePlayer('cb1', 'Passarella', 'CB'),
  fakePlayer('cb2', 'Perfumo', 'CB'),
  fakePlayer('cm', 'Verón', 'CM'),
  fakePlayer('cam', 'Maradona', 'CAM'),
  fakePlayer('st', 'Batistuta', 'ST'),
];

function input(over: Partial<BuildChronicleInput> = {}): BuildChronicleInput {
  return {
    opponent: 'Boca Juniors 2000',
    isHome: true,
    myGoals: 2,
    oppGoals: 1,
    goalsByPlayer: { st: 1, cam: 1 },
    assistsByPlayer: { cm: 1 },
    team,
    ...over,
  };
}

describe('buildMatchChronicle', () => {
  it('la cantidad de eventos de gol coincide con el marcador', () => {
    const { chronicle } = buildMatchChronicle(input(), seededRng(42));
    const goals = chronicle.events.filter(e => e.type === 'gol');
    expect(goals.filter(g => g.team === 'propio')).toHaveLength(2);
    expect(goals.filter(g => g.team === 'rival')).toHaveLength(1);
  });

  it('los minutos van en orden y siempre hay inicio y final', () => {
    const { chronicle } = buildMatchChronicle(input(), seededRng(7));
    const minutes = chronicle.events.map(e => e.minute);
    expect([...minutes].sort((a, b) => a - b)).toEqual(minutes);
    expect(chronicle.events[0].type).toBe('inicio');
    expect(chronicle.events[chronicle.events.length - 1].type).toBe('final');
    expect(chronicle.events.some(e => e.type === 'entretiempo')).toBe(true);
  });

  it('el texto del gol nombra al goleador', () => {
    const { chronicle } = buildMatchChronicle(input({ goalsByPlayer: { st: 2 }, oppGoals: 0, assistsByPlayer: {} }), seededRng(3));
    const goals = chronicle.events.filter(e => e.type === 'gol' && e.team === 'propio');
    expect(goals).toHaveLength(2);
    for (const g of goals) {
      expect(g.text).toContain('Batistuta');
      expect(g.playerId).toBe('st');
    }
  });

  it('evento de penales solo si hubo definición por penales', () => {
    const sin = buildMatchChronicle(input(), seededRng(1)).chronicle;
    expect(sin.events.some(e => e.type === 'penales')).toBe(false);
    const con = buildMatchChronicle(input({ myGoals: 1, oppGoals: 1, goalsByPlayer: { st: 1 }, penalties: '4-3', roundLabel: 'Semifinal' }), seededRng(1)).chronicle;
    expect(con.events.some(e => e.type === 'penales' && e.text.includes('4-3'))).toBe(true);
    expect(con.roundLabel).toBe('Semifinal');
  });

  it('discipline y eventos de tarjetas son consistentes', () => {
    const { chronicle, discipline } = buildMatchChronicle(input(), seededRng(999));
    const yellowEvents = chronicle.events.filter(e => e.type === 'amarilla');
    const redEvents = chronicle.events.filter(e => e.type === 'roja');
    expect(yellowEvents.map(e => e.playerId).sort()).toEqual([...discipline.yellows].sort());
    expect(redEvents.map(e => e.playerId).sort()).toEqual([...discipline.reds].sort());
  });

  it('es determinista con el mismo rng', () => {
    const a = buildMatchChronicle(input(), seededRng(55)).chronicle;
    const b = buildMatchChronicle(input(), seededRng(55)).chronicle;
    expect(a).toEqual(b);
  });

  it('partido sin goles genera crónica válida', () => {
    const { chronicle } = buildMatchChronicle(input({ myGoals: 0, oppGoals: 0, goalsByPlayer: {}, assistsByPlayer: {} }), seededRng(10));
    expect(chronicle.events.filter(e => e.type === 'gol')).toHaveLength(0);
    expect(chronicle.events.at(-1)?.text).toContain('Empate');
  });
});
