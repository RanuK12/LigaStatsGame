import {
  findClub,
  positionCategory,
  type CareerState,
  type PositionCategory,
} from './career-engine'

/**
 * A quién te pareciste.
 *
 * Es lo que hace que la ficha de El Ídolo circule: al retirarte te dice a qué leyenda real se
 * pareció tu carrera. "Te pareciste a Riquelme" se comparte; "12 títulos" no. La comparación es
 * el titular de la placa, y el titular es lo único que se lee cuando alguien pasa el dedo por la
 * línea de tiempo.
 *
 * Cómo se elige: cada leyenda es un perfil de carrera —dónde jugó, cuánto ganó, si fue campeón
 * del mundo, si se quedó en un club o dio la vuelta al mundo— y la carrera del jugador se
 * compara contra todos. Gana el más parecido. No hay azar: la misma carrera da siempre la misma
 * leyenda, que es lo que hace que valga la pena mostrarla.
 *
 * Sobre los datos: cada perfil describe la FORMA de una carrera real (posición, si ganó un
 * Mundial, si se fue a Europa, si fue de un solo club), no estadísticas puntuales. Es lo que se
 * puede afirmar sin inventar números.
 */

export interface Leyenda {
  nombre: string
  /** La frase que va debajo del nombre en la ficha. */
  bajada: string
  categoria: PositionCategory
  /** Rasgos de la carrera, de 0 a 1. Es contra esto que se compara. */
  perfil: {
    /** Cuánto ganó. 1 = vitrina llena. */
    titulos: number
    /** Cuánto de la carrera transcurrió en Europa. 0 = nunca se fue. */
    europa: number
    /** Cuánto goleó, relativo a su puesto. */
    gol: number
    /** Cuántos clubes tuvo. 0 = uno solo toda la vida. */
    rodaje: number
    /** Techo alcanzado. */
    techo: number
  }
  /** Filtros duros: si la carrera no los cumple, esta leyenda no puede salir. */
  requiere?: { mundial?: boolean; balonDeOro?: boolean }
}

