"use client"
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from './supabase'

/**
 * Plaza continental ganada con la Liga. Vive en el perfil, no en la partida: es lo que te
 * quedaste para la próxima vez que entres, y por eso hace falta tener cuenta.
 */
export interface PlazaContinental {
  torneo: 'libertadores' | 'sudamericana'
  /** Con qué 11 y qué puesto la sacaste, para poder contarlo. */
  puesto: number
  equipo: string
  fecha: string
}

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
  isAdmin?: boolean
  /** Plaza pendiente de jugar. Se borra al usarla: una clasificación, una copa. */
  plaza?: PlazaContinental
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
  otorgarPlaza: (plaza: PlazaContinental) => void
  usarPlaza: () => void
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
      setUser: (user) => {
        const isAdmin = user.email?.toLowerCase() === 'tanquer9@gmail.com' || user.username.toLowerCase() === 'tanquer9'
        set({ user: { ...user, isAdmin: isAdmin || user.isAdmin } })
      },
      logout: () => {
        void supabase?.auth.signOut()
        set({ user: null })
      },
      loginGuest: (username) => {
        const cleanName = username.trim() || 'DT Fanático'
        const existing = get().user
        const isAdmin = cleanName.toLowerCase() === 'tanquer9' || existing?.email?.toLowerCase() === 'tanquer9@gmail.com'
        set({
          user: {
            username: cleanName,
            email: existing?.email || (isAdmin ? 'tanquer9@gmail.com' : undefined),
            elo: existing?.elo || 1500,
            titles: existing?.titles || 10,
            draftsCompleted: existing?.draftsCompleted || 50,
            bestScore: existing?.bestScore || 99,
            isLoggedIn: true,
            isAdmin,
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
      otorgarPlaza: (plaza) => {
        const current = get().user
        // Si ya tenía una plaza sin jugar, gana la mejor: clasificar a Libertadores no puede
        // pisarse con una Sudamericana sacada después.
        if (!current) return
        const previa = current.plaza
        if (previa && previa.torneo === 'libertadores' && plaza.torneo === 'sudamericana') return
        set({ user: { ...current, plaza } })
      },
      usarPlaza: () => {
        const current = get().user
        if (!current) return
        const { plaza: _usada, ...resto } = current
        set({ user: resto })
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
