import { Player, Squad, Club, Formation, FormationConfig, Position, MatchResult, GameModeConfig, ScheduleMatch, RoundMatch } from './types';

// ═══════════════════════════════════════════════════════════════
// POSITION LABELS (Español)
// ═══════════════════════════════════════════════════════════════
function isPlayer(x: any): x is Player {
  return x && typeof x.id === 'string' && typeof x.name === 'string';
}

export const POS_LABELS: Record<string, string> = {
  GK: 'POR', CB: 'DEF', LB: 'LI', RB: 'LD', LWB: 'Carr. Izq', RWB: 'Carr. Der',
  CDM: 'MCD', CM: 'MC', CAM: 'MCO', LM: 'MI', RM: 'MD',
  LW: 'EI', RW: 'ED', ST: 'DC', CF: 'CD',
};

export const POS_SHORT: Record<string, string> = {
  GK: 'POR', CB: 'DFC', LB: 'DFI', RB: 'DFD', LWB: 'CII', RWB: 'CID',
  CDM: 'MCD', CM: 'MED', CAM: 'MCO', LM: 'MII', RM: 'MDD',
  LW: 'EXT', RW: 'EXT', ST: 'DEL', CF: 'DCO',
};

// ═══════════════════════════════════════════════════════════════
// FORMATIONS
// ═══════════════════════════════════════════════════════════════
export const formations: Record<string, FormationConfig> = {
  '4-3-3': {
    id: '4-3-3', name: '4-3-3',
    positions: [
      { pos: 'GK', x: 50, y: 92, label: 'Arquero' },
      { pos: 'LB', x: 12, y: 72, label: 'Lateral Izq.' },
      { pos: 'CB', x: 37, y: 72, label: 'Zaguero Central' },
      { pos: 'CB', x: 63, y: 72, label: 'Zaguero Central' },
      { pos: 'RB', x: 88, y: 72, label: 'Lateral Der.' },
      { pos: 'CDM', x: 22, y: 48, label: 'Centro Def.' },
      { pos: 'CM', x: 50, y: 48, label: 'Centrocampista' },
      { pos: 'CAM', x: 78, y: 48, label: 'Centro Of.' },
      { pos: 'LW', x: 15, y: 24, label: 'Extremo Izq.' },
      { pos: 'ST', x: 50, y: 16, label: 'Delantero' },
      { pos: 'RW', x: 85, y: 24, label: 'Extremo Der.' },
    ],
    requirements: { GK: 1, CB: 2, LB: 1, RB: 1, CDM: 1, CM: 1, CAM: 1, LW: 1, ST: 1, RW: 1 },
  },
  '4-4-2': {
    id: '4-4-2', name: '4-4-2',
    positions: [
      { pos: 'GK', x: 50, y: 92, label: 'Arquero' },
      { pos: 'LB', x: 12, y: 72, label: 'Lateral Izq.' },
      { pos: 'CB', x: 37, y: 72, label: 'Zaguero Central' },
      { pos: 'CB', x: 63, y: 72, label: 'Zaguero Central' },
      { pos: 'RB', x: 88, y: 72, label: 'Lateral Der.' },
      { pos: 'LM', x: 15, y: 48, label: 'Med. Izq.' },
      { pos: 'CM', x: 38, y: 48, label: 'Centrocampista' },
      { pos: 'CM', x: 62, y: 48, label: 'Centrocampista' },
      { pos: 'RM', x: 85, y: 48, label: 'Med. Der.' },
      { pos: 'ST', x: 37, y: 18, label: 'Delantero' },
      { pos: 'ST', x: 63, y: 18, label: 'Delantero' },
    ],
    requirements: { GK: 1, CB: 2, LB: 1, RB: 1, LM: 1, CM: 2, RM: 1, ST: 2 },
  },
  '4-2-3-1': {
    id: '4-2-3-1', name: '4-2-3-1',
    positions: [
      { pos: 'GK', x: 50, y: 92, label: 'Arquero' },
      { pos: 'LB', x: 12, y: 72, label: 'Lateral Izq.' },
      { pos: 'CB', x: 37, y: 72, label: 'Zaguero Central' },
      { pos: 'CB', x: 63, y: 72, label: 'Zaguero Central' },
      { pos: 'RB', x: 88, y: 72, label: 'Lateral Der.' },
      { pos: 'CDM', x: 37, y: 50, label: 'Centro Def.' },
      { pos: 'CDM', x: 63, y: 50, label: 'Centro Def.' },
      { pos: 'LW', x: 15, y: 32, label: 'Extremo Izq.' },
      { pos: 'CAM', x: 50, y: 32, label: 'Centro Of.' },
      { pos: 'RW', x: 85, y: 32, label: 'Extremo Der.' },
      { pos: 'ST', x: 50, y: 16, label: 'Delantero' },
    ],
    requirements: { GK: 1, CB: 2, LB: 1, RB: 1, CDM: 2, LW: 1, CAM: 1, RW: 1, ST: 1 },
  },
  '3-5-2': {
    id: '3-5-2', name: '3-5-2',
    positions: [
      { pos: 'GK', x: 50, y: 92, label: 'Arquero' },
      { pos: 'CB', x: 25, y: 72, label: 'Zaguero Central' },
      { pos: 'CB', x: 50, y: 72, label: 'Zaguero Central' },
      { pos: 'CB', x: 75, y: 72, label: 'Zaguero Central' },
      { pos: 'LWB', x: 8, y: 48, label: 'Carrilero Izq.' },
      { pos: 'CM', x: 30, y: 48, label: 'Centrocampista' },
      { pos: 'CM', x: 50, y: 48, label: 'Centrocampista' },
      { pos: 'CM', x: 70, y: 48, label: 'Centrocampista' },
      { pos: 'RWB', x: 92, y: 48, label: 'Carrilero Der.' },
      { pos: 'ST', x: 37, y: 18, label: 'Delantero' },
      { pos: 'ST', x: 63, y: 18, label: 'Delantero' },
    ],
    requirements: { GK: 1, CB: 3, LWB: 1, RWB: 1, CM: 3, ST: 2 },
  },
};

