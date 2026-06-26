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
  playerIds: z.array(z.string()).min(1),
});

export const formatSchema = z.enum(['4-3-3', '4-4-2', '4-2-3-1', '3-5-2']);

export type Position = z.infer<typeof positionSchema>;
export type Club = z.infer<typeof clubSchema>;
export type Player = z.infer<typeof playerSchema>;
export type Squad = z.infer<typeof squadSchema>;
export type Formation = z.infer<typeof formatSchema>;

// ═══════════════════════════════════════════════════════════════
// JUGADOR (sub‑types)
// ═══════════════════════════════════════════════════════════════
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

export interface ScheduleMatch {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
  isPlayerHome: boolean;
  penalties?: string;
}

export interface RoundMatch {
  round: string;
  matches: ScheduleMatch[];
}
