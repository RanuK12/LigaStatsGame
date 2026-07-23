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
  simulateNextSeason: () => void
  acceptOffer: (clubId: string) => void
  declineOffers: () => void
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

      simulateNextSeason: () => {
        const state = get().career
        if (!state || state.finished || state.pendingOffers.length > 0) return

        const rng = makeRng(Math.floor(Math.random() * 1_000_000_000))
        const { season, trophiesWon, offers } = simulateSeason(state, rng)

        const trophies = { ...state.trophies }
        trophiesWon.forEach((id) => {
          trophies[id] = (trophies[id] || 0) + 1
        })

        // Hitos de carrera (debut en Selección, Balón de Oro, botines de oro)
        const milestones = { ...state.milestones }
        const nation = state.player.nationality === 'Argentina' ? 'Argentina' : state.player.nationality
        if (!milestones.nationalTeam && season.ovr >= 80) {
          milestones.nationalTeam = true
          season.highlights.unshift(`${state.player.flag} Debutaste en la Selección de ${nation}`)
        }
        if (season.topScorer) milestones.goldenBoots += 1
        if (season.ovr >= 88 && (season.liga || season.continentalWon) && rng() < 0.6) {
          milestones.balonDeOro += 1
          season.highlights.unshift(`🏅 Ganaste el Balón de Oro`)
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
        set({
          career: {
            ...state,
            clubId: offer.clubId,
            clubHistory: state.clubHistory.includes(offer.clubId)
              ? state.clubHistory
              : [...state.clubHistory, offer.clubId],
            player: { ...state.player, marketValueM: Math.max(state.player.marketValueM, offer.valueM) },
            pendingOffers: [],
          },
        })
      },

      declineOffers: () => {
        const state = get().career
        if (!state) return
        set({ career: { ...state, pendingOffers: [] } })
      },

      resetCareer: () => set({ career: null }),
    }),
    { name: 'ligastats_career_v1' },
  ),
)

/** Build the visual ficha data from career state (clubs = trajectory, trophies with counts). */
export function buildCareerCardData(state: CareerState): CareerCardData {
  const clubs = state.clubHistory.map((id) => {
    const c = findClub(id)
    return {
      id,
      name: c?.name ?? id,
      logoUrl: c ? `/LigaStatsGame/logos/clubs/${id}.png` : undefined,
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
