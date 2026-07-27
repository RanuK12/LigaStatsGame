/**
 * El Mundial, simulado de verdad.
 *
 * Antes era una línea de texto ("llegaron a cuartos, perdieron con Francia") sacada de un
 * sorteo suelto. Acá se juega el torneo: tres partidos de grupo y después la llave hasta la
 * final, cada cruce resuelto por la fuerza de los dos equipos. El recorrido queda guardado
 * partido por partido para poder contarlo.
 *
 * Y el papel del jugador sale de comparar SU OVR con el nivel de su propia selección: con 75
 * siendo argentino vas al banco, con 80 en una selección chica sos la figura.
 */

import type { PositionCategory } from './career-engine'

export type RondaMundial = 'grupos' | 'octavos' | 'cuartos' | 'semi' | 'final' | 'campeon'
export type RolMundial = 'figura' | 'titular' | 'alternativa' | 'convocado'

export interface PartidoMundial {
  ronda: string
  rival: string
  golesAFavor: number
  golesEnContra: number
  penales?: string
}

export interface WorldCupRun {
  year: number
  seleccion: string
  ronda: RondaMundial
  campeon: boolean
  eliminadoPor?: string
  partidos: PartidoMundial[]
  rol: RolMundial
  caps: number
  goles: number
  asistencias: number
  vallasInvictas: number
  /** 0..1: qué tan bien le fue al jugador. Alimenta las ofertas y el plus de OVR. */
  puntaje: number
}

/** Selecciones que pueden tocar de rival, con su nivel. */
const RIVALES: Record<string, number> = {
  Brasil: 91, Argentina: 90, Francia: 89, España: 87, Inglaterra: 86, Alemania: 85,
  Portugal: 85, 'Países Bajos': 84, Italia: 84, Bélgica: 83, Uruguay: 82, Croacia: 81,
  Colombia: 80, Marruecos: 79, México: 79, Suiza: 78, Chile: 78, Dinamarca: 78,
  Japón: 77, 'Corea del Sur': 76, Senegal: 76, 'Estados Unidos': 75, Ecuador: 75,
  Polonia: 75, Serbia: 75, Australia: 73, Nigeria: 74, Ghana: 73, Paraguay: 74,
  Perú: 74, 'Costa Rica': 72, Túnez: 72, Irán: 73, Catar: 70, Canadá: 74,
}

const NOMBRE_RONDA: Record<string, string> = {
  grupos: 'la fase de grupos',
  octavos: 'los octavos de final',
  cuartos: 'los cuartos de final',
  semi: 'la semifinal',
  final: 'la final',
}

function golesEsperados(propia: number, rival: number): number {
  // La ventaja pesa, pero no decide: con /14 una diferencia de 10 puntos era paliza asegurada
  // y la mejor selección ganaba el 42% de los Mundiales. Un Mundial son siete finales.
  return Math.max(0.35, 1.3 + (propia - rival) / 17)
}

function poisson(lambda: number, rng: () => number): number {
  const L = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= rng()
  } while (p > L)
  return Math.min(k - 1, 6)
}

/** Rival del bombo, evitando repetir y evitando a la propia selección. */
function sortearRival(usados: Set<string>, propia: string, nivelObjetivo: number, rng: () => number): [string, number] {
  const opciones = Object.entries(RIVALES)
    .filter(([n]) => n !== propia && !usados.has(n))
    .sort((a, b) => Math.abs(a[1] - nivelObjetivo) - Math.abs(b[1] - nivelObjetivo))
  // De los 10 más parecidos en nivel, uno al azar: así el cruce es creíble pero no repetitivo
  const pool = opciones.slice(0, Math.min(10, opciones.length))
  const [nombre, nivel] = pool[Math.floor(rng() * pool.length)] || ['Selección rival', 75]
  usados.add(nombre)
  return [nombre, nivel]
}

/** Qué papel juega el jugador dentro de SU selección. */
export function rolEnLaSeleccion(ovrJugador: number, fuerzaSeleccion: number): RolMundial {
  const brecha = ovrJugador - fuerzaSeleccion
  // Figura es estar al nivel del equipo o por encima. Con 88 en una selección de 90 sos
  // titular, no la estrella: la estrella es el que la levanta por encima de la media.
  if (brecha >= 0) return 'figura'
  if (brecha >= -7) return 'titular'
  if (brecha >= -14) return 'alternativa'
  return 'convocado'
}

const MINUTOS_POR_ROL: Record<RolMundial, number> = { figura: 1, titular: 0.85, alternativa: 0.45, convocado: 0.18 }

