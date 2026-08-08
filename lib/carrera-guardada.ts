/**
 * Leer la carrera que quedó guardada, sin arrastrar el motor.
 *
 * La tarjeta del home necesita cuatro datos de la partida guardada, y montar `career-store`
 * para eso mete `career-engine` —y sus 189 kB de `ligas.json`— en el bundle de la portada, que
 * ya carga 320 kB de JS y en móvil convierte cuatro veces peor.
 *
 * Es una función pura sobre el texto crudo, no sobre `localStorage`: así se prueba sin navegador
 * y la forma que escribe `persist` queda fijada por un test. Si zustand cambia dónde guarda el
 * estado, la tarjeta desaparecería en silencio y nadie se enteraría.
 */
export interface CarreraGuardada {
  nombre: string
  ovr: number
  edad: number
  temporadas: number
  clubId: string
}

export const CLAVE_CARRERA = 'ligastats_career_v1'

export function leerCarrera(crudo: string | null): CarreraGuardada | null {
  if (!crudo) return null
  try {
    const c = JSON.parse(crudo)?.state?.career
    // Una carrera terminada no se "sigue": esa ya tiene su ficha final.
    if (!c || c.finished || !c.player) return null
    return {
      nombre: c.player.name,
      ovr: c.player.ovr,
      edad: c.player.age,
      temporadas: c.seasonsPlayed ?? 0,
      clubId: c.clubId,
    }
  } catch {
    return null
  }
}
