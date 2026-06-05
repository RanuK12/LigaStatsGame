/**
 * LigaStatsGame - Game Engine
 * Lógica central para el modo Leyendas Draft
 */

// ═══════════════════════════════════════════════════════════════
// FORMACIONES DISPONIBLES
// ═══════════════════════════════════════════════════════════════
export const formations = {
  '4-3-3': {
    name: '4-3-3',
    positions: [
      { pos: 'GK', x: 50, y: 90, label: 'Arquero' },
      { pos: 'LB', x: 10, y: 70, label: 'Lateral Izquierdo' },
      { pos: 'CB', x: 35, y: 70, label: 'Zaguero Central' },
      { pos: 'CB', x: 65, y: 70, label: 'Zaguero Central' },
      { pos: 'RB', x: 90, y: 70, label: 'Lateral Derecho' },
      { pos: 'CDM', x: 20, y: 45, label: 'Centrocampista Defensivo' },
      { pos: 'CM', x: 50, y: 45, label: 'Centrocampista' },
      { pos: 'CAM', x: 80, y: 45, label: 'Centrocampista Ofensivo' },
      { pos: 'LW', x: 15, y: 20, label: 'Extremo Izquierdo' },
      { pos: 'ST', x: 50, y: 15, label: 'Delantero Centro' },
      { pos: 'RW', x: 85, y: 20, label: 'Extremo Derecho' },
    ],
    requirements: { GK: 1, CB: 2, LB: 1, RB: 1, CDM: 1, CM: 1, CAM: 1, LW: 1, ST: 1, RW: 1 },
  },
  '4-4-2': {
    name: '4-4-2',
    positions: [
      { pos: 'GK', x: 50, y: 90, label: 'Arquero' },
      { pos: 'LB', x: 10, y: 70, label: 'Lateral Izquierdo' },
      { pos: 'CB', x: 35, y: 70, label: 'Zaguero Central' },
      { pos: 'CB', x: 65, y: 70, label: 'Zaguero Central' },
      { pos: 'RB', x: 90, y: 70, label: 'Lateral Derecho' },
      { pos: 'LM', x: 15, y: 45, label: 'Mediocampista Izquierdo' },
      { pos: 'CM', x: 38, y: 45, label: 'Centrocampista' },
      { pos: 'CM', x: 62, y: 45, label: 'Centrocampista' },
      { pos: 'RM', x: 85, y: 45, label: 'Mediocampista Derecho' },
      { pos: 'ST', x: 35, y: 15, label: 'Delantero Centro' },
      { pos: 'ST', x: 65, y: 15, label: 'Delantero Centro' },
    ],
    requirements: { GK: 1, CB: 2, LB: 1, RB: 1, LM: 1, CM: 2, RM: 1, ST: 2 },
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: [
      { pos: 'GK', x: 50, y: 90, label: 'Arquero' },
      { pos: 'LB', x: 10, y: 70, label: 'Lateral Izquierdo' },
      { pos: 'CB', x: 35, y: 70, label: 'Zaguero Central' },
      { pos: 'CB', x: 65, y: 70, label: 'Zaguero Central' },
      { pos: 'RB', x: 90, y: 70, label: 'Lateral Derecho' },
      { pos: 'CDM', x: 35, y: 50, label: 'Centrocampista Defensivo' },
      { pos: 'CDM', x: 65, y: 50, label: 'Centrocampista Defensivo' },
      { pos: 'LW', x: 15, y: 30, label: 'Extremo Izquierdo' },
      { pos: 'CAM', x: 50, y: 30, label: 'Centrocampista Ofensivo' },
      { pos: 'RW', x: 85, y: 30, label: 'Extremo Derecho' },
      { pos: 'ST', x: 50, y: 10, label: 'Delantero Centro' },
    ],
    requirements: { GK: 1, CB: 2, LB: 1, RB: 1, CDM: 2, LW: 1, CAM: 1, RW: 1, ST: 1 },
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { pos: 'GK', x: 50, y: 90, label: 'Arquero' },
      { pos: 'CB', x: 25, y: 70, label: 'Zaguero Central' },
      { pos: 'CB', x: 50, y: 70, label: 'Zaguero Central' },
      { pos: 'CB', x: 75, y: 70, label: 'Zaguero Central' },
      { pos: 'LWB', x: 5, y: 50, label: 'Wingback Izquierdo' },
      { pos: 'CDM', x: 30, y: 45, label: 'Centrocampista Defensivo' },
      { pos: 'CM', x: 50, y: 45, label: 'Centrocampista' },
      { pos: 'CDM', x: 70, y: 45, label: 'Centrocampista Defensivo' },
      { pos: 'RWB', x: 95, y: 50, label: 'Wingback Derecho' },
      { pos: 'ST', x: 35, y: 15, label: 'Delantero Centro' },
      { pos: 'ST', x: 65, y: 15, label: 'Delantero Centro' },
    ],
    requirements: { GK: 1, CB: 3, LWB: 1, CDM: 2, CM: 1, RWB: 1, ST: 2 },
  },
  '4-2-4': {
    name: '4-2-4',
    positions: [
      { pos: 'GK', x: 50, y: 90, label: 'Arquero' },
      { pos: 'LB', x: 10, y: 70, label: 'Lateral Izquierdo' },
      { pos: 'CB', x: 35, y: 70, label: 'Zaguero Central' },
      { pos: 'CB', x: 65, y: 70, label: 'Zaguero Central' },
      { pos: 'RB', x: 90, y: 70, label: 'Lateral Derecho' },
      { pos: 'CM', x: 35, y: 45, label: 'Centrocampista' },
      { pos: 'CM', x: 65, y: 45, label: 'Centrocampista' },
      { pos: 'LW', x: 10, y: 20, label: 'Extremo Izquierdo' },
      { pos: 'ST', x: 35, y: 15, label: 'Delantero Centro' },
      { pos: 'ST', x: 65, y: 15, label: 'Delantero Centro' },
      { pos: 'RW', x: 90, y: 20, label: 'Extremo Derecho' },
    ],
    requirements: { GK: 1, CB: 2, LB: 1, RB: 1, CM: 2, LW: 1, ST: 2, RW: 1 },
  },
};

