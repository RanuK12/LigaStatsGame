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
export const GAME_MODES: Record<string, GameModeConfig> = {
  clasico: { id: 'clasico', name: 'Clásico', description: 'Ratings visibles. Intenta superar los 100 pts.', icon: '⚽', ratingsVisible: true, rerolls: 3 },
  almanaque: { id: 'almanaque', name: 'El Almanaque', description: 'Sin estadísticas. Solo tu conocimiento.', icon: '🧠', ratingsVisible: false, rerolls: 2 },
  liga: { id: 'liga', name: 'Liga Argentina', description: 'Formato real. 2 zonas + playoffs.', icon: '🏆', ratingsVisible: true, rerolls: 3 },
  copa: { id: 'copa', name: 'Copa Argentina', description: 'Eliminación directa.', icon: '🏅', ratingsVisible: true, rerolls: 3 },
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
  const valid = team.filter(isPlayer);
  const chemistryMatches = team.reduce((acc, player, index) => {
    const slot = formation.positions[index];
    if (!player || !slot) return acc;
    if (normPos(player.position) === slot.pos) return acc + 1;
    if (player.positions?.some((pos) => normPos(pos) === slot.pos)) return acc + 1;
    return acc;
  }, 0);

  const goalkeeper = lineRating(team, formation, 'goalkeeper');
  const defense = lineRating(team, formation, 'defense');
  const midfield = lineRating(team, formation, 'midfield');
  const attack = lineRating(team, formation, 'attack');
  const chemistry = valid.length === 0 ? 0 : Math.round((chemistryMatches / Math.min(valid.length, formation.positions.length)) * 100);
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

function teamToStrength(team: Player[], formation: FormationConfig, mode: GameModeConfig['id'] = 'clasico'): TeamStrength {
  const slots: (Player | null)[] = new Array(formation.positions.length).fill(null);
  team.slice(0, formation.positions.length).forEach((player, index) => {
    slots[index] = player;
  });
  return styleModifier(mode, calculateTeamStrength(slots, formation));
}

// ═══════════════════════════════════════════════════════════════
// CORE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

// Normaliza etiquetas de posición en español a los códigos enum (defensa: datos viejos/scrapeados a
// veces traen "Mediocampista"/"Delantero" en vez de CM/ST y rompen la compatibilidad). (fix 06-29)
const POS_ALIAS: Record<string, string> = {
  Arquero: 'GK', Portero: 'GK', Defensor: 'CB', 'Defensa central': 'CB',
  'Lateral izquierdo': 'LB', 'Lateral derecho': 'RB',
  Mediocampista: 'CM', Volante: 'CM', 'Volante central': 'CDM', 'Volante defensivo': 'CDM',
  Enganche: 'CAM', Mediapunta: 'CAM',
  Delantero: 'ST', Centrodelantero: 'CF', Extremo: 'RW', 'Extremo derecho': 'RW', 'Extremo izquierdo': 'LW',
};
export function normPos(p: string): string {
  return POS_ALIAS[p] || p;
}

/**
 * Check if a player can play in a given formation slot position.
 * Uses both primary position and alternate positions array.
 */
export function canPlayHere(player: Player, requiredPos: string): boolean {
  const compat = positionCompatibility[normPos(requiredPos)] || [requiredPos];
  // Check primary position
  if (compat.includes(normPos(player.position))) return true;
  // Check alternate positions array
  if (player.positions && player.positions.length > 0) {
    return player.positions.some(p => compat.includes(normPos(p)));
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

function simulateMatchGoals(home: TeamStrength, away: TeamStrength): { homeGoals: number; awayGoals: number } {
  const homeAttack = home.attack * 0.55 + home.midfield * 0.25 + home.chemistry * 0.12 + home.overall * 0.08;
  const awayAttack = away.attack * 0.55 + away.midfield * 0.25 + away.chemistry * 0.12 + away.overall * 0.08;
  const homeDefense = home.defense * 0.55 + home.goalkeeper * 0.3 + home.chemistry * 0.15;
  const awayDefense = away.defense * 0.55 + away.goalkeeper * 0.3 + away.chemistry * 0.15;

  const homeExpected = clamp((homeAttack - awayDefense + 52) / 28, 0.35, 2.85);
  const awayExpected = clamp((awayAttack - homeDefense + 50) / 29, 0.25, 2.55);

  const homeGoals = simulateGoals(homeExpected * 18);
  const awayGoals = simulateGoals(awayExpected * 18);

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
