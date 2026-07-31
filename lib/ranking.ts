// Sistema de ranking competitivo: ELO -> Tier + División.
// Diseñado para ser difícil arriba (Leyenda = techo chico) y adictivo (siempre
// "te falta poco para subir").

export interface Tier {
  name: string
  short: string
  min: number
  color: string // color de acento (hex)
  icon: string
}

// Umbrales de ELO. El piso del store es 500, el arranque 1000 (Plata).
export const TIERS: Tier[] = [
  { name: 'Bronce', short: 'BRO', min: 500, color: '#b06a3b', icon: '🥉' },
  { name: 'Plata', short: 'PLA', min: 900, color: '#9fb2c9', icon: '⚪' },
  { name: 'Oro', short: 'ORO', min: 1100, color: '#f1c453', icon: '🟡' },
  { name: 'Platino', short: 'PLT', min: 1300, color: '#5fd0c8', icon: '🔷' },
  { name: 'Diamante', short: 'DIA', min: 1500, color: '#7aa2ff', icon: '💎' },
  { name: 'Leyenda', short: 'LEY', min: 1750, color: '#ffd54a', icon: '👑' },
]

export interface Rank {
  tier: Tier
  division: string // 'III' | 'II' | 'I' (Leyenda no tiene)
  label: string // "Oro II"
  progressPct: number // 0..100 hacia el próximo tier
  toNext: number // ELO que falta para el próximo tier (0 si es Leyenda)
  nextLabel: string
}

/** Calcula tier + división desde el ELO. */
export function rankFromElo(elo: number): Rank {
  let idx = 0
  for (let i = 0; i < TIERS.length; i++) {
    if (elo >= TIERS[i].min) idx = i
  }
  const tier = TIERS[idx]
  const next = TIERS[idx + 1]
  const floor = tier.min
  const ceil = next ? next.min : tier.min + 300 // Leyenda: escala abierta

  // Leyenda no tiene divisiones; el resto se parte en III (abajo) -> I (arriba)
  let division = ''
  let label = tier.name
  if (next) {
    const span = (ceil - floor) / 3
    const d = Math.min(2, Math.floor((elo - floor) / span))
    division = ['III', 'II', 'I'][d]
    label = `${tier.name} ${division}`
  }

  const progressPct = next ? Math.max(0, Math.min(100, Math.round(((elo - floor) / (ceil - floor)) * 100))) : 100
  const toNext = next ? Math.max(0, next.min - elo) : 0
  const nextLabel = next ? next.name : 'Leyenda'

  return { tier, division, label, progressPct, toNext, nextLabel }
}

/**
 * Puntos de tabla por torneo, ponderados por dificultad (Liga completa vale más
 * que una Copa corta) y por el rendimiento (posición final).
 *
 * El rendimiento va de +1 (campeón) a -1 (último): un draft flojo RESTA puntos.
 * Antes hasta el peor torneo posible sumaba, así que cualquier partida engordaba la tabla.
 */
export type TorneoTipo = 'liga' | 'copa' | 'sudamericana' | 'libertadores'

/**
 * Cuánto vale cada torneo. Las copas continentales valen más porque no se eligen: hay que
 * clasificar con la Liga para poder jugarlas, y jugás contra clubes de todo el continente.
 */
export const BASE_POR_TORNEO: Record<TorneoTipo, number> = {
  liga: 100,
  copa: 70,
  sudamericana: 120,
  libertadores: 150,
}

export function tournamentPoints(opts: {
  type: TorneoTipo
  pos: number
  totalTeams: number
  isChampion: boolean
}): number {
  const { type, pos, totalTeams, isChampion } = opts
  const base = BASE_POR_TORNEO[type] ?? 70
  const continental = type === 'libertadores' || type === 'sudamericana'
  // En la liga y en la copa terminar abajo resta: es la competencia de todos los días y quedarse
  // último tiene consecuencias. En las copas continentales NO, porque la plaza te la ganaste
  // clasificando: irse en la fase de grupos daba -73 puntos, o sea que jugar la Libertadores te
  // costaba más caro que no clasificar nunca. Acá el peor resultado es cero, no un castigo.
  const perf = totalTeams <= 1 ? 0
    : continental ? (totalTeams - pos) / (totalTeams - 1)          // 1º = 1, último = 0
    : 1 - (2 * (pos - 1)) / (totalTeams - 1)                       // 1º = +1, mitad = 0, último = -1
  const champ = isChampion ? 40 : 0
  // El descenso es de la Liga. En una copa de eliminación directa terminar abajo es quedar
  // afuera en primera ronda, no descender: no corresponde castigarlo dos veces.
  const descenso = type === 'liga' && pos > totalTeams - 4 ? -20 : 0
  return Math.round(base * perf + champ + descenso)
}

/** Plaza continental que deja la Liga: 1° a 4° van a Libertadores, 5° a 8° a Sudamericana. */
export function plazaPorPuesto(pos: number): 'libertadores' | 'sudamericana' | null {
  if (pos >= 1 && pos <= 4) return 'libertadores'
  if (pos >= 5 && pos <= 8) return 'sudamericana'
  return null
}
