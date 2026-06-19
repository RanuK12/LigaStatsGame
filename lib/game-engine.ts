import { Player, Squad, Club, Formation, FormationConfig, Position, MatchResult } from './types';

// ═══════════════════════════════════════════════════════════════
// POSITION LABELS (Español)
// ═══════════════════════════════════════════════════════════════
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
// POSITION COMPATIBILITY
// ═══════════════════════════════════════════════════════════════
export const positionCompatibility: Record<string, string[]> = {
  GK: ['GK'],
  CB: ['CB'],
  LB: ['LB', 'LWB', 'CB'],
  RB: ['RB', 'RWB', 'CB'],
  LWB: ['LWB', 'LB'],
  RWB: ['RWB', 'RB'],
  CDM: ['CDM', 'CM', 'CB'],
  CM: ['CM', 'CDM', 'CAM', 'LM', 'RM'],
  CAM: ['CAM', 'CM', 'CF', 'ST'],
  LM: ['LM', 'LW', 'LB', 'CM'],
  RM: ['RM', 'RW', 'RB', 'CM'],
  LW: ['LW', 'LM', 'ST'],
  RW: ['RW', 'RM', 'ST'],
  ST: ['ST', 'CF', 'CAM'],
  CF: ['CF', 'ST', 'CAM'],
};

// ═══════════════════════════════════════════════════════════════
// GAME MODES
// ═══════════════════════════════════════════════════════════════
export const GAME_MODES: Record<string, any> = {
  clasico: { id: 'clasico', name: 'Clásico', description: 'Ratings visibles. Intenta superar los 100 pts.', icon: '⚽', ratingsVisible: true, rerolls: 3 },
  almanaque: { id: 'almanaque', name: 'El Almanaque', description: 'Sin estadísticas. Solo tu conocimiento.', icon: '🧠', ratingsVisible: false, rerolls: 2 },
  liga: { id: 'liga', name: 'Liga Argentina', description: 'Formato real. 2 zonas + playoffs.', icon: '🏆', ratingsVisible: true, rerolls: 3 },
  copa: { id: 'copa', name: 'Copa Argentina', description: 'Eliminación directa.', icon: '🏅', ratingsVisible: true, rerolls: 3 },
};

// ═══════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Check if a player can play in a given formation slot position.
 * Uses both primary position and alternate positions array.
 */
export function canPlayHere(player: Player, requiredPos: string): boolean {
  const compat = positionCompatibility[requiredPos] || [requiredPos];
  // Check primary position
  if (compat.includes(player.position)) return true;
  // Check alternate positions array
  if (player.positions && player.positions.length > 0) {
    return player.positions.some(p => compat.includes(p));
  }
  return false;
}

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
  const valid = team.filter(Boolean) as Player[];
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
  const valid = team.filter(Boolean) as Player[];
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

function simulateGoals(teamStr: number): number {
  const avg = Math.max(0.3, (teamStr - 50) / 25);
  let goals = 0;
  for (let i = 0; i < 5; i++) { if (Math.random() < avg * 0.2) goals++; }
  return goals;
}

interface LigaTeam { name: string; pts: number; gf: number; ga: number; w: number; d: number; l: number; form: string[] }

function sortTable(teams: LigaTeam[]) {
  return teams.sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
}

