import type { Player, Squad, FormationConfig, TournamentResult, LigaTeamRow } from './types'
import { teamToStrength, simulateMatchGoals, distributeGoalsAmongPlayers, type TeamStrength } from './game-engine'
import { buildMatchChronicle } from './chronicle'

export interface ContinentalClub {
  id: string
  name: string
  country: string
  /** Bandera del país, para la fila del cruce */
  flag: string
  /** Colores del escudo generado en public/logos/continental/<id>.svg */
  colors: [string, string]
  /** Fuerza en la escala del motor de partidos (la misma que devuelve teamToStrength) */
  strength: TeamStrength
  /** El mismo club en escala FIFA (60-90), que es la que usa el modo carrera */
  nivel: number
}

// OJO con la escala: teamToStrength() no devuelve el rating de los jugadores. Un once de 95
// da overall 73, y uno realista de draft anda por 55-65. Los rivales continentales estaban
// cargados en escala FIFA (72-84), así que ninguna copa se podía ganar: el equipo perfecto
// entraba de último del grupo. Estos números están en la escala del juego.
const fuerza = (o: number, extra: Partial<TeamStrength> = {}) => ({
  strength: { attack: o, midfield: o, defense: o, goalkeeper: o, chemistry: o - 3, overall: o, ...extra } as TeamStrength,
  // El modo carrera pide la escala FIFA y el motor de partidos la del juego: se guardan las dos,
  // atadas por esta conversión, para que no vuelvan a divergir.
  nivel: Math.round((o + 6) / 0.8333),
})

/**
 * Los que juegan la Libertadores. Son los campeones y los históricos del continente: el que
 * clasificó a esta copa tiene que sentir que subió de categoría.
 */
export const LIBERTADORES_CLUBS: ContinentalClub[] = [
  { id: 'flamengo', name: 'Flamengo', country: 'Brasil', flag: '🇧🇷', colors: ['#E4002B', '#000000'], ...fuerza(64) },
  { id: 'palmeiras', name: 'Palmeiras', country: 'Brasil', flag: '🇧🇷', colors: ['#006437', '#FFFFFF'], ...fuerza(64) },
  { id: 'botafogo', name: 'Botafogo', country: 'Brasil', flag: '🇧🇷', colors: ['#000000', '#FFFFFF'], ...fuerza(62) },
  { id: 'fluminense', name: 'Fluminense', country: 'Brasil', flag: '🇧🇷', colors: ['#7A1E30', '#006437'], ...fuerza(62) },
  { id: 'atletico-mineiro', name: 'Atlético Mineiro', country: 'Brasil', flag: '🇧🇷', colors: ['#000000', '#E4002B'], ...fuerza(62) },
  { id: 'sao-paulo', name: 'São Paulo', country: 'Brasil', flag: '🇧🇷', colors: ['#E4002B', '#000000'], ...fuerza(61) },
  { id: 'internacional', name: 'Internacional', country: 'Brasil', flag: '🇧🇷', colors: ['#E4002B', '#FFFFFF'], ...fuerza(60) },
  { id: 'gremio', name: 'Grêmio', country: 'Brasil', flag: '🇧🇷', colors: ['#0D80BF', '#000000'], ...fuerza(60) },
  { id: 'penarol', name: 'Peñarol', country: 'Uruguay', flag: '🇺🇾', colors: ['#F5D000', '#000000'], ...fuerza(60) },
  { id: 'nacional-uru', name: 'Nacional', country: 'Uruguay', flag: '🇺🇾', colors: ['#FFFFFF', '#0038A8'], ...fuerza(59) },
  { id: 'ldu-quito', name: 'LDU Quito', country: 'Ecuador', flag: '🇪🇨', colors: ['#FFFFFF', '#0038A8'], ...fuerza(59) },
  { id: 'ind-del-valle', name: 'Independiente del Valle', country: 'Ecuador', flag: '🇪🇨', colors: ['#000000', '#0038A8'], ...fuerza(60) },
  { id: 'colo-colo', name: 'Colo-Colo', country: 'Chile', flag: '🇨🇱', colors: ['#FFFFFF', '#000000'], ...fuerza(58) },
  { id: 'universidad-catolica', name: 'U. Católica', country: 'Chile', flag: '🇨🇱', colors: ['#FFFFFF', '#0038A8'], ...fuerza(57) },
  { id: 'olimpia', name: 'Olimpia', country: 'Paraguay', flag: '🇵🇾', colors: ['#FFFFFF', '#000000'], ...fuerza(58) },
  { id: 'cerro-porteno', name: 'Cerro Porteño', country: 'Paraguay', flag: '🇵🇾', colors: ['#E4002B', '#0038A8'], ...fuerza(57) },
  { id: 'atletico-nacional', name: 'Atlético Nacional', country: 'Colombia', flag: '🇨🇴', colors: ['#00A650', '#FFFFFF'], ...fuerza(59) },
  { id: 'millonarios', name: 'Millonarios', country: 'Colombia', flag: '🇨🇴', colors: ['#0038A8', '#FFFFFF'], ...fuerza(57) },
  { id: 'universitario', name: 'Universitario', country: 'Perú', flag: '🇵🇪', colors: ['#B08D2E', '#7A1E30'], ...fuerza(56) },
  { id: 'alianza-lima', name: 'Alianza Lima', country: 'Perú', flag: '🇵🇪', colors: ['#0038A8', '#FFFFFF'], ...fuerza(56) },
  { id: 'bolivar', name: 'Bolívar', country: 'Bolivia', flag: '🇧🇴', colors: ['#0F5EA8', '#FFFFFF'], ...fuerza(56) },
  { id: 'the-strongest', name: 'The Strongest', country: 'Bolivia', flag: '🇧🇴', colors: ['#F5D000', '#000000'], ...fuerza(55) },
  { id: 'caracas', name: 'Caracas', country: 'Venezuela', flag: '🇻🇪', colors: ['#E4002B', '#FFFFFF'], ...fuerza(54) },
  { id: 'nacional-py', name: 'Nacional', country: 'Paraguay', flag: '🇵🇾', colors: ['#0038A8', '#FFFFFF'], ...fuerza(55) },
]

