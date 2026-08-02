// Simula carreras completas con el motor del juego, para sacar fichas de promoción reales.
//
// No inventa nada: corre exactamente el mismo lazo que lib/career-store.ts, temporada por
// temporada, con el mismo azar. Lo que sale en las placas de X es una carrera que un jugador
// podría haber tenido, no una maqueta.
//
// Se compila con vite (ver scripts/fichas-promo.mjs) porque career-engine importa el dataset
// con el alias @/ y JSON, y node solo no lo resuelve.
import {
  MAX_SEASONS,
  advancePlayer,
  findClub,
  makeRng,
  marketValueFor,
  nationalTeamSeason,
  nextContinentalFrom,
  playsMundialClubesFrom,
  retirementStory,
  simulateSeason,
  sortearTalento,
  type CareerState,
} from '@/lib/career-engine'
import { leyendaParecida } from '@/lib/career-legend'

export interface Arranque {
  name: string
  position: string
  clubId: string
  ovr: number
  nationality?: string
  flag?: string
}

function nueva(a: Arranque, rng: () => number): CareerState {
  return {
    player: {
      name: a.name,
      number: 10,
      position: a.position,
      nationality: a.nationality ?? 'Argentina',
      flag: a.flag ?? '🇦🇷',
      ovr: a.ovr,
      age: 16,
      marketValueM: marketValueFor(a.ovr, 16),
    },
    clubId: a.clubId,
    startYear: 2026,
    seasonsPlayed: 0,
    totals: { matchesPlayed: 0, goals: 0, assists: 0 },
    trophies: {},
    clubHistory: [a.clubId],
    history: [],
    pendingOffers: [],
    nextContinental: 'sudamericana',
    milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
    finished: false,
    talento: sortearTalento(rng),
  }
}

/** Una temporada, igual que simulateNextSeason del store. */
function temporada(state: CareerState, rng: () => number): CareerState {
  const { season, trophiesWon, offers } = simulateSeason(state, rng)

  const trophies = { ...state.trophies }
  trophiesWon.forEach((id) => {
    trophies[id] = (trophies[id] || 0) + 1
  })

  const milestones = { ...state.milestones }
  const nt = nationalTeamSeason({
    nationality: state.player.nationality,
    ovr: season.ovr,
    performance: season.performance ?? 0.5,
    year: season.year,
    wasCalledUp: milestones.nationalTeam,
    position: state.player.position,
    rng,
  })
  if (nt.debut) milestones.nationalTeam = true
  season.ntDebut = nt.debut
  season.worldCup = nt.worldCup
  if (nt.worldCup && nt.worldCup.puntaje >= 0.55) {
    const plus = nt.worldCup.campeon ? 2 : nt.worldCup.puntaje >= 0.75 ? 2 : 1
    season.nextOvr = Math.min(99, (season.nextOvr ?? season.ovr) + plus)
  }
  season.clasificoLibertadores =
    state.nextContinental !== 'libertadores' && nextContinentalFrom(season) === 'libertadores'
  const yaEstuvoEnEuropa = state.clubHistory.some((id) => findClub(id)?.region === 'euro')
  const yaLoBuscaron = state.history.some((h) => h.euroOffer)
  season.euroOffer = !yaEstuvoEnEuropa && !yaLoBuscaron && offers.some((o) => o.region === 'euro')
  milestones.ntCaps = (milestones.ntCaps || 0) + nt.caps
  milestones.ntGoals = (milestones.ntGoals || 0) + nt.goals
  if (nt.worldCupChampion) {
    milestones.worldCup = true
    trophies['mundial'] = (trophies['mundial'] || 0) + 1
  }
  if (season.topScorer) milestones.goldenBoots += 1

  const euroClub = findClub(state.clubId)?.region === 'euro'
  const bdoEligible =
    season.ovr >= 90 &&
    (nt.worldCupChampion || season.continentalWon || (euroClub && season.liga) || season.rating >= 9.3)
  if (bdoEligible && rng() < 0.45) {
    milestones.balonDeOro += 1
    season.ballonDor = true
  }

  const seasonsPlayed = state.seasonsPlayed + 1
  return {
    ...state,
    player: advancePlayer(state, season),
    seasonsPlayed,
    totals: {
      matchesPlayed: state.totals.matchesPlayed + season.matchesPlayed,
      goals: state.totals.goals + season.goals,
      assists: state.totals.assists + season.assists,
    },
    trophies,
    history: [...state.history, season],
    pendingOffers: offers,
    nextContinental: nextContinentalFrom(season),
    playsMundialClubes: playsMundialClubesFrom(season),
    milestones,
    finished: seasonsPlayed >= MAX_SEASONS,
  }
}

/** Acepta la mejor oferta si mejora al club actual, que es lo que hace casi todo el mundo. */
function decidirFichaje(state: CareerState): CareerState {
  if (!state.pendingOffers.length) return state
  const actual = findClub(state.clubId)
  const mejor = [...state.pendingOffers].sort((a, b) => b.strength - a.strength)[0]
  if (!actual || mejor.strength <= actual.strength) return { ...state, pendingOffers: [] }
  return {
    ...state,
    clubId: mejor.clubId,
    clubHistory: state.clubHistory.includes(mejor.clubId)
      ? state.clubHistory
      : [...state.clubHistory, mejor.clubId],
    player: {
      ...state.player,
      marketValueM: Math.min(
        Math.max(state.player.marketValueM, mejor.valueM),
        Math.round(marketValueFor(state.player.ovr, state.player.age) * 1.25 * 100) / 100,
      ),
    },
    pendingOffers: [],
  }
}

/** Una carrera de las 15 temporadas, de punta a punta. */
export function carreraCompleta(a: Arranque, semilla: number) {
  const rng = makeRng(semilla)
  let state = nueva(a, rng)
  while (!state.finished) {
    state = decidirFichaje(state)
    state = temporada(state, rng)
  }

  const pico = Math.max(state.player.ovr, ...state.history.map((s) => s.nextOvr ?? s.ovr))
  const titulos = Object.values(state.trophies).reduce((x, y) => x + y, 0)
  const clubes = new Set(state.history.map((s) => s.clubId)).size
  const parecido = leyendaParecida(state)

  return {
    jugador: state.player.name,
    posicion: state.player.position,
    temporadas: state.seasonsPlayed,
    pico,
    titulos,
    trofeos: state.trophies,
    clubes,
    recorrido: state.clubHistory.map((id) => findClub(id)?.name ?? id),
    partidos: state.totals.matchesPlayed,
    goles: state.totals.goals,
    asistencias: state.totals.assists,
    mundial: state.milestones.worldCup,
    balonDeOro: state.milestones.balonDeOro,
    botasDeOro: state.milestones.goldenBoots,
    seleccion: state.milestones.nationalTeam,
    caps: state.milestones.ntCaps ?? 0,
    golesSeleccion: state.milestones.ntGoals ?? 0,
    parecido: { nombre: parecido.leyenda.nombre, bajada: parecido.leyenda.bajada, pct: parecido.parecido },
    retiro: retirementStory(state),
  }
}
