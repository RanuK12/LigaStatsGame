import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { normalizePlayers, normalizeSquads } from '@/lib/data-normalizers'
import {
  formations, spinSquadWithPity, updatePity, canPlayHere, getSquadTier,
  calculateFullTeamScore, simulateSeasonWithStats, simulateCopaWithStats,
} from '@/lib/game-engine'
import { simulateContinentalTournament } from '@/lib/copa-libertadores'
import { tournamentPoints, plazaPorPuesto } from '@/lib/ranking'
import playersData from '@/data/players.json'
import squadsData from '@/data/squads.json'
import type { Player, Squad } from '@/lib/types'

/**
 * Simulación integral con los datos REALES del juego.
 *
 * No es un test de una función: es la partida entera, de punta a punta, corrida cientos de veces
 * para ver qué siente el que juega. Cada expect de acá es una promesa que le hacemos al jugador
 * ("vas a ver equipos históricos", "la copa se puede ganar"), no un detalle de implementación.
 *
 * Deja el informe en data/reports/simulacion.md para poder leerlo sin correr los tests.
 */
const players = normalizePlayers(playersData as unknown[]) as Player[]
const squads = normalizeSquads(squadsData as unknown[]).filter((s) => s.playerIds.length >= 11) as Squad[]
// Índice plantel → jugadores. Sin esto cada giro recorre 3.334 jugadores por cada uno de los 206
// planteles y la simulación no termina nunca.
const jugadoresDe = new Map<string, Player[]>(
  squads.map((sq) => [sq.id, players.filter((p) => sq.playerIds.includes(p.id))]),
)
const informe: string[] = []
const anotar = (linea: string) => { informe.push(linea) }

/** Un draft completo: once giros, se elige el mejor disponible para el puesto. */
function draftear(formacionId: keyof typeof formations = '4-3-3') {
  const formacion = formations[formacionId]
  const equipo: (Player | null)[] = []
  const drafted = new Set<string>()
  const clubesUsados = new Set<string>()
  let pity = { consecutiveLow: 0, lastRatings: [] as number[], pityActive: false, spinsSinEstrella: 0 }
  let historicosVistos = 0
  let historicosFichados = 0

  for (const slot of formacion.positions) {
    const elegibles = squads.filter((sq) =>
      jugadoresDe.get(sq.id)!.some((p) => !drafted.has(p.id) && canPlayHere(p, slot.pos)),
    )
    if (elegibles.length === 0) { equipo.push(null); continue }

    const sq = spinSquadWithPity(elegibles, players, pity, { position: slot.pos, drafted }, clubesUsados)
    clubesUsados.add(sq.clubId)
    if (sq.historico) historicosVistos++

    const candidatos = jugadoresDe.get(sq.id)!
      .filter((p) => !drafted.has(p.id) && canPlayHere(p, slot.pos))
      .sort((a, b) => b.rating - a.rating)
    const elegido = candidatos[0] ?? null
    if (elegido) {
      drafted.add(elegido.id)
      if (sq.historico) historicosFichados++
      pity = updatePity(pity, elegido.rating, Boolean(elegido.legendary) || elegido.rating >= 84)
    }
    equipo.push(elegido)
  }

  const score = calculateFullTeamScore(equipo, formacion)
  return { equipo, formacion, score, historicosVistos, historicosFichados, clubes: clubesUsados.size }
}