// ═══════════════════════════════════════════════════════════════
// POSITION COMPATIBILITY (movido a lib/positions.ts; re-export para consumidores)
// ═══════════════════════════════════════════════════════════════
export { positionCompatibility, normPos, canPlayHere } from './positions';
import { normPos, canPlayHere } from './positions';
import { calculateChemistry } from './chemistry';
import { buildMatchChronicle, type MatchChronicle } from './chronicle';

// ═══════════════════════════════════════════════════════════════
// GAME MODES
// ═══════════════════════════════════════════════════════════════
export const GAME_MODES: Record<string, GameModeConfig> = {
  clasico: { id: 'clasico', name: 'Clásico', description: 'Ratings visibles. Intenta superar los 100 pts.', icon: '', ratingsVisible: true, rerolls: 3 },
  almanaque: { id: 'almanaque', name: 'El Almanaque', description: 'Sin estadísticas. Solo tu conocimiento.', icon: '', ratingsVisible: false, rerolls: 2 },
  liga: { id: 'liga', name: 'Liga Argentina', description: 'Formato real. 2 zonas + playoffs.', icon: '', ratingsVisible: true, rerolls: 3 },
  copa: { id: 'copa', name: 'Copa Argentina', description: 'Eliminación directa.', icon: '', ratingsVisible: true, rerolls: 3 },
};

export type TeamStrength = {
  attack: number;
  midfield: number;
  defense: number;
  goalkeeper: number;
  chemistry: number;
  overall: number;
};

type TeamLine = 'attack' | 'midfield' | 'defense' | 'goalkeeper';

