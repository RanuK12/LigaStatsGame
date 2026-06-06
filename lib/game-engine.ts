/**
 * LigaStatsGame v2 - Game Engine
 * Squad-by-year model: spin → get a plantel → pick 11 from THAT squad
 */
import { Player, Squad, Club, Formation, FormationConfig, Position, SeasonResult, MatchResult, GameMode } from './types';

// ═══════════════════════════════════════════════════════════════
// FORMACIONES
// ═══════════════════════════════════════════════════════════════
export const formations: Record<string, FormationConfig> = {
  '4-3-3': {
    id: '4-3-3', name: '4-3-3',
    positions: [
      { pos: 'GK', x: 50, y: 90, label: 'Arquero' },
      { pos: 'LB', x: 10, y: 70, label: 'Lateral Izq.' },
      { pos: 'CB', x: 35, y: 70, label: 'Zaguero Central' },
      { pos: 'CB', x: 65, y: 70, label: 'Zaguero Central' },
      { pos: 'RB', x: 90, y: 70, label: 'Lateral Der.' },
      { pos: 'CDM', x: 20, y: 45, label: 'Centro Def.' },
      { pos: 'CM', x: 50, y: 45, label: 'Centrocampista' },
      { pos: 'CAM', x: 80, y: 45, label: 'Centro Of.' },
      { pos: 'LW', x: 15, y: 20, label: 'Extremo Izq.' },
      { pos: 'ST', x: 50, y: 15, label: 'Delantero' },
      { pos: 'RW', x: 85, y: 20, label: 'Extremo Der.' },
    ],
    requirements: { GK: 1, CB: 2, LB: 1, RB: 1, CDM: 1, CM: 1, CAM: 1, LW: 1, ST: 1, RW: 1 },
  },
  '4-4-2': {
    id: '4-4-2', name: '4-4-2',
    positions: [
      { pos: 'GK', x: 50, y: 90, label: 'Arquero' },
      { pos: 'LB', x: 10, y: 70, label: 'Lateral Izq.' },
      { pos: 'CB', x: 35, y: 70, label: 'Zaguero Central' },
      { pos: 'CB', x: 65, y: 70, label: 'Zaguero Central' },
      { pos: 'RB', x: 90, y: 70, label: 'Lateral Der.' },
      { pos: 'CM', x: 25, y: 45, label: 'Centro Izq.' },
      { pos: 'CM', x: 45, y: 45, label: 'Centrocampista' },
      { pos: 'CM', x: 55, y: 45, label: 'Centrocampista' },
      { pos: 'CM', x: 75, y: 45, label: 'Centro Der.' },
      { pos: 'ST', x: 35, y: 15, label: 'Delantero' },
      { pos: 'ST', x: 65, y: 15, label: 'Delantero' },
    ],
    requirements: { GK: 1, CB: 2, LB: 1, RB: 1, CM: 4, ST: 2 },
  },
  '4-2-3-1': {
    id: '4-2-3-1', name: '4-2-3-1',
    positions: [
      { pos: 'GK', x: 50, y: 90, label: 'Arquero' },
      { pos: 'LB', x: 10, y: 70, label: 'Lateral Izq.' },
      { pos: 'CB', x: 35, y: 70, label: 'Zaguero Central' },
      { pos: 'CB', x: 65, y: 70, label: 'Zaguero Central' },
      { pos: 'RB', x: 90, y: 70, label: 'Lateral Der.' },
      { pos: 'CDM', x: 35, y: 45, label: 'Centro Def.' },
      { pos: 'CDM', x: 65, y: 45, label: 'Centro Def.' },
      { pos: 'LW', x: 15, y: 25, label: 'Extremo Izq.' },
      { pos: 'CAM', x: 50, y: 25, label: 'Enganche' },
      { pos: 'RW', x: 85, y: 25, label: 'Extremo Der.' },
      { pos: 'ST', x: 50, y: 10, label: 'Delantero' },
    ],
    requirements: { GK: 1, CB: 2, LB: 1, RB: 1, CDM: 2, LW: 1, CAM: 1, RW: 1, ST: 1 },
  },
  '3-5-2': {
    id: '3-5-2', name: '3-5-2',
    positions: [
      { pos: 'GK', x: 50, y: 90, label: 'Arquero' },
      { pos: 'CB', x: 25, y: 70, label: 'Zaguero' },
      { pos: 'CB', x: 50, y: 70, label: 'Zaguero' },
      { pos: 'CB', x: 75, y: 70, label: 'Zaguero' },
      { pos: 'CM', x: 5, y: 50, label: 'Carrilero Izq.' },
      { pos: 'CM', x: 30, y: 45, label: 'Centrocampista' },
      { pos: 'CDM', x: 50, y: 45, label: 'Centro Def.' },
      { pos: 'CM', x: 70, y: 45, label: 'Centrocampista' },
      { pos: 'CM', x: 95, y: 50, label: 'Carrilero Der.' },
      { pos: 'ST', x: 35, y: 15, label: 'Delantero' },
      { pos: 'ST', x: 65, y: 15, label: 'Delantero' },
    ],
    requirements: { GK: 1, CB: 3, CM: 4, CDM: 1, ST: 2 },
  },
  '4-2-4': {
    id: '4-2-4', name: '4-2-4',
    positions: [
      { pos: 'GK', x: 50, y: 90, label: 'Arquero' },
      { pos: 'LB', x: 10, y: 70, label: 'Lateral Izq.' },
      { pos: 'CB', x: 35, y: 70, label: 'Zaguero Central' },
      { pos: 'CB', x: 65, y: 70, label: 'Zaguero Central' },
      { pos: 'RB', x: 90, y: 70, label: 'Lateral Der.' },
      { pos: 'CM', x: 35, y: 45, label: 'Centrocampista' },
      { pos: 'CM', x: 65, y: 45, label: 'Centrocampista' },
      { pos: 'LW', x: 10, y: 20, label: 'Extremo Izq.' },
      { pos: 'ST', x: 35, y: 15, label: 'Delantero' },
      { pos: 'ST', x: 65, y: 15, label: 'Delantero' },
      { pos: 'RW', x: 90, y: 20, label: 'Extremo Der.' },
    ],
    requirements: { GK: 1, CB: 2, LB: 1, RB: 1, CM: 2, LW: 1, ST: 2, RW: 1 },
  },
};

