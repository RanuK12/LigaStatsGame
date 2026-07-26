"use client"
// Progreso del Reto Diario: qué día se completó por última vez y la racha.
// Vive en localStorage (el juego es export estático) y alimenta el bono de ELO del ranking.

import { localYmd } from './daily-challenge'

const KEY = 'gambeta_daily_v1'

export interface DailyProgress {
  lastYmd: string | null // último día completado
  streak: number // días seguidos
  totalElo: number // ELO acumulado por retos
}

const VACIO: DailyProgress = { lastYmd: null, streak: 0, totalElo: 0 }

// Bono base + premio a la constancia (hasta 6 días de racha).
export const DAILY_BASE_ELO = 12
export const DAILY_STREAK_ELO = 3
export const DAILY_MAX_ELO = DAILY_BASE_ELO + DAILY_STREAK_ELO * 6

export function bonusForStreak(streak: number): number {
  return Math.min(DAILY_MAX_ELO, DAILY_BASE_ELO + DAILY_STREAK_ELO * Math.max(0, streak - 1))
}

export function loadDaily(): DailyProgress {
  if (typeof localStorage === 'undefined') return { ...VACIO }
  try {
    const raw = localStorage.getItem(KEY)
    const p = raw ? JSON.parse(raw) : null
    return p && typeof p === 'object' ? { ...VACIO, ...p } : { ...VACIO }
  } catch {
    return { ...VACIO }
  }
}

function save(p: DailyProgress): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* sin espacio: el reto igual se juega */
  }
}

export function completadoHoy(p: DailyProgress = loadDaily()): boolean {
  return p.lastYmd === localYmd()
}

function ayer(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return localYmd(d)
}

/**
 * Registra el reto de hoy como completado y devuelve el bono de ELO ganado.
 * Devuelve null si ya se había cobrado hoy (el bono es uno por día).
 */
export function claimDailyBonus(): { elo: number; streak: number } | null {
  const p = loadDaily()
  const hoy = localYmd()
  if (p.lastYmd === hoy) return null
  const streak = p.lastYmd === ayer() ? p.streak + 1 : 1
  const elo = bonusForStreak(streak)
  save({ lastYmd: hoy, streak, totalElo: p.totalElo + elo })
  return { elo, streak }
}