// El orden no importa: siempre gana el más parecido.
const LEYENDAS: Leyenda[] = [
  {
    nombre: 'Diego Maradona',
    bajada: 'Campeón del mundo y ese gol. No hay carrera que se le parezca del todo.',
    categoria: 'ATT',
    perfil: { titulos: 0.85, europa: 0.75, gol: 0.85, rodaje: 0.7, techo: 1 },
    requiere: { mundial: true },
  },
  {
    nombre: 'Lionel Messi',
    bajada: 'Ganó todo lo que se podía ganar, y después ganó el Mundial.',
    categoria: 'ATT',
    perfil: { titulos: 1, europa: 0.9, gol: 1, rodaje: 0.45, techo: 1 },
    requiere: { mundial: true, balonDeOro: true },
  },
  {
    nombre: 'Juan Román Riquelme',
    bajada: 'El último diez. Se hizo ídolo eterno en Boca y volvió para quedarse.',
    categoria: 'MID',
    perfil: { titulos: 0.8, europa: 0.35, gol: 0.5, rodaje: 0.45, techo: 0.9 },
  },
  {
    nombre: 'Gabriel Batistuta',
    bajada: 'Gol tras gol en Italia. El nueve que todos querían tener.',
    categoria: 'ATT',
    perfil: { titulos: 0.45, europa: 0.8, gol: 1, rodaje: 0.75, techo: 0.9 },
  },
  {
    nombre: 'Juan Sebastián Verón',
    bajada: 'La Brujita: se fue a lo más alto de Europa y volvió a levantar la Copa con Estudiantes.',
    categoria: 'MID',
    perfil: { titulos: 0.75, europa: 0.7, gol: 0.4, rodaje: 0.85, techo: 0.9 },
  },
  {
    nombre: 'Javier Zanetti',
    bajada: 'Una vida en un solo club de Europa. El capitán que nunca se cansó.',
    categoria: 'DEF',
    perfil: { titulos: 0.8, europa: 0.9, gol: 0.15, rodaje: 0.15, techo: 0.9 },
  },
  {
    nombre: 'Ricardo Bochini',
    bajada: 'Toda la carrera en Independiente. El ídolo de un solo club.',
    categoria: 'MID',
    perfil: { titulos: 0.75, europa: 0, gol: 0.45, rodaje: 0, techo: 0.85 },
  },
  {
    nombre: 'Hernán Crespo',
    bajada: 'Salió de River y goleó en media Europa. Nunca dejó de convertir.',
    categoria: 'ATT',
    perfil: { titulos: 0.6, europa: 0.85, gol: 0.95, rodaje: 0.95, techo: 0.85 },
  },
  {
    nombre: 'Martín Palermo',
    bajada: 'El Titán. Le erró tres penales en un partido y siguió haciendo goles.',
    categoria: 'ATT',
    perfil: { titulos: 0.7, europa: 0.3, gol: 0.95, rodaje: 0.6, techo: 0.8 },
  },
  {
    nombre: 'Roberto Ayala',
    bajada: 'El Ratón. Zaguero de la Selección durante una década, siempre en Europa.',
    categoria: 'DEF',
    perfil: { titulos: 0.5, europa: 0.85, gol: 0.1, rodaje: 0.8, techo: 0.85 },
  },
  {
    nombre: 'Ubaldo Fillol',
    bajada: 'El Pato: campeón del mundo bajo los tres palos.',
    categoria: 'GK',
    perfil: { titulos: 0.7, europa: 0.2, gol: 0, rodaje: 0.6, techo: 0.9 },
    requiere: { mundial: true },
  },
  {
    nombre: 'Sergio Goycochea',
    bajada: 'El arquero de los penales. Se hizo leyenda en el momento justo.',
    categoria: 'GK',
    perfil: { titulos: 0.35, europa: 0.3, gol: 0, rodaje: 0.8, techo: 0.75 },
  },
  {
    nombre: 'Ariel Ortega',
    bajada: 'El Burrito. Talento de sobra y una carrera que siempre volvía a River.',
    categoria: 'ATT',
    perfil: { titulos: 0.45, europa: 0.5, gol: 0.5, rodaje: 0.8, techo: 0.8 },
  },
  {
    nombre: 'Marcelo Gallardo',
    bajada: 'El Muñeco jugador: pausa, gol y títulos de los dos lados del charco.',
    categoria: 'MID',
    perfil: { titulos: 0.65, europa: 0.45, gol: 0.55, rodaje: 0.7, techo: 0.8 },
  },
  {
    nombre: 'Esteban Cambiasso',
    bajada: 'El Cuchu: el que corría por todos. Ganó todo sin que nadie lo nombrara primero.',
    categoria: 'MID',
    perfil: { titulos: 0.85, europa: 0.85, gol: 0.3, rodaje: 0.6, techo: 0.8 },
  },
  {
    nombre: 'Carlos Bianchi',
    bajada: 'Goleador en Francia cuando irse era ir a la aventura.',
    categoria: 'ATT',
    perfil: { titulos: 0.35, europa: 0.7, gol: 0.95, rodaje: 0.55, techo: 0.75 },
  },
  {
    nombre: 'un histórico del Ascenso',
    bajada: 'De los que se ganaron el respeto sin salir en la tapa de los diarios.',
    categoria: 'MID',
    perfil: { titulos: 0.1, europa: 0.05, gol: 0.3, rodaje: 0.5, techo: 0.35 },
  },
  {
    nombre: 'un ídolo de barrio',
    bajada: 'Nunca se fue del club que lo vio nacer, y ahí lo siguen cantando.',
    categoria: 'DEF',
    perfil: { titulos: 0.2, europa: 0, gol: 0.15, rodaje: 0.1, techo: 0.5 },
  },
]

/** Lleva un valor a 0-1 con techo, para poder comparar cosas de escalas distintas. */
const norm = (v: number, max: number) => Math.min(1, Math.max(0, v / max))