/**
 * Los de la Sudamericana. Misma idea, un escalón más abajo: ganarla tiene que ser más accesible
 * que la Libertadores, o la clasificación por puesto 5°-8° no significaría nada distinto.
 */
export const SUDAMERICANA_CLUBS: ContinentalClub[] = [
  { id: 'corinthians', name: 'Corinthians', country: 'Brasil', flag: '🇧🇷', colors: ['#000000', '#FFFFFF'], ...fuerza(58) },
  { id: 'cruzeiro', name: 'Cruzeiro', country: 'Brasil', flag: '🇧🇷', colors: ['#0038A8', '#FFFFFF'], ...fuerza(57) },
  { id: 'vasco', name: 'Vasco da Gama', country: 'Brasil', flag: '🇧🇷', colors: ['#000000', '#FFFFFF'], ...fuerza(55) },
  { id: 'bahia', name: 'Bahia', country: 'Brasil', flag: '🇧🇷', colors: ['#0038A8', '#E4002B'], ...fuerza(55) },
  { id: 'defensor', name: 'Defensor Sporting', country: 'Uruguay', flag: '🇺🇾', colors: ['#7A1E30', '#FFFFFF'], ...fuerza(51) },
  { id: 'danubio', name: 'Danubio', country: 'Uruguay', flag: '🇺🇾', colors: ['#0038A8', '#FFFFFF'], ...fuerza(50) },
  { id: 'emelec', name: 'Emelec', country: 'Ecuador', flag: '🇪🇨', colors: ['#0038A8', '#FFFFFF'], ...fuerza(52) },
  { id: 'barcelona-sc', name: 'Barcelona SC', country: 'Ecuador', flag: '🇪🇨', colors: ['#F5D000', '#000000'], ...fuerza(54) },
  { id: 'union-espanola', name: 'Unión Española', country: 'Chile', flag: '🇨🇱', colors: ['#E4002B', '#FFFFFF'], ...fuerza(50) },
  { id: 'huachipato', name: 'Huachipato', country: 'Chile', flag: '🇨🇱', colors: ['#0038A8', '#000000'], ...fuerza(49) },
  { id: 'guarani', name: 'Guaraní', country: 'Paraguay', flag: '🇵🇾', colors: ['#F5D000', '#000000'], ...fuerza(50) },
  { id: 'libertad', name: 'Libertad', country: 'Paraguay', flag: '🇵🇾', colors: ['#000000', '#F5D000'], ...fuerza(54) },
  { id: 'junior', name: 'Junior', country: 'Colombia', flag: '🇨🇴', colors: ['#E4002B', '#FFFFFF'], ...fuerza(52) },
  { id: 'america-cali', name: 'América de Cali', country: 'Colombia', flag: '🇨🇴', colors: ['#E4002B', '#FFFFFF'], ...fuerza(51) },
  { id: 'sporting-cristal', name: 'Sporting Cristal', country: 'Perú', flag: '🇵🇪', colors: ['#0FA3D8', '#FFFFFF'], ...fuerza(50) },
  { id: 'melgar', name: 'Melgar', country: 'Perú', flag: '🇵🇪', colors: ['#000000', '#E4002B'], ...fuerza(48) },
  { id: 'always-ready', name: 'Always Ready', country: 'Bolivia', flag: '🇧🇴', colors: ['#000000', '#E4002B'], ...fuerza(48) },
  { id: 'deportivo-tachira', name: 'Dep. Táchira', country: 'Venezuela', flag: '🇻🇪', colors: ['#F5D000', '#000000'], ...fuerza(48) },
  { id: 'deportivo-cali', name: 'Deportivo Cali', country: 'Colombia', flag: '🇨🇴', colors: ['#00A650', '#FFFFFF'], ...fuerza(50) },
  { id: 'fortaleza', name: 'Fortaleza', country: 'Brasil', flag: '🇧🇷', colors: ['#0038A8', '#E4002B'], ...fuerza(54) },
  { id: 'lanus-cont', name: 'Lanús', country: 'Argentina', flag: '🇦🇷', colors: ['#7A1E30', '#FFFFFF'], ...fuerza(54) },
  { id: 'independiente-cont', name: 'Independiente', country: 'Argentina', flag: '🇦🇷', colors: ['#E4002B', '#FFFFFF'], ...fuerza(55) },
  { id: 'san-lorenzo-cont', name: 'San Lorenzo', country: 'Argentina', flag: '🇦🇷', colors: ['#0038A8', '#7A1E30'], ...fuerza(54) },
  { id: 'estudiantes-cont', name: 'Estudiantes', country: 'Argentina', flag: '🇦🇷', colors: ['#E4002B', '#FFFFFF'], ...fuerza(55) },
]

