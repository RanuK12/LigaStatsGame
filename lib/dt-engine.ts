/**
 * El motor del modo DT: lo que pasa ENTRE temporada y temporada.
 *
 * Los partidos no se simulan acá. `simulateSeasonWithStats` de `game-engine` ya juega una liga
 * entera con formación, tabla y estadísticas por jugador, y está probado; el modo DT es lo que
 * lo rodea: qué te pide la dirigencia, con cuánta plata contás, a quién comprás y vendés, y qué
 * pasa cuando no cumplís.
 *
 * La referencia es Football Manager, con una diferencia deliberada: allá el mercado son miles de
 * jugadores y una tarde de trabajo. Acá son TRES movimientos por temporada. No es simplificar
 * por vagancia — está medido que la gente abandona los modos largos (108 empiezan una carrera de
 * jugador y 4 la terminan), y un mercado completo es exactamente donde se cierra la pestaña.
 *
 * El bucle: objetivo → mercado → se juega → te evalúan → seguís, te ascienden o te echan.
 */
import type { Player, Squad, TournamentResult } from './types'
import { formations, canPlayHere } from './game-engine'
import { makeRng } from './career-engine'

/* ── El club que dirigís ──────────────────────────────────────────────────── */

export interface ClubDT {
  id: string
  nombre: string
  /** Fuerza del plantel: la media de los once mejores. La calcula `fuerzaDeClub`. */
  fuerza: number
}

/** La media de los once mejores del plantel: es con lo que la dirigencia te mide. */
export function fuerzaDeClub(squad: Squad, jugadores: Player[]): number {
  const porId = new Map(jugadores.map((p) => [p.id, p]))
  const ratings = squad.playerIds
    .map((id) => porId.get(id)?.rating ?? 0)
    .filter((r) => r > 0)
    .sort((a, b) => b - a)
    .slice(0, 11)
  if (ratings.length === 0) return 60
  return Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length)
}

/**
 * Los rivales de la liga, con su MEJOR once.
 *
 * Sin esto el modo estaba roto de una forma que no se ve hasta que se mide: `game-engine` arma
 * cada rival con `getSquadPlayers(...).slice(0, 11)`, y `getSquadPlayers` filtra la lista global
 * de jugadores, así que devuelve once cualquiera —los primeros que aparecen en players.json—
 * mientras que el club que dirigís sale con su once ideal.
 *
 * Medido antes de arreglarlo, seis temporadas por club: Aldosivi, el plantel más flojo de la
 * liga, promediaba 5,8º de 24, y NINGÚN club terminaba en la mitad de abajo. Con todos ganando
 * siempre, la dirigencia nunca echaba a nadie y el modo no tenía tensión: en 300 carreras no
 * hubo un solo despido.
 *
 * Recortar cada plantel a sus once mejores empareja la cancha, y no toca `game-engine`, que es
 * de lo que depende el draft y ya está probado.
 */
export function ligaParaSimular(squads: Squad[], jugadores: Player[]): Squad[] {
  const porId = new Map(jugadores.map((p) => [p.id, p]))
  return squads.map((s) => {
    const disponibles = s.playerIds.map((id) => porId.get(id)).filter(Boolean) as Player[]
    return { ...s, playerIds: onceIdeal(disponibles).map((p) => p.id) as [string, ...string[]] }
  })
}

/**
 * Los rivales: la liga MENOS el club que dirigís.
 *
 * Parece obvio y es el bug que hacía que el modo entero no tuviera sentido. `simulateSeasonWithStats`
 * excluye del bombo de rivales al plantel cuyo `id` le pasás, pero el club que dirigís entra con
 * un id propio (su plantel cambia con los fichajes), así que el club ORIGINAL se quedaba en la
 * lista y jugaba también. La tabla terminaba con dos filas del mismo nombre y —como se agrupa por
 * nombre— el club acumulaba los puntos de las dos: 74 puntos y 50 partidos jugados contra los 24
 * de todos los demás.
 *
 * Con el doble de partidos, salir campeón era automático: **312 de 312 carreras con título**.
 */
export function rivalesParaSimular(liga: Squad[], clubId: string): Squad[] {
  return liga.filter((s) => s.clubId !== clubId)
}

/**
 * La lista de jugadores ordenada para que los rivales salgan bien parados.
 *
 * Acá está la trampa fina, y costó dos intentos encontrarla. `game-engine` arma cada rival con
 * `getSquadPlayers(o, allPlayers).slice(0, 11)`, y `getSquadPlayers` hace
 * `allPlayers.filter(p => squad.playerIds.includes(p.id))`: devuelve los jugadores en el orden de
 * **la lista global**, no en el del plantel. Ordenar `playerIds` no sirve de nada porque ese
 * orden se descarta.
 *
 * Y el orden importa: `teamToStrength` mete `team[i]` en `formation.positions[i]`, así que un
 * arquero que aparece primero en players.json termina jugando de arquero por casualidad, y en el
 * club de al lado un delantero termina atajando.
 *
 * La salida es ordenar la lista global que se le pasa al motor, club por club, con el once ideal
 * de cada uno en el orden de la formación. Se puede porque en la liga cada jugador pertenece a un
 * solo club. No se toca `game-engine`, que es de lo que dependen el draft y el versus.
 *
 * Medido antes de esto: **312 de 312 carreras terminaban campeonas**, porque el club que dirigís
 * se alineaba por puesto y los 23 rivales no.
 */
