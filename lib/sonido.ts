"use client"
// Sonido del juego, sintetizado.
//
// No hay un solo archivo de audio: todo se genera con la Web Audio API. Un mp3 de un segundo pesa
// más que este archivo entero, y acá no hay licencias que revisar ni nada que descargar antes de
// que suene. Son tres sonidos y alcanzan.
//
// Reglas que no se rompen:
//   · Arranca APAGADO. Un sitio que suena sin que se lo pidan es un sitio que se cierra.
//   · El AudioContext se crea recién en el primer gesto del usuario: los navegadores no dejan
//     crearlo antes, y hacerlo tira un warning en consola en cada carga.
//   · Si algo falla, no pasa nada. El juego se juega igual sin sonido.

const KEY = 'gambeta_sonido_v1'

let ctx: AudioContext | null = null

/** ¿El usuario lo prendió? Por defecto, no. */
export function sonidoActivo(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setSonidoActivo(v: boolean) {
  try {
    localStorage.setItem(KEY, v ? '1' : '0')
  } catch {
    /* modo privado */
  }
}

function contexto(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

/** Una nota. `tipo` cambia el timbre: seno es suave, cuadrada es de consola vieja. */
function nota(freq: number, desde: number, dur: number, vol = 0.18, tipo: OscillatorType = 'sine') {
  const c = contexto()
  if (!c) return
  const osc = c.createOscillator()
  const gan = c.createGain()
  osc.type = tipo
  osc.frequency.setValueAtTime(freq, c.currentTime + desde)
  // Ataque corto y caída exponencial: sin esto, cada nota termina en un clic.
  gan.gain.setValueAtTime(0.0001, c.currentTime + desde)
  gan.gain.exponentialRampToValueAtTime(vol, c.currentTime + desde + 0.012)
  gan.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + desde + dur)
  osc.connect(gan).connect(c.destination)
  osc.start(c.currentTime + desde)
  osc.stop(c.currentTime + desde + dur + 0.02)
}

export type Sonido = 'giro' | 'ficha' | 'legendario' | 'campeon'

/**
 * Toca uno de los sonidos del juego. Silencioso si el usuario no lo prendió.
 *
 * Vibra siempre que el dispositivo pueda, esté el sonido prendido o no: el golpecito no molesta
 * a nadie en un colectivo y es lo que le da peso al momento en un teléfono.
 */
export function tocar(s: Sonido) {
  try {
    const patron: Record<Sonido, number[]> = {
      giro: [8],
      ficha: [14],
      legendario: [10, 45, 90],
      campeon: [16, 60, 16, 60, 120],
    }
    navigator.vibrate?.(patron[s])
  } catch {
    /* el navegador no lo soporta */
  }

  if (!sonidoActivo()) return

  switch (s) {
    case 'giro':
      // Un tic corto y seco, como la ruleta pasando de casillero.
      nota(880, 0, 0.05, 0.08, 'square')
      break
    case 'ficha':
      // Confirmación de dos notas que sube: "listo, fichado".
      nota(523.25, 0, 0.09, 0.14)
      nota(783.99, 0.07, 0.12, 0.12)
      break
    case 'legendario':
      // Arpegio ascendente: es el sonido de que te tocó algo bueno.
      ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => nota(f, i * 0.075, 0.22, 0.16))
      break
    case 'campeon':
      // Fanfarria corta, en mayor, con la última nota sostenida.
      ;[523.25, 659.25, 783.99].forEach((f, i) => nota(f, i * 0.1, 0.26, 0.17, 'triangle'))
      nota(1046.5, 0.3, 0.75, 0.2, 'triangle')
      nota(1318.5, 0.32, 0.7, 0.12, 'triangle')
      break
  }
}