// ═══ MATCH-BY-MATCH SEASON SIMULATION ═══
export function simulateSeasonMatchByMatch(
  playerTeam: Player[], squad: Squad, allSquads: Squad[], allPlayers: Player[], formation: FormationConfig
): { schedule: any[]; table: LigaTeam[]; playerPos: number; champion: string } {
  const teamStr = calculateFullTeamScore(playerTeam, formation) || calculateTeamScore(playerTeam, formation);
  const opponents = allSquads
    .filter(s => s.id !== squad.id && s.playerIds.length >= 11)
    .sort(() => Math.random() - 0.5).slice(0, 29);
  const allNames = [squad.label, ...opponents.map(o => o.label)];
  const zoneA = allNames.slice(0, 15);
  const zoneB = allNames.slice(15);
  const playerZone = zoneA.includes(squad.label) ? zoneA : zoneB;

  const strengths: Record<string, number> = {};
  strengths[squad.label] = teamStr;
  opponents.forEach(o => {
    const p = getSquadPlayers(o, allPlayers).slice(0, 11);
    strengths[o.label] = p.length >= 11 ? calculateFullTeamScore(p, formations['4-3-3']) || calculateTeamScore(p, formations['4-3-3']) : 55 + Math.random() * 15;
  });
  allNames.forEach(n => { if (!strengths[n]) strengths[n] = 50 + Math.random() * 20; });

  const teams: LigaTeam[] = playerZone.map(name => ({ name, pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, form: [] }));
  const schedule: any[] = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const home = teams[i], away = teams[j];
      const hg = simulateGoals(strengths[home.name] + 3);
      const ag = simulateGoals(strengths[away.name]);
      const isPlayerHome = home.name === squad.label;
      const isPlayerAway = away.name === squad.label;
      home.gf += hg; home.ga += ag; away.gf += ag; away.ga += hg;
      if (hg > ag) { home.pts += 3; home.w++; away.l++; home.form.push('V'); away.form.push('D'); }
      else if (hg < ag) { away.pts += 3; away.w++; home.l++; home.form.push('D'); away.form.push('V'); }
      else { home.pts++; away.pts++; home.d++; away.d++; home.form.push('E'); away.form.push('E'); }
      if (home.form.length > 5) { home.form.shift(); away.form.shift(); }
      schedule.push({
        home: home.name, away: away.name,
        hg, ag,
        playerInvolved: isPlayerHome || isPlayerAway,
        isHome: isPlayerHome,
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
): { rounds: any[]; champion?: string; eliminated: boolean; eliminatedRound: string } {
  const teamStr = calculateFullTeamScore(playerTeam, formation) || calculateTeamScore(playerTeam, formation);
  const opponents = allSquads.filter(s => s.id !== squad.id && s.playerIds.length >= 11)
    .sort(() => Math.random() - 0.5).slice(0, 31);
  const names = [squad.label, ...opponents.map(o => o.label)];
  const str: Record<string, number> = {};
  str[squad.label] = teamStr;
  opponents.forEach(o => { const p = getSquadPlayers(o, allPlayers).slice(0, 11); str[o.label] = p.length >= 11 ? calculateFullTeamScore(p, formations['4-3-3']) || calculateTeamScore(p, formations['4-3-3']) : 45 + Math.random() * 25; });
  const roundNames = ['32avos', '16avos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'];
  const rounds: any[] = [];
  let alive = [...names]; let eliminated = false; let eliminatedRound = '';
  for (let r = 0; r < roundNames.length && alive.length > 1; r++) {
    const matches: any[] = [];
    const next: string[] = [];
    for (let i = 0; i < alive.length; i += 2) {
      if (i + 1 >= alive.length) { next.push(alive[i]); continue; }
      const home = alive[i], away = alive[i + 1];
      let hg = simulateGoals((str[home] || 55) + 3);
      let ag = simulateGoals(str[away] || 55);
      let penalties: string | null = null;
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
      matches.push({ home, away, hg, ag, penalties, winner });
      next.push(winner);
      if ((home === squad.label || away === squad.label) && winner !== squad.label) { eliminated = true; eliminatedRound = roundNames[r]; }
    }
    rounds.push({ round: roundNames[r], matches });
    alive = next;
  }
  return { rounds, champion: alive[0], eliminated, eliminatedRound };
}

export function generateShareText(squad: Squad, score: number, formation: string): string {
  return `⚽ Mi 11 de ${squad.label} | ${formation} | Score: ${score}/99\n🇦🇷 Liga Argentina Fans — Armá tu 11 de la historia`;
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
