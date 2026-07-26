"use client"
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CareerCardData } from '@/components/pitch/CareerCardView'
import {
  type CareerState,
  type TransferOffer,
  MAX_SEASONS,
  TROPHY_META,
  findClub,
  marketValueFor,
  makeRng,
  simulateSeason,
  advancePlayer,
  nextContinentalFrom,
  nationalTeamSeason,
} from './career-engine'

export interface CareerSetup {
  name: string
  number: number
  position: string
  nationality: string
  flag: string
  ovr: number
  age: number
  clubId: string
}

interface CareerStore {
  career: CareerState | null
  startCareer: (setup: CareerSetup) => void
  simulateNextSeason: (decisionOptionId?: string) => void
  acceptOffer: (clubId: string) => void
  declineOffers: () => void
  retire: () => void
  resetCareer: () => void
}

const CURRENT_YEAR = new Date().getFullYear()

export const useCareerStore = create<CareerStore>()(
  persist(
    (set, get) => ({
      career: null,

      startCareer: (setup) => {
        const marketValueM = marketValueFor(setup.ovr, setup.age)
        set({
          career: {
            player: {
              name: setup.name.trim() || 'Mi Crack',
              number: setup.number,
              position: setup.position,
              nationality: setup.nationality,
              flag: setup.flag,
              ovr: setup.ovr,
              age: setup.age,
              marketValueM,
            },
            clubId: setup.clubId,
            startYear: CURRENT_YEAR,
            seasonsPlayed: 0,
            totals: { matchesPlayed: 0, goals: 0, assists: 0 },
            trophies: {},
            clubHistory: [setup.clubId],
            history: [],
            pendingOffers: [],
            nextContinental: 'sudamericana',
            milestones: { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false },
            finished: false,
          },
        })
      },

      simulateNextSeason: (decisionOptionId) => {
        const state = get().career
        if (!state || state.finished || state.pendingOffers.length > 0) return

        const rng = makeRng(Math.floor(Math.random() * 1_000_000_000))
        const { season, trophiesWon, offers } = simulateSeason(state, rng, decisionOptionId)

        const trophies = { ...state.trophies }
        trophiesWon.forEach((id) => {
          trophies[id] = (trophies[id] || 0) + 1
        })

        // Selección nacional: atada a la nacionalidad (convocatoria, partidos, Mundial real).
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
        milestones.ntCaps = (milestones.ntCaps || 0) + nt.caps
        milestones.ntGoals = (milestones.ntGoals || 0) + nt.goals
        if (nt.worldCupChampion) {
          milestones.worldCup = true
          trophies['mundial'] = (trophies['mundial'] || 0) + 1
        }
        nt.highlights.forEach((h) => season.highlights.push(h))

        // Otros hitos
        if (season.topScorer) milestones.goldenBoots += 1
        // Balón de Oro: la competencia entre los mejores del mundo. Hace falta un OVR de élite
        // (90+) y una temporada consagratoria (Champions/Libertadores, campeón del mundo, o
        // liga en Europa, o un año descomunal). No garantizado: es EL premio.
        const euroClub = findClub(state.clubId)?.region === 'euro'
        const bdoEligible =
          season.ovr >= 90 &&
          (nt.worldCupChampion || season.continentalWon || (euroClub && season.liga) || season.rating >= 9.3)
        if (bdoEligible && rng() < 0.45) {
          milestones.balonDeOro += 1
          season.ballonDor = true
          season.highlights.unshift(`🏆🥇 ¡Ganaste el BALÓN DE ORO ${season.year}!`)
        }

        const player = advancePlayer(state, season)
        const seasonsPlayed = state.seasonsPlayed + 1

        set({
          career: {
            ...state,
            player,
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
            milestones,
            finished: seasonsPlayed >= MAX_SEASONS,
          },
        })
      },

      acceptOffer: (clubId) => {
        const state = get().career
        if (!state) return
        const offer = state.pendingOffers.find((o) => o.clubId === clubId)
        if (!offer) return
        // Momento del fichaje: si es el salto a Europa, queda marcado en la temporada.
        const history = [...state.history]
        const fromRegion = findClub(state.clubId)?.region
        if (history.length > 0) {
          const last = { ...history[history.length - 1], highlights: [...history[history.length - 1].highlights] }
          if (offer.region === 'euro' && fromRegion !== 'euro') {
            last.highlights.unshift(`${offer.flag || '🌍'} ¡EL SALTO A EUROPA! Te fichó el ${offer.clubName} por €${offer.valueM}M`)
          } else {
            last.highlights.unshift(`✍️ Fichaste por el ${offer.clubName} (€${offer.valueM}M)`)
          }
          history[history.length - 1] = last
        }
        set({
          career: {
            ...state,
            clubId: offer.clubId,
            clubHistory: state.clubHistory.includes(offer.clubId)
              ? state.clubHistory
              : [...state.clubHistory, offer.clubId],
            // El traspaso es lo que PAGA el club, no lo que vale el jugador: guardar el máximo
            // inflaba el precio fichaje tras fichaje hasta valores absurdos. El valor sigue la
            // curva de OVR/edad, con un plus del 25% por el pase.
            player: {
              ...state.player,
              marketValueM: Math.min(
                Math.max(state.player.marketValueM, offer.valueM),
                Math.round(marketValueFor(state.player.ovr, state.player.age) * 1.25 * 100) / 100,
              ),
            },
            history,
            pendingOffers: [],
          },
        })
      },

      declineOffers: () => {
        const state = get().career
        if (!state) return
        set({ career: { ...state, pendingOffers: [] } })
      },

      retire: () => {
        const state = get().career
        if (!state) return
        set({ career: { ...state, finished: true, pendingOffers: [] } })
      },

      resetCareer: () => set({ career: null }),
    }),
    {
      name: 'ligastats_career_v1',
      version: 2,
      // Carreras guardadas por versiones previas no tienen milestones/rating/highlights.
      migrate: (persisted: any) => {
        const s = persisted
        if (s?.career) {
          s.career.milestones = s.career.milestones || { nationalTeam: false, balonDeOro: 0, goldenBoots: 0, worldCup: false }
          s.career.history = (s.career.history || []).map((h: any) => ({ rating: 7, topScorer: false, highlights: [], ...h }))
        }
        return s
      },
    },
  ),
)

/** Build the visual ficha data from career state (clubs = trajectory, trophies with counts). */
export function buildCareerCardData(state: CareerState): CareerCardData {
  const clubs = state.clubHistory.map((id) => {
    const c = findClub(id)
    // Todos los clubes (incluidos los europeos) tienen escudo en /logos/clubs.
    return {
      id,
      name: c?.name ?? id,
      logoUrl: c ? `/logos/clubs/${id}.png` : undefined,
    }
  })

  const trophies = Object.entries(state.trophies)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({
      id,
      name: TROPHY_META[id]?.name ?? id,
      icon: TROPHY_META[id]?.icon ?? '🏆',
      count,
    }))

  return {
    playerName: state.player.name,
    number: state.player.number,
    position: state.player.position,
    overall: state.player.ovr,
    marketValue: `€${state.player.marketValueM}M`,
    nationalityFlag: state.player.flag,
    matchesPlayed: state.totals.matchesPlayed,
    goals: state.totals.goals,
    assists: state.totals.assists,
    clubs,
    trophies,
  }
}

export type { TransferOffer }