// ═══════════════════════════════════════════════════════════════
// POSICIONES COMPATIBLES
// ═══════════════════════════════════════════════════════════════
export const positionGroups: Record<string, string[]> = {
  GK: ['GK'],
  DEF: ['CB', 'LB', 'RB', 'LWB', 'RWB'],
  MID: ['CM', 'CDM', 'CAM', 'LM', 'RM'],
  FWD: ['ST', 'CF', 'LW', 'RW'],
};

// Mapa completo de compatibilidad de posiciones
export const positionCompatibility: Record<string, string[]> = {
  GK: ['GK'],
  CB: ['CB'],
  LB: ['LB', 'CB', 'LWB'],
  RB: ['RB', 'CB', 'RWB'],
  LWB: ['LWB', 'LB'],
  RWB: ['RWB', 'RB'],
  CM: ['CM', 'CDM', 'CAM', 'LM', 'RM'],
  CDM: ['CDM', 'CM', 'CB'],
  CAM: ['CAM', 'CM', 'CDM', 'CF'],
  LM: ['LM', 'LW', 'LB'],
  RM: ['RM', 'RW', 'RB'],
  LW: ['LW', 'LM', 'ST'],
  RW: ['RW', 'RM', 'ST'],
  ST: ['ST', 'CF', 'LW', 'RW'],
  CF: ['CF', 'ST', 'CAM'],
};

// ═══════════════════════════════════════════════════════════════
// CÁLCULO DE RATING
// ═══════════════════════════════════════════════════════════════
export function calculatePlayerRating(player: {
  capsClub: number;
  goalsClub: number;
  assistsClub?: number;
  capsNationalTeam: number;
  goalsNationalTeam: number;
  trophies: { competition: string }[];
  marketValue: string;
  position: string;
  decade: string;
}, targetPosition: string): number {
  let rating = 50; // Base

  // + Por partidos jugados (experiencia)
  rating += Math.min(20, player.capsClub / 30);

  // + Por goles (más para delanteros)
  const goalBonus = player.position.startsWith('ST') || player.position === 'CF' ? 0.4 : 0.2;
  rating += Math.min(15, player.goalsClub * goalBonus);

  // + Por asistencias
  rating += Math.min(5, (player.assistsClub || 0) * 0.1);

  // + Por partidos en selección (élite)
  rating += Math.min(10, player.capsNationalTeam / 10);

  // + Por goles en selección
  rating += Math.min(5, player.goalsNationalTeam * 0.3);

  // + Por títulos
  rating += Math.min(10, player.trophies.length * 1.5);

  // + Por valor de mercado
  const mv = parseFloat(player.marketValue) || 0;
  rating += Math.min(5, mv * 0.5);

  // + Bonificación por posición natural
  if (positionCompatibility[targetPosition]?.includes(player.position)) {
    rating += 3; // Jugando en su posición natural
  } else {
    rating -= 5; // Fuera de posición
  }

  // Redondear a entero
  return Math.round(Math.max(0, Math.min(100, rating)));
}