// ═══════════════════════════════════════════════════════════════
// POSITION COMPATIBILITY
// ═══════════════════════════════════════════════════════════════
export const positionCompatibility: Record<string, string[]> = {
  GK: ['GK'], CB: ['CB'], LB: ['LB','CB'], RB: ['RB','CB'],
  CM: ['CM','CDM','CAM','LM','RM'], CDM: ['CDM','CM','CB'],
  CAM: ['CAM','CM','CF'], LW: ['LW','LM','ST'], RW: ['RW','RM','ST'],
  ST: ['ST','CF','LW','RW'], CF: ['CF','ST','CAM'],
  LWB: ['LWB','LB'], RWB: ['RWB','RB'], LM: ['LM','LW'], RM: ['RM','RW'],
};

// ═══════════════════════════════════════════════════════════════
// GAME MODES
// ═══════════════════════════════════════════════════════════════
export const GAME_MODES: Record<GameMode, { id: GameMode; name: string; desc: string; icon: string; ratingsVisible: boolean; rerolls: number }> = {
  clasico: { id: 'clasico', name: 'Clásico', desc: 'Ratings visibles, armá el 11 ideal', icon: '⚽', ratingsVisible: true, rerolls: 1 },
  almanaque: { id: 'almanaque', name: 'El Almanaque', desc: 'Ratings ocultos, gana la memoria', icon: '🧠', ratingsVisible: false, rerolls: 0 },
  'reto-dia': { id: 'reto-dia', name: 'Reto del Día', desc: 'Combinación fija, sin reroll', icon: '🎯', ratingsVisible: true, rerolls: 0 },
  liga: { id: 'liga', name: 'Liga', desc: 'Tu 11 juega 38 fechas', icon: '🏆', ratingsVisible: true, rerolls: 1 },
  ruleta: { id: 'ruleta', name: 'Ruleta', desc: 'Girá y descubrí una leyenda', icon: '🎰', ratingsVisible: true, rerolls: 0 },
};

// ═══════════════════════════════════════════════════════════════
// SPIN: elegir un squad aleatorio
// ═══════════════════════════════════════════════════════════════
export function spinSquad(squads: Squad[], filter?: { clubId?: string; competition?: string }): Squad {
  let pool = squads;
  if (filter?.clubId) pool = pool.filter(s => s.clubId === filter.clubId);
  if (filter?.competition) pool = pool.filter(s => s.competition === filter.competition);
  // Prefer squads with at least 15 players
  const good = pool.filter(s => s.playerIds.length >= 15);
  const use = good.length > 0 ? good : pool;
  return use[Math.floor(Math.random() * use.length)];
}

