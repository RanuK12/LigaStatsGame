import { describe, it, expect } from 'vitest'
import { leerCarrera } from '@/lib/carrera-guardada'

/**
 * La tarjeta del home lee el guardado a mano en vez de montar el store, para no arrastrar
 * `career-engine` (y sus 189 kB de ligas.json) al bundle de la portada. El precio de eso es que
 * la forma que escribe `persist` pasa a ser un contrato: si zustand cambia dónde guarda el
 * estado, la tarjeta deja de aparecer en silencio y nadie se entera.
 */
const guardado = (career: unknown) => JSON.stringify({ state: { career }, version: 2 })

const enCurso = {
  player: { name: 'Emilio', ovr: 71, age: 19 },
  clubId: 'velez',
  seasonsPlayed: 3,
  finished: false,
}

describe('la carrera empezada que se ofrece en el home', () => {
  it('sin nada guardado no hay tarjeta', () => {
    expect(leerCarrera(null)).toBeNull()
  })

  it('una carrera en curso se lee con sus datos', () => {
    expect(leerCarrera(guardado(enCurso))).toEqual({
      nombre: 'Emilio',
      ovr: 71,
      edad: 19,
      temporadas: 3,
      clubId: 'velez',
    })
  })

  /** La terminada ya tiene su ficha final: ofrecer "seguir" ahí no tiene sentido. */
  it('una carrera terminada no se ofrece', () => {
    expect(leerCarrera(guardado({ ...enCurso, finished: true }))).toBeNull()
  })

  it('un guardado corrupto no rompe el home', () => {
    expect(leerCarrera('esto no es json')).toBeNull()
  })

  it('la forma vieja sin `state` tampoco rompe', () => {
    expect(leerCarrera(JSON.stringify({ career: enCurso }))).toBeNull()
  })
})