export const CONTINENTAL_CLUBS = LIBERTADORES_CLUBS

export type ContinentalType = 'libertadores' | 'sudamericana'

/** Fisher-Yates. `sort(() => Math.random() - 0.5)` no baraja: sesga hacia el orden original. */
function barajar<T>(items: T[]): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const filaVacia = (name: string): LigaTeamRow => ({ name, pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, form: [] })

function anotar(fila: LigaTeamRow, gf: number, ga: number) {
  fila.gf += gf
  fila.ga += ga
  if (gf > ga) { fila.pts += 3; fila.w += 1; fila.form.push('G') }
  else if (gf === ga) { fila.pts += 1; fila.d += 1; fila.form.push('E') }
  else { fila.l += 1; fila.form.push('P') }
}

const ordenarTabla = (t: LigaTeamRow[]) => [...t].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)

/** Penales: la fuerza pesa, pero poco. Un penal es un penal. */
function penales(miFuerza: number, suFuerza: number): [number, number] {
  let yo = 0, el = 0
  const ventaja = Math.max(-0.08, Math.min(0.08, (miFuerza - suFuerza) / 400))
  for (let i = 0; i < 5; i++) {
    if (Math.random() < 0.75 + ventaja) yo++
    if (Math.random() < 0.75 - ventaja) el++
  }
  while (yo === el) {
    const a = Math.random() < 0.72 + ventaja
    const b = Math.random() < 0.72 - ventaja
    if (a) yo++
    if (b) el++
    if (yo !== el) break
  }
  return [yo, el]
}

/**
 * El cuadro del otro lado: mientras vos jugás tu llave, los demás juegan la suya. Sirve para que,
 * cuando te eliminan, el campeón sea alguien que ganó su camino y no un nombre puesto al azar.
 */
function campeonDelOtroLado(candidatos: ContinentalClub[]): string {
  let vivos = barajar(candidatos)
  while (vivos.length > 1) {
    const siguiente: ContinentalClub[] = []
    for (let i = 0; i < vivos.length - 1; i += 2) {
      const a = vivos[i], b = vivos[i + 1]
      const chanceA = a.strength.overall / (a.strength.overall + b.strength.overall)
      siguiente.push(Math.random() < chanceA ? a : b)
    }
    if (vivos.length % 2 === 1) siguiente.push(vivos[vivos.length - 1])
    vivos = siguiente
  }
  return vivos[0]?.name ?? 'Flamengo'
}

