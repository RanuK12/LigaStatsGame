"use client"
// Persistencia de resultados para la Tabla de Líderes (local + online).

export interface GameScore {
  id: string
  username: string
  club: string
  clubName: string
  rating: number
  players: number
  pts: number
  pos: number
  elo: number
  date: string
}

const KEY = 'ligastats_scores'
const MAX = 100

export function loadLocalScores(): GameScore[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export function saveLocalScore(score: GameScore): void {
  if (typeof window === 'undefined') return
  const all = [score, ...loadLocalScores()].slice(0, MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* ignore quota */
  }
}