export function jugadoresParaSimular(liga: Squad[], jugadores: Player[]): Player[] {
  const porId = new Map(jugadores.map((p) => [p.id, p]))
  const ordenados: Player[] = []
  const puestos = new Set<string>()
  for (const s of liga) {
    for (const id of s.playerIds) {
      const p = porId.get(id)
      if (p && !puestos.has(p.id)) {
        ordenados.push(p)
        puestos.add(p.id)
      }
    }
  }
  // El resto de la base va después: el mercado de pases los necesita, la simulación no.
  for (const p of jugadores) if (!puestos.has(p.id)) ordenados.push(p)
  return ordenados
}

/**
 * El once ideal de un plantel, ordenado como lo espera el motor.
 *
 * No alcanza con los once de mejor OVR: `teamToStrength` mete `team[i]` en `formation.positions[i]`,
 * o sea que el ORDEN del array es la alineación. Si se le pasan los once mejores sin ordenar, el
 * arquero puede terminar jugando de nueve.
 *
 * Eso hacía que los rivales salieran mal parados contra un club que sí se alineaba por puesto, y
 * el resultado estaba medido y era absurdo: **312 de 312 carreras terminaban con título**. Con
 * todos campeones no hay despidos, no hay tensión y no hay modo.
 */
export function onceIdeal(disponibles: Player[]): Player[] {
  const puestos = formations['4-3-3'].positions
  const usados = new Set<string>()
  const equipo: Player[] = []
  for (const slot of puestos) {
    const candidatos = disponibles
      .filter((p) => !usados.has(p.id))
      .sort((a, b) => {
        // Primero el que juega de eso, después el mejor. Un central de 80 vale más que un
        // delantero de 82 cuando el puesto que falta es central.
        const encaja = (x: Player) => (x.position === slot.pos ? 2 : canPlayHere(x, slot.pos) ? 1 : 0)
        return encaja(b) - encaja(a) || (b.rating ?? 0) - (a.rating ?? 0)
      })
    const elegido = candidatos[0]
    if (elegido) {
      equipo.push(elegido)
      usados.add(elegido.id)
    }
  }
  return equipo
}

/* ── La táctica ───────────────────────────────────────────────────────────── */

export const FORMACIONES_DT = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2'] as const
export type FormacionDT = (typeof FORMACIONES_DT)[number]

/** Qué le hace cada dibujo al equipo, para que elegir no sea tirar una moneda. */
export const PERFIL_FORMACION: Record<FormacionDT, { nombre: string; idea: string }> = {
  '4-3-3': { nombre: '4-3-3', idea: 'Tres arriba. El que más ataca y el que más se expone.' },
  '4-4-2': { nombre: '4-4-2', idea: 'El clásico. Equilibrado y sin sorpresas.' },
  '4-2-3-1': { nombre: '4-2-3-1', idea: 'Dos cinco de contención. Aguanta y sale de contra.' },
  '3-5-2': { nombre: '3-5-2', idea: 'Se puebla el medio. Se gana la pelota y se sufre atrás.' },
}

/**
 * El once para una formación, sin los lesionados.
 *
 * Elegir el dibujo es la decisión de manager por excelencia y hasta acá no existía: el modo
 * jugaba siempre 4-3-3. Y no es cosmético — `teamToStrength` reparte a los once en los puestos
 * del dibujo, así que un 3-5-2 con este plantel da otro ataque y otra defensa que un 4-3-3.
 */
export function onceDeFormacion(
  disponibles: Player[],
  formacion: FormacionDT,
  lesionados: string[] = [],
): Player[] {
  const puestos = formations[formacion].positions
  const sanos = disponibles.filter((p) => !lesionados.includes(p.id))
  const usados = new Set<string>()
  const equipo: Player[] = []
  for (const slot of puestos) {
    const elegido = sanos
      .filter((p) => !usados.has(p.id))
      .sort((a, b) => {
        const encaja = (x: Player) => (x.position === slot.pos ? 2 : canPlayHere(x, slot.pos) ? 1 : 0)
        return encaja(b) - encaja(a) || (b.rating ?? 0) - (a.rating ?? 0)
      })[0]
    if (elegido) {
      equipo.push(elegido)
      usados.add(elegido.id)
    }
  }
  return equipo
}

/* ── Que el plantel envejezca y crezca ────────────────────────────────────── */

export interface CambioJugador {
  jugadorId: string
  nombre: string
  antes: number
  ahora: number
}

export interface EvolucionPlantel {
  /** Cuánto se le suma o resta al rating de cada jugador, acumulado en el estado. */
  ajustes: Record<string, number>
  crecieron: CambioJugador[]
  bajaron: CambioJugador[]
  /** Los que se retiran: pasados los 38, alguno cuelga los botines. */
  retirados: CambioJugador[]
}

