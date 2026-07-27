import { describe, it, expect } from 'vitest'
import { simularMundial, rolEnLaSeleccion } from '@/lib/world-cup'
import { makeRng } from '@/lib/career-engine'

describe('Mundial', () => {
  it('tu rol depende de tu OVR contra el nivel de TU selección', () => {
    // Con 78 sos suplente en Argentina pero figura en Paraguay
    expect(rolEnLaSeleccion(78, 90)).toBe('alternativa')
    expect(rolEnLaSeleccion(78, 74)).toBe('figura')
    expect(rolEnLaSeleccion(70, 90)).toBe('convocado')
    expect(rolEnLaSeleccion(88, 90)).toBe('titular')
  })

  it('el recorrido es coherente: se juegan 3 de grupo y la llave se corta donde te eliminan', () => {
    for (let seed = 0; seed < 40; seed++) {
      const wc = simularMundial({ year: 2026, seleccion: 'Argentina', fuerzaSeleccion: 90, ovrJugador: 88, categoria: 'ATT', rng: makeRng(seed * 9 + 1) })
      expect(wc.partidos.filter((p) => p.ronda === 'Grupo')).toHaveLength(3)
      // Campeón = jugó las cuatro rondas de la llave
      if (wc.campeon) expect(wc.partidos).toHaveLength(7)
      if (wc.ronda === 'grupos') expect(wc.partidos).toHaveLength(3)
      // No podés jugar más partidos que los que jugó el equipo
      expect(wc.caps).toBeLessThanOrEqual(wc.partidos.length)
      expect(wc.puntaje).toBeGreaterThanOrEqual(0)
      expect(wc.puntaje).toBeLessThanOrEqual(1)
    }
  })

  it('una selección grande gana más seguido que una chica, pero ninguna gana siempre', () => {
    const campeon = (fuerza: number) => {
      let n = 0
      for (let s = 0; s < 100; s++) {
        if (simularMundial({ year: 2026, seleccion: 'X', fuerzaSeleccion: fuerza, ovrJugador: 85, categoria: 'ATT', rng: makeRng(s * 31 + 11) }).campeon) n++
      }
      return n
    }
    const grande = campeon(90)
    const chica = campeon(74)
    expect(grande).toBeGreaterThan(chica)
    expect(grande).toBeLessThan(45) // ni la mejor gana la mitad de los Mundiales
    expect(grande).toBeGreaterThan(3)
  })
})
