import { describe, it, expect } from 'vitest'
import { profileFromSupabaseUser } from '@/lib/auth'

describe('profileFromSupabaseUser', () => {
  it('maps OAuth metadata to a profile', () => {
    const p = profileFromSupabaseUser(
      { email: 'dt@example.com', user_metadata: { full_name: 'El Romi', avatar_url: 'https://img/a.png' } },
      null,
    )
    expect(p.username).toBe('El Romi')
    expect(p.email).toBe('dt@example.com')
    expect(p.avatarUrl).toBe('https://img/a.png')
    expect(p.isLoggedIn).toBe(true)
    expect(p.elo).toBe(1000)
  })

  it('preserves locally-earned stats from an existing profile', () => {
    const existing = {
      username: 'old',
      elo: 1450,
      titles: 3,
      draftsCompleted: 12,
      bestScore: 88,
      isLoggedIn: true,
    }
    const p = profileFromSupabaseUser(
      { email: 'x@y.com', user_metadata: { name: 'Nuevo' } },
      existing,
    )
    expect(p.elo).toBe(1450)
    expect(p.titles).toBe(3)
    expect(p.draftsCompleted).toBe(12)
    expect(p.username).toBe('Nuevo')
  })

  it('falls back to the email local-part when no name is present', () => {
    const p = profileFromSupabaseUser({ email: 'scaloni@afa.com', user_metadata: {} }, null)
    expect(p.username).toBe('scaloni')
  })
})
