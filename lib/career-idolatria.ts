import type { CareerState, SeasonResult } from './career-engine'

/**
 * La idolatría: cuánto te quiere la gente de UN club.
 *
 * Copiada de El Ídolo (potrerofutbol.ar), medido el 2026-08-03. Es la mecánica que hace que
 * quedarse valga algo: sin esto el modo carrera premia siempre agarrar la oferta más grande, y
 * la carrera termina siendo una lista de clubes en vez de una historia.
 *
 * No se guarda en el estado: se calcula del historial. La carrera ya tiene todo lo que hace
 * falta —en qué club jugó cada año, cuántos goles hizo y qué ganó—, así que un campo nuevo solo
 * agregaría una segunda fuente de verdad que se puede desincronizar.
 */

export interface NivelIdolatria {
  id: 'uno-mas' | 'querido' | 'referente' | 'idolo' | 'leyenda'
  nombre: string
  icono: string
  /** Puntos a partir de los cuales se entra al nivel. */
  desde: number
  descripcion: string
}

export const NIVELES: NivelIdolatria[] = [
  { id: 'uno-mas', nombre: 'Uno más', icono: '▫️', desde: 0, descripcion: 'Recién llegás. Sos uno más del plantel.' },
  { id: 'querido', nombre: 'Querido', icono: '👏', desde: 40, descripcion: 'El hincha empieza a bancarte.' },
  { id: 'referente', nombre: 'Referente', icono: '💙', desde: 100, descripcion: 'Sos una pieza clave. El equipo te mira a vos.' },
  { id: 'idolo', nombre: 'Ídolo', icono: '⭐', desde: 190, descripcion: 'Tu nombre ya es canción de tribuna.' },
  { id: 'leyenda', nombre: 'Leyenda', icono: '🗿', desde: 300, descripcion: 'Tenés tu estatua en la puerta del estadio.' },
]

export interface Idolatria {
  clubId: string
  clubName: string
  puntos: number
  nivel: NivelIdolatria
  /** El siguiente nivel y cuánto falta. `null` cuando ya es Leyenda. */
  siguiente: { nivel: NivelIdolatria; faltan: number } | null
  /** 0..1 dentro del nivel actual, para la barra. */
  progreso: number
  temporadas: number
  goles: number
  titulos: number
  /** Temporadas seguidas en el club, que es lo que de verdad paga. */
  rachaMasLarga: number
}

/** Los títulos que suma una temporada. La Copa Argentina también cuenta: la ganás con el club. */
function titulosDe(s: SeasonResult): number {
  return (s.liga ? 1 : 0) + (s.copaArgentina ? 1 : 0) + (s.continentalWon ? 1 : 0) + (s.mundialClubesGanado ? 1 : 0)
}

/**
 * Racha más larga de temporadas SEGUIDAS en el club, mirando el historial completo.
 *
 * Se calcula sobre temporadas consecutivas y no sobre el total: irse y volver dos veces no es lo
 * mismo que quedarse cuatro años, y la diferencia entre esas dos carreras es justamente lo que
 * la idolatría tiene que premiar.
 */
function rachaEn(history: SeasonResult[], clubId: string): number {
  let mejor = 0
  let actual = 0
  for (const s of history) {
    if (s.clubId === clubId) {
      actual += 1
      if (actual > mejor) mejor = actual
    } else {
      actual = 0
    }
  }
  return mejor
}

export function nivelPara(puntos: number): NivelIdolatria {
  let n = NIVELES[0]
  for (const x of NIVELES) if (puntos >= x.desde) n = x
  return n
}

/**
 * Idolatría de un club puntual.
 *
 * Los pesos están puestos para que el camino a la estatua sea la lealtad y no el goleo: seis
 * temporadas seguidas en el mismo club con títulos llegan; dos temporadas con muchos goles, no.
 */
export function idolatriaDeClub(history: SeasonResult[], clubId: string, clubName?: string): Idolatria {
  const suyas = history.filter((s) => s.clubId === clubId)
  const goles = suyas.reduce((a, s) => a + s.goals, 0)
  const titulos = suyas.reduce((a, s) => a + titulosDe(s), 0)
  const racha = rachaEn(history, clubId)

  const puntos = Math.round(
    suyas.length * 14 + // estar
      racha * racha * 3 + // quedarse, que crece más que lineal
      goles * 1.2 +
      titulos * 30,
  )

  const nivel = nivelPara(puntos)
  const idx = NIVELES.findIndex((n) => n.id === nivel.id)
  const prox = NIVELES[idx + 1] ?? null
  const progreso = prox ? Math.min(1, (puntos - nivel.desde) / (prox.desde - nivel.desde)) : 1

  return {
    clubId,
    clubName: clubName || suyas[suyas.length - 1]?.clubName || clubId,
    puntos,
    nivel,
    siguiente: prox ? { nivel: prox, faltan: Math.max(0, prox.desde - puntos) } : null,
    progreso,
    temporadas: suyas.length,
    goles,
    titulos,
    rachaMasLarga: racha,
  }
}

/** La idolatría en el club donde está jugando ahora. */
export function idolatriaActual(career: CareerState): Idolatria {
  return idolatriaDeClub(career.history, career.clubId)
}

/** Todas, de mayor a menor. La primera es la que va en la ficha final. */
export function idolatriaPorClub(career: CareerState): Idolatria[] {
  const ids: string[] = []
  for (const s of career.history) if (!ids.includes(s.clubId)) ids.push(s.clubId)
  return ids.map((id) => idolatriaDeClub(career.history, id)).sort((a, b) => b.puntos - a.puntos)
}

/**
 * El club del que sos más ídolo. Es el título de la ficha final: "Leyenda de Vélez" dice mucho
 * más que "12 títulos", y es lo que la gente saca de captura.
 */
export function clubDeLaVida(career: CareerState): Idolatria | null {
  return idolatriaPorClub(career)[0] ?? null
}
