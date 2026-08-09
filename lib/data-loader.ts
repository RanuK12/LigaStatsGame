// Carga diferida de players-core.json (generado por scripts/data/build-public-data.mjs
// en public/data/). Saca los 2.3MB de players.json del bundle JS del cliente.
"use client"

import { useEffect, useState } from 'react'
import type { Player, Squad } from './types'
import { normalizePlayers, normalizeSquads } from './data-normalizers'

// Debe coincidir con basePath de next.config.js (aplica también en `next dev`).
export const BASE_PATH = ''

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

/**
 * Los planteles, por fetch en vez de en el bundle.
 *
 * `data/squads.json` son 174 kB y lo importaban tres páginas de cliente, así que viajaban en
 * el JavaScript inicial antes de que nadie pudiera tocar nada. Acá se piden recién cuando
 * hacen falta —cuando el jugador entra al draft o al versus—, igual que los jugadores.
 */
let squadsPromise: Promise<Squad[]> | null = null

export function loadSquads(): Promise<Squad[]> {
  if (!squadsPromise) {
    squadsPromise = fetch(`${BASE_PATH}/data/squads-core.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`squads-core.json: HTTP ${res.status}`)
        return res.json()
      })
      .then((raw) => normalizeSquads(raw))
      .catch((err) => {
        squadsPromise = null // permitir reintento
        throw err
      })
  }
  return squadsPromise
}

export function useSquads(): { squads: Squad[] | null; error: string | null } {
  const [squads, setSquads] = useState<Squad[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    loadSquads()
      .then((s) => { if (alive) setSquads(s) })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : 'Error cargando planteles') })
    return () => { alive = false }
  }, [])

  return { squads, error }
}