/** El perfil de la carrera jugada, en los mismos ejes que las leyendas. */
function perfilDeCarrera(career: CareerState): Leyenda['perfil'] {
  const titulos = Object.values(career.trophies).reduce((a, b) => a + b, 0)
  const temporadas = Math.max(1, career.seasonsPlayed)
  const clubes = new Set(career.clubHistory).size

  // Temporadas en Europa, sobre el total. Un club sin ficha se cuenta como argentino: es lo que
  // era antes de que existieran los clubes europeos en la base.
  const enEuropa = career.clubHistory.filter((id) => findClub(id)?.region === 'euro').length
  const pico = Math.max(career.player.ovr, ...career.history.map((s) => s.nextOvr ?? s.ovr))

  // Los goles se miden contra el puesto: 40 goles de un central no son 40 goles de un nueve.
  const cat = positionCategory(career.player.position)
  const techoGol = cat === 'ATT' ? 250 : cat === 'MID' ? 120 : cat === 'DEF' ? 40 : 1
  const gol = cat === 'GK' ? 0 : norm(career.totals.goals, techoGol)

  return {
    titulos: norm(titulos, 14),
    europa: norm(enEuropa, temporadas),
    gol,
    rodaje: norm(clubes - 1, 6),
    // 60 es el piso de la base y 99 el techo, así que la escala útil son esos 39 puntos.
    techo: norm(pico - 60, 39),
  }
}

const EJES = ['titulos', 'europa', 'gol', 'rodaje', 'techo'] as const

// El techo pesa el doble: es lo que separa una carrera de leyenda de una carrera digna, y sin
// esto un jugador de 70 con muchos clubes salía comparado con Crespo.
const PESO: Record<(typeof EJES)[number], number> = {
  titulos: 1.3,
  europa: 1,
  gol: 1.1,
  rodaje: 0.7,
  techo: 2,
}

export interface Comparacion {
  leyenda: Leyenda
  /** Qué tan parecida es la carrera, de 0 a 100. Va en la ficha. */
  parecido: number
}

/**
 * A qué leyenda se pareció esta carrera.
 *
 * Determinística: la misma carrera devuelve siempre lo mismo. Nunca devuelve null — si nada
 * encaja, encaja el ídolo de barrio, que es una comparación tan válida como las otras.
 */
export function leyendaParecida(career: CareerState): Comparacion {
  const mio = perfilDeCarrera(career)
  const cat = positionCategory(career.player.position)
  const ganoMundial = career.milestones.worldCup === true
  const tieneBalon = (career.milestones.balonDeOro ?? 0) > 0

  const candidatas = LEYENDAS.filter((l) => {
    if (l.requiere?.mundial && !ganoMundial) return false
    if (l.requiere?.balonDeOro && !tieneBalon) return false
    // El puesto no se negocia: un arquero no se parece a Batistuta por más goles que le hayan
    // hecho. Los arqueros solo se comparan con arqueros y viceversa.
    if (cat === 'GK') return l.categoria === 'GK'
    return l.categoria !== 'GK'
  })

  let mejor = candidatas[0]
  let mejorDist = Infinity
  for (const l of candidatas) {
    // Distancia ponderada: cuanto más chica, más se parece.
    let d = 0
    for (const eje of EJES) d += PESO[eje] * Math.abs(mio[eje] - l.perfil[eje])
    // Mismo puesto exacto, un empujón: entre dos parecidos gana el del puesto del jugador.
    if (l.categoria === cat) d -= 0.25
    if (d < mejorDist) {
      mejorDist = d
      mejor = l
    }
  }

  // La distancia máxima posible es la suma de los pesos; el parecido es lo que queda de eso.
  const maxDist = Object.values(PESO).reduce((a, b) => a + b, 0)
  const parecido = Math.round(Math.max(0, 1 - Math.max(0, mejorDist) / maxDist) * 100)

  return { leyenda: mejor, parecido }
}
