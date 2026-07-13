// ═══════════════════════════════════════════════════════════════
// MATCH CHRONICLE — relatos textuales dinámicos de los partidos del usuario
// ═══════════════════════════════════════════════════════════════
import type { Player } from './types';
import { normPos } from './positions';

export type GoalVariant = 'jugada' | 'golazo' | 'tiro-libre' | 'penal' | 'cabezazo' | 'contra';

export interface MatchEvent {
  minute: number;
  team: 'propio' | 'rival';
  type: 'inicio' | 'gol' | 'atajada' | 'amarilla' | 'roja' | 'entretiempo' | 'penales' | 'final';
  goalVariant?: GoalVariant;
  playerId?: string;
  playerName?: string;
  text: string;
}

export interface MatchChronicle {
  opponent: string;
  isHome: boolean;
  myGoals: number;
  oppGoals: number;
  penalties?: string;
  roundLabel?: string;
  events: MatchEvent[];
}

/** Tarjetas decididas por el builder: única fuente de verdad para stats y relato */
export interface MatchDiscipline {
  yellows: string[];  // playerIds
  reds: string[];     // playerIds
}

export interface BuildChronicleInput {
  opponent: string;
  isHome: boolean;
  myGoals: number;
  oppGoals: number;
  goalsByPlayer: Record<string, number>;
  assistsByPlayer: Record<string, number>;
  team: Player[];
  penalties?: string;
  roundLabel?: string;
}

const GOAL_TEMPLATES: Record<GoalVariant, string[]> = {
  jugada: [
    '¡GOL de {jugador}! Definió cruzado tras una gran jugada colectiva',
    '¡GOL! {jugador} apareció solo en el área y no perdonó',
    '¡Gol de {jugador}! Pura potencia para vencer al arquero',
  ],
  golazo: [
    '¡GOLAZO de {jugador}! La clavó en el ángulo desde afuera del área',
    '¡Qué GOLAZO de {jugador}! Zurdazo imposible para el arquero',
    '¡GOLAZO! {jugador} se sacó a dos de encima y la picó por arriba',
  ],
  'tiro-libre': [
    '¡GOLAZO de tiro libre de {jugador}! La colgó del ángulo',
    '¡GOL de {jugador}! Tiro libre perfecto por encima de la barrera',
  ],
  penal: [
    '¡GOL de penal de {jugador}! Cruzado, imposible para el arquero',
    '¡GOL! {jugador} la picó desde los doce pasos. Frialdad total',
  ],
  cabezazo: [
    '¡GOL de cabeza de {jugador}! Ganó en las alturas tras el centro',
    '¡GOL! {jugador} la peinó de cabeza al primer palo',
  ],
  contra: [
    '¡GOL de contra de {jugador}! Salida letal en tres toques',
    '¡GOL! {jugador} definió mano a mano tras una contra fulminante',
  ],
};

const ASSIST_SUFFIX = ', tras la asistencia de {asistidor}';

const RIVAL_GOAL_TEMPLATES = [
  'Gol de {rival}. Golpe duro para nuestro equipo',
  'Descuido en defensa y {rival} no perdonó. Gol rival',
  '{rival} aprovechó el espacio y marcó. A remar de nuevo',
];

const SAVE_TEMPLATES = [
  '¡Qué atajada de {jugador}! La sacó con la punta de los dedos',
  '¡ENORME {jugador}! Mano a mano salvador para el equipo',
];

const YELLOW_TEMPLATES = [
  'Amarilla para {jugador} por una falta táctica',
  '{jugador} llegó tarde al cruce y se lleva la amarilla',
];

const RED_TEMPLATES = [
  '¡EXPULSADO {jugador}! Roja directa por una patada violenta',
  '¡Roja para {jugador}! Se va antes de tiempo y deja al equipo con uno menos',
];

// Peso de cada variante de gol según posición del goleador
const VARIANT_WEIGHTS: Record<string, Partial<Record<GoalVariant, number>>> = {
  ST: { jugada: 4, cabezazo: 3, contra: 2, penal: 1, golazo: 1 },
  CF: { jugada: 4, cabezazo: 2, contra: 2, penal: 1, golazo: 1 },
  LW: { golazo: 3, jugada: 3, contra: 3 },
  RW: { golazo: 3, jugada: 3, contra: 3 },
  CAM: { golazo: 3, 'tiro-libre': 3, jugada: 2, penal: 2 },
  CM: { golazo: 3, 'tiro-libre': 2, jugada: 2 },
  CDM: { golazo: 2, jugada: 2 },
  CB: { cabezazo: 5, jugada: 1 },
  LB: { jugada: 2, golazo: 1 },
  RB: { jugada: 2, golazo: 1 },
};
const DEFAULT_VARIANT_WEIGHTS: Partial<Record<GoalVariant, number>> = { jugada: 3, golazo: 2 };

const YELLOW_PROB = 0.08;
const RED_PROB = 0.01;

function pick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function pickVariant(position: string, rng: () => number): GoalVariant {
  const weights = VARIANT_WEIGHTS[normPos(position)] || DEFAULT_VARIANT_WEIGHTS;
  const entries = Object.entries(weights) as [GoalVariant, number][];
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [variant, w] of entries) {
    r -= w;
    if (r <= 0) return variant;
  }
  return 'jugada';
}

/** Minutos aleatorios únicos y ordenados dentro de [from, to] */
function randomMinutes(count: number, from: number, to: number, rng: () => number): number[] {
  const used = new Set<number>();
  while (used.size < count && used.size < to - from) {
    used.add(from + Math.floor(rng() * (to - from)));
  }
  return [...used].sort((a, b) => a - b);
}

