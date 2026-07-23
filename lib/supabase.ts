import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { LeaderboardEntry } from './types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null

export interface OnlineScore {
  id?: string
  username: string
  club: string
  clubName: string
  rating: number
  players: number
  pts: number
  pos: number
  date: string
  elo: number
}

/** ELO Calculation formula based on tournament finish */
export function calculateElo(currentElo: number, pos: number, totalTeams: number = 28): { newElo: number; delta: number } {
  const K = 32
  // S: normalized performance score from 1.0 (1st place) to 0.0 (last place)
  const S = Math.max(0, (totalTeams - pos) / (totalTeams - 1))
  // E: expected score based on current ELO vs average field ELO (1200)
  const E = 1 / (1 + Math.pow(10, (1200 - currentElo) / 400))
  const delta = Math.round(K * (S - E))
  const newElo = Math.max(500, currentElo + delta)
  return { newElo, delta }
}

/** Fetch top online leaderboard entries */
export async function fetchOnlineScores(limit: number = 50): Promise<OnlineScore[]> {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('pts', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data as OnlineScore[]
  } catch {
    return []
  }
}

/** Submit a draft score entry to Supabase */
export async function submitOnlineScore(entry: Omit<OnlineScore, 'id'>): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase
      .from('leaderboard')
      .insert([entry])
    return !error
  } catch {
    return false
  }
}