/**
 * Un año más para el plantel.
 *
 * Sin esto, una carrera de veinte temporadas se juega con el mismo plantel congelado y el
 * mercado de pases no significa nada: comprar da igual que no comprar.
 *
 * NO se modela por edad, y es a propósito. La base no la tiene: de 3.334 jugadores solo 1.861
 * traen fecha de nacimiento —y justo los modernos, que son los que juegan la Liga Profesional,
 * no la traen— y encima `players-core.json`, que es lo que llega al navegador, ni siquiera
 * incluye el campo. Con una edad inventada, el mecanismo se apoyaría en un dato falso sobre
 * personas reales, y en este juego los datos se cruzan contra tres fuentes antes de entrar.
 *
 * Lo que sí se modela es lo que importa para jugar: **el plantel se desgasta si no lo tocás**.
 * El que está lejos de su techo tiene margen para crecer; el que ya está arriba solo puede
 * caerse. Es la misma tensión —hay que trabajar el mercado— sin afirmar nada que no sepamos.
 */
export function evolucionarPlantel(
  plantel: Player[],
  ajustesPrevios: Record<string, number>,
  _temporada: number,
  rng: () => number,
): EvolucionPlantel {
  const ajustes = { ...ajustesPrevios }
  const crecieron: CambioJugador[] = []
  const bajaron: CambioJugador[] = []
  const retirados: CambioJugador[] = []
  if (plantel.length === 0) return { ajustes, crecieron, bajaron, retirados }

  const media = plantel.reduce((a, p) => a + (p.rating ?? 60), 0) / plantel.length

  for (const p of plantel) {
    const base = p.rating ?? 60
    const acumulado = ajustes[p.id] ?? 0
    const antes = Math.max(35, Math.min(99, base + acumulado))

    // Cuánto margen le queda: el suplente de 62 puede dar un salto, el crack de 84 no.
    const margen = Math.max(0, 1 - (antes - media + 6) / 16)
    const chanceCrecer = 0.1 + margen * 0.3
    const chanceCaer = 0.1 + (1 - margen) * 0.22
    // Y cuanto más lejos del punto de partida, más cuesta seguir en esa dirección: así nadie
    // termina la carrera en 99 ni en 35 por acumulación.
    const tirón = 1 - Math.min(Math.abs(acumulado) / 9, 0.85)

    let delta = 0
    const d = rng()
    if (d < chanceCrecer * tirón) delta = 1
    else if (d > 1 - chanceCaer * tirón) delta = -1

    const ahora = Math.max(35, Math.min(Math.min(99, base + 8), Math.max(base - 10, antes + delta)))
    ajustes[p.id] = ahora - base

    if (ahora > antes) crecieron.push({ jugadorId: p.id, nombre: p.name, antes, ahora })
    else if (ahora < antes) bajaron.push({ jugadorId: p.id, nombre: p.name, antes, ahora })
  }

  // El que se cayó mucho respecto de lo que era, cuelga los botines. Es la salida natural de un
  // veterano sin nombrar una edad que no tenemos.
  for (const b of bajaron) {
    if (b.ahora <= (plantel.find((x) => x.id === b.jugadorId)?.rating ?? 60) - 8 && rng() < 0.5) {
      retirados.push(b)
    }
  }

  crecieron.sort((a, b) => b.ahora - b.antes - (a.ahora - a.antes))
  bajaron.sort((a, b) => a.ahora - a.antes - (b.ahora - b.antes))
  return { ajustes, crecieron, bajaron, retirados }
}

/** El plantel con los ajustes de las temporadas aplicados. */
export function aplicarAjustes(plantel: Player[], ajustes: Record<string, number>): Player[] {
  return plantel.map((p) => {
    const d = ajustes[p.id] ?? 0
    if (d === 0) return p
    return { ...p, rating: Math.max(35, Math.min(99, (p.rating ?? 60) + d)) }
  })
}

/* ── Lesiones ─────────────────────────────────────────────────────────────── */

export interface Lesion {
  jugadorId: string
  nombre: string
  tipo: string
  /** Cuántos partidos de los ~46 de la temporada se pierde. */
  partidos: number
}

const LESIONES = [
  { tipo: 'Rotura de ligamento cruzado', partidos: 40 },
  { tipo: 'Fractura de peroné', partidos: 28 },
  { tipo: 'Rotura de menisco', partidos: 22 },
  { tipo: 'Desgarro grado 3', partidos: 14 },
  { tipo: 'Pubalgia', partidos: 12 },
]

/**
 * La lesión de la temporada.
 *
 * Es lo que hace que el fondo del plantel valga algo: sin lesiones da lo mismo tener once
 * jugadores que veintitrés, y vender al suplente es gratis. Cae sobre alguien del once ideal —si
 * cayera sobre el número 20 no cambiaría nada y no sería una noticia.
 */
export function sortearLesion(once: Player[], rng: () => number): Lesion | null {
  if (once.length === 0 || rng() > 0.45) return null
  const victima = once[Math.floor(rng() * once.length)]
  const l = LESIONES[Math.floor(rng() * LESIONES.length)]
  return { jugadorId: victima.id, nombre: victima.name, tipo: l.tipo, partidos: l.partidos }
}

/* ── Lo que te pide la dirigencia ─────────────────────────────────────────── */

export type ObjetivoId = 'campeon' | 'copas' | 'mitad' | 'permanencia'

export interface Objetivo {
  id: ObjetivoId
  /** El puesto que hay que alcanzar o superar. */
  puesto: number
  texto: string
}