const LINE_GROUPS: Record<string, TeamLine> = {
  GK: 'goalkeeper',
  CB: 'defense',
  LB: 'defense',
  RB: 'defense',
  LWB: 'defense',
  RWB: 'defense',
  CDM: 'midfield',
  CM: 'midfield',
  CAM: 'midfield',
  LM: 'midfield',
  RM: 'midfield',
  LW: 'attack',
  RW: 'attack',
  ST: 'attack',
  CF: 'attack',
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lineRating(team: (Player | null)[], formation: FormationConfig, line: TeamLine): number {
  const weighted = team
    .map((player, index) => ({ player, slot: formation.positions[index] }))
    .filter(({ player, slot }) => player && slot && LINE_GROUPS[slot.pos] === line)
    .map(({ player, slot }) => {
      const rating = player!.rating || 50;
      const base = rating * 0.7;
      const naturalFit = normPos(player!.position) === slot!.pos || player!.positions?.some((pos) => normPos(pos) === slot!.pos);
      const fitBonus = naturalFit ? 8 : 0;
      return base + fitBonus;
    });

  if (weighted.length === 0) {
    return line === 'goalkeeper' ? 45 : line === 'defense' ? 50 : line === 'midfield' ? 52 : 48;
  }

  const average = weighted.reduce((sum, value) => sum + value, 0) / weighted.length;
  return clamp(Math.round(average), 35, 99);
}

export function calculateTeamStrength(team: (Player | null)[], formation: FormationConfig): TeamStrength {
  const goalkeeper = lineRating(team, formation, 'goalkeeper');
  const defense = lineRating(team, formation, 'defense');
  const midfield = lineRating(team, formation, 'midfield');
  const attack = lineRating(team, formation, 'attack');
  const chemistry = calculateChemistry(team, formation).total;
  const overall = Math.round(
    goalkeeper * 0.18 +
    defense * 0.28 +
    midfield * 0.24 +
    attack * 0.22 +
    chemistry * 0.08
  );

  return { attack, midfield, defense, goalkeeper, chemistry, overall: clamp(overall, 35, 99) };
}

function styleModifier(mode: GameModeConfig['id'], strength: TeamStrength): TeamStrength {
  if (mode === 'copa') {
    return {
      ...strength,
      defense: clamp(strength.defense + 2, 35, 99),
      attack: clamp(strength.attack - 1, 35, 99),
      overall: clamp(Math.round(strength.overall + 1), 35, 99),
    };
  }

  if (mode === 'almanaque') {
    return {
      ...strength,
      chemistry: clamp(strength.chemistry + 2, 0, 100),
      overall: clamp(Math.round(strength.overall + 1), 35, 99),
    };
  }

  if (mode === 'liga') {
    return {
      ...strength,
      midfield: clamp(strength.midfield + 1, 35, 99),
    };
  }

  return strength;
}

export function teamToStrength(team: Player[], formation: FormationConfig, mode: GameModeConfig['id'] = 'clasico'): TeamStrength {
  const slots: (Player | null)[] = new Array(formation.positions.length).fill(null);
  team.slice(0, formation.positions.length).forEach((player, index) => {
    slots[index] = player;
  });
  return styleModifier(mode, calculateTeamStrength(slots, formation));
}

// ═══════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all players from a squad that can play in a specific formation slot.
 * This is the MAIN filter used by the draft UI.
 */
export function getPlayersForSlot(squad: Squad, allPlayers: Player[], slotPosition: string): Player[] {
  const squadPlayers = allPlayers.filter(p => squad.playerIds.includes(p.id));
  return squadPlayers.filter(p => canPlayHere(p, slotPosition));
}

/**
 * Get all players from a squad (no position filter).
 */
export function getSquadPlayers(squad: Squad, allPlayers: Player[]): Player[] {
  return allPlayers.filter(p => squad.playerIds.includes(p.id));
}

export type SquadTier = 'comun' | 'elite' | 'legendario';

/**
 * Tier del plantel para el reveal de la ruleta. Umbrales calibrados a la base
 * real (mejores planteles avg ~64-68, mediana ~54).
 */
export function getSquadTier(squad: Squad, allPlayers: Player[]): { avg: number; legendaryCount: number; tier: SquadTier } {
  const players = getSquadPlayers(squad, allPlayers);
  const avg = players.length === 0 ? 0 : players.reduce((s, p) => s + (p.rating || 60), 0) / players.length;
  const legendaryCount = players.filter(p => p.legendary).length;
  const tier: SquadTier = avg >= 64 || legendaryCount >= 3 ? 'legendario' : avg >= 58 ? 'elite' : 'comun';
  return { avg: Math.round(avg), legendaryCount, tier };
}

/**
 * Spin a random squad from the available ones.
 * Only returns squads with at least 11 players.
 */
export function spinSquad(allSquads: Squad[]): Squad {
  const valid = allSquads.filter(s => s.playerIds.length >= 11);
  return valid[Math.floor(Math.random() * valid.length)];
}

/**
 * Calculate team score (average rating of filled positions).
 * Returns 0 if not all 11 positions are filled.
 */
export function calculateTeamScore(team: (Player | null)[], formation: FormationConfig): number {
  const valid = team.filter(isPlayer);
  if (valid.length === 0) return 0;
  // Partial score even if not all 11 filled
  let score = 0;
  valid.forEach(p => { score += p.rating || 50; });
  return Math.round(score / valid.length);
}

/**
 * Calculate a full team score bonus (only when all 11 are filled).
 */
export function calculateFullTeamScore(team: (Player | null)[], formation: FormationConfig): number {
  const valid = team.filter(isPlayer);
  if (valid.length < 11) return 0;
  let score = 0;
  valid.forEach(p => { score += p.rating || 50; });
  // Chemistry bonus for having correct positions
  let chemBonus = 0;
  team.forEach((p, i) => {
    if (p && formation.positions[i] && p.position === formation.positions[i].pos) chemBonus += 2;
  });
  return Math.round(score / 11 + chemBonus);
}

// ═══════════════════════════════════════════════════════════════
// SIMULATION
// ═══════════════════════════════════════════════════════════════

// Muestreo Poisson (Knuth) sobre los goles esperados. Reemplaza al viejo
// simulateGoals(expected*18) que aplanaba todo al piso 0.3 y hacía que la
// fuerza del equipo casi no afectara los resultados.
function samplePoissonGoals(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return Math.min(k - 1, 7);
}

interface LigaTeam { name: string; pts: number; gf: number; ga: number; w: number; d: number; l: number; form: string[] }

function sortTable(teams: LigaTeam[]) {
  return teams.sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
}

export function simulateMatchGoals(home: TeamStrength, away: TeamStrength): { homeGoals: number; awayGoals: number } {
  const homeAttack = home.attack * 0.55 + home.midfield * 0.25 + home.chemistry * 0.12 + home.overall * 0.08;
  const awayAttack = away.attack * 0.55 + away.midfield * 0.25 + away.chemistry * 0.12 + away.overall * 0.08;
  const homeDefense = home.defense * 0.55 + home.goalkeeper * 0.3 + home.chemistry * 0.15;
  const awayDefense = away.defense * 0.55 + away.goalkeeper * 0.3 + away.chemistry * 0.15;

  const homeExpected = clamp((homeAttack - awayDefense + 52) / 28, 0.35, 2.85);
  const awayExpected = clamp((awayAttack - homeDefense + 50) / 29, 0.25, 2.55);

  const homeGoals = samplePoissonGoals(homeExpected);
  const awayGoals = samplePoissonGoals(awayExpected);

  return { homeGoals, awayGoals };
}

// ═══ MATCH-BY-MATCH SEASON SIMULATION ═══
export function simulateSeasonMatchByMatch(
  playerTeam: Player[], squad: Squad, allSquads: Squad[], allPlayers: Player[], formation: FormationConfig
): { schedule: ScheduleMatch[]; table: LigaTeam[]; playerPos: number; champion: string } {
  const playerStrength = teamToStrength(playerTeam, formation, 'liga');
  const opponents = allSquads
    .filter(s => s.id !== squad.id && s.playerIds.length >= 11)
    .sort(() => Math.random() - 0.5).slice(0, 29);
  const allNames = [squad.label, ...opponents.map(o => o.label)];
  const zoneA = allNames.slice(0, 15);
  const zoneB = allNames.slice(15);
  const playerZone = zoneA.includes(squad.label) ? zoneA : zoneB;

  const strengths: Record<string, number> = {};
  const strengthByTeam: Record<string, TeamStrength> = {};
  strengthByTeam[squad.label] = playerStrength;
  strengths[squad.label] = playerStrength.overall;
  opponents.forEach(o => {
    const p = getSquadPlayers(o, allPlayers).slice(0, 11);
    const opponentStrength = p.length >= 11 ? teamToStrength(p, formations['4-3-3'], 'liga') : { attack: 55, midfield: 55, defense: 55, goalkeeper: 55, chemistry: 40, overall: 55 };
    strengthByTeam[o.label] = opponentStrength;
    strengths[o.label] = opponentStrength.overall;
  });
  allNames.forEach(n => { if (!strengths[n]) strengths[n] = 50 + Math.random() * 20; });

  const teams: LigaTeam[] = playerZone.map(name => ({ name, pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, form: [] }));
  const schedule: ScheduleMatch[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const home = teams[i], away = teams[j];
      const { homeGoals: hg, awayGoals: ag } = simulateMatchGoals(
        strengthByTeam[home.name] || { attack: strengths[home.name], midfield: strengths[home.name], defense: strengths[home.name], goalkeeper: strengths[home.name], chemistry: 50, overall: strengths[home.name] },
        strengthByTeam[away.name] || { attack: strengths[away.name], midfield: strengths[away.name], defense: strengths[away.name], goalkeeper: strengths[away.name], chemistry: 50, overall: strengths[away.name] }
      );
      const isPlayerHome = home.name === squad.label;
      const isPlayerAway = away.name === squad.label;
      home.gf += hg; home.ga += ag; away.gf += ag; away.ga += hg;
      if (hg > ag) { home.pts += 3; home.w++; away.l++; home.form.push('V'); away.form.push('D'); }
      else if (hg < ag) { away.pts += 3; away.w++; home.l++; home.form.push('D'); away.form.push('V'); }
      else { home.pts++; away.pts++; home.d++; away.d++; home.form.push('E'); away.form.push('E'); }
      if (home.form.length > 5) { home.form.shift(); away.form.shift(); }
      schedule.push({
        home: home.name,
        away: away.name,
        homeGoals: hg,
        awayGoals: ag,
        isPlayerHome,
      });
    }
  }
  const sorted = sortTable([...teams]);
  const pIdx = sorted.findIndex(t => t.name === squad.label);
  return { schedule, table: sorted, playerPos: pIdx + 1, champion: sorted[0].name };
}

