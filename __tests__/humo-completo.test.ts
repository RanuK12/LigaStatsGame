import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import { normalizePlayers, normalizeSquads } from '@/lib/data-normalizers'
import {
  formations, spinSquadWithPity, updatePity, canPlayHere, getSquadTier,
  calculateFullTeamScore, simulateSeasonWithStats, simulateCopaWithStats,
} from '@/lib/game-engine'
import { simulateContinentalTournament } from '@/lib/copa-libertadores'
import { simulateSeason, advancePlayer, makeRng, marketValueFor, ALL_CLUBS, ARG_CLUBS, type CareerState } from '@/lib/career-engine'
import { CHALLENGES, challengeForDate } from '@/lib/daily-challenge'
import { tournamentPoints, plazaPorPuesto } from '@/lib/ranking'
import playersData from '@/data/players.json'
import squadsData from '@/data/squads.json'
import curiosidades from '@/data/derived/curiosidades.json'
import type { Player, Squad } from '@/lib/types'

/**
 * Prueba de humo de todo el juego, con los datos reales.
 *
 * Treinta drafts completos, torneos de las cuatro competencias, temporadas de modo carrera, los
 * ocho retos diarios y el mazo de datos curiosos. No busca un caso borde: busca que nada explote
 * y que los números que ve el jugador tengan sentido. El informe queda escrito para poder leerlo
 * sin volver a correr los tests.
 */
const players = normalizePlayers(playersData as unknown[]) as Player[]
const squads = normalizeSquads(squadsData as unknown[]).filter((s) => s.playerIds.length >= 11) as Squad[]
const jugadoresDe = new Map<string, Player[]>(
  squads.map((sq) => [sq.id, players.filter((p) => sq.playerIds.includes(p.id))]),
)
const informe: string[] = []
const anotar = (l: string) => informe.push(l)

function draftear(pool: Player[] = players, formacionId: keyof typeof formations = '4-3-3') {
  const formacion = formations[formacionId]
  const equipo: (Player | null)[] = []
  const drafted = new Set<string>()
  const clubes = new Set<string>()
  let pity = { consecutiveLow: 0, lastRatings: [] as number[], pityActive: false, spinsSinEstrella: 0 }
  const ids = new Set(pool.map((p) => p.id))
  const legibles = (sq: Squad) => (jugadoresDe.get(sq.id) || []).filter((p) => ids.has(p.id))

  for (const slot of formacion.positions) {
    const elegibles = squads.filter((sq) => legibles(sq).some((p) => !drafted.has(p.id) && canPlayHere(p, slot.pos)))
    if (elegibles.length === 0) { equipo.push(null); continue }
    const sq = spinSquadWithPity(elegibles, pool, pity, { position: slot.pos, drafted }, clubes)
    clubes.add(sq.clubId)
    const mejor = legibles(sq)
      .filter((p) => !drafted.has(p.id) && canPlayHere(p, slot.pos))
      .sort((a, b) => b.rating - a.rating)[0]
    if (mejor) {
      drafted.add(mejor.id)
      pity = updatePity(pity, mejor.rating, !!mejor.legendary || mejor.rating >= 84)
    }
    equipo.push(mejor ?? null)
  }
  return { equipo, formacion, score: calculateFullTeamScore(equipo, formacion), clubes: clubes.size }
}