// ═══════════════════════════════════════════════════════════════
// SIMULACIÓN DE PARTIDO
// ═══════════════════════════════════════════════════════════════
export function simulateMatch(
  team1Players: { rating: number }[],
  team2Players: { rating: number }
): { team1Goals: number; team2Goals: number } {
  const team1Avg = team1Players.reduce((a, b) => a + b.rating, 0) / team1Players.length;
  const team2Avg = team2Players.rating;

  // Probabilidad basada en diferencia de rating
  const diff = team1Avg - team2Avg;
  const team1Prob = 1 / (1 + Math.exp(-diff / 20));

  // Simular goles (90 minutos, ~2.5 goles por partido en promedio)
  const team1Goals = Math.floor(Math.random() * 4 * team1Prob);
  const team2Goals = Math.floor(Math.random() * 4 * (1 - team1Prob));

  return { team1Goals, team2Goals };
}

// ═══════════════════════════════════════════════════════════════
// SIMULACIÓN DE TEMPORADA
// ═══════════════════════════════════════════════════════════════
export function simulateSeason(
  teamPlayers: { rating: number }[],
  opponentRatings: { name: string; avgRating: number }[]
): {
  position: number;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  results: { opponent: string; goalsFor: number; goalsAgainst: number; result: 'W' | 'D' | 'L' }[];
} {
  const teamAvg = teamPlayers.reduce((a, b) => a + b.rating, 0) / teamPlayers.length;

  let points = 0;
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  const results: { opponent: string; goalsFor: number; goalsAgainst: number; result: 'W' | 'D' | 'L' }[] = [];

  for (const opp of opponentRatings) {
    const diff = teamAvg - opp.avgRating;
    const teamProb = 1 / (1 + Math.exp(-diff / 20));

    // Simular goles
    const gf = Math.floor(Math.random() * 4 * teamProb);
    const ga = Math.floor(Math.random() * 4 * (1 - teamProb));

    goalsFor += gf;
    goalsAgainst += ga;

    if (gf > ga) {
      wins++;
      points += 3;
      results.push({ opponent: opp.name, goalsFor: gf, goalsAgainst: ga, result: 'W' });
    } else if (gf === ga) {
      draws++;
      points += 1;
      results.push({ opponent: opp.name, goalsFor: gf, goalsAgainst: ga, result: 'D' });
    } else {
      losses++;
      results.push({ opponent: opp.name, goalsFor: gf, goalsAgainst: ga, result: 'L' });
    }
  }

  // Calcular posición basada en puntos
  const position = Math.floor(Math.random() * 4) + 1; // Simplificado

  return {
    position,
    points,
    matchesPlayed: opponentRatings.length,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    results,
  };
}

// ═══════════════════════════════════════════════════════════════
// RULETA - ASIGNACIÓN DE CLUB + DÉCADA
// ═══════════════════════════════════════════════════════════════
export function spinWheel(clubs: any[], decades: string[]): { club: any; decade: string } {
  const randomClub = clubs[Math.floor(Math.random() * clubs.length)];
  const randomDecade = decades[Math.floor(Math.random() * decades.length)];
  return { club: randomClub, decade: randomDecade };
}

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function formatScore(score: number): string {
  if (score >= 90) return '⭐ Excelente';
  if (score >= 70) return '🔥 Muy Bueno';
  if (score >= 50) return '👍 Bueno';
  if (score >= 30) return '🤷 Regular';
  return '😐 Pobre';
}

export function getDecadeLabel(decade: string): string {
  const labels: Record<string, string> = {
    '1960s': 'Los 60',
    '1970s': 'Los 70',
    '1980s': 'Los 80',
    '1990s': 'Los 90',
    '2000s': 'Los 2000',
    '2010s': 'Los 2010',
    '2020s': 'Los 2020',
  };
  return labels[decade] || decade;
}
