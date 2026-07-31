import { describe, it, expect } from 'vitest'
import type { GameScore } from '@/lib/scores'

/**
 * La regla del ranking, escrita como test para que no se rompa sin que nadie se entere.
 *
 * El defecto que arregla: la tabla guarda UNA FILA POR PARTIDA. El que jugó veinte veces ocupaba
 * veinte puestos y empujaba para abajo a todos los demás. Y como el invitado subía como
 * "Invitado", el podio lo peleaban filas sin dueño contra gente con cuenta.
 *
 * Esta es la misma reducción que hace app/leaderboard/page.tsx.
 */
function rankear(filas: GameScore[]): GameScore[] {
  const mejorPorNombre = new Map<string, GameScore>()
  for (const f of filas) {
    const clave = (f.username || '').trim().toLowerCase()
    const previa = mejorPorNombre.get(clave)
    if (!previa || f.elo > previa.elo || (f.elo === previa.elo && f.pts > previa.pts)) {
      mejorPorNombre.set(clave, f)
    }
  }
  return [...mejorPorNombre.values()].sort((a, b) => b.elo - a.elo || b.pts - a.pts)
}

const fila = (username: string, elo: number, pts = 0): GameScore => ({
  id: `${username}-${elo}-${pts}`, username, club: 'mi-11', clubName: 'Mi 11',
  rating: 80, players: 11, pts, pos: 1, elo, date: '2026-07-31',
})

describe('ranking limpio', () => {
  it('una fila por persona: se queda su mejor ELO', () => {
    const tabla = rankear([
      fila('Emilio', 1100), fila('Emilio', 1350), fila('Emilio', 1200),
      fila('Marcelo', 1300),
    ])
    expect(tabla).toHaveLength(2)
    expect(tabla[0].username).toBe('Emilio')
    expect(tabla[0].elo).toBe(1350)
  })

  it('el mismo nombre con distinta capitalización o espacios es la misma persona', () => {
    const tabla = rankear([fila('Emilio', 1200), fila('  emilio ', 1400), fila('EMILIO', 1000)])
    expect(tabla).toHaveLength(1)
    expect(tabla[0].elo).toBe(1400)
  })

  it('con veinte partidas de uno solo, los demás no se corren de puesto', () => {
    const muchas = Array.from({ length: 20 }, (_, i) => fila('Repetido', 1000 + i))
    const tabla = rankear([...muchas, fila('Otro', 1015), fila('Tercero', 1010)])
    expect(tabla).toHaveLength(3)
    expect(tabla.map((f) => f.username)).toEqual(['Repetido', 'Otro', 'Tercero'])
  })

  it('a igual ELO, desempata por puntos', () => {
    const tabla = rankear([fila('A', 1200, 50), fila('B', 1200, 90)])
    expect(tabla[0].username).toBe('B')
  })
})