// ═══ COPA ARGENTINA SIMULATION ═══
export function simulateCopaArgentinaMatchByMatch(
  playerTeam: Player[], squad: Squad, allSquads: Squad[], allPlayers: Player[], formation: FormationConfig
): { rounds: RoundMatch[]; champion?: string; eliminated: boolean; eliminatedRound: string } {
  const playerStrength = teamToStrength(playerTeam, formation, 'copa');
  const opponents = allSquads.filter(s => s.id !== squad.id && s.playerIds.length >= 11)
    .sort(() => Math.random() - 0.5).slice(0, 31);
  const names = [squad.label, ...opponents.map(o => o.label)];
  const str: Record<string, number> = {};
  const strengthByTeam: Record<string, TeamStrength> = {};
  strengthByTeam[squad.label] = playerStrength;
  str[squad.label] = playerStrength.overall;
  opponents.forEach(o => {
    const p = getSquadPlayers(o, allPlayers).slice(0, 11);
    const opponentStrength = p.length >= 11 ? teamToStrength(p, formations['4-3-3'], 'copa') : { attack: 50, midfield: 50, defense: 50, goalkeeper: 50, chemistry: 35, overall: 50 };
    strengthByTeam[o.label] = opponentStrength;
    str[o.label] = opponentStrength.overall;
  });
  const roundNames = ['32avos', '16avos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'];
  const rounds: RoundMatch[] = [];
  let alive = [...names]; let eliminated = false; let eliminatedRound = '';
  for (let r = 0; r < roundNames.length && alive.length > 1; r++) {
    const matches: ScheduleMatch[] = [];
    const next: string[] = [];
    for (let i = 0; i < alive.length; i += 2) {
      if (i + 1 >= alive.length) { next.push(alive[i]); continue; }
      const home = alive[i], away = alive[i + 1];
      const { homeGoals: hg, awayGoals: ag } = simulateMatchGoals(
        strengthByTeam[home] || { attack: str[home] || 55, midfield: str[home] || 55, defense: str[home] || 55, goalkeeper: str[home] || 55, chemistry: 45, overall: str[home] || 55 },
        strengthByTeam[away] || { attack: str[away] || 55, midfield: str[away] || 55, defense: str[away] || 55, goalkeeper: str[away] || 55, chemistry: 45, overall: str[away] || 55 }
      );
      let penalties: string | undefined;
      let winner = home;
      if (hg === ag) {
        let ph = Math.floor(Math.random() * 5) + 1;
        let pa = Math.floor(Math.random() * 5) + 1;
        while (ph === pa) { ph += Math.random() > 0.5 ? 1 : 0; pa += Math.random() > 0.5 ? 1 : 0; }
        penalties = Math.min(ph, 5) + '-' + Math.min(pa, 5);
        winner = ph > pa ? home : away;
      } else {
        winner = hg > ag ? home : away;
      }
      matches.push({
        home,
        away,
        homeGoals: hg,
        awayGoals: ag,
        isPlayerHome: home === squad.label,
        penalties,
      });
      next.push(winner);
      if ((home === squad.label || away === squad.label) && winner !== squad.label) { eliminated = true; eliminatedRound = roundNames[r]; }
    }
    rounds.push({ round: roundNames[r], matches });
    alive = next;
  }
  return { rounds, champion: alive[0], eliminated, eliminatedRound };
}