function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export function buildMatchChronicle(
  input: BuildChronicleInput,
  rng: () => number = Math.random
): { chronicle: MatchChronicle; discipline: MatchDiscipline } {
  const { opponent, isHome, myGoals, oppGoals, goalsByPlayer, assistsByPlayer, team, penalties, roundLabel } = input;
  const events: MatchEvent[] = [];

  events.push({ minute: 0, team: 'propio', type: 'inicio', text: `Arranca el partido ante ${opponent}. ¡Vamos!` });

  // Goles propios: expandir gol a gol
  const myScorers: Player[] = [];
  for (const p of team) {
    for (let i = 0; i < (goalsByPlayer[p.id] || 0); i++) myScorers.push(p);
  }
  // Asistidores disponibles (para atribuir en los textos)
  const assisters: Player[] = [];
  for (const p of team) {
    for (let i = 0; i < (assistsByPlayer[p.id] || 0); i++) assisters.push(p);
  }

  const gk = team.find(p => normPos(p.position) === 'GK');

  // Tarjetas (única fuente de verdad, la sim las aplica al statsMap)
  const yellows: string[] = [];
  const reds: string[] = [];
  for (const p of team) {
    if (rng() < YELLOW_PROB) yellows.push(p.id);
    if (rng() < RED_PROB) reds.push(p.id);
  }

  // Atajadas: hasta 2 si tenemos arquero y el rival no goleó demasiado
  const saveCount = gk ? Math.min(2, Math.floor(rng() * 3)) : 0;

  const totalEvents = myScorers.length + oppGoals + yellows.length + reds.length + saveCount;
  const minutes = randomMinutes(totalEvents, 1, 90, rng);
  let mi = 0;
  const nextMinute = () => minutes[mi++] ?? Math.min(90, 1 + Math.floor(rng() * 89));

  type Pending = { minute: number; ev: MatchEvent };
  const pending: Pending[] = [];

  myScorers.forEach((scorer, i) => {
    const variant = pickVariant(scorer.position, rng);
    let text = fill(pick(GOAL_TEMPLATES[variant], rng), { jugador: scorer.name });
    const assister = assisters[i];
    if (assister && assister.id !== scorer.id && variant !== 'penal' && variant !== 'tiro-libre') {
      text += fill(ASSIST_SUFFIX, { asistidor: assister.name });
    }
    pending.push({
      minute: nextMinute(),
      ev: { minute: 0, team: 'propio', type: 'gol', goalVariant: variant, playerId: scorer.id, playerName: scorer.name, text },
    });
  });

  for (let i = 0; i < oppGoals; i++) {
    pending.push({
      minute: nextMinute(),
      ev: { minute: 0, team: 'rival', type: 'gol', text: fill(pick(RIVAL_GOAL_TEMPLATES, rng), { rival: opponent }) },
    });
  }

  for (let i = 0; i < saveCount; i++) {
    pending.push({
      minute: nextMinute(),
      ev: { minute: 0, team: 'propio', type: 'atajada', playerId: gk!.id, playerName: gk!.name, text: fill(pick(SAVE_TEMPLATES, rng), { jugador: gk!.name }) },
    });
  }

  for (const id of yellows) {
    const p = team.find(x => x.id === id)!;
    pending.push({
      minute: nextMinute(),
      ev: { minute: 0, team: 'propio', type: 'amarilla', playerId: p.id, playerName: p.name, text: fill(pick(YELLOW_TEMPLATES, rng), { jugador: p.name }) },
    });
  }
  for (const id of reds) {
    const p = team.find(x => x.id === id)!;
    pending.push({
      minute: nextMinute(),
      ev: { minute: 0, team: 'propio', type: 'roja', playerId: p.id, playerName: p.name, text: fill(pick(RED_TEMPLATES, rng), { jugador: p.name }) },
    });
  }

  pending.sort((a, b) => a.minute - b.minute);
  let htInserted = false;
  for (const { minute, ev } of pending) {
    if (!htInserted && minute > 45) {
      const partial = events.filter(e => e.type === 'gol');
      const mine = partial.filter(e => e.team === 'propio').length;
      const theirs = partial.filter(e => e.team === 'rival').length;
      events.push({ minute: 45, team: 'propio', type: 'entretiempo', text: `Entretiempo. ${isHome ? `${mine}-${theirs}` : `${theirs}-${mine}`} ante ${opponent}.` });
      htInserted = true;
    }
    events.push({ ...ev, minute });
  }
  if (!htInserted) {
    events.push({ minute: 45, team: 'propio', type: 'entretiempo', text: `Entretiempo ante ${opponent}. Partido cerrado.` });
    events.sort((a, b) => a.minute - b.minute);
  }

  if (penalties) {
    events.push({ minute: 90, team: 'propio', type: 'penales', text: `¡Definición infartante por penales! Terminó ${penalties}. Drama puro desde los doce pasos.` });
  }

  const finalScore = isHome ? `${myGoals}-${oppGoals}` : `${oppGoals}-${myGoals}`;
  const won = myGoals > oppGoals;
  const drew = myGoals === oppGoals;
  events.push({
    minute: 90,
    team: 'propio',
    type: 'final',
    text: won
      ? `¡Final del partido! Victoria ${finalScore} ante ${opponent}. Tres puntos de oro.`
      : drew
      ? `Final. Empate ${finalScore} ante ${opponent}.${penalties ? '' : ' Sabor a poco.'}`
      : `Final. Derrota ${finalScore} ante ${opponent}. A levantar la cabeza.`,
  });

  return {
    chronicle: { opponent, isHome, myGoals, oppGoals, penalties, roundLabel, events },
    discipline: { yellows, reds },
  };
}
