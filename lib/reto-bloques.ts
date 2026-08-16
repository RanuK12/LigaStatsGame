/**
 * El resultado del reto del día en bloques de color, para pegar en un grupo de WhatsApp.
 *
 * Es la pieza que le falta al reto diario para funcionar como Wordle. Hoy compartir el reto
 * necesita una imagen o un link, y las dos cosas se pierden en un grupo: la imagen no se lee en
 * la vista previa y el link nadie lo abre. Wordle creció con texto plano que se pega en
 * cualquier lado y que provoca sin spoilear — el que lo lee ve cómo te fue, no CON QUÉ.
 *
 * Cada cuadrado es uno de los once, por línea, ordenado como sale a la cancha. El color dice el
 * nivel del jugador y nada más: dos personas que jugaron el mismo bombo comparan sus grillas y
 * ninguna se entera de qué jugador le tocó a la otra.
 */

export type TierBloque = '🟩' | '🟨' | '🟧' | '⬜'

/** Los cortes salen de cómo se reparte el OVR en data/players.json, no de números redondos. */
export function bloqueDe(rating: number): TierBloque {
  // Recalculados el 16/8 con la escala real de la liga: los jugadores están en p75=67, p90=72 y
  // p95=74, así que verde es el 5 % de arriba y no un número que ya no alcanzaba nadie.
  if (rating >= 74) return '🟩'
  if (rating >= 70) return '🟨'
  if (rating >= 65) return '🟧'
  return '⬜'
}

export interface JugadorBloque {
  rating: number
  /** GK · DEF · MID · ATT */
  linea: string
}

const ORDEN = ['GK', 'DEF', 'MID', 'ATT']

const LINEA: Record<string, string> = {
  GK: 'GK',
  CB: 'DEF', LB: 'DEF', RB: 'DEF', LWB: 'DEF', RWB: 'DEF',
  CDM: 'MID', CM: 'MID', CAM: 'MID', LM: 'MID', RM: 'MID',
  LW: 'ATT', RW: 'ATT', ST: 'ATT', CF: 'ATT',
}

/** De qué línea es el puesto de la formación. Un puesto desconocido se cuenta como medio. */
export function lineaDePuesto(pos: string): string {
  return LINEA[pos] ?? 'MID'
}

export interface RetoParaCompartir {
  numero: number
  titulo: string
  jugadores: JugadorBloque[]
  puntaje: number
  campeon?: boolean
  puesto?: number
  /** Días seguidos. Solo se muestra si hay racha: "racha de 1" no impresiona a nadie. */
  racha?: number
}

/**
 * El texto listo para copiar. Sin link: el link lo agrega el botón de compartir si hace falta,
 * y en un grupo de WhatsApp un mensaje sin link se lee como un mensaje y no como publicidad.
 */
export function textoDeBloques(r: RetoParaCompartir): string {
  const porLinea = ORDEN.map((linea) =>
    r.jugadores
      .filter((j) => j.linea === linea)
      .map((j) => bloqueDe(j.rating))
      .join(''),
  ).filter((fila) => fila.length > 0)

  const cierre = [
    `Media ${Math.round(r.puntaje)}`,
    r.campeon ? '🏆 Campeón' : r.puesto ? `${r.puesto}º` : null,
    r.racha && r.racha > 1 ? `🔥 ${r.racha} días` : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return [`Gambeta ⚽ Reto #${r.numero} · ${r.titulo}`, ...porLinea, cierre].join('\n')
}