export function generateShareText(squad: Squad, score: number, formation: string): string {
  return `Mi 11 de ${squad.label} | ${formation} | Score: ${score}/99\nLiga Argentina Fans — Armá tu 11 de la historia`;
}

export function validateSquadFormation(
  squad: Squad,
  formationId: string,
  players: Player[]
): { isValid: boolean; missing: string[] } {
  const formation = formations[formationId];
  if (!formation) {
    return { isValid: false, missing: [`Formation "${formationId}" not found`] };
  }
  const squadPlayers = players.filter(p => squad.playerIds.includes(p.id));
  const missing: string[] = [];
  for (const [pos, needed] of Object.entries(formation.requirements)) {
    const count = squadPlayers.filter(p => canPlayHere(p, pos)).length;
    if (count < needed) {
      missing.push(`${pos} (needs ${needed}, has ${count})`);
    }
  }
  return { isValid: missing.length === 0, missing };
}

// ═══════════════════════════════════════════════════════════════
// INDIVIDUAL PLAYER STATS SIMULATION
// ═══════════════════════════════════════════════════════════════

import type { TournamentPlayerStats, TournamentResult } from './types';

const GOAL_PROBS: Record<string, number> = {
  GK: 0.01, CB: 0.04, LB: 0.06, RB: 0.06, LWB: 0.07, RWB: 0.07,
  CDM: 0.07, CM: 0.10, CAM: 0.14, LM: 0.12, RM: 0.12,
  LW: 0.18, RW: 0.18, ST: 0.28, CF: 0.24,
};
const ASSIST_PROBS: Record<string, number> = {
  GK: 0.00, CB: 0.03, LB: 0.09, RB: 0.09, LWB: 0.10, RWB: 0.10,
  CDM: 0.08, CM: 0.14, CAM: 0.20, LM: 0.16, RM: 0.16,
  LW: 0.16, RW: 0.16, ST: 0.10, CF: 0.12,
};