/**
 * Lo que te exigen, medido contra los RIVALES y no contra un número absoluto.
 *
 * A River le piden salir campeón y a Aldosivi que no se vaya al descenso, y eso no es una tabla
 * escrita a mano: sale de dónde está el plantel dentro de su propia liga. Es la misma idea que
 * ya usa el ascenso en `career-engine`, y hace que el modo funcione solo si mañana entran otros
 * clubes.
 *
 * El prestigio del DT sube la vara: al que ganó tres ligas no le alcanza con entrar en la mitad.
 */
export function objetivoDeTemporada(
  club: ClubDT,
  rivales: ClubDT[],
  prestigio: number,
): Objetivo {
  const total = rivales.length + 1
  const masFuertes = rivales.filter((r) => r.fuerza > club.fuerza).length
  // Dónde "debería" salir por plantel, de 0 (el mejor) a 1 (el peor).
  const relativo = masFuertes / Math.max(total - 1, 1)
  // El prestigio aprieta: cada 25 puntos, medio escalón más de exigencia.
  const exigencia = Math.max(0, relativo - prestigio / 200)

  if (exigencia <= 0.12) {
    return { id: 'campeon', puesto: 1, texto: 'Salir campeón' }
  }
  if (exigencia <= 0.35) {
    const puesto = Math.max(2, Math.round(total * 0.2))
    return { id: 'copas', puesto, texto: `Clasificar a la Libertadores (top ${puesto})` }
  }
  if (exigencia <= 0.7) {
    const puesto = Math.round(total * 0.5)
    return { id: 'mitad', puesto, texto: `Terminar en la mitad de arriba (top ${puesto})` }
  }
  const puesto = Math.max(1, total - 4)
  return { id: 'permanencia', puesto, texto: `Mantener la categoría (no salir último ${total - puesto + 1})` }
}

/* ── La plata ─────────────────────────────────────────────────────────────── */

/**
 * El presupuesto de la temporada, en millones.
 *
 * Sale de la fuerza del plantel —un club grande mueve más plata— y de cómo te fue: salir campeón
 * abre la billetera y pelear el descenso la cierra. Es lo que hace que una buena temporada se
 * sienta en la siguiente y no solo en la tabla.
 */
export function presupuestoDe(club: ClubDT, puestoAnterior: number | null, total: number): number {
  const base = Math.max(0.5, Math.pow(Math.max(club.fuerza - 55, 1), 1.55) / 9)
  if (puestoAnterior === null) return Math.round(base * 10) / 10
  const rendimiento = 1 - (puestoAnterior - 1) / Math.max(total - 1, 1) // 1 = campeón, 0 = último
  const factor = 0.6 + rendimiento * 0.9
  return Math.round(base * factor * 10) / 10
}

/* ── El mercado de pases ──────────────────────────────────────────────────── */

export type TipoMovimiento = 'compra' | 'venta' | 'cantera'

export interface Movimiento {
  tipo: TipoMovimiento
  jugadorId: string
  nombre: string
  posicion: string
  rating: number
  edad: number
  /** Millones: lo que cuesta si es compra, lo que te pagan si es venta. */
  precio: number
  /** Por qué está en la mesa, para que la decisión tenga contexto y no sea un número pelado. */
  nota: string
}

/** Lo que vale un jugador, en millones. Misma curva que el modo carrera: OVR manda, la edad pesa. */
export function valorDe(rating: number, edad: number): number {
  const porOvr = Math.pow(Math.max(rating - 45, 1), 2.1) / 260
  const porEdad = edad <= 23 ? 1.35 : edad <= 27 ? 1.15 : edad <= 30 ? 0.85 : edad <= 33 ? 0.5 : 0.25
  return Math.max(0.1, Math.round(porOvr * porEdad * 10) / 10)
}

const CATEGORIA: Record<string, string> = {
  GK: 'Arquero', CB: 'Defensor', LB: 'Defensor', RB: 'Defensor', LWB: 'Defensor', RWB: 'Defensor',
  CDM: 'Mediocampo', CM: 'Mediocampo', CAM: 'Mediocampo', LM: 'Mediocampo', RM: 'Mediocampo',
  LW: 'Ataque', RW: 'Ataque', ST: 'Ataque', CF: 'Ataque',
}

/**
 * Tres o cuatro movimientos, no una base de datos.
 *
 * Es la decisión de diseño más importante del modo. Un mercado de pases completo —buscar,
 * filtrar, negociar— es donde la gente cierra la pestaña, y el dato que tenemos dice que los
 * modos largos no se terminan. Acá se elige entre pocas cosas concretas y se sigue jugando.
 *
 * Siempre hay al menos una venta: sin vender, el presupuesto de un club chico no alcanza para
 * nada y la temporada se juega igual que la anterior.
 */