export function simularMundial(o: {
  year: number
  seleccion: string
  fuerzaSeleccion: number
  ovrJugador: number
  categoria: PositionCategory
  rng: () => number
}): WorldCupRun {
  const { rng, seleccion } = o
  const propia = o.fuerzaSeleccion
  const usados = new Set<string>()
  const partidos: PartidoMundial[] = []

  // ── Fase de grupos: tres partidos, hay que sumar para pasar ──
  let puntos = 0
  for (let i = 0; i < 3; i++) {
    // Bombos: uno del nivel propio, y dos bastante por debajo
    const objetivoGrupo = [propia - 3, propia - 11, propia - 16][i]
    const [rival, nivelRival] = sortearRival(usados, seleccion, objetivoGrupo, rng)
    const gf = poisson(golesEsperados(propia, nivelRival), rng)
    const gc = poisson(golesEsperados(nivelRival, propia), rng)
    partidos.push({ ronda: 'Grupo', rival, golesAFavor: gf, golesEnContra: gc })
    puntos += gf > gc ? 3 : gf === gc ? 1 : 0
  }

  if (puntos < 4) {
    // Con 3 puntos o menos casi nunca se pasa; con 4 siempre. En el grupo no hay un verdugo
    // puntual, así que no se nombra a nadie.
    return armarResultado(o, 'grupos', partidos, false)
  }

  // ── Llave ──
  const llave: { clave: RondaMundial; nombre: string }[] = [
    { clave: 'octavos', nombre: 'Octavos' },
    { clave: 'cuartos', nombre: 'Cuartos' },
    { clave: 'semi', nombre: 'Semifinal' },
    { clave: 'final', nombre: 'Final' },
  ]

  for (const { clave, nombre } of llave) {
    // Cuanto más avanza el torneo, más duro el rival
    const dureza = clave === 'octavos' ? propia - 8 : clave === 'cuartos' ? propia - 3 : clave === 'semi' ? propia : propia + 1
    const [rival, nivelRival] = sortearRival(usados, seleccion, dureza, rng)
    let gf = poisson(golesEsperados(propia, nivelRival), rng)
    let gc = poisson(golesEsperados(nivelRival, propia), rng)
    let penales: string | undefined

    if (gf === gc) {
      // Empate: penales. La tanda es una moneda con un poco de ventaja al mejor.
      const miTanda = 3 + Math.floor(rng() * 3)
      const suTanda = 3 + Math.floor(rng() * 3)
      const gano = miTanda === suTanda ? rng() < 0.5 + (propia - nivelRival) / 60 : miTanda > suTanda
      penales = gano ? `${Math.max(miTanda, suTanda + 1)}-${Math.min(miTanda, suTanda)}` : `${Math.min(miTanda, suTanda)}-${Math.max(miTanda, suTanda + 1)}`
      if (gano) gf += 0
      else gc += 0
      partidos.push({ ronda: nombre, rival, golesAFavor: gf, golesEnContra: gc, penales })
      if (!gano) return armarResultado(o, clave, partidos, false, rival)
      continue
    }

    partidos.push({ ronda: nombre, rival, golesAFavor: gf, golesEnContra: gc })
    if (gf < gc) return armarResultado(o, clave, partidos, false, rival)
    if (clave === 'final') return armarResultado(o, 'campeon', partidos, true)
  }

  return armarResultado(o, 'campeon', partidos, true)
}

function armarResultado(
  o: { year: number; seleccion: string; fuerzaSeleccion: number; ovrJugador: number; categoria: PositionCategory; rng: () => number },
  ronda: RondaMundial,
  partidos: PartidoMundial[],
  campeon: boolean,
  eliminadoPor?: string,
): WorldCupRun {
  const { rng } = o
  const rol = rolEnLaSeleccion(o.ovrJugador, o.fuerzaSeleccion)
  const minutos = MINUTOS_POR_ROL[rol]

  // Cuántos de los partidos del equipo jugó realmente
  const caps = Math.max(rol === 'convocado' ? 0 : 1, Math.round(partidos.length * minutos))

  // Goles y asistencias según puesto, minutos y nivel propio
  const escala = Math.max(0.5, o.ovrJugador / 82)
  const gpp: Record<PositionCategory, number> = { ATT: 0.55, MID: 0.26, DEF: 0.08, GK: 0 }
  const app: Record<PositionCategory, number> = { ATT: 0.25, MID: 0.32, DEF: 0.1, GK: 0.02 }
  const goles = Math.round(caps * gpp[o.categoria] * escala * (0.4 + rng() * 1.2))
  const asistencias = Math.round(caps * app[o.categoria] * escala * (0.4 + rng() * 1.1))
  const vallasInvictas =
    o.categoria === 'GK' || o.categoria === 'DEF'
      ? partidos.slice(0, caps).filter((p) => p.golesEnContra === 0).length
      : 0

  // Puntaje: hasta dónde llegó el equipo + qué tanto jugó y aportó el jugador
  const avance = { grupos: 0.1, octavos: 0.3, cuartos: 0.5, semi: 0.7, final: 0.85, campeon: 1 }[ronda]
  const aporte = Math.min(1, (goles * 0.18 + asistencias * 0.12 + vallasInvictas * 0.12 + minutos * 0.5))
  const puntaje = Math.min(1, avance * 0.6 + aporte * 0.4)

  return {
    year: o.year,
    seleccion: o.seleccion,
    ronda,
    campeon,
    eliminadoPor,
    partidos,
    rol,
    caps,
    goles,
    asistencias,
    vallasInvictas,
    puntaje: Math.round(puntaje * 100) / 100,
  }
}

/** Frase corta para el historial. */
export function resumenMundial(w: WorldCupRun): string {
  if (w.campeon) return `🌍🏆 ¡CAMPEÓN DEL MUNDO ${w.year} con ${w.seleccion}!`
  const ronda = NOMBRE_RONDA[w.ronda] || 'el torneo'
  return w.eliminadoPor
    ? `🌍 Mundial ${w.year}: eliminados en ${ronda} por ${w.eliminadoPor}`
    : `🌍 Mundial ${w.year}: quedaron afuera en ${ronda}`
}

export const NIVEL_RIVALES = RIVALES
