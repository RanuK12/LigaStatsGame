// LigaStatsGame - Tipos TypeScript v2 (Squad-by-year model)
import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// SCHEMAS (Zod)
// ═══════════════════════════════════════════════════════════════
export const positionSchema = z.enum(['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF', 'LM', 'RM', 'LWB', 'RWB']);

export const clubSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  founded: z.number(),
  stadium: z.string(),
  city: z.string(),
  colors: z.array(z.string()).nonempty(),
  titles: z.number().int().nonnegative(),
  Libertadores: z.number().int().nonnegative(),
  era: z.array(z.string()).nonempty(),
  nickname: z.string(),
});

export const playerClubSchema = z.object({
  id: z.string(),
  name: z.string(),
  years: z.string(),
});

export const trophySchema = z.object({
  competition: z.string(),
  year: z.string(),
  club: z.string(),
});

export const playerSchema = z.object({
  id: z.string(),
  name: z.string(),
  fullName: z.string(),
  birthDate: z.string(),
  position: positionSchema,
  positions: z.array(positionSchema).nonempty(),
  nationality: z.string(),
  height: z.number().positive(),
  weight: z.number().positive(),
  preferredFoot: z.string(),
  clubs: z.array(playerClubSchema).nonempty(),
  capsNationalTeam: z.number().int().nonnegative(),
  goalsNationalTeam: z.number().int().nonnegative(),
  capsClub: z.number().int().nonnegative(),
  goalsClub: z.number().int().nonnegative(),
  assistsClub: z.number().int().nonnegative(),
  trophies: z.array(trophySchema),
  image: z.string(),
  marketValue: z.string(),
  activeYears: z.string(),
  decade: z.string(),
  rating: z.number().multipleOf(0.1).nonnegative(),
  legendary: z.boolean(),
});

export const squadSchema = z.object({
  id: z.string(),
  clubId: z.string(),
  season: z.string(),
  competition: z.string(),
  label: z.string(),
  playerIds: z.array(z.string()).nonempty(),
});

export const formatSchema = z.enum(['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '4-2-4']);

export type Position = z.infer<typeof positionSchema>;
export type Club = z.infer<typeof clubSchema>;
export type Player = z.infer<typeof playerSchema>;
export type Squad = z.infer<typeof squadSchema>;
export type Formation = z.infer<typeof formatSchema>;

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
