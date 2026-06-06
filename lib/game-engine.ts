/**
 * LigaStatsGame v3 - Game Engine — Formato REAL Argentina
 */
import { Player, Squad, Club, Formation, FormationConfig, Position, MatchResult } from './types';

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
      { pos: 'CM', x: 20, y: 45, label: 'Med. Izq.' },
      { pos: 'CM', x: 40, y: 45, label: 'Centrocampista' },
      { pos: 'CM', x: 60, y: 45, label: 'Centrocampista' },
      { pos: 'CM', x: 80, y: 45, label: 'Med. Der.' },
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
      { pos: 'CDM', x: 35, y: 48, label: 'Centro Def.' },
      { pos: 'CDM', x: 65, y: 48, label: 'Centro Def.' },
      { pos: 'LW', x: 15, y: 28, label: 'Extremo Izq.' },
      { pos: 'CAM', x: 50, y: 28, label: 'Enganche' },
      { pos: 'RW', x: 85, y: 28, label: 'Extremo Der.' },
      { pos: 'ST', x: 50, y: 10, label: 'Delantero' },
    ],
    requirements: { GK: 1, CB: 2, LB: 1, RB: 1, CDM: 2, LW: 1, CAM: 1, RW: 1, ST: 1 },
  },
  '3-5-2': {
    id: '3-5-2', name: '3-5-2',
    positions: [
      { pos: 'GK', x: 50, y: 90, label: 'Arquero' },
      { pos: 'CB', x: 25, y: 72, label: 'Zaguero Central' },
      { pos: 'CB', x: 50, y: 72, label: 'Zaguero Central' },
      { pos: 'CB', x: 75, y: 72, label: 'Zaguero Central' },
      { pos: 'LW', x: 5, y: 42, label: 'Carrilero Izq.' },
      { pos: 'CM', x: 30, y: 45, label: 'Centrocampista' },
      { pos: 'CM', x: 50, y: 42, label: 'Volante' },
      { pos: 'CM', x: 70, y: 45, label: 'Centrocampista' },
      { pos: 'RW', x: 95, y: 42, label: 'Carrilero Der.' },
      { pos: 'ST', x: 35, y: 15, label: 'Delantero' },
      { pos: 'ST', x: 65, y: 15, label: 'Delantero' },
    ],
    requirements: { GK: 1, CB: 3, LW: 1, CM: 3, RW: 1, ST: 2 },
  },
};

export const positionCompatibility: Record<string, string[]> = {
  GK: ['GK'], CB: ['CB'], LB: ['LB', 'CB'], RB: ['RB', 'CB'],
  CDM: ['CDM', 'CM'], CM: ['CM', 'CDM', 'CAM'], CAM: ['CAM', 'CM'],
  LW: ['LW', 'LM', 'LB'], RW: ['RW', 'RM', 'RB'],
  ST: ['ST', 'CF'], CF: ['CF', 'ST'],
};

export const GAME_MODES: Record<string, { name: string; desc: string; icon: string; ratingsVisible: boolean; rerolls: number }> = {
  clasico: { name: 'Clasico', desc: 'Ratings visibles, armá el 11 ideal', icon: '⚽', ratingsVisible: true, rerolls: 0 },
  almanaque: { name: 'El Almanaque', desc: 'Ratings ocultos, gana la memoria', icon: '🧠', ratingsVisible: false, rerolls: 0 },
  liga: { name: 'Liga Argentina', desc: 'Tu 11 juega en la Liga Profesional', icon: '🏆', ratingsVisible: true, rerolls: 0 },
  'copa-argentina': { name: 'Copa Argentina', desc: 'Eliminacion directa, batacazo!', icon: '🏆', ratingsVisible: true, rerolls: 0 },
  'reto-dia': { name: 'Reto del Dia', desc: 'Combinacion fija, comparti tu score', icon: '🎯', ratingsVisible: true, rerolls: 0 },
};

