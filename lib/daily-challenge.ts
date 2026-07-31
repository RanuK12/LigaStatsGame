// Reto diario determinístico: todos ven el MISMO reto cada día y rota solo al cambiar el día.
// La selección se deriva de la fecha (YYYY-MM-DD) con un hash estable, sin backend.

import type { Player } from './types'

export type Difficulty = "Fácil" | "Media" | "Difícil" | "Leyenda"

export interface DailyChallenge {
  id: string
  title: string
  rule: string
  icon: string
  difficulty: Difficulty
  /**
   * El filtro que se aplica AL BOMBO. Sin esto el reto es un título y nada más: durante meses los
   * catorce retos produjeron exactamente el mismo draft aleatorio, así que no había nada que
   * comparar entre dos personas y compartir el resultado no significaba nada.
   *
   * Cada filtro de acá está medido contra data/players.json: tiene que poder llenar los once
   * puestos de cualquier formación. Los retos que la base no puede sostener —campeones del mundo
   * (10 jugadores con el trofeo cargado), campeones de Libertadores (11), década del 80 (8)— no
   * están: prometer un plantel que no se puede armar es peor que no tener el reto.
   */
  filtro: (p: Player) => boolean
}

const enClubes = (...ids: string[]) => (p: Player) =>
  (p.clubs || []).some((c) => ids.includes(c.id))

// Pool temático. Cada uno viene con su regla aplicable; agregar más solo amplía la variedad,
// pero el filtro nuevo hay que medirlo antes: si no llena los once puestos, rompe el draft.
export const CHALLENGES: DailyChallenge[] = [
  {
    id: "clasico-eterno", title: "Clásico Eterno", icon: "🔵🔴", difficulty: "Fácil",
    rule: "Solo jugadores que pasaron por Boca o por River.",
    filtro: enClubes("boca-juniors", "river-plate"),
  },
  {
    id: "rosario", title: "Orgullo Rosarino", icon: "🌟", difficulty: "Media",
    rule: "Solo Central y Newell's. La ciudad del gol.",
    filtro: enClubes("rosario-central", "newells"),
  },
  {
    id: "cordoba", title: "Furia Cordobesa", icon: "🏔️", difficulty: "Media",
    rule: "Solo Talleres, Belgrano e Instituto. Córdoba manda.",
    filtro: enClubes("talleres-cba", "belgrano", "instituto"),
  },
  {
    id: "avellaneda", title: "Clásico de Avellaneda", icon: "🔴🔵", difficulty: "Media",
    rule: "Solo Independiente y Racing. El barrio del rey de copas.",
    filtro: enClubes("independiente", "racing-club"),
  },
  {
    id: "zurdos", title: "Zurdos Mágicos", icon: "🦵", difficulty: "Difícil",
    rule: "Solo jugadores de pie zurdo. La zurda manda.",
    filtro: (p) => p.preferredFoot === "Izquierdo",
  },
  {
    id: "extranjeros", title: "Los que Vinieron", icon: "✈️", difficulty: "Media",
    rule: "Solo extranjeros que hicieron historia en el fútbol argentino.",
    filtro: (p) => !!p.nationality && p.nationality !== "Argentina",
  },
  {
    id: "noventas", title: "Puro Noventa", icon: "📼", difficulty: "Media",
    rule: "Solo cracks de los años noventa. Fútbol de otra época.",
    filtro: (p) => p.decade === "1990s",
  },
  {
    id: "dosmiles", title: "Generación 2000", icon: "💿", difficulty: "Media",
    rule: "Solo jugadores que brillaron en los 2000.",
    filtro: (p) => p.decade === "2000s",
  },
]

// Epoch del juego para numerar los retos (Reto #N).
const EPOCH = Date.UTC(2026, 0, 1)

// Fecha local en YYYY-MM-DD (no UTC, para no correr el día).
export function localYmd(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Hash estable de un string (FNV-1a de 32 bits).
function hashStr(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// Reto de un día concreto (determinístico).
export function challengeForDate(ymd: string): DailyChallenge {
  return CHALLENGES[hashStr(ymd) % CHALLENGES.length]
}

// Número de reto desde el epoch (Reto #N).
export function challengeNumber(d: Date = new Date()): number {
  const local = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  return Math.floor((local.getTime() - EPOCH) / 86400000) + 1
}

// Milisegundos hasta la próxima medianoche local (para el countdown).
export function msUntilNextDay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0)
  return next.getTime() - now.getTime()
}