export function mercadoDePases(
  plantel: Player[],
  mercado: Player[],
  presupuesto: number,
  rng: () => number,
): Movimiento[] {
  const movimientos: Movimiento[] = []
  const enPlantel = new Set(plantel.map((p) => p.id))

  // ── Una venta: el que te quieren comprar ──
  // El más valioso, que es el que duele vender. Un club de afuera paga por encima del valor.
  const vendibles = [...plantel].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5)
  if (vendibles.length > 0) {
    const v = vendibles[Math.floor(rng() * vendibles.length)]
    const edad = edadDe(v)
    movimientos.push({
      tipo: 'venta',
      jugadorId: v.id,
      nombre: v.name,
      posicion: v.position,
      rating: v.rating ?? 60,
      edad,
      precio: Math.round(valorDe(v.rating ?? 60, edad) * (1.15 + rng() * 0.5) * 10) / 10,
      nota: 'Llegó una oferta de afuera. Si lo vendés, entra plata para reforzar.',
    })
  }

  // ── Dos compras: una por lo que falta, otra por lo que se puede pagar ──
  const flojoPor = puestoMasFlojo(plantel)
  const candidatos = mercado.filter((p) => !enPlantel.has(p.id) && (p.rating ?? 0) > 0)

  const paraElHueco = candidatos
    .filter((p) => CATEGORIA[p.position] === flojoPor)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  const asequible = (p: Player) => valorDe(p.rating ?? 60, edadDe(p)) <= presupuesto * 1.6

  const elegido = paraElHueco.find(asequible)
  if (elegido) {
    const edad = edadDe(elegido)
    movimientos.push({
      tipo: 'compra',
      jugadorId: elegido.id,
      nombre: elegido.name,
      posicion: elegido.position,
      rating: elegido.rating ?? 60,
      edad,
      precio: valorDe(elegido.rating ?? 60, edad),
      nota: `Lo que más falta es ${flojoPor.toLowerCase()}. Es el mejor disponible para ese puesto.`,
    })
  }

  // Una joven, más barata, que es la apuesta a futuro.
  const joven = candidatos
    .filter((p) => edadDe(p) <= 22 && (p.rating ?? 0) >= 68 && p.id !== elegido?.id)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .find(asequible)
  if (joven) {
    const edad = edadDe(joven)
    movimientos.push({
      tipo: 'compra',
      jugadorId: joven.id,
      nombre: joven.name,
      posicion: joven.position,
      rating: joven.rating ?? 60,
      edad,
      precio: valorDe(joven.rating ?? 60, edad),
      nota: `${edad} años. Todavía tiene techo para crecer.`,
    })
  }

  return movimientos
}

/** El puesto donde el plantel está más flojo, para que la compra sugerida tenga sentido. */
export function puestoMasFlojo(plantel: Player[]): string {
  const lineas = ['Arquero', 'Defensor', 'Mediocampo', 'Ataque']
  const medias = lineas.map((linea) => {
    const suyos = plantel.filter((p) => CATEGORIA[p.position] === linea).map((p) => p.rating ?? 0)
    return { linea, media: suyos.length ? suyos.reduce((a, b) => a + b, 0) / suyos.length : 0 }
  })
  // Un puesto sin nadie es el más flojo de todos: falta el jugador entero.
  const vacio = medias.find((m) => m.media === 0)
  if (vacio) return vacio.linea
  return medias.sort((a, b) => a.media - b.media)[0].linea
}

/**
 * La edad del jugador.
 *
 * `Player` no la trae: trae `birthDate`, y en la base hay fichas viejas donde viene vacía. Por
 * eso se calcula, y si no se puede se devuelven 27 —la edad media de un plantel— antes que
 * romper el mercado de pases por un dato que falta.
 */
function edadDe(p: Player): number {
  const conEdad = p as unknown as { age?: number }
  if (typeof conEdad.age === 'number') return conEdad.age
  if (p.birthDate) {
    const anio = parseInt(String(p.birthDate).slice(0, 4), 10)
    if (anio > 1900) return Math.max(16, Math.min(41, new Date().getFullYear() - anio))
  }
  return 27
}

/* ── Cómo te evalúan ──────────────────────────────────────────────────────── */

export interface EvaluacionDT {
  cumplio: boolean
  /** Cuánto se movió el prestigio y la paciencia, para poder contarlo en pantalla. */
  prestigio: number
  paciencia: number
  despedido: boolean
  titulo: string
  detalle: string
}

/**
 * Cumpliste o no, y qué pasa con eso.
 *
 * La paciencia es lo que hace que el modo tenga tensión: no te echan por una mala temporada,
 * te echan por la tercera. Salir campeón la repone entera —en el fútbol un título compra
 * tiempo— y quedar último la funde.
 */
