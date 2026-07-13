import { describe, it, expect } from 'vitest';
import { calculateChemistry, getAdjacentPairs } from '../lib/chemistry';
import { formations } from '../lib/game-engine';
import type { Player } from '../lib/types';

const F433 = formations['4-3-3'];

type FakeOverrides = Partial<Omit<Player, 'clubs'>> & { clubs?: { id: string; name: string; years: string }[] }

function fakePlayer(over: FakeOverrides): Player {
  return {
    id: Math.random().toString(36).slice(2),
    name: 'Jugador',
    position: 'CM',
    positions: [],
    nationality: 'Argentina',
    clubs: [],
    rating: 75,
    ...over,
  } as Player;
}

/** 11 jugadores que calzan natural en el 4-3-3 */
function naturalTeam(over: FakeOverrides = {}): Player[] {
  return F433.positions.map((slot, i) =>
    fakePlayer({ id: `p${i}`, position: slot.pos, ...over })
  );
}

describe('getAdjacentPairs', () => {
  it('genera pares simétricos sin autopares', () => {
    const pairs = getAdjacentPairs(F433);
    expect(pairs.length).toBeGreaterThan(8);
    for (const [i, j] of pairs) {
      expect(i).toBeLessThan(j);
    }
  });

  it('conecta a los dos zagueros centrales del 4-3-3', () => {
    const pairs = getAdjacentPairs(F433);
    // CB en slots 2 y 3 (x 37 y 63, misma y)
    expect(pairs.some(([a, b]) => a === 2 && b === 3)).toBe(true);
  });
});

describe('calculateChemistry', () => {
  it('equipo del mismo club + posiciones naturales = quimica alta', () => {
    const team = naturalTeam({ clubs: [{ id: 'river', name: 'River Plate', years: '2018' }] });
    const chem = calculateChemistry(team, F433);
    expect(chem.total).toBeGreaterThanOrEqual(90);
    expect(chem.links.every(l => l.type === 'club' && l.label === 'River Plate')).toBe(true);
  });

  it('sin links ni fit = quimica baja', () => {
    const team = F433.positions.map((_, i) =>
      fakePlayer({ id: `p${i}`, position: 'GK', nationality: `Pais${i}`, clubs: [{ id: `c${i}`, name: `Club${i}`, years: '2000' }] })
    );
    // GK en todos los slots menos el arco = casi todo "fuera"
    const chem = calculateChemistry(team, F433);
    expect(chem.total).toBeLessThan(30);
    expect(chem.links).toHaveLength(0);
  });

  it('posicion secundaria puntua menos que natural', () => {
    const natural = calculateChemistry(naturalTeam({ nationality: '', clubs: [] }), F433);
    // CDM jugando de CM (slot 6 del 4-3-3 es CM; CDM es compatible secundaria)
    const secondaryTeam = naturalTeam({ nationality: '', clubs: [] });
    secondaryTeam[6] = fakePlayer({ id: 'sec', position: 'CDM', nationality: '', clubs: [] });
    const secondary = calculateChemistry(secondaryTeam, F433);
    expect(secondary.total).toBeLessThan(natural.total);
    expect(secondary.positionFit[6]).toBe('secundaria');
    expect(natural.positionFit[6]).toBe('natural');
  });

  it('nacionalidad compartida crea link cuando no hay club comun', () => {
    const team = naturalTeam({ clubs: [] });
    const chem = calculateChemistry(team, F433);
    expect(chem.links.length).toBeGreaterThan(0);
    expect(chem.links.every(l => l.type === 'nacionalidad' && l.label === 'Argentina')).toBe(true);
  });

  it('el link de club pisa al de nacionalidad en el mismo par', () => {
    const team = naturalTeam({ clubs: [{ id: 'boca', name: 'Boca Juniors', years: '2000' }] });
    const chem = calculateChemistry(team, F433);
    expect(chem.links.every(l => l.type === 'club')).toBe(true);
  });

  it('equipo con nulls no explota', () => {
    const team: (Player | null)[] = new Array(11).fill(null);
    team[0] = fakePlayer({ position: 'GK' });
    const chem = calculateChemistry(team, F433);
    expect(chem.links).toHaveLength(0);
    expect(chem.total).toBeGreaterThanOrEqual(0);
    expect(chem.perSlot).toHaveLength(11);
  });

  it('equipo vacio da 0', () => {
    expect(calculateChemistry(new Array(11).fill(null), F433).total).toBe(0);
  });
});