/**
 * Copa Libertadores / Sudamericana, con las fases de verdad.
 *
 * Antes eran siete partidos sueltos y una "fase de grupos" decorativa: podías perder los tres
 * partidos del grupo y clasificar igual. Ahora el grupo se juega ida y vuelta, hay tabla, pasan
 * dos, y las llaves son a doble partido con global y penales. La final es a partido único.
 */
export function simulateContinentalTournament(
  playerTeam: Player[],
  squad: Squad,
  formation: FormationConfig,
  teamScore: number,
  type: ContinentalType = 'libertadores'
): TournamentResult {
  const userStrength = teamToStrength(playerTeam, formation, 'copa')
  const title = type === 'libertadores' ? 'Copa Libertadores' : 'Copa Sudamericana'
  const pool = (type === 'libertadores' ? LIBERTADORES_CLUBS : SUDAMERICANA_CLUBS)
    .filter((c) => c.name !== squad.label && !squad.label.startsWith(c.name))

  const sorteo = barajar(pool)
  const grupo = sorteo.slice(0, 3)
  const restoDelCuadro = sorteo.slice(3, 11)

  const roundMatches: import('./types').RoundMatch[] = []
  const chronicles: import('./chronicle').MatchChronicle[] = []
  const playerStatsMap: Record<string, import('./types').TournamentPlayerStats> = {}
  playerTeam.forEach((p) => {
    playerStatsMap[p.id] = {
      playerId: p.id, playerName: p.name, position: p.position, rating: p.rating,
      goals: 0, assists: 0, yellowCards: 0, redCards: 0, matchesPlayed: 0,
    }
  })

  /** Un partido del usuario: guarda relato, estadísticas y la fila del cruce. */
  function jugar(opp: ContinentalClub, enCasa: boolean, ronda: string): { yo: number; el: number } {
    const { homeGoals, awayGoals } = simulateMatchGoals(
      enCasa ? userStrength : opp.strength,
      enCasa ? opp.strength : userStrength,
    )
    const yo = enCasa ? homeGoals : awayGoals
    const el = enCasa ? awayGoals : homeGoals

    const { goals, assists } = yo > 0 ? distributeGoalsAmongPlayers(playerTeam, yo, formation) : { goals: {}, assists: {} }
    const { chronicle, discipline } = buildMatchChronicle({
      opponent: opp.name, isHome: enCasa, myGoals: yo, oppGoals: el,
      goalsByPlayer: goals, assistsByPlayer: assists, team: playerTeam, roundLabel: ronda,
    })
    chronicles.push(chronicle)

    playerTeam.forEach((p) => {
      const st = playerStatsMap[p.id]
      if (!st) return
      st.goals += (goals as Record<string, number>)[p.id] || 0
      st.assists += (assists as Record<string, number>)[p.id] || 0
      st.matchesPlayed += 1
      if (discipline.yellows.includes(p.id)) st.yellowCards += 1
      if (discipline.reds.includes(p.id)) st.redCards += 1
    })

    roundMatches.push({
      round: ronda,
      matches: [{
        home: enCasa ? squad.label : opp.name,
        away: enCasa ? opp.name : squad.label,
        homeId: enCasa ? undefined : opp.id,
        awayId: enCasa ? opp.id : undefined,
        homeGoals, awayGoals, isPlayerHome: enCasa,
      }],
    })
    return { yo, el }
  }

  // ── FASE DE GRUPOS: seis fechas, ida y vuelta, y una tabla que decide de verdad ──
  const tabla: Record<string, LigaTeamRow> = { [squad.label]: filaVacia(squad.label) }
  grupo.forEach((c) => { tabla[c.name] = filaVacia(c.name) })

  const fechas: Array<{ opp: ContinentalClub; enCasa: boolean }> = []
  grupo.forEach((opp) => fechas.push({ opp, enCasa: true }))
  grupo.forEach((opp) => fechas.push({ opp, enCasa: false }))

  fechas.forEach((f, i) => {
    const { yo, el } = jugar(f.opp, f.enCasa, `Fase de Grupos · Fecha ${i + 1}`)
    anotar(tabla[squad.label], yo, el)
    anotar(tabla[f.opp.name], el, yo)
  })

  // Los rivales del grupo también juegan entre ellos: si no, la tabla no cierra.
  for (let i = 0; i < grupo.length; i++) {
    for (let j = i + 1; j < grupo.length; j++) {
      for (const vuelta of [false, true]) {
        const local = vuelta ? grupo[j] : grupo[i]
        const visita = vuelta ? grupo[i] : grupo[j]
        const { homeGoals, awayGoals } = simulateMatchGoals(local.strength, visita.strength)
        anotar(tabla[local.name], homeGoals, awayGoals)
        anotar(tabla[visita.name], awayGoals, homeGoals)
      }
    }
  }

  const groupTable = ordenarTabla(Object.values(tabla))
  const puestoGrupo = groupTable.findIndex((f) => f.name === squad.label) + 1
  let eliminated = puestoGrupo > 2
  let eliminatedRound = eliminated ? 'Fase de Grupos' : ''

  // ── ELIMINATORIAS: ida y vuelta con global, penales si empatan. La final, a partido único ──
  const llaves: Array<{ nombre: string; unico: boolean }> = [
    { nombre: 'Octavos de Final', unico: false },
    { nombre: 'Cuartos de Final', unico: false },
    { nombre: 'Semifinal', unico: false },
    { nombre: 'Final', unico: true },
  ]

  let rivalQueMeElimino: ContinentalClub | null = null

  for (let k = 0; k < llaves.length && !eliminated; k++) {
    const llave = llaves[k]
    const rival = restoDelCuadro[k % restoDelCuadro.length]
    if (!rival) break

    if (llave.unico) {
      const { yo, el } = jugar(rival, true, 'Final Única')
      if (yo === el) {
        const [pYo, pEl] = penales(userStrength.overall, rival.strength.overall)
        roundMatches[roundMatches.length - 1].matches[0].penalties = `${pYo}-${pEl}`
        if (pYo < pEl) { eliminated = true; eliminatedRound = 'Final'; rivalQueMeElimino = rival }
      } else if (yo < el) {
        eliminated = true
        eliminatedRound = 'Final'
        rivalQueMeElimino = rival
      }
      break
    }

    const ida = jugar(rival, false, `${llave.nombre} · Ida`)
    const vuelta = jugar(rival, true, `${llave.nombre} · Vuelta`)
    const globalYo = ida.yo + vuelta.yo
    const globalEl = ida.el + vuelta.el

    if (globalYo === globalEl) {
      const [pYo, pEl] = penales(userStrength.overall, rival.strength.overall)
      roundMatches[roundMatches.length - 1].matches[0].penalties = `${pYo}-${pEl}`
      if (pYo < pEl) { eliminated = true; eliminatedRound = llave.nombre; rivalQueMeElimino = rival }
    } else if (globalYo < globalEl) {
      eliminated = true
      eliminatedRound = llave.nombre
      rivalQueMeElimino = rival
    }
  }

  const isChampion = !eliminated
  // Si quedaste afuera, el campeón sale del cuadro del otro lado. El que te eliminó entra con su
  // lugar ganado: es el más probable, no el único.
  const champion = isChampion
    ? squad.label
    : campeonDelOtroLado([rivalQueMeElimino, ...restoDelCuadro].filter(Boolean) as ContinentalClub[])

  // Puesto en la copa, para que el ranking distinga irse en la fase de grupos de perder la final.
  // Antes las dos cosas puntuaban igual (mitad de tabla), y perder una final no dolía ni pagaba.
  const PUESTO_POR_RONDA: Record<string, number> = {
    'Fase de Grupos': 24, 'Octavos de Final': 12, 'Cuartos de Final': 6, 'Semifinal': 3, 'Final': 2,
  }
  const playerPos = isChampion ? 1 : (PUESTO_POR_RONDA[eliminatedRound] ?? 24)

  const finalStats = Object.values(playerStatsMap)
  return {
    type: 'copa',
    playerPos,
    champion,
    isChampion,
    eliminated,
    eliminatedRound: eliminated ? eliminatedRound : undefined,
    playerStats: finalStats,
    topScorers: [...finalStats].sort((a, b) => b.goals - a.goals || b.assists - a.assists),
    topAssisters: [...finalStats].sort((a, b) => b.assists - a.assists || b.goals - a.goals),
    rounds: roundMatches,
    groupTable,
    groupPos: puestoGrupo,
    teamLabel: `${squad.label} (${title})`,
    formation: formation.id,
    teamScore,
    chronicle: chronicles,
  }
}
