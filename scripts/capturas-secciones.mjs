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
    desplazar: 0,
    ruta: '/datos',
    titulo: '¿Sabías que?',
    // El dado Y la carta que sale, no `main` desde arriba. Con `main` la captura salía de 12 kB
    // —encabezado y fondo, nada más— y el generador la marcaba para revisar, así que la sección
    // no se promocionó nunca. Lo que hay que mostrar es el dato, que es lo que se lee, y por eso
    // el recorte arranca en el dado (`desplazar`) en vez de en el título.
    selector: 'main',
    desplazarHasta: 'article',
    link: `${SITIO}/datos/`,
    de_que_habla:
      'Datos de fútbol con dos fuentes cada uno. Se tira un dado y sale uno; son 74 y no se repiten.',
    angulos: [
      'El Vélez del 94 le ganó al Milan de Capello en la Intercontinental.',
      'Cada dato del mazo está cruzado contra dos fuentes: no hay ninguno inventado.',
    ],
    preparar: async (p) => {
      const dado = p.locator('button').filter({ hasText: /tirar|dado|otro/i }).first()
      if (await dado.count()) {
        await dado.click().catch(() => {})
        await p.waitForTimeout(2600)
      }
      // La carta aparece debajo del dado: se la trae al centro para que entre en el recorte.
      await p.locator('article').first().scrollIntoViewIfNeeded().catch(() => {})
      await p.waitForTimeout(600)
    },
  },

  // Las dos formas de jugar, que eran justo las que faltaban: se promocionaban el ranking y los
  // equipos históricos, y no el draft ni el modo DT.
  {
    id: 'draft',
    desplazar: 0,
    ruta: '/draft?mode=liga',
    titulo: 'El draft',
    // El plantel que salió vive en una CAPA FIJA sobre la página, así que recortar `main` daba
    // una imagen negra de 415 kB: se capturaba el fondo tapado por la capa. Se captura la capa,
    // con el viewport justo en la medida que X muestra entera.
    selector: 'div.fixed.inset-0.z-50',
    viewport: { width: 1200, height: 675 },
    link: `${SITIO}/draft/`,
    de_que_habla:
      'La ruleta te da un plantel y elegís un jugador de ahí para cada puesto. Once vueltas y se juega la Liga.',
    angulos: [
      'No elegís a quien querés: elegís entre los que te tocaron.',
      'Salen planteles de 2015 a 2026 y los históricos.',
    ],
    preparar: async (p) => {
      const empezar = p.locator('button:visible').filter({ hasText: /COMENZAR DRAFT/i }).first()
      if (await empezar.count()) {
        await empezar.click().catch(() => {})
        await p.waitForTimeout(2500)
      }
      const girar = p.locator('button:visible').filter({ hasText: /GIRAR RULETA/i }).first()
      if (await girar.count()) {
        await girar.click().catch(() => {})
        // La ruleta tarda ~5 s en frenar; se captura ya parada, con el plantel que salió.
        await p.waitForTimeout(6200)
      }
    },
  },
  {
    id: 'dt',
    desplazar: 0,
    ruta: '/dt',
    titulo: 'Modo DT',
    selector: 'main',
    link: `${SITIO}/dt/`,
    de_que_habla:
      'Dirigís un club de la Liga Profesional: elegís el dibujo, manejás el mercado y la temporada se juega fecha por fecha con su tabla. Si no cumplís, te echan.',
    angulos: [
      'La dirigencia te pide un puesto. Si no llegás, se le acaba la paciencia.',
      'Tres movimientos de mercado por temporada, no una base de datos.',
      'Podés terminar con cuatro ligas o sin trabajo.',
    ],
    preparar: async (p) => {
      const nombre = p.locator('input[placeholder="El DT"]').first()
      if (await nombre.count()) await nombre.fill('El DT').catch(() => {})
      const club = p.locator('button').filter({ hasText: /Boca Juniors/ }).first()
      if (await club.count()) {
        await club.click().catch(() => {})
        await p.waitForTimeout(700)
      }
      const firmar = p.locator('button:visible').filter({ hasText: /Firmar contrato/ }).first()
      if (await firmar.count()) {
        await firmar.click().catch(() => {})
        await p.waitForTimeout(2500)
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
  const p = await navegador.newPage({ viewport: s.viewport ?? { width: 1280, height: 2200 }, deviceScaleFactor: 2 })
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
    // Anclar el recorte a un elemento, no a un número de píxeles a ojo: lo que hay que mostrar
    // es la carta con el dato, y su altura depende de cuánto texto le tocó.
    let desdeY = caja.y + (s.desplazar ?? 0)
    if (s.desplazarHasta) {
      const ancla = await p.locator(s.desplazarHasta).first().boundingBox().catch(() => null)
      // Un poco por encima del ancla, para que entre lo que la explica (el dado y su botón).
      if (ancla) desdeY = Math.max(caja.y, ancla.y - 330)
    }
    const archivo = path.join(SALIDA, `${s.id}.png`)
    await p.screenshot({
      path: archivo,
      clip: {
        x: caja.x,
        y: desdeY,
        width: Math.min(caja.width, 1200),
        height: Math.min(675, Math.max(caja.y + caja.height - desdeY, 200)),
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