export function evaluar(
  objetivo: Objetivo,
  puesto: number,
  total: number,
  campeon: boolean,
  prestigioActual: number,
  pacienciaActual: number,
): EvaluacionDT {
  const cumplio = campeon || puesto <= objetivo.puesto
  // Cuánto te pasaste o te quedaste, en puestos, para que el castigo sea proporcional.
  const diferencia = puesto - objetivo.puesto

  // Los números están calibrados contra la corrida de 300 carreras, no elegidos a ojo.
  // Con la versión anterior (cumplir +18, fallar −14) NADIE se comía un despido en 300 carreras:
  // cumplir es lo normal —entre 4 y 6 de cada 6 temporadas según el club— así que la paciencia
  // vivía en 100 y las malas rachas no alcanzaban a fundirla. Un modo donde no te pueden echar
  // no tiene tensión, y la tensión es todo lo que tiene un modo DT.
  //
  // Ahora cumplir repone poco y fallar cuesta caro: desde 70, tres temporadas malas seguidas te
  // dejan sin trabajo, que es más o menos lo que dura un técnico en el fútbol argentino.
  let prestigio = 0
  let paciencia = 0
  if (campeon) {
    prestigio = 14
    paciencia = 30
  } else if (cumplio) {
    prestigio = 6 + Math.round((objetivo.puesto - puesto) * 0.6)
    paciencia = 12
  } else {
    prestigio = -Math.min(12, 3 + diferencia)
    paciencia = -Math.min(60, 22 + diferencia * 2.5)
  }

  const nuevaPaciencia = Math.max(0, Math.min(100, pacienciaActual + paciencia))
  const despedido = nuevaPaciencia <= 0

  const titulo = campeon
    ? '¡CAMPEÓN!'
    : cumplio
      ? 'Objetivo cumplido'
      : despedido
        ? 'La dirigencia te echó'
        : 'Objetivo incumplido'

  const detalle = campeon
    ? `Salieron campeones. La dirigencia no te va a discutir nada por un buen rato.`
    : cumplio
      ? `Terminaron ${puesto}º de ${total}. Se pedía ${objetivo.puesto}º o mejor.`
      : despedido
        ? `Terminaron ${puesto}º de ${total} y se pedía ${objetivo.puesto}º. Se acabó la paciencia.`
        : `Terminaron ${puesto}º de ${total} y se pedía ${objetivo.puesto}º. La dirigencia lo dejó pasar, pero tomó nota.`

  return {
    cumplio,
    prestigio: Math.max(0, Math.min(100, prestigioActual + prestigio)) - prestigioActual,
    paciencia: nuevaPaciencia - pacienciaActual,
    despedido,
    titulo,
    detalle,
  }
}

/* ── Los clubes que te llaman ─────────────────────────────────────────────── */

export interface OfertaTrabajo {
  clubId: string
  nombre: string
  fuerza: number
  texto: string
}

/**
 * Quién te ofrece el puesto según lo que hiciste.
 *
 * Es la escalera del modo, y es lo mismo que hace funcionar al modo carrera de jugador: no se
 * trata de ganar la liga con River, se trata de llegar a River. Con prestigio bajo te llaman los
 * de abajo; con prestigio alto, los grandes.
 */
/**
 * Por debajo de esto no te llama nadie y la carrera se termina.
 *
 * Medido antes de existir este piso: en 144 carreras de 20 temporadas, CERO terminaron sin
 * trabajo. Siempre quedaban 23 clubes dispuestos, así que un DT podía fracasar para siempre sin
 * consecuencias y la carrera duraba exactamente veinte temporadas en todos los casos. Un modo DT
 * sin final malo pierde la mitad de lo que lo hace un juego.
 *
 * Se combina con `excluir`: los clubes que ya te echaron no te vuelven a llamar, así que a fuerza
 * de despidos te vas quedando sin puertas aunque el prestigio aguante.
 *
 * Y hacen falta las DOS condiciones. Con el piso solo, jugando una carrera de punta a punta en el
 * navegador se terminaba en la temporada 6 con un despido: el prestigio arranca en 10 y una mala
 * temporada resta hasta 12, así que el primer fracaso cerraba todas las puertas para siempre. A un
 * técnico joven que fracasa en Aldosivi lo vuelve a llamar otro club chico; al que fracasó en dos,
 * no. Y sin segundo club la ficha final no tiene trayectoria: un solo escudo en "por dónde pasó".
 *
 * El número de despidos es el que manda, no el piso: al despido llegás casi siempre con el
 * prestigio en el fondo, así que la condición del piso rara vez decide sola. Barrido sobre las
 * mismas 312 carreras de 20 temporadas:
 *
 *   despidos=1 → 62% termina sin trabajo, largo medio 9,2 temporadas
 *   despidos=2 →  5% termina sin trabajo, largo medio 17,9 temporadas
 *
 * Va 2. Con 1, la mayoría de las carreras se corta en el primer tropiezo; con 2, el 80% igual se
 * come un despido —la tensión temporada a temporada queda intacta— pero se puede reconstruir.
 */
export const PRESTIGIO_MINIMO_PARA_QUE_TE_LLAMEN = 20
export const DESPIDOS_ANTES_DE_QUEDARTE_SIN_PUERTAS = 2

export function clubesQueTeLlaman(
  prestigio: number,
  clubes: ClubDT[],
  excluir: string[],
  rng: () => number,
  despidos = 0,
): OfertaTrabajo[] {
  if (prestigio < PRESTIGIO_MINIMO_PARA_QUE_TE_LLAMEN && despidos >= DESPIDOS_ANTES_DE_QUEDARTE_SIN_PUERTAS)
    return []
  const disponibles = clubes.filter((c) => !excluir.includes(c.id))
  if (disponibles.length === 0) return []

  const ordenados = [...disponibles].sort((a, b) => a.fuerza - b.fuerza)
  // Con 0 de prestigio mirás el fondo de la tabla; con 100, los de arriba.
  const centro = Math.round((ordenados.length - 1) * (prestigio / 100))
  const ventana = Math.max(2, Math.round(ordenados.length * 0.25))
  const desde = Math.max(0, centro - ventana)
  const hasta = Math.min(ordenados.length, centro + ventana + 1)

  const cerca = ordenados.slice(desde, hasta)
  const elegidos: ClubDT[] = []
  const pool = [...cerca]
  while (elegidos.length < Math.min(3, pool.length) && pool.length > 0) {
    elegidos.push(pool.splice(Math.floor(rng() * pool.length), 1)[0])
  }

  return elegidos.map((c) => ({
    clubId: c.id,
    nombre: c.nombre,
    fuerza: c.fuerza,
    texto:
      c.fuerza >= 76
        ? 'Un grande. Te van a exigir desde el primer partido.'
        : c.fuerza >= 70
          ? 'Un club que pelea arriba y quiere dar el salto.'
          : 'Un club chico. Ideal para hacerse un nombre sin que te corran.',
  }))
}