export function spinSquad(squads: Squad[]): Squad {
  const valid = squads.filter(s => s.playerIds.length >= 11);
  return valid[Math.floor(Math.random() * valid.length)];
}

export function getSquadPlayers(squad: Squad, allPlayers: Player[]): Player[] {
  const pMap = new Map(allPlayers.map(p => [p.id, p]));
  return squad.playerIds.map(id => pMap.get(id)).filter(Boolean) as Player[];
}

export function canPlayHere(player: Player, requiredPos: string): boolean {
  const compat = positionCompatibility[requiredPos] || [requiredPos];
  return compat.includes(player.position) || player.positions?.some(p => compat.includes(p));
}

export function calculateTeamScore(team: (Player | null)[], formation: FormationConfig): number {
  const valid = team.filter(Boolean) as Player[];
  if (valid.length < 11) return 0;
  let score = 0;
  valid.forEach(p => { score += p.rating || 50; });
  const posCounts: Record<string, number> = {};
  valid.forEach(p => { posCounts[p.position] = (posCounts[p.position] || 0) + 1; });
  let allMet = true;
  for (const [pos, count] of Object.entries(formation.requirements)) {
    if ((posCounts[pos] || 0) < count) allMet = false;
  }
  if (allMet) score += 30;
  return Math.round(score / 11);
}

function simulateGoals(teamStr: number): number {
  const avg = Math.max(0.3, (teamStr - 50) / 25);
  let goals = 0;
  for (let i = 0; i < 5; i++) { if (Math.random() < avg * 0.2) goals++; }
  return goals;
}

interface LigaTeam { name: string; pts: number; gf: number; ga: number; w: number; d: number; l: number; form: string[] }

function playMatch(home: LigaTeam, away: LigaTeam, hStr: number, aStr: number) {
  const hg = simulateGoals(hStr);
  const ag = simulateGoals(aStr);
  home.gf += hg; home.ga += ag; away.gf += ag; away.ga += hg;
  if (hg > ag) { home.pts += 3; home.w++; away.l++; home.form.push('V'); away.form.push('D'); }
  else if (hg < ag) { away.pts += 3; away.w++; home.l++; home.form.push('D'); away.form.push('V'); }
  else { home.pts++; away.pts++; home.d++; away.d++; home.form.push('E'); away.form.push('E'); }
  if (home.form.length > 5) { home.form.shift(); away.form.shift(); }
}

function sortTable(teams: LigaTeam[]) {
  return teams.sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf);
}

export function simulateSeason(
  playerTeam: Player[], squad: Squad, allSquads: Squad[], allPlayers: Player[]
): { table: LigaTeam[]; playerPos: number; zone: string; playoff?: any[]; champion?: string } {
  const teamStr = calculateTeamScore(playerTeam, formations['4-3-3']);
  const opponents = allSquads
    .filter(s => s.id !== squad.id && s.playerIds.length >= 11)
    .sort(() => Math.random() - 0.5).slice(0, 29);
  const allNames = [squad.label, ...opponents.map(o => o.label)];
  const zoneA = allNames.slice(0, 15);
  const zoneB = allNames.slice(15);
  const playerZone = zoneA.includes(squad.label) ? zoneA : zoneB;
  const zoneName = playerZone === zoneA ? 'Zona A' : 'Zona B';
  const strengths: Record<string, number> = {};
  strengths[squad.label] = teamStr;
  opponents.forEach(o => {
    const p = getSquadPlayers(o, allPlayers).slice(0, 11);
    strengths[o.label] = p.length >= 11 ? calculateTeamScore(p, formations['4-3-3']) : 55 + Math.random() * 15;
  });
  allNames.forEach(n => { if (!strengths[n]) strengths[n] = 50 + Math.random() * 20; });
  const teams: LigaTeam[] = playerZone.map(name => ({ name, pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, form: [] }));
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      if (Math.random() < 0.55) playMatch(teams[i], teams[j], strengths[teams[i].name] + 3, strengths[teams[j].name]);
    }
  }
  const sorted = sortTable([...teams]);
  const pIdx = sorted.findIndex(t => t.name === squad.label);
  const top8 = sorted.slice(0, 8);
  let playoffResult: any[] | undefined;
  if (pIdx < 8) {
    let round = [...top8]; const plog: string[] = [];
    while (round.length > 1) {
      const next: LigaTeam[] = [];
      for (let i = 0; i < round.length; i += 2) {
        if (i + 1 >= round.length) { next.push(round[i]); continue; }
        const hg = simulateGoals(strengths[round[i].name] + 5);
        const ag = simulateGoals(strengths[round[i + 1].name]);
        plog.push(round[i].name + ' ' + hg + '-' + ag + ' ' + round[i + 1].name);
        next.push(hg >= ag ? round[i] : round[i + 1]);
      }
      round = next;
    }
    playoffResult = [{ champion: round[0].name, log: plog }];
  }
  return { table: sorted, playerPos: pIdx + 1, zone: zoneName, playoff: playoffResult, champion: sorted[0].name };
}

