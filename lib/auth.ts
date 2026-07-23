"use client"
import { supabase, isSupabaseConfigured } from './supabase'
import type { UserProfile } from './user-store'

export type OAuthProvider = 'google' | 'twitter'

/**
 * Base path for OAuth redirect. Must match the deployed GH Pages sub-path and be
 * whitelisted in the Supabase dashboard (Auth > URL Configuration > Redirect URLs).
 */
function redirectTo(): string {
  if (typeof window === 'undefined') return ''
  return `${window.location.origin}/LigaStatsGame/`
}

/** Start the OAuth redirect flow. No-op (returns false) when Supabase is not configured. */
export async function signInWithProvider(provider: OAuthProvider): Promise<boolean> {
  if (!supabase) return false
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: redirectTo() },
  })
  return !error
}

/** Sign out of Supabase (safe to call when unconfigured). */
export async function signOutSupabase(): Promise<void> {
  await supabase?.auth.signOut()
}

/**
 * Map a Supabase auth user to our UserProfile shape, preserving locally-earned
 * stats (elo/titles/...) from any existing profile so social login never resets progress.
 */
export function profileFromSupabaseUser(
  supabaseUser: { email?: string | null; user_metadata?: Record<string, any> },
  existing: UserProfile | null,
): UserProfile {
  const meta = supabaseUser.user_metadata || {}
  const username =
    meta.full_name || meta.name || meta.user_name || (supabaseUser.email?.split('@')[0]) || 'DT Fanático'
  const avatarUrl = meta.avatar_url || meta.picture || undefined
  return {
    username,
    email: supabaseUser.email || undefined,
    avatarUrl,
    elo: existing?.elo ?? 1000,
    titles: existing?.titles ?? 0,
    draftsCompleted: existing?.draftsCompleted ?? 0,
    bestScore: existing?.bestScore ?? 0,
    favoriteClub: existing?.favoriteClub,
    isLoggedIn: true,
  }
}

export { isSupabaseConfigured }
