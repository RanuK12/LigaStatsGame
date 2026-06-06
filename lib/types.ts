// LigaStatsGame - Tipos TypeScript v2 (Squad-by-year model)

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
// SQUAD (plantel por año — el corazón del juego)
// ═══════════════════════════════════════════════════════════════
export interface Squad {
  id: string;           // e.g. "river-plate-2025" or "argentina-1986"
  clubId: string;       // e.g. "river-plate" or "argentina"
  season: string;       // e.g. "2025" or "1986"
  competition: string;  // "Liga Profesional", "Copa del Mundo", etc.
  label: string;        // "River Plate 2025", "Argentina Mundial 1986"
  playerIds: string[];  // IDs de players que forman parte del plantel
}

// ═══════════════════════════════════════════════════════════════
// JUGADOR
// ═══════════════════════════════════════════════════════════════
export type Position = 'GK' | 'CB' | 'LB' | 'RB' | 'CDM' | 'CM' | 'CAM' | 'LW' | 'RW' | 'ST' | 'CF' | 'LM' | 'RM' | 'LWB' | 'RWB';

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
  preferredFoot: string;
  clubs: PlayerClub[];
  capsNationalTeam: number;
  goalsNationalTeam: number;
  capsClub: number;
  goalsClub: number;
  assistsClub: number;
  trophies: Trophy[];
  image: string;
  marketValue: string;
  activeYears: string;
  decade: string;
  rating: number;
  legendary: boolean;
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
export type Formation = '4-3-3' | '4-4-2' | '4-2-3-1' | '3-5-2' | '4-2-4';

export interface FormationConfig {
  id: Formation;
  name: string;
  positions: { pos: Position; x: number; y: number; label: string }[];
  requirements: Record<string, number>;
}

// ═══════════════════════════════════════════════════════════════
// GAME MODES
// ═══════════════════════════════════════════════════════════════
export type GameMode = 'clasico' | 'almanaque' | 'liga' | 'reto-dia' | 'ruleta';

export interface GameModeConfig {
  id: GameMode;
  name: string;
  description: string;
  icon: string;
  ratingsVisible: boolean;
  rerollsAllowed: number;
  shareable: boolean;
}

// ═══════════════════════════════════════════════════════════════
// GAME SESSION
// ═══════════════════════════════════════════════════════════════
export interface GameSession {
  id: string;
  mode: GameMode;
  squad: Squad;
  formation: Formation;
  players: (Player | null)[];
  score: number;
  startedAt: string;
  finishedAt?: string;
}

// ═══════════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════════
export interface LeaderboardEntry {
  id: string;
  playerName: string;
  score: number;
  squadLabel: string;
  formation: Formation;
  mode: GameMode;
  date: string;
}

// ═══════════════════════════════════════════════════════════════
// SEASON SIM
// ═══════════════════════════════════════════════════════════════
export interface MatchResult {
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
  result: 'W' | 'D' | 'L';
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
  results: MatchResult[];
}
