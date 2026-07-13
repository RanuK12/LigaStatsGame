// ═══════════════════════════════════════════════════════════════
// TEAM CHEMISTRY — club de origen + nacionalidad + fit posicional
// ═══════════════════════════════════════════════════════════════
import type { Player, FormationConfig } from './types';
import { normPos, canPlayHere } from './positions';

export interface ChemistryLink {
  aIndex: number;
  bIndex: number;
  type: 'club' | 'nacionalidad';
  label: string;
  strength: number;
}

export type PositionFit = 'natural' | 'secundaria' | 'fuera';

export interface ChemistryBreakdown {
  total: number;                 // 0-100, entra al componente chemistry de calculateTeamStrength
  links: ChemistryLink[];        // pares adyacentes conectados (líneas del pitch)
  perSlot: number[];             // 0-100 por slot (glow de tokens)
  positionFit: PositionFit[];    // fit por slot
}

// Distancia máxima (en coords % de la formación) para considerar dos slots adyacentes
const ADJACENCY_DIST = 30;
const CLUB_LINK_PTS = 3;
const NATION_LINK_PTS = 1;
const FIT_PTS: Record<PositionFit, number> = { natural: 3, secundaria: 1.5, fuera: 0 };

export function getAdjacentPairs(formation: FormationConfig): [number, number][] {
  const pairs: [number, number][] = [];
  const pos = formation.positions;
  for (let i = 0; i < pos.length; i++) {
    for (let j = i + 1; j < pos.length; j++) {
      const dx = pos[i].x - pos[j].x;
      const dy = pos[i].y - pos[j].y;
      if (Math.sqrt(dx * dx + dy * dy) <= ADJACENCY_DIST) pairs.push([i, j]);
    }
  }
  return pairs;
}

function sharedClub(a: Player, b: Player): string | null {
  if (!a.clubs || !b.clubs) return null;
  for (const ca of a.clubs) {
    const match = b.clubs.find(cb => cb.id === ca.id);
    if (match) return match.name;
  }
  return null;
}

function slotFit(player: Player, slotPos: string): PositionFit {
  const target = normPos(slotPos);
  if (normPos(player.position) === target || player.positions?.some(p => normPos(p) === target)) return 'natural';
  if (canPlayHere(player, slotPos)) return 'secundaria';
  return 'fuera';
}

export function calculateChemistry(team: (Player | null)[], formation: FormationConfig): ChemistryBreakdown {
  const slots = formation.positions;
  const pairs = getAdjacentPairs(formation);
  const links: ChemistryLink[] = [];
  const slotPts = new Array<number>(slots.length).fill(0);
  const slotMax = new Array<number>(slots.length).fill(0);
  const positionFit: PositionFit[] = new Array(slots.length).fill('fuera');

  // Links entre adyacentes ocupados
  for (const [i, j] of pairs) {
    const a = team[i], b = team[j];
    if (!a || !b) continue;
    const club = sharedClub(a, b);
    if (club) {
      links.push({ aIndex: i, bIndex: j, type: 'club', label: club, strength: CLUB_LINK_PTS });
      slotPts[i] += CLUB_LINK_PTS; slotPts[j] += CLUB_LINK_PTS;
    } else if (a.nationality && a.nationality === b.nationality) {
      links.push({ aIndex: i, bIndex: j, type: 'nacionalidad', label: a.nationality, strength: NATION_LINK_PTS });
      slotPts[i] += NATION_LINK_PTS; slotPts[j] += NATION_LINK_PTS;
    }
  }

  // Fit posicional por slot ocupado
  let linkMax = 0;
  let fitPts = 0;
  let fitMax = 0;
  let filled = 0;
  for (let i = 0; i < slots.length; i++) {
    const p = team[i];
    if (!p) continue;
    filled++;
    const fit = slotFit(p, slots[i].pos);
    positionFit[i] = fit;
    fitPts += FIT_PTS[fit];
    fitMax += FIT_PTS.natural;
    slotPts[i] += FIT_PTS[fit];
  }
  for (const [i, j] of pairs) {
    if (team[i] && team[j]) {
      linkMax += CLUB_LINK_PTS;
      slotMax[i] += CLUB_LINK_PTS; slotMax[j] += CLUB_LINK_PTS;
    }
  }
  for (let i = 0; i < slots.length; i++) {
    if (team[i]) slotMax[i] += FIT_PTS.natural;
  }

  const linkPts = links.reduce((s, l) => s + l.strength, 0);
  const total = filled === 0
    ? 0
    : Math.max(0, Math.min(100, Math.round(100 * (linkPts + fitPts) / Math.max(1, linkMax + fitMax))));

  const perSlot = slotPts.map((pts, i) => (slotMax[i] > 0 ? Math.round(100 * pts / slotMax[i]) : 0));

  return { total, links, perSlot, positionFit };
}
