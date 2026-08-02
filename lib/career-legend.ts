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
    nombre: 'Carlos Tevez',
    bajada: 'El Apache. Dio la vuelta al mundo ganando y volvió a Boca igual.',
    categoria: 'ATT',
    perfil: { titulos: 0.9, europa: 0.6, gol: 0.8, rodaje: 1, techo: 0.9 },
  },
  {
    nombre: 'Walter Samuel',
    bajada: 'El Muro. Quince años de central en Italia sin que nadie le pasara por al lado.',
    categoria: 'DEF',
    perfil: { titulos: 0.7, europa: 0.75, gol: 0.15, rodaje: 0.5, techo: 0.85 },
  },
  {
    nombre: 'Oscar Ruggeri',
    bajada: 'El Cabezón: campeón del mundo y de todo lo que se le puso adelante.',
    categoria: 'DEF',
    perfil: { titulos: 0.9, europa: 0.4, gol: 0.25, rodaje: 0.9, techo: 0.9 },
    requiere: { mundial: true },
  },
  {
    nombre: 'Roberto Perfumo',
    bajada: 'El Mariscal. Se hizo grande de este lado del charco y no le hizo falta más.',
    categoria: 'DEF',
    perfil: { titulos: 0.55, europa: 0, gol: 0.15, rodaje: 0.45, techo: 0.8 },
  },
  {
    nombre: 'Fernando Redondo',
    bajada: 'Elegancia pura en el medio, y en Europa lo entendieron antes que acá.',
    categoria: 'MID',
    perfil: { titulos: 0.6, europa: 0.85, gol: 0.15, rodaje: 0.5, techo: 0.9 },
  },
  {
    nombre: 'Diego Simeone',
    bajada: 'El Cholo jugador: cabeza, pierna fuerte y una valija siempre lista.',
    categoria: 'MID',
    perfil: { titulos: 0.5, europa: 0.7, gol: 0.35, rodaje: 1, techo: 0.75 },
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
  // Los que no llegaron. Uno por puesto, porque la comparación se hace solo dentro del puesto y
  // sin esto un delantero del montón terminaba comparado con Batistuta por descarte.
  {
    nombre: 'un nueve de barrio',
    bajada: 'De los que hacían el gol del domingo y el lunes seguían laburando.',
    categoria: 'ATT',
    perfil: { titulos: 0.1, europa: 0.05, gol: 0.45, rodaje: 0.5, techo: 0.35 },
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
    perfil: { titulos: 0.2, europa: 0, gol: 0.15, rodaje: 0.1, techo: 0.45 },
  },
  {
    nombre: 'un arquero de toda la vida',
    bajada: 'Atajó veinte años en el mismo arco y lo sacaron en andas.',
    categoria: 'GK',
    perfil: { titulos: 0.2, europa: 0, gol: 0, rodaje: 0.25, techo: 0.45 },
  },
]

/** Lleva un valor a 0-1 con techo, para poder comparar cosas de escalas distintas. */
const norm = (v: number, max: number) => Math.min(1, Math.max(0, v / max))

/** El perfil de la carrera jugada, en los mismos ejes que las leyendas. */
function perfilDeCarrera(career: CareerState): Leyenda['perfil'] {
  const titulos = Object.values(career.trophies).reduce((a, b) => a + b, 0)
  const temporadas = Math.max(1, career.seasonsPlayed)
  const clubes = new Set(career.clubHistory).size

  // Temporadas jugadas en Europa, sobre el total. Se cuenta sobre el historial de temporadas y no
  // sobre la lista de clubes: contar clubes y dividir por temporadas mezclaba dos unidades, y un
  // central con quince años de carrera que pasó por Chelsea, Liverpool y el City daba 3/15 = 0,2
  // de Europa. Con eso salía comparado con Roberto Perfumo, cuya ficha dice que nunca se fue.
  const enEuropa = career.history.filter((s) => findClub(s.clubId)?.region === 'euro').length
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

  // El puesto no se negocia. Un central no se parece a Ariel Ortega por más que los números den
  // parecido, y un arquero no se parece a Batistuta por muchos goles que le hayan hecho. Al
  // principio el puesto era solo un empujón en el puntaje y en seis carreras simuladas de verdad
  // salió Ortega cuatro veces, una de ellas para un zaguero.
  const candidatas = LEYENDAS.filter((l) => {
    if (l.categoria !== cat) return false
    if (l.requiere?.mundial && !ganoMundial) return false
    if (l.requiere?.balonDeOro && !tieneBalon) return false
    return true
  })

  let mejor = candidatas[0]
  let mejorDist = Infinity
  for (const l of candidatas) {
    // Distancia al cuadrado, no lineal: castiga estar MUY lejos en un eje. Con distancia lineal
    // ganaba siempre el perfil más promedio, porque nunca quedaba lejos de nada; con esta gana
    // el que tiene la misma forma de carrera, que es lo que se quería comparar.
    let d = 0
    for (const eje of EJES) {
      const dif = mio[eje] - l.perfil[eje]
      d += PESO[eje] * dif * dif
    }
    if (d < mejorDist) {
      mejorDist = d
      mejor = l
    }
  }

  // La distancia máxima posible es la suma de los pesos (cada eje va de 0 a 1, y 1² = 1).
  const maxDist = Object.values(PESO).reduce((a, b) => a + b, 0)
  const parecido = Math.round(Math.max(0, 1 - mejorDist / maxDist) * 100)

  return { leyenda: mejor, parecido }
}
