import { describe, it, expect } from 'vitest'
import datos from '@/data/derived/curiosidades.json'

const { mazo, efemerides } = datos as unknown as {
  mazo: { id: string; texto: string; rareza: string }[]
  efemerides: { squadId: string; label: string; texto: string; anio: number }[]
}

/**
 * El mazo y las efemérides comparten los hitos: el id del mazo es `hito-` + el squadId de la
 * efeméride. Eso está bien —es la misma base— pero significa que el dato de "un día como hoy",
 * que está escrito arriba en la misma pantalla, puede volver a salir en el dado.
 *
 * Pasó en la primera tirada al sacar las capturas de prensa: arriba decía "Boca 1998, campeón
 * del Apertura, arranque de la era Bianchi" y el dado devolvió exactamente eso.
 */
describe('el mazo de ¿Sabías que?', () => {
  it('cada hito de las efemérides tiene su carta en el mazo, con el id que las liga', () => {
    // Si esta relación se rompe, el filtro de `tirar` deja de excluir nada y no se entera nadie.
    const ids = new Set(mazo.map((c) => c.id))
    const ligados = efemerides.filter((e) => ids.has(`hito-${e.squadId}`))
    expect(ligados.length, 'ninguna efeméride tiene carta: el id dejó de ser hito-<squadId>')
      .toBeGreaterThan(0)
  })

  it('no hay dos cartas con el mismo id', () => {
    const ids = mazo.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ninguna carta viene sin texto ni con una rareza inventada', () => {
    for (const c of mazo) {
      expect(c.texto.trim().length, c.id).toBeGreaterThan(20)
      expect(['comun', 'insolito', 'leyenda'], c.id).toContain(c.rareza)
    }
  })

  it('el mazo alcanza para varios días sin repetir', () => {
    // Son 3 tiradas por día: con menos de 30 cartas la colección se agota en una semana.
    expect(mazo.length).toBeGreaterThanOrEqual(30)
  })
})
