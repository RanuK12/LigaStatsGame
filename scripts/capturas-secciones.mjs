// Capturas de cada sección del juego, para que el bot de X promocione lo que hay adentro.
//
//   npm run dev              (en otra terminal)
//   node scripts/capturas-secciones.mjs
//
// Por qué existe: la cuenta responde cosas genéricas de fútbol y nunca dice qué tiene el juego.
// "¿Sabías que en Gambeta hay una sección de datos curiosos? [captura] [link]" es un tweet que
// alguien clickea; "me gusta cuando un equipo juega bien" no.
//
// Cada captura sale de la página REAL corriendo, no de una maqueta: si la sección cambia, la
// captura cambia. Y va con su contexto —qué muestra, qué link le corresponde y qué se puede
// decir de ella— en un JSON que lee el bot.
//
// LA TRAMPA: el fondo del sitio es fijo, así que un screenshot con `clip` o `fullPage` sale
// NEGRO. Hay que capturar el locator directamente y con un viewport que lo contenga entero.
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ROOT = process.cwd()
const SALIDA = path.join(ROOT, 'data', 'reports', 'capturas-secciones')
const BASE = process.env.BASE_URL || 'http://localhost:3000'
const SITIO = 'gambetafutbol.games'

/**
 * Qué se captura de cada sección.
 *
 * `preparar` deja la página en el estado que vale la pena mostrar: no sirve la captura de una
 * ruleta quieta ni de un dado sin tirar.
 */
const SECCIONES = [
  {
    id: 'sabias-que',
    desplazar: 120,
    ruta: '/datos',
    titulo: '¿Sabías que?',
    selector: 'main',
    link: `${SITIO}/datos/`,
    de_que_habla:
      'Datos del fútbol argentino con dos fuentes cada uno. Se tira un dado y sale uno.',
    angulos: [
      'El Vélez del 94 le ganó al Milan de Capello en la Intercontinental.',
      'Cada dato del mazo está cruzado contra dos fuentes: no hay ninguno inventado.',
    ],
    preparar: async (p) => {
      const dado = p.locator('button').filter({ hasText: /tirar|dado|otro/i }).first()
      if (await dado.count()) {
        await dado.click().catch(() => {})
        await p.waitForTimeout(1800)
      }
    },
  },
  {
    id: 'leyendas',
    desplazar: 120,
    ruta: '/records',
    titulo: 'Leyendas',
    selector: 'main',
    link: `${SITIO}/records/`,
    de_que_habla: 'Los máximos goleadores y las leyendas del fútbol argentino, con sus números.',
    angulos: ['Los goleadores históricos, ordenados.', 'Cada leyenda con sus goles y su recorrido.'],
  },
  {
    id: 'versus',
    desplazar: 90,
    ruta: '/versus',
    titulo: 'Versus',
    selector: 'main',
    link: `${SITIO}/versus/`,
    de_que_habla: 'Dos jugadores cara a cara, para discutir con un amigo quién era mejor.',
    angulos: ['Poné a dos y discutan.', 'El que pierde la discusión paga el café.'],
  },
  {
    id: 'ruleta',
    desplazar: 120,
    ruta: '/ruleta',
    titulo: 'Ruleta',
    selector: 'main',
    link: `${SITIO}/ruleta/`,
    de_que_habla: 'La ruleta que te da un plantel al azar, con sus tiers.',
    angulos: ['A ver qué te toca.', 'Los planteles históricos salen poco: cuando salen, es un premio.'],
  },
  {
    id: 'equipos',
    desplazar: 100,
    ruta: '/equipos',
    titulo: 'Equipos históricos',
    selector: 'main',
    link: `${SITIO}/equipos/`,
    de_que_habla: '36 planteles históricos argentinos, cada jugador cruzado contra tres fuentes.',
    angulos: ['El Vélez del 94, los Boca de Bianchi, el River del 96.', 'El plantel completo de cada uno.'],
  },
  {
    id: 'carrera',
    desplazar: 0,
    ruta: '/carrera',
    titulo: 'Modo carrera',
    // El formulario de creación no vende nada: lo que vende son los siete países. El clip usa
    // coordenadas del DOCUMENTO, así que scrollear no alcanza — hay que apuntar al elemento.
    selector: 'div.card-gradient:has-text("CLUB DE INICIO")',
    link: `${SITIO}/carrera/`,
    de_que_habla: '7 países, 16 categorías y 410 clubes. Se puede empezar en el Torneo Federal A.',
    angulos: [
      'Elegís país, categoría y club, y subís peleándola.',
      'Ningún otro juego deja empezar en el Federal A.',
    ],
  },
  {
    id: 'ranking',
    desplazar: 100,
    ruta: '/leaderboard',
    titulo: 'Ranking',
    selector: 'main',
    link: `${SITIO}/leaderboard/`,
    de_que_habla: 'El ranking global por ELO. Cada torneo que jugás suma o resta.',
    angulos: ['A ver dónde entrás.', 'El ELO sube y baja según cómo te va: no es un contador de partidas.'],
  },
  {
    id: 'home',
    desplazar: 0,
    ruta: '/',
    titulo: 'El juego',
    selector: 'main',
    link: `${SITIO}/`,
    de_que_habla: 'Draft, modo carrera, reto diario, torneos. Gratis y sin registrarse.',
    angulos: ['Gratis, en el navegador, sin cuenta.'],
  },
]

