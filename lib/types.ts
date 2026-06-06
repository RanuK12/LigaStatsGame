// LigaStatsGame - Tipos TypeScript

// ═══════════════════════════════════════════════════════════════
// CLUB
// ═══════════════════════════════════════════════════════════════
export interface Club {
  id: string;
  name: string;
  shortName: string;
  founded: number;
  stadium: string;
  city: string;
  colors: string[];
  titles: number;
  Libertadores: number;
  era: string[];
  nickname: string;
}

// ═══════════════════════════════════════════════════════════════
// JUGADOR
// ═══════════════════════════════════════════════════════════════
export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CM' | 'CDM' | 'CAM' | 'LW' | 'RW' | 'ST' | 'CF';

export interface Player {
  id: string;
  name: string;
  fullName: string;
  birthDate: string;
  position: Position;
  positions: Position[];
  nationality: string;
  height: number;
  weight: number;
  preferredFoot: 'Izquierdo' | 'Derecho' | 'Ambidiestro';
  clubs: PlayerClub[];
  capsNationalTeam: number;
  goalsNationalTeam: number;
  capsClub: number;
  goalsClub: number;
  assistsClub: number;
  trophies: Trophy[];
  image: string;
  marketValue: string; // en millones de euros
  activeYears: string;
  decade: string; // década principal: '1980s', '1990s', etc.
  rating: number; // 0-100, calculado por el sistema
  legendary: boolean; // leyenda del fútbol argentino
}

export interface PlayerClub {
  id: string;
  name: string;
  years: string;
}

export interface Trophy {
  competition: string;
  year: string;
  club: string;
}

// ═══════════════════════════════════════════════════════════════
// FORMACIÓN
// ═══════════════════════════════════════════════════════════════
export type Formation = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '5-3-2' | '4-2-4' | '3-4-3' | '4-5-1' | '5-3-2' | '4-2-4' | '3-4-3' | '4-5-1';

export interface FormationConfig {
  id: Formation;
  name: string;
  positions: { pos: Position; x: number; y: number }[];
  requirements: Record<Position, number>;
}

// ═══════════════════════════════════════════════════════════════
// PARTIDA
// ═══════════════════════════════════════════════════════════════
export interface GameSession {
  id: string;
  club: Club;
  decade: string;
  formation: Formation;
  players: (Player | null)[]; // 11 posiciones, null = vacía
  score: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  startedAt: string;
  finishedAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// QUIZ
// ═══════════════════════════════════════════════════════════════
export type QuizType = 'whois' | 'memory' | 'decade' | 'stats' | 'record';

export interface Quiz {
  id: string;
  type: QuizType;
  question: string;
  image?: string;
  options: QuizOption[];
  difficulty: 'easy' | 'medium' | 'hard';
  decade: string;
  tags: string[];
}

export interface QuizOption {
  name: string;
  correct: boolean;
  points?: number;
  stats?: {
    caps: number;
    goals: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════
export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  club: Club['id'];
  decade: string;
  formation: Formation;
  date: string;
}

// ═══════════════════════════════════════════════════════════════
// GAME RESULT
// ═══════════════════════════════════════════════════════════════
export interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeScorers: string[];
  awayScorers: string[];
  matchday: number;
}

export interface SeasonResult {
  position: number;
  points: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  matchResults: MatchResult[];
}

// ═══════════════════════════════════════════════════════════════
// GAME MODES
// ═══════════════════════════════════════════════════════════════
export type GameMode = 'legend-draft' | 'memory' | 'records' | 'decade' | 'career';

export interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
  statsVisible: boolean;
  maxPlayers: number;
  timeLimit?: number; // en segundos
}

// ═══════════════════════════════════════════════════════════════
// USUARIO
// ═══════════════════════════════════════════════════════════════
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  totalScore: number;
  gamesPlayed: number;
  gamesWon: number;
  bestScore: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}
