"use client"

/**
 * Publicidad: la capa de decisión, aparte de los componentes que la dibujan.
 *
 * Por qué así y no con un banner arriba de todo, que es lo que se hace siempre:
 *
 * 1. **El formato manda sobre el volumen.** Medido en el mercado de juegos web (agosto 2026):
 *    un video recompensado paga entre 1 y 3 dólares cada mil vistas en Argentina, un
 *    intersticial la mitad, y un banner una fracción de eso. Con 1.700 usuarios por mes, la
 *    diferencia entre llenar la página de banners y poner dos avisos bien puestos es de
 *    centavos: lo único que cambia es cuánta gente se va. Así que van los dos formatos que
 *    pagan y ninguno de los que molestan.
 *
 * 2. **El recompensado no se sufre porque lo pide el jugador.** Se ofrece cuando se quedó sin
 *    comodines y quiere otro: mira el aviso si quiere, y si no sigue jugando igual. Es el único
 *    aviso que el jugador elige ver.
 *
 * 3. **El intersticial va entre partidas, nunca adentro de una.** Los que completan el draft
 *    hacen 5,4 drafts cada uno: hay corte natural entre uno y otro. Adentro del draft no hay
 *    nada, y en el reto diario tampoco: es la partida que se comparte.
 *
 * Nada de esto carga un byte si no está `NEXT_PUBLIC_ADSENSE_CLIENT`, igual que Analytics.
 *
 * La API es la Ad Placement API de AdSense (`adBreak`/`adConfig`), la misma que usan los
 * juegos H5: developers.google.com/ad-placement/apis
 */

import { estaEmbebido } from './embebido'

export const AD_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || ''
/** Bloque de display para las páginas de contenido (equipos, datos, cómo jugar, ranking). */
export const AD_SLOT_CONTENIDO = process.env.NEXT_PUBLIC_ADSENSE_SLOT_CONTENIDO || ''

/** Cada cuánto, como mucho, puede aparecer un intersticial. La pauta de AdSense es 120 s. */
const FRECUENCIA_HINT = '180s'

/**
 * Cuánto se espera a que AdSense dé señales de vida antes de seguir sin él.
 *
 * `adBreakDone` tiene que dispararse siempre, pero si un bloqueador se comió el script no se
 * dispara nada y el jugador se queda mirando un botón que no hace nada. El bloqueador no es un
 * caso raro: es una parte del tráfico.
 *
 * El reloj mide hasta que la API contesta, NO hasta que termina el aviso: un video recompensado
 * dura más que esto y cortarlo por tiempo sería negarle el premio a alguien que lo miró entero.
 */
const ESPERA_MAX_MS = 8000

/** Dos intersticiales no van pegados. Que no aparezca al principio se decide en cada llamada. */
const MIN_ENTRE_INTERSTICIALES_MS = 4 * 60 * 1000

export type ResultadoAviso = 'visto' | 'descartado' | 'sin-aviso'

interface PlacementInfo {
  breakType?: string
  breakName?: string
  breakFormat?: string
  breakStatus?: string
}

interface AdBreakParams {
  type: 'preroll' | 'start' | 'pause' | 'next' | 'browse' | 'reward'
  name: string
  beforeAd?: () => void
  afterAd?: () => void
  beforeReward?: (mostrarAviso: () => void) => void
  adDismissed?: () => void
  adViewed?: () => void
  adBreakDone?: (info: PlacementInfo) => void
}

declare global {
  interface Window {
    adsbygoogle?: unknown[]
    adBreak?: (params: AdBreakParams) => void
    adConfig?: (params: Record<string, string>) => void
  }
}

/**
 * ¿Se pueden mostrar avisos acá?
 *
 * Adentro del reproductor de un portal, NO. CrazyGames, Poki y GameDistribution monetizan ellos
 * el juego y su reglamento prohíbe que el juego traiga su propia publicidad; un aviso nuestro
 * adentro de su iframe es motivo de rechazo. Es la misma razón por la que ahí tampoco se ofrece
 * el login (ver `lib/embebido.ts`).
 */
export function adsHabilitados(): boolean {
  if (!AD_CLIENT || typeof window === 'undefined') return false
  return !estaEmbebido(window)
}

/** El atributo del script del cargador. Está acá para que el componente no invente valores. */
export const FRECUENCIA_INTERSTICIALES = FRECUENCIA_HINT

function pedirAviso(params: AdBreakParams): boolean {
  try {
    if (typeof window.adBreak === 'function') {
      window.adBreak(params)
      return true
    }
  } catch {
    /* cae al camino de abajo */
  }
  return false
}

/**
 * Video recompensado. Devuelve qué pasó; el premio lo da quien llama, y solo con `'visto'`.
 *
 * `beforeReward` recibe la función que muestra el aviso: el que decide es el jugador, y para
 * cuando llegamos acá ya tocó el botón que dice qué gana, así que se muestra en el acto en vez
 * de abrir un segundo cartel para preguntar lo mismo.
 */
export function verAvisoRecompensado(nombre: string): Promise<ResultadoAviso> {
  return new Promise((resolve) => {
    if (!adsHabilitados()) return resolve('sin-aviso')

    let resuelto = false
    const cerrar = (r: ResultadoAviso) => {
      if (resuelto) return
      resuelto = true
      clearTimeout(reloj)
      resolve(r)
    }
    const reloj = setTimeout(() => cerrar('sin-aviso'), ESPERA_MAX_MS)

    const pedido = pedirAviso({
      type: 'reward',
      name: nombre,
      beforeReward: (mostrarAviso) => {
        // AdSense contestó: a partir de acá manda el aviso y no el reloj.
        clearTimeout(reloj)
        mostrarAviso()
      },
      adViewed: () => cerrar('visto'),
      adDismissed: () => cerrar('descartado'),
      // Llega también después de `adViewed`/`adDismissed`; `cerrar` ya resolvió y no hace nada.
      adBreakDone: () => cerrar('sin-aviso'),
    })

    if (!pedido) cerrar('sin-aviso')
  })
}

let ultimoIntersticial = 0

/**
 * Intersticial entre partidas. No devuelve nada: el juego no espera a un aviso para arrancar.
 *
 * El tope propio es más duro que el de AdSense a propósito. AdSense frena por tiempo desde el
 * aviso anterior; acá además no se pide antes de los primeros minutos de la visita, porque el
 * que llega y ve un aviso antes de jugar se va, y el que se va no vuelve ni deja plata.
 */
export function verIntersticial(nombre: string): void {
  if (!adsHabilitados()) return

  const ahora = Date.now()
  if (ultimoIntersticial && ahora - ultimoIntersticial < MIN_ENTRE_INTERSTICIALES_MS) return
  ultimoIntersticial = ahora

  pedirAviso({
    type: 'next',
    name: nombre,
    beforeAd: () => {},
    afterAd: () => {},
  })
}

/** Para las pruebas: vuelve a dejar el contador en cero. */
export function _reiniciarFrecuencia(): void {
  ultimoIntersticial = 0
}