export function distributeGoalsAmongPlayers(
  players: Player[], totalGoals: number, formation: FormationConfig
): { goals: Record<string, number>; assists: Record<string, number> } {
  const goals: Record<string, number> = {};
  const assists: Record<string, number> = {};
  players.forEach(p => { goals[p.id] = 0; assists[p.id] = 0; });

  for (let g = 0; g < totalGoals; g++) {
    // Pick goal scorer weighted by position + rating
    const weights = players.map(p => {
      const pos = normPos(p.position);
      const base = (GOAL_PROBS[pos] || 0.08);
      const ratingBonus = (p.rating || 60) / 200;
      return Math.max(0.005, base + ratingBonus);
    });
    const totalW = weights.reduce((a, b) => a + b, 0);
    let rand = Math.random() * totalW;
    let scorer = players[0];
    for (let i = 0; i < players.length; i++) {
      rand -= weights[i];
      if (rand <= 0) { scorer = players[i]; break; }
    }
    goals[scorer.id] = (goals[scorer.id] || 0) + 1;

    // Pick assister (different from scorer, weighted by assist probs)
    const assistCandidates = players.filter(p => p.id !== scorer.id);
    if (assistCandidates.length > 0 && Math.random() < 0.75) {
      const aw = assistCandidates.map(p => {
        const pos = normPos(p.position);
        return Math.max(0.005, (ASSIST_PROBS[pos] || 0.08) + (p.rating || 60) / 300);
      });
      const totalAW = aw.reduce((a, b) => a + b, 0);
      let aRand = Math.random() * totalAW;
      let assister = assistCandidates[0];
      for (let i = 0; i < assistCandidates.length; i++) {
        aRand -= aw[i];
        if (aRand <= 0) { assister = assistCandidates[i]; break; }
      }
      assists[assister.id] = (assists[assister.id] || 0) + 1;
    }
  }
  return { goals, assists };
}

function initPlayerStats(players: Player[]): TournamentPlayerStats[] {
  return players.map(p => ({
    playerId: p.id,
    playerName: p.name,
    position: p.position,
    rating: p.rating || 60,
    goals: 0, assists: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0,
  }));
}

/** Simulate a Liga season AND track per-player goals/assists for the user's 11 */
export function simulateSeasonWithStats(
  playerTeam: Player[], squad: Squad, allSquads: Squad[], allPlayers: Player[],
  formation: FormationConfig, teamScore: number
): TournamentResult {
  const playerStrength = teamToStrength(playerTeam, formation, 'liga');
  const opponents = allSquads
    .filter(s => s.id !== squad.id && s.playerIds.length >= 11)
    .sort(() => Math.random() - 0.5).slice(0, 27); // 28 equipos totales (Liga Profesional)
  const allNames = [squad.label, ...opponents.map(o => o.label)];
  const strengthByTeam: Record<string, TeamStrength> = {};
  strengthByTeam[squad.label] = playerStrength;
  opponents.forEach(o => {
    const p = getSquadPlayers(o, allPlayers).slice(0, 11);
    strengthByTeam[o.label] = p.length >= 11
      ? teamToStrength(p, formations['4-3-3'], 'liga')
      : { attack: 55, midfield: 55, defense: 55, goalkeeper: 55, chemistry: 40, overall: 55 };
  });

  interface LigaTeam { name: string; pts: number; gf: number; ga: number; w: number; d: number; l: number; form: string[] }
  const teams: LigaTeam[] = allNames.map(n => ({ name: n, pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, form: [] }));

  const playerStats = initPlayerStats(playerTeam);
  const statsMap: Record<string, TournamentPlayerStats> = {};
  playerStats.forEach(ps => { statsMap[ps.playerId] = ps; });
  const chronicles: MatchChronicle[] = [];
  const rounds: import('./types').RoundMatch[] = [];

  // Berger Round-Robin Scheduling
  const numTeams = allNames.length;
  const numRounds = numTeams - 1;
  const matchesPerRound = numTeams / 2;

  for (let r = 0; r < numRounds; r++) {
    const roundMatches: import('./types').ScheduleMatch[] = [];
    for (let i = 0; i < matchesPerRound; i++) {
      const homeIdx = (r + i) % (numTeams - 1);
      let awayIdx = (numTeams - 1 - i + r) % (numTeams - 1);
      if (i === 0) awayIdx = numTeams - 1;

      const homeName = allNames[homeIdx];
      const awayName = allNames[awayIdx];

      // Alternar localía
      const h = (r + i) % 2 === 0 ? homeName : awayName;
      const a = (r + i) % 2 === 0 ? awayName : homeName;

      const hs = strengthByTeam[h] || { attack: 55, midfield: 55, defense: 55, goalkeeper: 55, chemistry: 50, overall: 55 };
      const as_ = strengthByTeam[a] || { attack: 55, midfield: 55, defense: 55, goalkeeper: 55, chemistry: 50, overall: 55 };
      const { homeGoals: hg, awayGoals: ag } = simulateMatchGoals(hs, as_);
      const isPlayerHome = h === squad.label;
      const isPlayerAway = a === squad.label;

      if (isPlayerHome || isPlayerAway) {
        const myGoals = isPlayerHome ? hg : ag;
        const oppGoals = isPlayerHome ? ag : hg;
        const { goals, assists } = myGoals > 0
          ? distributeGoalsAmongPlayers(playerTeam, myGoals, formation)
          : { goals: {}, assists: {} };
        const { chronicle, discipline } = buildMatchChronicle({
          opponent: isPlayerHome ? a : h,
          isHome: isPlayerHome,
          myGoals, oppGoals,
          goalsByPlayer: goals, assistsByPlayer: assists,
          team: playerTeam,
          roundLabel: `Fecha ${r + 1}`,
        });
        chronicles.push(chronicle);
        playerTeam.forEach(p => {
          if (statsMap[p.id]) {
            statsMap[p.id].goals += (goals as Record<string, number>)[p.id] || 0;
            statsMap[p.id].assists += (assists as Record<string, number>)[p.id] || 0;
            statsMap[p.id].matchesPlayed += 1;
            if (discipline.yellows.includes(p.id)) statsMap[p.id].yellowCards += 1;
            if (discipline.reds.includes(p.id)) statsMap[p.id].redCards += 1;
          }
        });
      }

      // Update league table teams data
      const homeTeam = teams.find(t => t.name === h)!;
      const awayTeam = teams.find(t => t.name === a)!;
      homeTeam.gf += hg; homeTeam.ga += ag; awayTeam.gf += ag; awayTeam.ga += hg;
      if (hg > ag) { homeTeam.pts += 3; homeTeam.w++; awayTeam.l++; homeTeam.form.push('V'); awayTeam.form.push('D'); }
      else if (hg < ag) { awayTeam.pts += 3; awayTeam.w++; homeTeam.l++; homeTeam.form.push('D'); awayTeam.form.push('V'); }
      else { homeTeam.pts++; awayTeam.pts++; homeTeam.d++; awayTeam.d++; homeTeam.form.push('E'); awayTeam.form.push('E'); }
      if (homeTeam.form.length > 5) homeTeam.form.shift();
      if (awayTeam.form.length > 5) awayTeam.form.shift();

      roundMatches.push({ home: h, away: a, homeGoals: hg, awayGoals: ag, isPlayerHome });
    }
    rounds.push({ round: `Fecha ${r + 1}`, matches: roundMatches });
  }

  const sorted = [...teams].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
  const playerPos = sorted.findIndex(t => t.name === squad.label) + 1;
  const champion = sorted[0].name;
  const finalStats = Object.values(statsMap);
  const topScorers = [...finalStats].sort((a, b) => b.goals - a.goals || b.assists - a.assists);
  const topAssisters = [...finalStats].sort((a, b) => b.assists - a.assists || b.goals - a.goals);
  const schedule = rounds.flatMap(r => r.matches);

  return {
    type: 'liga',
    table: sorted,
    playerPos,
    champion,
    isChampion: champion === squad.label,
    playerStats: finalStats,
    topScorers,
    topAssisters,
    schedule,
    rounds,
    teamLabel: squad.label,
    formation: formation.id,
    teamScore,
    chronicle: chronicles,
  };
}