describe('prueba de humo del juego entero', () => {
  it('30 drafts completos, en las cuatro formaciones', { timeout: 300_000 }, () => {
    const fms = Object.keys(formations) as (keyof typeof formations)[]
    let completos = 0, suma = 0
    for (let i = 0; i < 30; i++) {
      const d = draftear(players, fms[i % fms.length])
      expect(d.equipo.every(Boolean), `draft ${i} dejó un puesto vacío`).toBe(true)
      expect(d.clubes, `draft ${i} repitió club`).toBe(11)
      expect(d.score).toBeGreaterThan(40)
      expect(d.score).toBeLessThan(100)
      completos++
      suma += d.score
    }
    anotar(`## Drafts\n- 30 drafts en las 4 formaciones: **${completos} completos**, sin puestos vacíos ni clubes repetidos`)
    anotar(`- OVR medio del once: **${(suma / 30).toFixed(1)}**`)
  })

  it('los ocho retos diarios se pueden jugar de verdad', { timeout: 300_000 }, () => {
    const filas: string[] = []
    for (const c of CHALLENGES) {
      const pool = players.filter((p) => c.filtro(p))
      const d = draftear(pool)
      expect(d.equipo.every(Boolean), `${c.id} no pudo armar el once`).toBe(true)
      filas.push(`  - ${c.title}: ${pool.length} jugadores en el bombo, once armado con OVR ${d.score.toFixed(0)}`)
    }
    anotar(`\n## Retos diarios\n- Los ${CHALLENGES.length} arman el once con el bombo recortado:`)
    filas.forEach((f) => anotar(f))
  })

  it('las cuatro competencias corren y reparten puestos con sentido', { timeout: 300_000 }, () => {
    let campeonLiga = 0, plazas = 0, campeonLib = 0, campeonSud = 0
    const N = 30
    for (let i = 0; i < N; i++) {
      const d = draftear()
      const once = d.equipo.filter(Boolean) as Player[]
      const liga = simulateSeasonWithStats(once, squads[0], squads, players, d.formacion, d.score)
      expect(liga.table!.length).toBeGreaterThan(20)
      if (liga.isChampion) campeonLiga++
      if (plazaPorPuesto(liga.playerPos!)) plazas++

      const copa = simulateCopaWithStats(once, squads[0], squads, players, d.formacion, d.score)
      expect(copa.rounds!.length).toBeGreaterThan(0)

      for (const tipo of ['libertadores', 'sudamericana'] as const) {
        const r = simulateContinentalTournament(once, squads[0], d.formacion, d.score, tipo)
        expect(r.groupTable).toHaveLength(4)
        expect(r.continental).toBe(tipo)
        // Jugar la copa que te ganaste no puede restar
        expect(tournamentPoints({ type: tipo, pos: r.playerPos!, totalTeams: 32, isChampion: r.isChampion }))
          .toBeGreaterThanOrEqual(0)
        if (r.isChampion) tipo === 'libertadores' ? campeonLib++ : campeonSud++
      }
    }
    anotar(`\n## Torneos (${N} cada uno)\n- Liga: campeón el **${((campeonLiga / N) * 100).toFixed(0)} %**, clasifica a una copa el **${((plazas / N) * 100).toFixed(0)} %**`)
    anotar(`- Libertadores: campeón el **${((campeonLib / N) * 100).toFixed(0)} %** · Sudamericana: **${((campeonSud / N) * 100).toFixed(0)} %**`)
  })

  it('el modo carrera juega temporadas sin romperse', { timeout: 300_000 }, () => {
    let temporadas = 0
    let goles = 0
    for (let i = 0; i < 12; i++) {
      const club = ARG_CLUBS[i % ARG_CLUBS.length]
      let estado: CareerState = {
        player: { name: `Jugador ${i}`, number: 10, position: 'ST', nationality: 'Argentina', flag: '🇦🇷', ovr: 68, age: 18, marketValueM: marketValueFor(68, 18) },
        clubId: club.id,
        startYear: 2026,
        seasonsPlayed: 0,
        totals: { matchesPlayed: 0, goals: 0, assists: 0 },
        trophies: {},
        clubHistory: [club.id],
        history: [],
        pendingOffers: [],
        nextContinental: 'libertadores',
        milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
        finished: false,
      }
      // Una carrera entera: quince temporadas, de los 18 a los 33.
      for (let t = 0; t < 15; t++) {
        const rng = makeRng(`humo-${i}-${t}`)
        const r = simulateSeason(estado, rng)
        expect(r.season, `carrera ${i} temporada ${t} sin resultado`).toBeTruthy()
        expect(r.season.matchesPlayed).toBeGreaterThanOrEqual(0)
        goles += r.season.goals ?? 0
        estado = {
          ...estado,
          player: advancePlayer(estado, r.season),
          seasonsPlayed: estado.seasonsPlayed + 1,
          history: [...estado.history, r.season],
          totals: {
            matchesPlayed: estado.totals.matchesPlayed + (r.season.matchesPlayed ?? 0),
            goals: estado.totals.goals + (r.season.goals ?? 0),
            assists: estado.totals.assists + (r.season.assists ?? 0),
          },
        }
        temporadas++
      }
    }
    anotar(`\n## Modo carrera\n- **${temporadas} temporadas** en 12 carreras completas (18 a 33 años), sin excepciones`)
    anotar(`- Goles convertidos en total: **${goles}**`)
    expect(goles).toBeGreaterThan(0)
  })

  it('todos los clubes que puede tocar la carrera tienen escudo', () => {
    const sinEscudo = ALL_CLUBS.filter(
      (c) => !fs.existsSync(`public/logos/clubs/${c.id}.png`) && !fs.existsSync(`public/logos/clubs/${c.id}.svg`),
    )
    anotar(`- Clubes de carrera sin escudo: **${sinEscudo.length}**${sinEscudo.length ? ' → ' + sinEscudo.map((c) => c.id).join(', ') : ''}`)
    expect(sinEscudo.map((c) => c.id)).toEqual([])
  })

  it('el mazo de datos curiosos está entero y con respaldo', () => {
    const mazo = (curiosidades as { mazo: { id: string; texto: string; origen: string; fuentes?: string[] }[] }).mazo
    expect(mazo.length).toBeGreaterThan(40)
    for (const c of mazo) {
      expect(c.texto.length, `${c.id} tiene texto vacío`).toBeGreaterThan(20)
      if (c.origen === 'curado') expect(c.fuentes?.length, `${c.id} sin dos fuentes`).toBeGreaterThanOrEqual(2)
    }
    const ids = mazo.map((c) => c.id)
    expect(new Set(ids).size, 'hay datos repetidos en el mazo').toBe(ids.length)
    anotar(`\n## Datos curiosos\n- **${mazo.length} datos** en el mazo, sin repetidos, y los curados con dos fuentes`)
  })

  it('los planteles históricos siguen abriendo como legendarios', () => {
    const h = squads.filter((s) => s.historico)
    const leg = h.filter((s) => getSquadTier(s, players).tier === 'legendario')
    expect(leg.length).toBe(h.length)
    anotar(`- Planteles históricos legendarios: **${leg.length}/${h.length}**`)
  })

  it('escribe el informe', () => {
    fs.mkdirSync('data/reports', { recursive: true })
    fs.writeFileSync(
      'data/reports/humo.md',
      `# Prueba de humo de Gambeta\n\nGenerada por \`__tests__/humo-completo.test.ts\` con los datos reales del juego.\n\n${informe.join('\n')}\n`,
    )
    expect(informe.length).toBeGreaterThan(5)
  })
})
