"use client"
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from './supabase'

export interface UserProfile {
  username: string
  email?: string
  elo: number
  titles: number
  draftsCompleted: number
  bestScore: number
  favoriteClub?: string
  avatarUrl?: string
  isLoggedIn: boolean
}

interface UserStore {
  user: UserProfile | null
  isAuthModalOpen: boolean
  isProfileModalOpen: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  openProfileModal: () => void
  closeProfileModal: () => void
  setUser: (user: UserProfile) => void
  logout: () => void
  loginGuest: (username: string) => void
  addTitle: () => void
  updateElo: (delta: number) => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthModalOpen: false,
      isProfileModalOpen: false,
      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      openProfileModal: () => set({ isProfileModalOpen: true }),
      closeProfileModal: () => set({ isProfileModalOpen: false }),
      setUser: (user) => set({ user }),
      logout: () => {
        void supabase?.auth.signOut()
        set({ user: null })
      },
      loginGuest: (username) => {
        const cleanName = username.trim() || 'DT Fanático'
        const existing = get().user
        set({
          user: {
            username: cleanName,
            elo: existing?.elo || 1000,
            titles: existing?.titles || 0,
            draftsCompleted: existing?.draftsCompleted || 0,
            bestScore: existing?.bestScore || 0,
            isLoggedIn: true,
          },
          isAuthModalOpen: false,
        })
      },
      addTitle: () => {
        const current = get().user
        if (current) {
          set({
            user: {
              ...current,
              titles: current.titles + 1,
            },
          })
        }
      },
      updateElo: (delta) => {
        const current = get().user
        if (current) {
          set({
            user: {
              ...current,
              elo: Math.max(500, current.elo + delta),
            },
          })
        }
      },
    }),
    {
      name: 'ligastats_user_profile_v1',
      // Solo persistir el perfil. Si persistíamos isAuthModalOpen, tras el redirect de
      // OAuth (que recarga la página con el modal abierto) quedaba true y el recuadro
      // reaparecía en loop aunque el usuario ya estuviera logueado.
      partialize: (state) => ({ user: state.user }),
    }
  )
)
