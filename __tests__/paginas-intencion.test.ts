import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import sitemap from '@/app/sitemap'

/**
 * Las dos páginas escritas para una intención de búsqueda que NO es la marca.
 *
 * El problema medido: de 62 consultas de Search Console, 61 son "gambeta" y variantes. Google no
 * descubre, devuelve. Estas dos páginas van a lo que la gente sí tipea —verificado el 29/8 en el
 * autocompletado de Google, que solo sugiere consultas reales: "juegos como copero", "juegos como
 * copero y potrero", "simulador de carrera de futbolista online"—.
 *
 * Lo que se protege acá es lo que las hace existir para Google y se rompe sin que nadie lo note:
 * que estén en el sitemap, que tengan título y descripción propios (sin heredar los de la marca)
 * y que declaren su canónica. Una página así sin metadata propia es una copia de la home.
 *
 * Los layouts se leen como texto y no se importan: son `.tsx` y este proyecto corre los tests con
 * el JSX sin transformar, así que un import acá rompe con "invalid JS syntax".
 */
const PAGINAS = [
  { ruta: '/juegos-como-copero/', layout: 'app/juegos-como-copero/layout.tsx' },
  { ruta: '/simulador-carrera-futbolista/', layout: 'app/simulador-carrera-futbolista/layout.tsx' },
]

const fuente = (p: string) => readFileSync(p, 'utf8')

describe('las páginas de intención de búsqueda', () => {
  it('están las dos en el sitemap', () => {
    const urls = sitemap().map((e) => e.url)
    for (const { ruta } of PAGINAS) {
      expect(urls, `falta ${ruta} en el sitemap`).toContain(`https://gambetafutbol.games${ruta}`)
    }
  })

  it('cada una declara su canónica, que es su propia URL', () => {
    for (const { ruta, layout } of PAGINAS) {
      expect(fuente(layout), `${layout} no declara su canónica`).toContain(`canonical: '${ruta}'`)
    }
  })

  it('cada una tiene título propio y no empieza con la marca', () => {
    for (const { layout } of PAGINAS) {
      const título = fuente(layout).match(/title:\s*'([^']+)'/)?.[1]
      expect(título, `${layout} no tiene title`).toBeTruthy()
      // El título de la home empieza con la marca; el de una página de intención, con lo que se
      // busca. Si alguna arranca con "Gambeta", perdió la consulta antes de empezar.
      expect(título!.startsWith('Gambeta')).toBe(false)
      expect(título!.length).toBeGreaterThan(20)
    }
  })

  it('cada una tiene descripción propia y larga', () => {
    for (const { layout } of PAGINAS) {
      const desc = fuente(layout).match(/description:\s*\n?\s*'([^']+)'/)?.[1]
      expect(desc, `${layout} no tiene description`).toBeTruthy()
      expect(desc!.length).toBeGreaterThan(80)
    }
  })
})