/* ── La temporada en el historial ─────────────────────────────────────────── */

/** Cómo terminó la Copa Argentina de ese año. */
export interface CopaDT {
  campeon: boolean
  /** Hasta dónde llegó: "Final", "Semifinal", "Cuartos"… */
  hasta: string
}

export interface TemporadaDT {
  temporada: number
  anio: number
  clubId: string
  clubNombre: string
  puesto: number
  total: number
  campeon: boolean
  /** La copa nacional. En Football Manager media carrera se define en las copas. */
  copa?: CopaDT
  objetivo: Objetivo
  cumplio: boolean
  despedido: boolean
  /** Para la ficha final: quién metió los goles y cuántos partidos se ganaron. */
  goleador?: { nombre: string; goles: number }
  ganados: number
  empatados: number
  perdidos: number
  golesFavor: number
  golesContra: number
  fichajes: string[]
  ventas: string[]
  formacion?: FormacionDT
  lesion?: Lesion | null
}

/** Cómo le fue en la copa, leído del resultado que devuelve el motor. */
export function resumenDeCopa(resultado: TournamentResult): CopaDT {
  if (resultado.isChampion) return { campeon: true, hasta: 'Campeón' }
  // Si no lo eliminaron y no salió campeón, perdió la final.
  return { campeon: false, hasta: resultado.eliminated ? resultado.eliminatedRound || 'Eliminado' : 'Final' }
}

/** Los números de la temporada, sacados de la tabla que devuelve el motor de partidos. */
export function resumenDeTemporada(resultado: TournamentResult): {
  puesto: number
  total: number
  campeon: boolean
  ganados: number
  empatados: number
  perdidos: number
  golesFavor: number
  golesContra: number
  goleador?: { nombre: string; goles: number }
} {
  const tabla = resultado.table ?? []
  const total = tabla.length || 1
  const fila = tabla.find((t) => t.name === resultado.teamLabel)
  const puesto = resultado.playerPos ?? (fila ? tabla.indexOf(fila) + 1 : total)
  const mejor = [...(resultado.playerStats ?? [])].sort((a, b) => (b.goals ?? 0) - (a.goals ?? 0))[0]

  return {
    puesto,
    total,
    campeon: Boolean(resultado.isChampion),
    ganados: fila?.w ?? 0,
    empatados: fila?.d ?? 0,
    perdidos: fila?.l ?? 0,
    golesFavor: fila?.gf ?? 0,
    golesContra: fila?.ga ?? 0,
    goleador: mejor && (mejor.goals ?? 0) > 0 ? { nombre: mejor.playerName, goles: mejor.goals } : undefined,
  }
}

/* ── El estado completo ───────────────────────────────────────────────────── */

export interface DTState {
  nombre: string
  clubId: string
  temporada: number
  anio: number
  prestigio: number
  paciencia: number
  presupuesto: number
  plantel: string[]
  objetivo: Objetivo
  historia: TemporadaDT[]
  /** Clubes que ya dirigió, en orden. Es la trayectoria que va en la ficha final. */
  trayectoria: string[]
  /**
   * Los que te echaron. No te vuelven a llamar, así que cada despido cierra una puerta y la
   * carrera puede terminarse de verdad en vez de durar siempre veinte temporadas.
   */
  echaronDe: string[]
  /** El dibujo con el que se juega. Es la decisión de manager que faltaba. */
  formacion: FormacionDT
  /** Cuánto creció o bajó cada jugador desde que arrancó la carrera. */
  ajustes: Record<string, number>
  /** El lesionado de esta temporada, si lo hay. */
  lesion: Lesion | null
  despedido: boolean
  ofertas: OfertaTrabajo[]
  terminada: boolean
  semilla: number
}

export const MAX_TEMPORADAS_DT = 20

export function iniciarDT(o: {
  nombre: string
  club: ClubDT
  rivales: ClubDT[]
  plantel: string[]
  anio: number
  semilla: number
}): DTState {
  const objetivo = objetivoDeTemporada(o.club, o.rivales, 0)
  return {
    nombre: o.nombre.trim() || 'El DT',
    clubId: o.club.id,
    temporada: 1,
    anio: o.anio,
    // Un DT que arranca no tiene nombre: se lo hace. Empieza en 10, no en 0, porque con 0 no
    // lo llamaría ni el último de la tabla y el modo se trabaría al primer despido.
    prestigio: 10,
    paciencia: 70,
    presupuesto: presupuestoDe(o.club, null, o.rivales.length + 1),
    plantel: o.plantel,
    objetivo,
    historia: [],
    trayectoria: [o.club.id],
    echaronDe: [],
    formacion: '4-3-3',
    ajustes: {},
    lesion: null,
    despedido: false,
    ofertas: [],
    terminada: false,
    semilla: o.semilla,
  }
}

