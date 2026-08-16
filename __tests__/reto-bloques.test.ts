import { describe, it, expect } from 'vitest'
import { bloqueDe, lineaDePuesto, textoDeBloques, type RetoParaCompartir } from '@/lib/reto-bloques'

const once = (ratings: number[]) => {
  const lineas = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'ATT']
  return ratings.map((rating, i) => ({ rating, linea: lineas[i] }))
}

const base: RetoParaCompartir = {
  numero: 47,
  titulo: 'Clásico Eterno',
  jugadores: once([78, 76, 71, 66, 62, 80, 72, 68, 81, 73, 69]),
  puntaje: 72.5,
}

describe('el resultado del reto en bloques', () => {
  it('cada nivel tiene su color', () => {
    // Los cortes siguen a la escala real de la liga (p75=67, p90=72, p95=74), no a números
    // redondos: si se vuelve a mover la escala, esto tiene que moverse con ella.
    expect(bloqueDe(82)).toBe('🟩')
    expect(bloqueDe(74)).toBe('🟩')
    expect(bloqueDe(73)).toBe('🟨')
    expect(bloqueDe(70)).toBe('🟨')
    expect(bloqueDe(69)).toBe('🟧')
    expect(bloqueDe(65)).toBe('🟧')
    expect(bloqueDe(64)).toBe('⬜')
  })

  /** Una fila por línea, en el orden en que salen a la cancha: se lee como una formación. */
  it('se dibuja por líneas, del arco al ataque', () => {
    const filas = textoDeBloques(base).split('\n')
    expect(filas[0]).toBe('Gambeta ⚽ Reto #47 · Clásico Eterno')
    expect(filas[1]).toBe('🟩')
    expect(filas[2]).toBe('🟩🟨🟧⬜')
    expect(filas[3]).toBe('🟩🟨🟧')
    expect(filas[4]).toBe('🟩🟨🟧')
    expect(filas[5]).toBe('Media 73')
  })

  /**
   * Todo el sentido del formato es que se pueda comparar sin spoilear: si el texto dijera un
   * nombre, el que lo lee ya no juega el mismo bombo a ciegas.
   */
  it('no se escapa ningún nombre de jugador', () => {
    const filas = textoDeBloques({ ...base, campeon: true, racha: 4 }).split('\n')
    // Las filas del medio son la grilla: solo cuadraditos, ni una letra.
    expect(filas.slice(1, -1).join('')).toMatch(/^[🟩🟨🟧⬜]+$/u)
    // Y el encabezado nombra el reto, no a quién te tocó.
    expect(filas[0]).toBe('Gambeta ⚽ Reto #47 · Clásico Eterno')
  })

  it('el campeonato y la racha van al pie', () => {
    expect(textoDeBloques({ ...base, campeon: true, racha: 4 })).toContain('Media 73 · 🏆 Campeón · 🔥 4 días')
  })

  it('sin título, el puesto ocupa su lugar', () => {
    expect(textoDeBloques({ ...base, puesto: 6 })).toContain('Media 73 · 6º')
  })

  /** "racha de 1 día" no impresiona a nadie y ensucia el mensaje. */
  it('la racha de un solo día no se muestra', () => {
    expect(textoDeBloques({ ...base, racha: 1 })).not.toContain('🔥')
  })

  /** Los códigos son los de `formations` en game-engine: si aparece uno nuevo, cae en el medio. */
  it('cada puesto de la formación cae en su línea', () => {
    expect(['GK'].map(lineaDePuesto)).toEqual(['GK'])
    expect(['CB', 'LB', 'RB', 'LWB', 'RWB'].map(lineaDePuesto)).toEqual(Array(5).fill('DEF'))
    expect(['CDM', 'CM', 'CAM', 'LM', 'RM'].map(lineaDePuesto)).toEqual(Array(5).fill('MID'))
    expect(['LW', 'RW', 'ST', 'CF'].map(lineaDePuesto)).toEqual(Array(4).fill('ATT'))
    expect(lineaDePuesto('PUESTO_QUE_NO_EXISTE')).toBe('MID')
  })

  it('una formación sin delanteros no deja una fila vacía', () => {
    const sinAtaque = base.jugadores.filter((j) => j.linea !== 'ATT')
    const filas = textoDeBloques({ ...base, jugadores: sinAtaque }).split('\n')
    expect(filas.every((f) => f.length > 0)).toBe(true)
    expect(filas).toHaveLength(5)
  })
})