const navegador = await chromium.launch()
fs.mkdirSync(SALIDA, { recursive: true })
const indice = []

for (const s of SECCIONES) {
  // Viewport alto: si el contenido no entra, Playwright scrollea y el fondo fijo tapa todo.
  const p = await navegador.newPage({ viewport: { width: 1280, height: 2200 }, deviceScaleFactor: 2 })
  try {
    await p.goto(`${BASE}${s.ruta}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await p.waitForTimeout(4000)
    // Las imágenes son lazy: sin scrollear salen a medias.
    await p.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 600) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 110))
      }
      window.scrollTo(0, 0)
    })
    await p.waitForTimeout(1200)
    if (s.preparar) await s.preparar(p)

    // El fondo del sitio es `fixed`, y con `clip` eso hace que la captura salga NEGRA: el
    // navegador dibuja el fondo pegado al viewport y no al documento. Se le pone el color
    // plano justo antes de capturar.
    await p.addStyleTag({
      content: `body{background:#050d1c !important} .gradient-bg{background:#050d1c !important}`,
    })
    await p.waitForTimeout(400)

    // Recortada a 1200x675, que es la medida que X muestra entera en la línea de tiempo. Las
    // de página completa salían de 2 a 10 MB y 3000 px de alto: X las recorta a una tira y de
    // la sección se veía solo el encabezado.
    const el = p.locator(s.selector).first()
    const caja = await el.boundingBox()
    const archivo = path.join(SALIDA, `${s.id}.png`)
    await p.screenshot({
      path: archivo,
      clip: {
        x: caja.x,
        y: caja.y + (s.desplazar ?? 0),
        width: Math.min(caja.width, 1200),
        height: Math.min(675, Math.max(caja.height - (s.desplazar ?? 0), 200)),
      },
    })

    // Una captura casi vacía es una captura fallida: se avisa en vez de dejarla pasar.
    const bytes = fs.statSync(archivo).size
    indice.push({
      id: s.id,
      titulo: s.titulo,
      archivo: `${s.id}.png`,
      link: s.link,
      de_que_habla: s.de_que_habla,
      angulos: s.angulos,
      ...(bytes < 30_000 ? { revisar: `la captura pesa ${bytes} bytes, puede estar vacía` } : {}),
    })
    console.log(`  ${bytes < 30_000 ? '⚠' : '✓'} ${s.titulo.padEnd(20)} ${Math.round(bytes / 1024)} kB`)
  } catch (e) {
    console.log(`  ✗ ${s.titulo}: ${e.message.split('\n')[0]}`)
  }
  await p.close()
}

await navegador.close()
fs.writeFileSync(path.join(SALIDA, 'indice.json'), JSON.stringify(indice, null, 1))
console.log(`\n${indice.length} capturas → data/reports/capturas-secciones/`)
