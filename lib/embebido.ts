"use client"

import { useEffect, useState } from 'react'

/**
 * ¿El juego está corriendo adentro del reproductor de otro sitio?
 *
 * Los portales de juegos (CrazyGames, Poki, itch.io) sirven el juego dentro de un iframe en su
 * dominio, y CrazyGames prohíbe expresamente que el juego ofrezca su propio login:
 * "Logging out in the game and allowing login with external login options (e.g. Facebook,
 * Google, email) is not allowed" (docs.crazygames.com/requirements/account-integration).
 * Su revisión lo marca antes de publicar.
 *
 * Todo el juego anda sin cuenta —la cuenta solo hace que el ELO cuente en el ranking global—,
 * así que embebido simplemente no se ofrece: se juega de invitado.
 *
 * Se resuelve DESPUÉS del montaje. El sitio es un export estático: si esto se evaluara durante
 * el render, el HTML del servidor y el del navegador no coincidirían y React redibujaría la
 * página entera. Hasta que monta devuelve `false`, que es el caso normal (nadie embebido).
 */
/**
 * La comprobación, aparte del hook y sin tocar `window` global, para poder probarla.
 *
 * En un iframe del mismo origen `top` se lee sin problema; en uno de otro dominio —que es el
 * caso de los portales— el acceso tira excepción, y esa excepción ya es la respuesta.
 */
export function estaEmbebido(w: { self: unknown; top: unknown }): boolean {
  try {
    return w.self !== w.top
  } catch {
    return true
  }
}

export function useEmbebido(): boolean {
  const [embebido, setEmbebido] = useState(false)

  useEffect(() => setEmbebido(estaEmbebido(window)), [])

  return embebido
}