export function simulateCopaArgentina(
  playerTeam: Player[], squad: Squad, allSquads: Squad[], allPlayers: Player[]
): { bracket: { round: string; matches: { home: string; away: string; hg: number; ag: number; pen?: string }[] }[]; champion?: string; eliminated?: boolean; eliminatedRound?: string } {
  const teamStr = calculateTeamScore(playerTeam, formations['4-3-3']);
  const opponents = allSquads.filter(s => s.id !== squad.id && s.playerIds.length >= 11).sort(() => Math.random() - 0.5).slice(0, 31);
  const names = [squad.label, ...opponents.map(o => o.label)];
  const str: Record<string, number> = {};
  str[squad.label] = teamStr;
  opponents.forEach(o => { const p = getSquadPlayers(o, allPlayers).slice(0, 11); str[o.label] = p.length >= 11 ? calculateTeamScore(p, formations['4-3-3']) : 45 + Math.random() * 25; });
  const roundNames = ['32avos', '16avos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'];
  const bracket: { round: string; matches: { home: string; away: string; hg: number; ag: number; pen?: string }[] }[] = [];
  let alive = [...names]; let eliminated = false; let eliminatedRound = '';
  for (let r = 0; r < roundNames.length && alive.length > 1; r++) {
    const matches: { home: string; away: string; hg: number; ag: number; pen?: string }[] = [];
    const next: string[] = [];
    for (let i = 0; i < alive.length; i += 2) {
      if (i + 1 >= alive.length) { next.push(alive[i]); continue; }
      const home = alive[i], away = alive[i + 1];
      let hg = simulateGoals((str[home] || 55) + 3);
      let ag = simulateGoals(str[away] || 55);
      let pen: string | undefined;
      if (hg === ag) {
        let ph = Math.floor(Math.random() * 5) + 1;
        let pa = Math.floor(Math.random() * 5) + 1;
        while (ph === pa) { ph += Math.random() > 0.5 ? 1 : 0; pa += Math.random() > 0.5 ? 1 : 0; }
        pen = Math.min(ph, 5) + '-' + Math.min(pa, 5) + ' (pen)';
      }
      const winner = hg > ag ? home : hg < ag ? away : (pen ? (parseInt(pen.split('-')[0]) > parseInt(pen.split('-')[1]) ? home : away) : home);
      matches.push({ home, away, hg, ag, pen });
      next.push(winner);
      if ((home === squad.label || away === squad.label) && winner !== squad.label) { eliminated = true; eliminatedRound = roundNames[r]; }
    }
    bracket.push({ round: roundNames[r], matches });
    alive = next;
  }
  return { bracket, champion: alive[0], eliminated, eliminatedRound };
}

export function generateShareText(squad: Squad, score: number, formation: string): string {
  return '⚽ Mi 11 de ' + squad.label + ' | ' + formation + ' | Score: ' + score + '/99\n🇦🇷 LigaStatsGame — Armá tu 11 de la historia';
}