/** Simulate Copa Argentina AND track per-player goals/assists */
export function simulateCopaWithStats(
  playerTeam: Player[], squad: Squad, allSquads: Squad[], allPlayers: Player[],
  formation: FormationConfig, teamScore: number
): TournamentResult {
  const playerStrength = teamToStrength(playerTeam, formation, 'copa');
  const opponents = allSquads.filter(s => s.id !== squad.id && s.playerIds.length >= 11)
    .sort(() => Math.random() - 0.5).slice(0, 31);
  const names = [squad.label, ...opponents.map(o => o.label)];
  const strengthByTeam: Record<string, TeamStrength> = {};
  strengthByTeam[squad.label] = playerStrength;
  opponents.forEach(o => {
    const p = getSquadPlayers(o, allPlayers).slice(0, 11);
    strengthByTeam[o.label] = p.length >= 11
      ? teamToStrength(p, formations['4-3-3'], 'copa')
      : { attack: 50, midfield: 50, defense: 50, goalkeeper: 50, chemistry: 35, overall: 50 };
  });

  const roundNames = ['32avos', '16avos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'];
  const rounds: import('./types').RoundMatch[] = [];
  let alive = [...names]; let eliminated = false; let eliminatedRound = '';

  const playerStats = initPlayerStats(playerTeam);
  const statsMap: Record<string, TournamentPlayerStats> = {};
  playerStats.forEach(ps => { statsMap[ps.playerId] = ps; });
  const chronicles: MatchChronicle[] = [];

  for (let r = 0; r < roundNames.length && alive.length > 1; r++) {
    const matches: import('./types').ScheduleMatch[] = [];
    const next: string[] = [];
    for (let i = 0; i < alive.length; i += 2) {
      if (i + 1 >= alive.length) { next.push(alive[i]); continue; }
      const home = alive[i], away = alive[i + 1];
      const hs = strengthByTeam[home] || { attack: 55, midfield: 55, defense: 55, goalkeeper: 55, chemistry: 45, overall: 55 };
      const as_ = strengthByTeam[away] || { attack: 55, midfield: 55, defense: 55, goalkeeper: 55, chemistry: 45, overall: 55 };
      const { homeGoals: hg, awayGoals: ag } = simulateMatchGoals(hs, as_);
      let penalties: string | undefined;
      let winner = home;
      if (hg === ag) {
        let ph = Math.floor(Math.random() * 5) + 1;
        let pa = Math.floor(Math.random() * 5) + 1;
        while (ph === pa) { ph += Math.random() > 0.5 ? 1 : 0; pa += Math.random() > 0.5 ? 1 : 0; }
        penalties = Math.min(ph, 5) + '-' + Math.min(pa, 5);
        winner = ph > pa ? home : away;
      } else { winner = hg > ag ? home : away; }

      // Track player stats for user's games
      const isPlayerHome = home === squad.label;
      const isPlayerAway = away === squad.label;
      if (isPlayerHome || isPlayerAway) {
        const myGoals = isPlayerHome ? hg : ag;
        const oppGoals = isPlayerHome ? ag : hg;
        const { goals, assists } = myGoals > 0
          ? distributeGoalsAmongPlayers(playerTeam, myGoals, formation)
          : { goals: {}, assists: {} };
        const { chronicle, discipline } = buildMatchChronicle({
          opponent: isPlayerHome ? away : home,
          isHome: isPlayerHome,
          myGoals, oppGoals,
          goalsByPlayer: goals, assistsByPlayer: assists,
          team: playerTeam,
          penalties,
          roundLabel: roundNames[r],
        });
        chronicles.push(chronicle);
        playerTeam.forEach(p => {
          if (statsMap[p.id]) {
            statsMap[p.id].goals += (goals as Record<string, number>)[p.id] || 0;
            statsMap[p.id].assists += (assists as Record<string, number>)[p.id] || 0;
            statsMap[p.id].matchesPlayed += 1;
            if (discipline.yellows.includes(p.id)) statsMap[p.id].yellowCards += 1;
            if (discipline.reds.includes(p.id)) statsMap[p.id].redCards += 1;
          }
        });
      }

      matches.push({ home, away, homeGoals: hg, awayGoals: ag, isPlayerHome, penalties });
      next.push(winner);
      if ((home === squad.label || away === squad.label) && winner !== squad.label) {
        eliminated = true; eliminatedRound = roundNames[r];
      }
    }
    rounds.push({ round: roundNames[r], matches });
    alive = next;
  }

  const finalStats = Object.values(statsMap);
  const champion = alive[0];
  return {
    type: 'copa',
    champion,
    isChampion: champion === squad.label,
    playerStats: finalStats,
    topScorers: [...finalStats].sort((a, b) => b.goals - a.goals),
    topAssisters: [...finalStats].sort((a, b) => b.assists - a.assists),
    rounds,
    eliminated,
    eliminatedRound,
    teamLabel: squad.label,
    formation: formation.id,
    teamScore,
    chronicle: chronicles,
  };
}

