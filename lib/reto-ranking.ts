import { supabase } from './supabase'

/**
 * Los tres rankings del reto del día.
 *
 * De dónde sale: 7a0 (7a0.com.br) llegó a 11,5 millones de visitas y perdió el 51 % en un mes.
 * Su respuesta fue el "Desafio do Dia" con el mismo bombo para todos y TRES tablas —general,
 * fuerza y eficiencia— en vez de una. No es cosmético: con una sola tabla hay un primero por día
 * y con tres hay tres, y el que sale primero en algo es el que lo publica.
 *
 * Acá las tres son:
 * · General: los puntos que sacó en el torneo. Es el resultado.
 * · Fuerza: el OVR del once. Premia el bombo bien aprovechado.
 * · Eficiencia: puntos por cada 10 de OVR. Premia al que rinde por encima del papel, que es el
 *   único de los tres que puede ganar alguien a quien el bombo le salió flojo.
 *
 * Entran los invitados, no solo los registrados. El ranking global es de los que tienen cuenta a
 * propósito, pero una tabla diaria vacía no la mira nadie, y el 87 % de los que entran al juego
 * no tiene cuenta.
 */

export interface EntradaReto {
  reto: string
  /** El día en formato YYYY-MM-DD local: es la clave por la que se agrupa la tabla. */
  fecha: string
  username: string
  pts: number
  ovr: number
  pos: number
}

export type Tabla = 'general' | 'fuerza' | 'eficiencia'

/** Puntos por cada 10 de OVR, con un decimal. Sin OVR no hay eficiencia posible. */
export function eficiencia(pts: number, ovr: number): number {
  if (!ovr) return 0
  return Math.round((pts / ovr) * 100) / 10
}

/**
 * Guarda el resultado del reto. Devuelve false y sigue de largo ante cualquier problema: el
 * reto se juega igual sin tabla, y una partida no se puede perder por una tabla que no anda.
 */
export async function guardarResultadoReto(e: EntradaReto): Promise<boolean> {
  if (!supabase) return false
  try {
    const { error } = await supabase.from('reto_diario').insert([
      {
        reto: e.reto,
        fecha: e.fecha,
        username: e.username.slice(0, 40),
        pts: e.pts,
        ovr: e.ovr,
        pos: e.pos,
        eficiencia: eficiencia(e.pts, e.ovr),
      },
    ])
    return !error
  } catch {
    return false
  }
}

export interface FilaReto {
  username: string
  pts: number
  ovr: number
  eficiencia: number
}

/**
 * El top de una de las tres tablas del día.
 *
 * Devuelve `null` —y no una lista vacía— cuando no se pudo consultar (sin Supabase, sin red, o
 * la tabla todavía no existe), para que la pantalla sepa la diferencia entre "no hay tabla" y
 * "hoy no jugó nadie todavía".
 */
export async function topDelDia(fecha: string, tabla: Tabla, limite = 20): Promise<FilaReto[] | null> {
  if (!supabase) return null
  const columna = tabla === 'general' ? 'pts' : tabla === 'fuerza' ? 'ovr' : 'eficiencia'
  try {
    const { data, error } = await supabase
      .from('reto_diario')
      .select('username, pts, ovr, eficiencia')
      .eq('fecha', fecha)
      .order(columna, { ascending: false })
      .limit(limite)
    if (error || !data) return null
    return data as FilaReto[]
  } catch {
    return null
  }
}
