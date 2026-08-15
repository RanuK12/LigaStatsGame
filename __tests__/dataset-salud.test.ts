import { describe, it, expect } from 'vitest'
import playersData from '@/data/players.json'
import squadsData from '@/data/squads.json'
import clubsData from '@/data/clubs.json'

/**
 * La salud de la base, como test y no como informe.
 *
 * Los tres defectos que esto cierra estaban en producción el 15/8 y ninguno rompía el build:
 *
 *  · cinco planteles de la Liga Profesional no tenían un solo arquero, así que el draft giraba
 *    y el puesto no se podía llenar;
 *  · el filtro de los planteles históricos dejaba equipos con dos defensores, injugables;
 *  · nada comprobaba que los ids referenciados existieran de verdad.
 *
 * `validate-dataset.mjs` ya medía esto, pero había que acordarse de correrlo. Acá falla el CI.
 */

type Jugador = { id: string; name: string; position: string; rating: number; clubs?: unknown[] }
type Plantel = { clubId: string; season: string; playerIds: string[] }

const players = playersData as unknown as Jugador[]
const squads = squadsData as unknown as Plantel[]
const clubs = clubsData as unknown as { id: string }[]

const porId = new Map(players.map((p) => [p.id, p]))
const nombre = (s: Plantel) => `${s.clubId} ${s.season}`

const LINEA = (pos: string) =>
  pos === 'GK' ? 'GK'
  : ['CB', 'LB', 'RB', 'LWB', 'RWB'].includes(pos) ? 'DEF'
  : ['CDM', 'CM', 'CAM', 'LM', 'RM'].includes(pos) ? 'MID'
  : 'ATT'

const POSICIONES = ['GK', 'CB', 'LB', 'RB', 'LWB', 'RWB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'ST', 'CF']

describe('la base de jugadores', () => {
  it('no tiene ids repetidos', () => {
    const vistos = new Set<string>()
    const repetidos = players.filter((p) => (vistos.has(p.id) ? true : (vistos.add(p.id), false)))
    expect(repetidos.map((p) => p.id)).toEqual([])
  })

  it('todos tienen puesto válido y valoración en rango', () => {
    const malos = players.filter(
      (p) => !POSICIONES.includes(p.position) || !(p.rating >= 40 && p.rating <= 99),
    )
    expect(malos.map((p) => `${p.name} (${p.position} ${p.rating})`)).toEqual([])
  })
})

describe('los planteles', () => {
  it('apuntan a jugadores que existen', () => {
    const rotos: string[] = []
    for (const s of squads) {
      for (const id of s.playerIds) if (!porId.has(id)) rotos.push(`${nombre(s)} → ${id}`)
    }
    expect(rotos).toEqual([])
  })

  it('son de clubes que existen', () => {
    const ids = new Set(clubs.map((c) => c.id))
    expect(squads.filter((s) => !ids.has(s.clubId)).map(nombre)).toEqual([])
  })

  it('se pueden poner en una cancha: arquero, tres del fondo, tres del medio y un delantero', () => {
    const injugables: string[] = []
    for (const s of squads) {
      const lineas = { GK: 0, DEF: 0, MID: 0, ATT: 0 }
      for (const id of s.playerIds) {
        const p = porId.get(id)
        if (p) lineas[LINEA(p.position) as keyof typeof lineas]++
      }
      const falta =
        lineas.GK < 1 ? 'sin arquero'
        : lineas.DEF < 3 ? `solo ${lineas.DEF} defensores`
        : lineas.MID < 3 ? `solo ${lineas.MID} del medio`
        : lineas.ATT < 1 ? 'sin delanteros'
        : s.playerIds.length < 11 ? `solo ${s.playerIds.length} jugadores`
        : ''
      if (falta) injugables.push(`${nombre(s)}: ${falta}`)
    }
    expect(injugables).toEqual([])
  })
})
