import {
  VALID_POSITIONS as sharedVALID_POSITIONS,
  POSITION_ALIASES as sharedPOSITION_ALIASES,
  normalizePosition as sharedNormalizePosition,
  isValidPosition as sharedIsValidPosition,
  normalizePlayer as sharedNormalizePlayer,
  normalizePlayers as sharedNormalizePlayers,
  normalizeClub as sharedNormalizeClub,
  normalizeClubs as sharedNormalizeClubs,
  normalizeSquad as sharedNormalizeSquad,
  normalizeSquads as sharedNormalizeSquads,
} from '../scripts/data/shared-normalizers.mjs'

import type { Club, Player, Squad } from '@/lib/types'

export const VALID_POSITIONS = sharedVALID_POSITIONS as ReadonlySet<string>
export const POSITION_ALIASES = sharedPOSITION_ALIASES as Record<string, string>

export function normalizePosition(position: unknown): string {
  return sharedNormalizePosition(position)
}

export function isValidPosition(position: string): boolean {
  return sharedIsValidPosition(position)
}

export function normalizePlayer(player: unknown): Player {
  return sharedNormalizePlayer(player) as Player
}

export function normalizePlayers(players: unknown): Player[] {
  return sharedNormalizePlayers(players) as Player[]
}

export function normalizeClub(club: unknown): Club {
  return sharedNormalizeClub(club) as Club
}

export function normalizeClubs(clubs: unknown): Club[] {
  return sharedNormalizeClubs(clubs) as Club[]
}

export function normalizeSquad(squad: unknown): Squad {
  return sharedNormalizeSquad(squad) as Squad
}

export function normalizeSquads(squads: unknown): Squad[] {
  return sharedNormalizeSquads(squads) as Squad[]
}