// ═══════════════════════════════════════════════════════════════
// GET SQUAD PLAYERS: players from a specific squad
// ═══════════════════════════════════════════════════════════════
export function getSquadPlayers(squad: Squad, allPlayers: Player[]): Player[] {
  const byId = new Map(allPlayers.map(p => [p.id, p]));
  return squad.playerIds.map(id => byId.get(id)).filter((p): p is Player => !!p);
}

// ═══════════════════════════════════════════════════════════════
// SCORE CALCULATION
// ═══════════════════════════════════════════════════════════════
export function calculateTeamScore(players: (Player | null)[], formation: FormationConfig): number {
  const filled = players.filter(Boolean) as Player[];
  if (filled.length === 0) return 0;
  
  let score = 0;
  const totalSlots = formation.positions.length;
  
  // Base: average rating * fill percentage
  const avgRating = filled.reduce((s, p) => s + p.rating, 0) / filled.length;
  const fillBonus = (filled.length / totalSlots);
  score = avgRating * fillBonus;
  
  // Position fit bonus
  let positionMatches = 0;
  formation.positions.forEach((fp, i) => {
    const player = players[i];
    if (player && positionCompatibility[fp.pos]?.includes(player.position)) {
      positionMatches++;
      score += 2;
    }
  });
  
  // Legendary bonus
  const legends = filled.filter(p => p.legendary).length;
  score += legends * 3;
  
  // Perfect XI bonus
  if (filled.length === totalSlots) score += 10;
  
  return Math.round(Math.min(100, Math.max(0, score)));
}

// ═══════════════════════════════════════════════════════════════
// SEASON SIMULATION
// ═══════════════════════════════════════════════════════════════
export function simulateSeason(teamPlayers: Player[], opponentPool: Player[][]): SeasonResult {
  const teamAvg = teamPlayers.reduce((a, p) => a + p.rating, 0) / teamPlayers.length;
  
  let points = 0, wins = 0, draws = 0, losses = 0, gf = 0, ga = 0;
  const results: MatchResult[] = [];
  
  const opponents = opponentPool.slice(0, 38);
  
  for (const opp of opponents) {
    const oppAvg = opp.reduce((a, p) => a + p.rating, 0) / Math.max(1, opp.length);
    const diff = teamAvg - oppAvg;
    const teamProb = 1 / (1 + Math.exp(-diff / 15));
    
    const goalsFor = Math.floor(Math.random() * 5 * teamProb);
    const goalsAgainst = Math.floor(Math.random() * 5 * (1 - teamProb));
    
    gf += goalsFor;
    ga += goalsAgainst;
    
    if (goalsFor > goalsAgainst) { wins++; points += 3; results.push({ opponent: '', goalsFor, goalsAgainst, result: 'W' }); }
    else if (goalsFor === goalsAgainst) { draws++; points += 1; results.push({ opponent: '', goalsFor, goalsAgainst, result: 'D' }); }
    else { losses++; results.push({ opponent: '', goalsFor, goalsAgainst, result: 'L' }); }
  }
  
  // Position based on points
  const maxPts = 38 * 3;
  const pct = points / maxPts;
  const position = Math.max(1, Math.round(28 * (1 - pct) + (Math.random() * 3 - 1)));
  
  return { position, points, matchesPlayed: opponents.length, wins, draws, losses, goalsFor: gf, goalsAgainst: ga, results };
}

// ═══════════════════════════════════════════════════════════════
// DAILY CHALLENGE (seeded random by date)
// ═══════════════════════════════════════════════════════════════
export function getDailyChallenge(squads: Squad[]): Squad {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const idx = seed % squads.length;
  const good = squads.filter(s => s.playerIds.length >= 11);
  return good[idx % good.length];
}

// ═══════════════════════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════════════════════
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatScore(score: number): string {
  if (score >= 90) return '⭐ Excelente';
  if (score >= 70) return '🔥 Muy Bueno';
  if (score >= 50) return '👍 Bueno';
  return '🤷 Regular';
}

export function generateShareText(squad: Squad, score: number, formation: string): string {
  return `⚽ ${squad.label}\n📐 ${formation}\n🏆 Score: ${score}/100\n\nLigaStatsGame - El Draft del Fútbol Argentino 🇦🇷`;
}
