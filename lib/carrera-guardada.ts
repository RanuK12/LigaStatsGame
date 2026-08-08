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

const CLAVE_CARRERA = 'ligastats_career_v1'

/**
 * El texto guardado, o null si no se puede leer.
 *
 * `localStorage.getItem` no siempre devuelve: en un iframe de otro dominio Safari lo bloquea, y
 * en modo privado hay navegadores que tiran excepción al tocarlo. Sin este envoltorio la
 * excepción sale del `useEffect` de la tarjeta y se lleva puesta la portada entera. El resto del
 * juego (`daily-progress`, `scores`, `sonido`) ya se protege igual. Importa además para poder
 * publicar el juego embebido en portales tipo CrazyGames, que es todo iframe de otro dominio.
 */
export function crudoGuardado(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage.getItem(CLAVE_CARRERA)
  } catch {
    return null
  }
}

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
