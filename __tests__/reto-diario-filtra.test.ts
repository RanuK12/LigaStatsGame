import { describe, it, expect } from 'vitest'
import { CHALLENGES, challengeForDate } from '@/lib/daily-challenge'
import { normalizePlayers } from '@/lib/data-normalizers'
import { formations, canPlayHere } from '@/lib/game-engine'
import playersData from '@/data/players.json'
import type { Player } from '@/lib/types'

const players = normalizePlayers(playersData as unknown[]) as Player[]

// El reto tiene que RECORTAR el bombo. Durante meses fue un título: los catorce retos producían
// el mismo draft aleatorio, así que no había resultado comparable entre dos personas.
describe('el reto diario aplica su regla', () => {
  it('cada reto filtra de verdad y deja menos jugadores que la base', () => {
    for (const c of CHALLENGES) {
      const n = players.filter((p) => c.filtro(p)).length
      expect(n, `${c.id} no filtra nada`).toBeLessThan(players.length)
      expect(n, `${c.id} deja el bombo vacío`).toBeGreaterThan(60)
    }
  })

  it('cada reto puede llenar los once puestos de todas las formaciones', () => {
    for (const c of CHALLENGES) {
      const pool = players.filter((p) => c.filtro(p))
      for (const f of Object.values(formations)) {
        const necesarios = new Set(f.positions.map((s) => s.pos))
        for (const pos of necesarios) {
          // Como en el juego: canPlayHere permite que un CM cubra de LM, así que medir por
          // posición exacta daba falsos negativos (4-4-2 pide LM, que casi nadie tiene de titular).
          const cuantos = pool.filter((p) => canPlayHere(p, pos)).length
          expect(cuantos, `${c.id} no tiene ${pos} para ${f.id}`).toBeGreaterThanOrEqual(3)
        }
      }
    }
  })

  it('el reto del día es el mismo para todos y cambia al cambiar el día', () => {
    expect(challengeForDate('2026-08-01').id).toBe(challengeForDate('2026-08-01').id)
    const semana = new Set([1, 2, 3, 4, 5, 6, 7, 8].map((d) => challengeForDate(`2026-08-0${d}`).id))
    expect(semana.size).toBeGreaterThan(1)
  })
})
