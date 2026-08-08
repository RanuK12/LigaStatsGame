import { describe, it, expect } from 'vitest'
import { estaEmbebido } from '@/lib/embebido'

/**
 * CrazyGames rechaza los juegos que ofrecen su propio login: "Logging out in the game and
 * allowing login with external login options (e.g. Facebook, Google, email) is not allowed".
 * El header, el pedido de cuenta del final del torneo y la página de retos se apoyan en esto
 * para saber si están adentro del reproductor de un portal. Si devuelve mal el valor, o se
 * ofrece login donde está prohibido, o desaparece el botón para todo el mundo.
 */
describe('detectar que el juego corre embebido', () => {
  it('en el sitio propio, `top` es uno mismo: no está embebido', () => {
    const w: any = {}
    w.self = w
    w.top = w
    expect(estaEmbebido(w)).toBe(false)
  })

  it('dentro de un iframe del mismo origen, se detecta', () => {
    const propia: any = {}
    propia.self = propia
    propia.top = {}
    expect(estaEmbebido(propia)).toBe(true)
  })

  /** En un iframe de otro dominio leer `top` tira excepción, y eso ya es la respuesta. */
  it('un iframe de otro dominio también cuenta como embebido', () => {
    const propia: any = {}
    propia.self = propia
    Object.defineProperty(propia, 'top', {
      get() {
        throw new Error('Blocked a frame from accessing a cross-origin frame.')
      },
    })
    expect(estaEmbebido(propia)).toBe(true)
  })
})
