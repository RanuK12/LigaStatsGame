import { aBase64Url, deBase64Url } from './link-base64'
import { BASE_URL } from './career-link'

/**
 * El link del once armado.
 *
 * Medido del 7 al 13 de agosto: 13 personas compartieron algo y la página que recibe al que abre
 * un link compartido tuvo UNA visita. El motivo es que el link del draft llevaba a la portada:
 * el que lo abría no veía el equipo de nadie, veía el home, y ahí se termina la conversación.
 *
 * Los tres juegos del rubro que crecieron (Copero, El Ídolo, 7a0) comparten lo mismo: un link
 * que muestra LA PARTIDA del que lo mandó. No un puntaje: un equipo con nombre y apellido, que
 * es lo que da ganas de contestar "el mío es mejor".
 *
 * Como en `career-link`, el equipo viaja DENTRO de la URL: el sitio es export estático y un
 * link que depende de una base de datos es un link que se puede caer. Va en la query y no en el
 * hash porque el Worker que arme la previsualización va a poder leer la query, no el hash.
 */

export interface JugadorCompartido {
  /** Nombre del jugador. */
  n: string
  /** El puesto tal cual lo pide la formación (GK, CB, ST...). */
  p: string
  /** La valoración. */
  o: number
  /** El club, para dibujar el escudo. El escudo no viaja: se arma del id. */
  c?: string
}

export interface EquipoCompartido {
  /** La formación, por su nombre ('4-3-3'). Las posiciones se rearman del catálogo. */
  formacion: string
  once: JugadorCompartido[]
  /** El OVR del once. */
  ovr: number
  /** Cómo terminó: "¡Campeón!", "3° puesto", "Eliminado en Cuartos". */
  resultado: string
  /** El torneo que jugó. */
  torneo: string
  /** Si salió del reto del día, su id: el que abre el link puede jugar el MISMO bombo. */
  reto?: string
}

const VERSION = '1'

function comprimir(e: EquipoCompartido): unknown {
  return {
    v: VERSION,
    f: e.formacion,
    o: e.ovr,
    r: e.resultado,
    t: e.torneo,
    d: e.reto,
    j: e.once.map((x) => [x.n, x.p, x.o, x.c]),
  }
}

export function encodeEquipo(e: EquipoCompartido): string {
  return aBase64Url(new TextEncoder().encode(JSON.stringify(comprimir(e))))
}

/**
 * Devuelve `null` ante cualquier cosa rara en vez de tirar: el parámetro sale de una URL que
 * cualquiera puede editar, y un equipo roto tiene que mostrar "este link no anda".
 */
export function decodeEquipo(param: string): EquipoCompartido | null {
  try {
    const o = JSON.parse(new TextDecoder().decode(deBase64Url(param))) as Record<string, any>
    if (o?.v !== VERSION || !Array.isArray(o.j) || o.j.length === 0) return null

    return {
      formacion: String(o.f || '4-3-3'),
      ovr: Number(o.o) || 0,
      resultado: String(o.r || ''),
      torneo: String(o.t || ''),
      reto: o.d ? String(o.d) : undefined,
      once: o.j.map(([n, p, ovr, c]: [string, string, number, string?]) => ({
        n: String(n || ''),
        p: String(p || ''),
        o: Number(ovr) || 0,
        c: c || undefined,
      })),
    }
  } catch {
    return null
  }
}

export function urlDeEquipo(e: EquipoCompartido): string {
  return `${BASE_URL}/e/?e=${encodeEquipo(e)}`
}
