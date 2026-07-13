import { describe, it, expect } from 'vitest';
import {
  LIFETIME_KEY,
  SCORES_KEY,
  defaultLifetimeStats,
  loadLifetimeStats,
  saveLifetimeStats,
  applyDraftCompleted,
  applyTournament,
  extractBiggestWin,
  appendScore,
  type StorageLike,
} from '../lib/storage';
import type { Player, TournamentResult, TournamentPlayerStats } from '../lib/types';

function fakeStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
  };
}

function fakePlayer(id: string, name: string, rating: number): Player {
  return { id, name, position: 'ST', rating } as Player;
}

function fakeStats(playerId: string, goals: number, assists: number): TournamentPlayerStats {
  return { playerId, playerName: playerId, position: 'ST', rating: 80, goals, assists, yellowCards: 0, redCards: 0, matchesPlayed: 10 };
}

function ligaResult(overrides: Partial<TournamentResult> = {}): TournamentResult {
  return {
    type: 'liga',
    champion: 'Mi 11 Fantasy',
    isChampion: true,
    playerStats: [fakeStats('p1', 5, 2)],
    topScorers: [],
    topAssisters: [],
    schedule: [
      { home: 'Mi 11 Fantasy', away: 'Boca Juniors 2000', homeGoals: 4, awayGoals: 0, isPlayerHome: true },
      { home: 'River Plate 2018', away: 'Mi 11 Fantasy', homeGoals: 1, awayGoals: 3, isPlayerHome: false },
      { home: 'Racing 2001', away: 'Boca Juniors 2000', homeGoals: 9, awayGoals: 0, isPlayerHome: false },
    ],
    teamLabel: 'Mi 11 Fantasy',
    formation: '4-3-3',
    teamScore: 82,
    ...overrides,
  };
}

describe('loadLifetimeStats', () => {
  it('devuelve defaults sin storage', () => {
    expect(loadLifetimeStats(undefined)).toEqual(defaultLifetimeStats());
  });

  it('devuelve defaults con JSON corrupto', () => {
    const s = fakeStorage({ [LIFETIME_KEY]: '{no es json' });
    expect(loadLifetimeStats(s)).toEqual(defaultLifetimeStats());
  });

  it('devuelve defaults con versión desconocida', () => {
    const s = fakeStorage({ [LIFETIME_KEY]: JSON.stringify({ version: 99 }) });
    expect(loadLifetimeStats(s)).toEqual(defaultLifetimeStats());
  });

  it('round-trip guarda y carga', () => {
    const s = fakeStorage();
    const stats = { ...defaultLifetimeStats(), draftsCompleted: 3, titles: 1 };
    saveLifetimeStats(stats, s);
    expect(loadLifetimeStats(s)).toEqual(stats);
  });
});

describe('applyDraftCompleted', () => {
  it('incrementa drafts y trackea mejor jugador y score', () => {
    const team = [fakePlayer('a', 'Riquelme', 92), fakePlayer('b', 'Palermo', 88)];
    const next = applyDraftCompleted(defaultLifetimeStats(), team, 85);
    expect(next.draftsCompleted).toBe(1);
    expect(next.bestTeamScore).toBe(85);
    expect(next.bestPlayer).toEqual({ playerId: 'a', playerName: 'Riquelme', rating: 92 });
  });

  it('no baja el mejor jugador existente', () => {
    const base = applyDraftCompleted(defaultLifetimeStats(), [fakePlayer('a', 'Riquelme', 92)], 85);
    const next = applyDraftCompleted(base, [fakePlayer('b', 'Palermo', 88)], 70);
    expect(next.bestPlayer?.playerName).toBe('Riquelme');
    expect(next.bestTeamScore).toBe(85);
  });
});

describe('applyTournament', () => {
  it('acumula goles y asistencias entre torneos', () => {
    let stats = applyTournament(defaultLifetimeStats(), ligaResult());
    stats = applyTournament(stats, ligaResult({ isChampion: false, champion: 'Otro' }));
    expect(stats.simsPlayed).toBe(2);
    expect(stats.titles).toBe(1);
    expect(stats.playerTotals['p1']).toEqual({ name: 'p1', goals: 10, assists: 4, sims: 2 });
  });

  it('registra la mayor goleada', () => {
    const stats = applyTournament(defaultLifetimeStats(), ligaResult());
    expect(stats.biggestWin?.score).toBe('4-0');
    expect(stats.biggestWin?.rival).toBe('Boca Juniors 2000');
  });
});

describe('extractBiggestWin', () => {
  it('ignora partidos ajenos y derrotas en liga', () => {
    const win = extractBiggestWin(ligaResult());
    expect(win).toEqual({ score: '4-0', rival: 'Boca Juniors 2000' });
  });

  it('recorre rounds en copa', () => {
    const copa = ligaResult({
      type: 'copa',
      schedule: undefined,
      rounds: [
        { round: '32avos', matches: [{ home: 'Mi 11 Fantasy', away: 'Racing 2001', homeGoals: 5, awayGoals: 1, isPlayerHome: true }] },
        { round: '16avos', matches: [{ home: 'Velez 2011', away: 'Mi 11 Fantasy', homeGoals: 2, awayGoals: 2, isPlayerHome: false, penalties: '4-5' }] },
      ],
    });
    expect(extractBiggestWin(copa)).toEqual({ score: '5-1', rival: 'Racing 2001' });
  });

  it('devuelve null sin victorias', () => {
    const sinWins = ligaResult({
      schedule: [{ home: 'Mi 11 Fantasy', away: 'Boca Juniors 2000', homeGoals: 0, awayGoals: 2, isPlayerHome: true }],
    });
    expect(extractBiggestWin(sinWins)).toBeNull();
  });
});

describe('appendScore', () => {
  it('agrega sobre lista existente', () => {
    const s = fakeStorage({ [SCORES_KEY]: JSON.stringify([{ id: '1' }]) });
    appendScore({ id: '2' }, s);
    expect(JSON.parse(s.data[SCORES_KEY])).toHaveLength(2);
  });

  it('recupera de datos corruptos', () => {
    const s = fakeStorage({ [SCORES_KEY]: 'basura' });
    appendScore({ id: '2' }, s);
    expect(JSON.parse(s.data[SCORES_KEY])).toEqual([{ id: '2' }]);
  });
});
