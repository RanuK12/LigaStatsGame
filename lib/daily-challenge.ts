// Reto diario determinístico: todos ven el MISMO reto cada día y rota solo al cambiar el día.
// La selección se deriva de la fecha (YYYY-MM-DD) con un hash estable, sin backend.

export type Difficulty = "Fácil" | "Media" | "Difícil" | "Leyenda"

export interface DailyChallenge {
  id: string
  title: string
  rule: string
  icon: string
  difficulty: Difficulty
}

// Pool temático de retos del fútbol argentino. Agregar más solo amplía la variedad.
export const CHALLENGES: DailyChallenge[] = [
  { id: "campeones-mundo", title: "Campeones del Mundo", rule: "Armá tu XI usando solo jugadores campeones del mundo con Argentina.", icon: "🏆", difficulty: "Difícil" },
  { id: "scaloneta", title: "La Scaloneta", rule: "Solo héroes de Qatar 2022. Reviví la tercera estrella.", icon: "⭐", difficulty: "Difícil" },
  { id: "clasico-eterno", title: "Clásico Eterno", rule: "Solo jugadores de Boca Juniors y River Plate.", icon: "🔵🔴", difficulty: "Fácil" },
  { id: "decada-80", title: "Década Dorada", rule: "Solo cracks que brillaron en los años 80.", icon: "📼", difficulty: "Media" },
  { id: "zurdos", title: "Zurdos Mágicos", rule: "Solo jugadores de pie zurdo. La zurda manda.", icon: "🦵", difficulty: "Media" },
  { id: "rosario", title: "Orgullo Rosarino", rule: "Solo Central y Newell's. La ciudad del gol.", icon: "🌟", difficulty: "Media" },
  { id: "cordoba", title: "Furia Cordobesa", rule: "Solo clubes de Córdoba: Talleres, Belgrano, Instituto.", icon: "🏔️", difficulty: "Media" },
  { id: "arco-invicto", title: "Arco Invicto", rule: "Elegí el mejor arquero y una línea de 4 defensores de fierro.", icon: "🧤", difficulty: "Fácil" },
  { id: "goleadores", title: "Máquina de Goles", rule: "Armá el equipo con más goles sumados. A romper la red.", icon: "⚽", difficulty: "Fácil" },
  { id: "enganches", title: "Los 10", rule: "Solo enganches y volantes creativos. Fútbol de otro planeta.", icon: "🎩", difficulty: "Media" },
  { id: "ovr-90", title: "Élite Absoluta", rule: "Solo jugadores con OVR 88 o más. Nada de relleno.", icon: "💎", difficulty: "Leyenda" },
  { id: "libertadores", title: "Gloria Continental", rule: "Solo campeones de Copa Libertadores.", icon: "🌎", difficulty: "Difícil" },
  { id: "extranjeros", title: "Legionarios del Ascenso", rule: "Solo extranjeros que hicieron historia en el fútbol argentino.", icon: "✈️", difficulty: "Media" },
  { id: "leyendas-arqueros", title: "Guardianes Eternos", rule: "Rendí homenaje: armá con los arqueros más grandes de la historia.", icon: "🥅", difficulty: "Media" },
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
