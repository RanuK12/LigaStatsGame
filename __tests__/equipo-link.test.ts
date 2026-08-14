import { describe, it, expect } from 'vitest'
import { encodeEquipo, decodeEquipo, urlDeEquipo, type EquipoCompartido } from '@/lib/equipo-link'
import { formations } from '@/lib/game-engine'

const equipo: EquipoCompartido = {
  formacion: '4-3-3',
  ovr: 87,
  resultado: '¡Campeón!',
  torneo: 'Liga Profesional',
  once: formations['4-3-3'].positions.map((p, i) => ({
    n: `Jugador ${i + 1}`,
    p: p.pos,
    o: 80 + i,
    c: i % 2 === 0 ? 'boca-juniors' : undefined,
  })),
}

describe('el link del once', () => {
  it('vuelve entero después de ida y vuelta', () => {
    const vuelto = decodeEquipo(encodeEquipo(equipo))
    expect(vuelto).toEqual(equipo)
  })

  it('conserva el reto del día, que es lo que deja jugar el mismo bombo', () => {
    const vuelto = decodeEquipo(encodeEquipo({ ...equipo, reto: 'clasico-eterno' }))
    expect(vuelto?.reto).toBe('clasico-eterno')
  })

  it('sobrevive a los acentos y a los nombres largos', () => {
    const conAcentos = { ...equipo, once: [{ n: 'Ariel Ortega "El Burrito"', p: 'CAM', o: 88 }] }
    expect(decodeEquipo(encodeEquipo(conAcentos))?.once[0].n).toBe('Ariel Ortega "El Burrito"')
  })

  it('devuelve null y no explota con un parámetro roto', () => {
    // El link se copia a mano en WhatsApp: se corta, se pega de más, se edita.
    expect(decodeEquipo('no-es-base64-!!')).toBeNull()
    expect(decodeEquipo('')).toBeNull()
    expect(decodeEquipo(encodeEquipo(equipo).slice(0, 20))).toBeNull()
  })

  it('rechaza un equipo sin jugadores en vez de mostrar una cancha vacía', () => {
    expect(decodeEquipo(encodeEquipo({ ...equipo, once: [] }))).toBeNull()
  })

  it('la url apunta a /e/ y entra en un mensaje', () => {
    const url = urlDeEquipo(equipo)
    expect(url.startsWith('https://gambetafutbol.games/e/?e=')).toBe(true)
    // WhatsApp y X no cortan a esta altura, pero conviene saber si un cambio la dispara.
    expect(url.length).toBeLessThan(1200)
  })
})