/* ── La ficha final ───────────────────────────────────────────────────────── */

export interface FichaDT {
  nombre: string
  temporadas: number
  clubes: string[]
  titulos: number
  /** Copas nacionales. Se cuentan aparte: no es lo mismo una liga que una copa. */
  copas: number
  /**
   * Lo ganado por club, separando ligas de copas. Es lo que hace reconocible la ficha de un
   * hincha: el escudo dice más que la palabra "campeón".
   */
  titulosPorClub: { clubId: string; clubNombre: string; ligas: number; copas: number }[]
  despidos: number
  objetivosCumplidos: number
  prestigio: number
  partidos: number
  ganados: number
  empatados: number
  perdidos: number
  efectividad: number
  golesFavor: number
  golesContra: number
  mejorTemporada?: TemporadaDT
  /** El apodo que se ganó. Es el titular de la ficha para redes. */
  apodo: string
}

/**
 * Lo que se comparte.
 *
 * El artefacto compartible es el motor de crecimiento del juego —está medido: 9 personas
 * compartieron en 28 días y eso es lo que hay que mover— así que la ficha no es un resumen: es
 * el producto. Por eso el titular no es "20 temporadas" sino un apodo que se ganó, que es lo
 * que alguien saca de captura y lo que un tercero entiende sin haber jugado.
 */
export function fichaDT(estado: DTState, nombreDeClub: (id: string) => string): FichaDT {
  const h = estado.historia
  const ganados = h.reduce((a, t) => a + t.ganados, 0)
  const empatados = h.reduce((a, t) => a + t.empatados, 0)
  const perdidos = h.reduce((a, t) => a + t.perdidos, 0)
  const partidos = ganados + empatados + perdidos
  const titulos = h.filter((t) => t.campeon).length
  const copas = h.filter((t) => t.copa?.campeon).length
  const despidos = h.filter((t) => t.despedido).length

  // Un DT que ganó dos copas y ninguna liga tenía la sección "lo que ganó" VACÍA, justo en la
  // ficha de "Copero". Las copas cuentan igual que las ligas para lo que se muestra.
  const porClub = new Map<string, { ligas: number; copas: number }>()
  for (const t of h) {
    if (!t.campeon && !t.copa?.campeon) continue
    const cur = porClub.get(t.clubId) ?? { ligas: 0, copas: 0 }
    if (t.campeon) cur.ligas++
    if (t.copa?.campeon) cur.copas++
    porClub.set(t.clubId, cur)
  }

  const mejor = [...h].sort((a, b) => {
    if (a.campeon !== b.campeon) return a.campeon ? -1 : 1
    return a.puesto - b.puesto
  })[0]

  return {
    nombre: estado.nombre,
    temporadas: h.length,
    clubes: estado.trayectoria,
    titulos,
    copas,
    titulosPorClub: [...porClub.entries()]
      .map(([clubId, x]) => ({ clubId, clubNombre: nombreDeClub(clubId), ligas: x.ligas, copas: x.copas }))
      .sort((a, b) => b.ligas + b.copas - (a.ligas + a.copas)),
    despidos,
    objetivosCumplidos: h.filter((t) => t.cumplio).length,
    prestigio: estado.prestigio,
    partidos,
    ganados,
    empatados,
    perdidos,
    efectividad: partidos > 0 ? Math.round(((ganados * 3 + empatados) / (partidos * 3)) * 100) : 0,
    golesFavor: h.reduce((a, t) => a + t.golesFavor, 0),
    golesContra: h.reduce((a, t) => a + t.golesContra, 0),
    mejorTemporada: mejor,
    apodo: apodoDe({ titulos, copas, despidos, temporadas: h.length, clubes: estado.trayectoria.length, prestigio: estado.prestigio }),
  }
}

/**
 * El apodo, que es el titular de la ficha.
 *
 * Se elige por lo que de verdad pasó, no por un puntaje: "El eterno interino" para el que dirigió
 * cinco clubes y no ganó nada dice más de una carrera que cualquier número, y es lo que hace que
 * dos fichas distintas se puedan comparar y comentar.
 */
export function apodoDe(o: {
  titulos: number
  /** Copas nacionales. Un DT copero es un personaje propio del fútbol argentino. */
  copas?: number
  despidos: number
  temporadas: number
  clubes: number
  prestigio: number
}): string {
  const copas = o.copas ?? 0
  if (o.temporadas === 0) return 'Recién llegado'
  if (o.titulos >= 6) return 'Leyenda del banco'
  if (o.titulos >= 3 && o.despidos === 0) return 'El intocable'
  if (o.titulos >= 3) return 'Ganador serial'
  if (o.titulos >= 1 && o.clubes === 1) return 'Ídolo de una sola camiseta'
  if (o.titulos >= 1) return 'Campeón'
  if (copas >= 2) return 'Especialista en copas'
  if (copas >= 1) return 'Copero'
  if (o.despidos >= 3) return 'El eterno interino'
  if (o.clubes >= 4) return 'Trotamundos del banco'
  if (o.despidos === 0 && o.temporadas >= 5) return 'De la casa'
  if (o.prestigio >= 45) return 'Nombre respetado'
  return 'Haciéndose un nombre'
}

export { makeRng }
