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

/**
 * Top del ranking global.
 *
 * Ordena por ELO, que es por lo que se muestra la tabla. Antes pedía por `pts` y ordenaba en
 * pantalla por ELO: el top que traía no era el top que mostraba, así que alguien con ELO alto y
 * pocos puntos no entraba nunca a la lista por más que le correspondiera.
 */
export async function fetchOnlineScores(limit: number = 100): Promise<OnlineScore[]> {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('elo', { ascending: false })
      .order('pts', { ascending: false })
      .limit(limit)

    if (error || !data) return []
    return data as OnlineScore[]
  } catch {
    return []
  }
}

/**
 * Tu puesto real y cuántos jugadores hay, contados en la base.
 *
 * Sin esto el puesto salía del índice dentro de las filas descargadas: si estabas 300° la tabla
 * te decía cualquier cosa, porque solo conocía las primeras. Se cuenta cuántos te superan.
 */
export async function fetchRankGlobal(elo: number): Promise<{ puesto: number; total: number } | null> {
  if (!supabase) return null
  try {
    const [encima, todos] = await Promise.all([
      supabase.from('leaderboard').select('*', { count: 'exact', head: true }).gt('elo', elo),
      supabase.from('leaderboard').select('*', { count: 'exact', head: true }),
    ])
    if (encima.error || todos.error) return null
    return { puesto: (encima.count ?? 0) + 1, total: todos.count ?? 0 }
  } catch {
    return null
  }
}

export interface Suggestion {
  mensaje: string
  /** Cómo contactarlo si quiere respuesta. Opcional a propósito: pedir datos corta sugerencias. */
  contacto?: string
  /** De qué parte del juego habla, para poder agrupar lo que llega. */
  tema?: string
  pagina?: string
  fecha?: string
}

/**
 * Guarda una sugerencia. Devuelve false si no se pudo (sin Supabase, sin red o tabla caída);
 * el formulario ofrece el mail como salida para que lo que escribió no se pierda.
 */
export async function submitSuggestion(s: Suggestion): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('suggestions').insert([
      {
        mensaje: s.mensaje.slice(0, 2000),
        contacto: s.contacto?.slice(0, 200) || null,
        tema: s.tema || 'general',
        pagina: s.pagina || null,
        fecha: new Date().toISOString(),
      },
    ])
    return !error
  } catch {
    return false
  }
}

export async function fetchSuggestions(): Promise<Suggestion[]> {
  if (!supabase) return []
  try {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(100)
    if (error || !data) return []
    return data as Suggestion[]
  } catch {
    return []
  }
}

/** Submit a draft score entry to Supabase */
/**
 * ¿Ese nombre ya lo está usando alguien en el ranking?
 *
 * El ranking se muestra por nombre, así que dos personas con el mismo nombre son, en pantalla, la
 * misma persona. Se chequea antes de dejar entrar como invitado.
 */
export async function nombreEnUso(username: string): Promise<boolean> {
  if (!supabase) return false
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('username')
      .ilike('username', username.trim())
      .limit(1)
    return !error && !!data && data.length > 0
  } catch {
    return false
  }
}

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
