// ═══════════════════════════════════════════════════════════════
// PERSISTENT STORAGE — récords de por vida + wrappers de claves legacy
// ═══════════════════════════════════════════════════════════════
import { z } from 'zod';
import type { Player, TournamentResult } from './types';

export const LIFETIME_KEY = 'ligastats_lifetime_v1';
export const SCORES_KEY = 'ligastats_scores';
export const LAST_RESULT_KEY = 'ligastats_result';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const lifetimeStatsSchema = z.object({
  version: z.literal(1),
  draftsCompleted: z.number().int().nonnegative(),
  simsPlayed: z.number().int().nonnegative(),
  titles: z.number().int().nonnegative(),
  bestTeamScore: z.number().nonnegative(),
  biggestWin: z.object({
    score: z.string(),
    rival: z.string(),
    type: z.enum(['liga', 'copa']),
    date: z.string(),
  }).nullable(),
  bestPlayer: z.object({
    playerId: z.string(),
    playerName: z.string(),
    rating: z.number(),
  }).nullable(),
  playerTotals: z.record(z.object({
    name: z.string(),
    goals: z.number(),
    assists: z.number(),
    sims: z.number(),
  })),
});

export type LifetimeStats = z.infer<typeof lifetimeStatsSchema>;

function defaultStorage(): StorageLike | undefined {
  return typeof window !== 'undefined' ? window.localStorage : undefined;
}

export function defaultLifetimeStats(): LifetimeStats {
  return {
    version: 1,
    draftsCompleted: 0,
    simsPlayed: 0,
    titles: 0,
    bestTeamScore: 0,
    biggestWin: null,
    bestPlayer: null,
    playerTotals: {},
  };
}

export function loadLifetimeStats(storage: StorageLike | undefined = defaultStorage()): LifetimeStats {
  if (!storage) return defaultLifetimeStats();
  try {
    const raw = storage.getItem(LIFETIME_KEY);
    if (!raw) return defaultLifetimeStats();
    const parsed = lifetimeStatsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : defaultLifetimeStats();
  } catch {
    return defaultLifetimeStats();
  }
}

export function saveLifetimeStats(stats: LifetimeStats, storage: StorageLike | undefined = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(LIFETIME_KEY, JSON.stringify(stats));
  } catch {
    // storage lleno o bloqueado: no romper el juego
  }
}

/** Mejor victoria del usuario dentro de un torneo (liga: schedule completo; copa: rounds). */
export function extractBiggestWin(result: TournamentResult): { score: string; rival: string } | null {
  const matches = result.type === 'liga'
    ? (result.schedule || [])
    : (result.rounds || []).flatMap(r => r.matches);
  let best: { score: string; rival: string; diff: number } | null = null;
  for (const m of matches) {
    const isHome = m.home === result.teamLabel;
    const isAway = m.away === result.teamLabel;
    if (!isHome && !isAway) continue;
    const gf = isHome ? m.homeGoals : m.awayGoals;
    const ga = isHome ? m.awayGoals : m.homeGoals;
    const diff = gf - ga;
    if (diff > 0 && (!best || diff > best.diff)) {
      best = { score: `${gf}-${ga}`, rival: isHome ? m.away : m.home, diff };
    }
  }
  return best ? { score: best.score, rival: best.rival } : null;
}

/** Registra un draft completado (11 armado). Puro: devuelve estado nuevo. */
export function applyDraftCompleted(stats: LifetimeStats, team: Player[], teamScore: number): LifetimeStats {
  const next: LifetimeStats = { ...stats, draftsCompleted: stats.draftsCompleted + 1 };
  if (teamScore > next.bestTeamScore) next.bestTeamScore = teamScore;
  for (const p of team) {
    const rating = p.rating || 60;
    if (!next.bestPlayer || rating > next.bestPlayer.rating) {
      next.bestPlayer = { playerId: p.id, playerName: p.name, rating };
    }
  }
  return next;
}

/** Acumula un torneo simulado en los récords. Puro: devuelve estado nuevo. */
export function applyTournament(stats: LifetimeStats, result: TournamentResult): LifetimeStats {
  const next: LifetimeStats = {
    ...stats,
    simsPlayed: stats.simsPlayed + 1,
    titles: stats.titles + (result.isChampion ? 1 : 0),
    playerTotals: { ...stats.playerTotals },
  };
  for (const ps of result.playerStats) {
    const prev = next.playerTotals[ps.playerId] || { name: ps.playerName, goals: 0, assists: 0, sims: 0 };
    next.playerTotals[ps.playerId] = {
      name: ps.playerName,
      goals: prev.goals + ps.goals,
      assists: prev.assists + ps.assists,
      sims: prev.sims + 1,
    };
  }
  const win = extractBiggestWin(result);
  if (win) {
    const [gf, ga] = win.score.split('-').map(Number);
    const prevDiff = next.biggestWin
      ? Number(next.biggestWin.score.split('-')[0]) - Number(next.biggestWin.score.split('-')[1])
      : -1;
    if (gf - ga > prevDiff) {
      next.biggestWin = { ...win, type: result.type, date: new Date().toISOString().slice(0, 10) };
    }
  }
  return next;
}

// ── Claves legacy (mismo formato que hoy) ──

/** Agrega una entrada al leaderboard local (reemplaza el bloque inline de results). */
export function appendScore(entry: unknown, storage: StorageLike | undefined = defaultStorage()): void {
  if (!storage) return;
  try {
    const raw = storage.getItem(SCORES_KEY);
    const existing: unknown[] = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(existing) ? existing : [];
    list.push(entry);
    storage.setItem(SCORES_KEY, JSON.stringify(list));
  } catch {
    // datos corruptos: empezar de cero
    try { storage.setItem(SCORES_KEY, JSON.stringify([entry])); } catch { /* noop */ }
  }
}

/** Guarda el último equipo armado para la página /results. */
export function saveLastResult(payload: unknown, storage: StorageLike | undefined = defaultStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(LAST_RESULT_KEY, JSON.stringify(payload));
  } catch { /* noop */ }
}