describe('simulación integral con datos reales', () => {
  it('200 drafts: salen equipos históricos, no se repiten clubes y el once se completa', { timeout: 300_000 }, () => {
    const N = 200
    let vistos = 0, fichados = 0, once = 0, scores = 0, sinHistorico = 0
    for (let i = 0; i < N; i++) {
      const d = draftear()
      vistos += d.historicosVistos
      fichados += d.historicosFichados
      scores += d.score
      if (d.equipo.every(Boolean)) once++
      if (d.historicosVistos === 0) sinHistorico++
      expect(d.clubes).toBe(11) // un club por draft, siempre
    }
    anotar(`## Drafts (${N} simulaciones)`)
    anotar(`- Planteles históricos por draft: **${(vistos / N).toFixed(1)}** de 11 giros`)
    anotar(`- Jugadores históricos que terminan en el once: **${(fichados / N).toFixed(1)}**`)
    anotar(`- Drafts sin ver ni un histórico: **${((sinHistorico / N) * 100).toFixed(1)} %**`)
    anotar(`- Once completo: **${((once / N) * 100).toFixed(0)} %** · OVR medio del equipo: **${(scores / N).toFixed(1)}**`)
    anotar(`- Clubes repetidos en un mismo draft: **0**`)

    expect(vistos / N).toBeGreaterThan(2)
    expect(vistos / N).toBeLessThan(4.5)
    expect(once).toBe(N)          // nunca se queda un puesto vacío
    expect(sinHistorico / N).toBeLessThan(0.15)
  })

  it('los planteles históricos se revelan como legendarios', () => {
    const historicos = squads.filter((s) => s.historico)
    const legendarios = historicos.filter((s) => getSquadTier(s, players).tier === 'legendario')
    anotar(`- Planteles históricos que abren como legendarios: **${legendarios.length}/${historicos.length}**`)
    expect(legendarios.length).toBe(historicos.length)
  })

  it('la Liga y la Copa terminan bien y reparten puestos creíbles', { timeout: 300_000 }, () => {
    let campeonLiga = 0, plazas = 0
    const N = 60
    for (let i = 0; i < N; i++) {
      const d = draftear()
      const r = simulateSeasonWithStats(d.equipo.filter(Boolean) as Player[], squads[0], squads, players, d.formacion, d.score)
      expect(r.table!.length).toBeGreaterThan(20)
      expect(r.playerPos).toBeGreaterThan(0)
      if (r.isChampion) campeonLiga++
      if (plazaPorPuesto(r.playerPos!)) plazas++
      const c = simulateCopaWithStats(d.equipo.filter(Boolean) as Player[], squads[0], squads, players, d.formacion, d.score)
      expect(c.rounds!.length).toBeGreaterThan(0)
    }
    anotar(`\n## Liga (${N} simulaciones)`)
    anotar(`- Sale campeón: **${((campeonLiga / N) * 100).toFixed(0)} %**`)
    anotar(`- Clasifica a una copa continental (1° a 8°): **${((plazas / N) * 100).toFixed(0)} %**`)
    expect(plazas).toBeGreaterThan(0) // la plaza tiene que ser alcanzable o la copa no existe
  })

  it('la Libertadores y la Sudamericana se pueden ganar, y la Sudamericana es la más accesible', { timeout: 300_000 }, () => {
    const N = 200
    const medir = (tipo: 'libertadores' | 'sudamericana') => {
      const rondas: Record<string, number> = {}
      let campeon = 0, puntosCampeon = 0, puntosGrupos = 0
      for (let i = 0; i < N; i++) {
        const d = draftear()
        const r = simulateContinentalTournament(d.equipo.filter(Boolean) as Player[], squads[0], d.formacion, d.score, tipo)
        expect(r.continental).toBe(tipo)
        expect(r.groupTable).toHaveLength(4)
        const clave = r.isChampion ? 'Campeón' : r.eliminatedRound!
        rondas[clave] = (rondas[clave] || 0) + 1
        const pts = tournamentPoints({ type: tipo, pos: r.playerPos!, totalTeams: 32, isChampion: r.isChampion })
        if (r.isChampion) { campeon++; puntosCampeon = pts }
        if (r.eliminatedRound === 'Fase de Grupos') puntosGrupos = pts
      }
      return { rondas, campeon, puntosCampeon, puntosGrupos }
    }
    const lib = medir('libertadores')
    const sud = medir('sudamericana')

    for (const [nombre, m] of [['Libertadores', lib], ['Sudamericana', sud]] as const) {
      anotar(`\n## ${nombre} (${N} simulaciones, con equipos drafteados de verdad)`)
      anotar(`- Sale campeón: **${((m.campeon / N) * 100).toFixed(1)} %**`)
      for (const [ronda, n] of Object.entries(m.rondas).sort((a, b) => b[1] - a[1])) {
        anotar(`  - ${ronda}: ${((n / N) * 100).toFixed(1)} %`)
      }
      anotar(`- Puntos al ranking: campeón **${m.puntosCampeon}**, afuera en grupos **${m.puntosGrupos}**`)
    }

    // Se puede ganar: si no, el premio de clasificar no existe
    expect(lib.campeon).toBeGreaterThan(0)
    expect(sud.campeon).toBeGreaterThan(0)
    // Y la Sudamericana es la más accesible, o clasificar 5°-8° no significaría nada distinto
    expect(sud.campeon).toBeGreaterThan(lib.campeon)
    // Irse en la fase de grupos no puede pagar lo mismo que ganarla
    expect(lib.puntosCampeon).toBeGreaterThan(lib.puntosGrupos)
  })

  it('escribe el informe', () => {
    fs.mkdirSync('data/reports', { recursive: true })
    fs.writeFileSync(
      'data/reports/simulacion.md',
      `# Simulación integral de Gambeta\n\nGenerado por \`__tests__/simulacion-integral.test.ts\` con los datos reales del juego.\n\n${informe.join('\n')}\n`,
    )
    expect(informe.length).toBeGreaterThan(5)
  })
})