// ═══════════════════════════════════════════════════════════════
// PITY SYSTEM — smart squad selection
// ═══════════════════════════════════════════════════════════════
export const PITY_LOW_THRESHOLD = 60;   // rating considered "low"
export const PITY_GOOD_THRESHOLD = 72;  // rating considered "good" for pity

/**
 * Given a list of eligible squads and the current pity state,
 * returns a squad with boosted probability towards high-rated squads
 * when pity is active.
 */
export function spinSquadWithPity(
  eligible: Squad[], allPlayers: Player[], pity: { consecutiveLow: number; pityActive: boolean }
): Squad {
  if (eligible.length === 0) throw new Error('No eligible squads');
  if (eligible.length === 1) return eligible[0];

  // Compute avg squad rating for each eligible squad
  const withRating = eligible.map(sq => {
    const ps = allPlayers.filter(p => sq.playerIds.includes(p.id));
    const avg = ps.length > 0 ? ps.reduce((s, p) => s + (p.rating || 55), 0) / ps.length : 55;
    return { sq, avg };
  });

  // If pity is active (2+ consecutive low picks), boost squads with avg > 68
  const isPityActive = pity.consecutiveLow >= 2;
  if (isPityActive) {
    const goodSquads = withRating.filter(x => x.avg >= 68);
    if (goodSquads.length > 0) {
      // 65% chance to pick from good squads
      if (Math.random() < 0.65) {
        const pick = goodSquads[Math.floor(Math.random() * goodSquads.length)];
        return pick.sq;
      }
    }
  } else if (pity.consecutiveLow === 1) {
    // 1 consecutive low → 30% chance to get a decent squad
    const decentSquads = withRating.filter(x => x.avg >= 62);
    if (decentSquads.length > 0 && Math.random() < 0.30) {
      return decentSquads[Math.floor(Math.random() * decentSquads.length)].sq;
    }
  }

  // Normal random pick
  return eligible[Math.floor(Math.random() * eligible.length)];
}

/** Update pity state after a player is picked */
export function updatePity(
  current: { consecutiveLow: number; lastRatings: number[]; pityActive: boolean },
  pickedRating: number
): { consecutiveLow: number; lastRatings: number[]; pityActive: boolean } {
  const newLast = [pickedRating, ...current.lastRatings].slice(0, 5);
  const isLow = pickedRating <= PITY_LOW_THRESHOLD;
  const newConsec = isLow ? current.consecutiveLow + 1 : 0;
  return {
    consecutiveLow: newConsec,
    lastRatings: newLast,
    pityActive: newConsec >= 2,
  };
}

