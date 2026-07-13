import { Player } from './types';

// ═══════════════════════════════════════════════════════════════
// POSITION COMPATIBILITY
// ═══════════════════════════════════════════════════════════════
export const positionCompatibility: Record<string, string[]> = {
  GK: ['GK'],
  CB: ['CB'],
  LB: ['LB', 'LWB'],
  RB: ['RB', 'RWB'],
  LWB: ['LWB', 'LB'],
  RWB: ['RWB', 'RB'],
  CDM: ['CDM', 'CM'],
  CM: ['CM', 'CDM', 'CAM', 'LM', 'RM'],
  CAM: ['CAM', 'CM', 'CF', 'ST'],
  LM: ['LM', 'LW', 'LB', 'CM'],
  RM: ['RM', 'RW', 'RB', 'CM'],
  LW: ['LW', 'LM', 'ST'],
  RW: ['RW', 'RM', 'ST'],
  ST: ['ST', 'CF', 'CAM'],
  CF: ['CF', 'ST', 'CAM'],
};

// Normaliza etiquetas de posición en español a los códigos enum (defensa: datos viejos/scrapeados a
// veces traen "Mediocampista"/"Delantero" en vez de CM/ST y rompen la compatibilidad). (fix 06-29)
const POS_ALIAS: Record<string, string> = {
  Arquero: 'GK', Portero: 'GK', Defensor: 'CB', 'Defensa central': 'CB',
  'Lateral izquierdo': 'LB', 'Lateral derecho': 'RB',
  Mediocampista: 'CM', Volante: 'CM', 'Volante central': 'CDM', 'Volante defensivo': 'CDM',
  Enganche: 'CAM', Mediapunta: 'CAM',
  Delantero: 'ST', Centrodelantero: 'CF', Extremo: 'RW', 'Extremo derecho': 'RW', 'Extremo izquierdo': 'LW',
};
export function normPos(p: string): string {
  return POS_ALIAS[p] || p;
}

/**
 * Check if a player can play in a given formation slot position.
 * Uses both primary position and alternate positions array.
 */
export function canPlayHere(player: Player, requiredPos: string): boolean {
  const compat = positionCompatibility[normPos(requiredPos)] || [requiredPos];
  // Check primary position
  if (compat.includes(normPos(player.position))) return true;
  // Check alternate positions array
  if (player.positions && player.positions.length > 0) {
    return player.positions.some(p => compat.includes(normPos(p)));
  }
  return false;
}
