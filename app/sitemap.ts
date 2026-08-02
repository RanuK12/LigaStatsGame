import type { MetadataRoute } from 'next'
import equipos from '@/data/derived/equipos.json'

/**
 * El sitemap que robots.txt viene prometiendo desde el primer día.
 *
 * Estaba anunciado en `public/robots.txt` y la URL devolvía 404, así que Google descubría las
 * páginas de casualidad, siguiendo links. Y la búsqueda de Google es el 85 % del tráfico: 324 de
 * las 381 sesiones del 31 de julio y el 1 de agosto.
 *
 * `output: 'export'` lo escribe como archivo estático en el build, igual que el resto del sitio.
 * `trailingSlash: true` en next.config obliga a que las URLs terminen en barra: si acá van sin
 * barra, Google encuentra un redirect en cada entrada del sitemap.
 */
const BASE = 'https://gambetafutbol.games'

// La prioridad no es un ranking: le dice a Google qué mirar primero cuando vuelve. El draft y la
// carrera son a lo que la gente le dedica tiempo de verdad (2 min 49 s y 3 min 41 s de media).
const RUTAS: Array<[string, number, MetadataRoute.Sitemap[number]['changeFrequency']]> = [
  ['/', 1.0, 'daily'],
  ['/draft/', 0.9, 'weekly'],
  ['/carrera/', 0.9, 'weekly'],
  // El índice de equipos históricos: es la puerta a las 36 páginas de contenido, y lo único de
  // todo el sitio que responde a lo que la gente busca de verdad ("Vélez 1994 plantel").
  ['/equipos/', 0.9, 'monthly'],
  ['/daily/', 0.8, 'daily'],
  ['/como-jugar/', 0.7, 'monthly'],
  ['/datos/', 0.7, 'weekly'],
  ['/leaderboard/', 0.6, 'daily'],
  ['/records/', 0.6, 'weekly'],
  ['/versus/', 0.5, 'monthly'],
  ['/ruleta/', 0.5, 'monthly'],
  ['/legal/', 0.3, 'yearly'],
]

export default function sitemap(): MetadataRoute.Sitemap {
  // Sin hora: el sitemap se genera en cada build y una marca con hora haría que Google viera
  // "cambió todo" cada vez que se despliega, aunque no haya cambiado nada.
  const hoy = new Date().toISOString().slice(0, 10)

  const fijas = RUTAS.map(([ruta, priority, changeFrequency]) => ({
    url: `${BASE}${ruta}`,
    lastModified: hoy,
    changeFrequency,
    priority,
  }))

  // Una entrada por equipo histórico. Son páginas de archivo: el plantel del Vélez del 94 no
  // cambia, así que 'yearly' le dice a Google que no vuelva a mirarlas todas las semanas.
  const deEquipos = equipos.map((e) => ({
    url: `${BASE}/equipos/${e.slug}/`,
    lastModified: hoy,
    changeFrequency: 'yearly' as const,
    priority: 0.7,
  }))

  return [...fijas, ...deEquipos]
}
