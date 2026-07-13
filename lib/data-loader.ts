// Carga diferida de players-core.json (generado por scripts/data/build-public-data.mjs
// en public/data/). Saca los 2.3MB de players.json del bundle JS del cliente.
"use client"

import { useEffect, useState } from 'react'
import type { Player } from './types'
import { normalizePlayers } from './data-normalizers'

// Debe coincidir con basePath de next.config.js (aplica también en `next dev`).
export const BASE_PATH = '/LigaStatsGame'

let playersPromise: Promise<Player[]> | null = null

export function loadPlayersCore(): Promise<Player[]> {
  if (!playersPromise) {
    playersPromise = fetch(`${BASE_PATH}/data/players-core.json`)
      .then(res => {
        if (!res.ok) throw new Error(`players-core.json: HTTP ${res.status}`)
        return res.json()
      })
      .then(raw => normalizePlayers(raw))
      .catch(err => {
        playersPromise = null // permitir reintento
        throw err
      })
  }
  return playersPromise
}

export function usePlayersCore(): { players: Player[] | null; error: string | null } {
  const [players, setPlayers] = useState<Player[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadPlayersCore()
      .then(p => { if (alive) setPlayers(p) })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Error cargando jugadores') })
    return () => { alive = false }
  }, [])

  return { players, error }
}
