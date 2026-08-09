import { describe, it, expect } from 'vitest'
import squadsData from '@/data/squads.json'
import playersData from '@/data/players.json'
import { normalizePlayers, normalizeSquads } from '@/lib/data-normalizers'
import { formations, simulateSeasonWithStats, getSquadPlayers, calculateFullTeamScore } from '@/lib/game-engine'
import { agruparEnFechas, tablaHasta } from '@/lib/fechas'
import type { Player, Squad } from '@/lib/types'

const TODOS_P: Player[] = normalizePlayers(playersData)
const TODOS_S: Squad[] = normalizeSquads(squadsData)
const LPF = TODOS_S.filter((s) => s.season === '2026' && s.playerIds.length >= 11)

/** Una liga de verdad, jugada por el motor, que es lo que hay que repartir en fechas. */
function unaLiga(clubId: string) {
  const squad = LPF.find((s) => s.clubId === clubId)!
  const once = getSquadPlayers(squad, TODOS_P).slice(0, 11)
  const f = formations['4-3-3']
  return simulateSeasonWithStats(
    once,
    { ...squad, id: 'mio' },
    LPF.filter((s) => s.clubId !== clubId),
    TODOS_P,
    f,
    calculateFullTeamScore(once, f),
  )
}

describe('el calendario y la tabla, fecha por fecha', () => {
  const r = unaLiga('boca-juniors')
  const partidos = r.schedule ?? []
  const equipos = (r.table ?? []).map((t) => t.name)
  const fechas = agruparEnFechas(partidos, equipos)

  it('no se pierde ni se repite ningún partido al repartirlos', () => {
    const repartidos = fechas.flat()
    expect(repartidos).toHaveLength(partidos.length)
    expect(new Set(repartidos).size).toBe(partidos.length)
  })

  /**
   * Es la razón de existir del archivo. El motor devuelve los partidos en el orden en que los
   * calculó —el equipo 1 contra todos, después el 2 contra todos—, así que a mitad de esa lista
   * un equipo lleva veinte partidos y otro uno. Sin repartirlos, "fecha 7" no significa nada y
   * una tabla parcial es cualquier cosa.
   */
  it('en cada fecha ningún equipo juega dos veces', () => {
    for (const [i, fecha] of fechas.entries()) {
      const vistos = new Set<string>()
      for (const m of fecha) {
        expect(vistos.has(m.home), `fecha ${i + 1}: ${m.home} juega dos veces`).toBe(false)
        expect(vistos.has(m.away), `fecha ${i + 1}: ${m.away} juega dos veces`).toBe(false)
        vistos.add(m.home)
        vistos.add(m.away)
      }
    }
  })

  it('la tabla parcial tiene a todos con los mismos partidos jugados', () => {
    const t = tablaHasta(fechas, 5, equipos)
    // Con número par de equipos nadie queda libre; con impar, uno descansa por fecha.
    const pjs = [...new Set(t.map((f) => f.pj))].sort()
    expect(Math.max(...pjs) - Math.min(...pjs)).toBeLessThanOrEqual(1)
  })

  it('la tabla del final es la misma que la del motor', () => {
    const mia = tablaHasta(fechas, fechas.length, equipos)
    const suya = r.table ?? []
    expect(mia).toHaveLength(suya.length)
    for (const fila of suya) {
      const m = mia.find((x) => x.nombre === fila.name)!
      expect(m, fila.name).toBeTruthy()
      expect(m.pts, `puntos de ${fila.name}`).toBe(fila.pts)
      expect(m.gf, `goles a favor de ${fila.name}`).toBe(fila.gf)
      expect(m.gc, `goles en contra de ${fila.name}`).toBe(fila.ga)
    }
    // Y el campeón es el mismo, que es lo que se muestra al final.
    expect(mia[0].nombre).toBe(suya[0].name)
  })

  it('aguanta un fixture que no es todos contra todos', () => {
    const sueltos = partidos.slice(0, 3)
    const f = agruparEnFechas(sueltos, equipos)
    expect(f.flat()).toHaveLength(3)
  })
})
