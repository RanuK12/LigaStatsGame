import { describe, it, expect } from 'vitest'
import { eficiencia } from '@/lib/reto-ranking'

describe('la eficiencia del reto', () => {
  it('premia al que saca los mismos puntos con un once peor', () => {
    const conBombazo = eficiencia(60, 88)
    const conLoQueVino = eficiencia(60, 74)
    expect(conLoQueVino).toBeGreaterThan(conBombazo)
  })

  it('son puntos por cada 10 de OVR, con un decimal', () => {
    expect(eficiencia(60, 80)).toBe(7.5)
    expect(eficiencia(45, 75)).toBe(6)
  })

  it('sin OVR devuelve 0 en vez de infinito', () => {
    // Pasó de verdad en el modo carrera: una división por cero llegó hasta la pantalla.
    expect(eficiencia(30, 0)).toBe(0)
  })
})
