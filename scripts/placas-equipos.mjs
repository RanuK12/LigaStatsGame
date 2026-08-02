// Una placa por equipo histórico, para postear en X.
//
// Cierra el circuito que arma el plan: la placa lleva a /equipos/<slug>/, que es una página con
// el plantel completo que además rankea sola en Google. El que llega desde X encuentra contenido
// de verdad, no una portada; y el que llega desde Google encuentra el botón de jugar.
//
// Antes los posteos llevaban siempre al home, que es la página que menos tiene para decirle a
// alguien que todavía no juega: 299 usuarios pasan por ella y le dedican 30 segundos.
//
//   node scripts/placas-equipos.mjs            # todas
//   node scripts/placas-equipos.mjs velez-1994 boca-juniors-2001
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ROOT = process.cwd()
const SALIDA = path.join(ROOT, 'data', 'reports', 'placas-equipos')
const equipos = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'derived', 'equipos.json'), 'utf8'))

const pedidos = process.argv.slice(2)
const lote = pedidos.length ? equipos.filter((e) => pedidos.includes(e.slug)) : equipos
if (!lote.length) {
  console.error(`no encontré ${pedidos.join(', ')}`)
  process.exit(1)
}

const F = 'Helvetica, Arial, sans-serif'
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** Parte un texto en líneas de a lo sumo `max` caracteres, sin cortar palabras. */
function cortar(texto, max) {
  const palabras = String(texto).split(' ')
  const lineas = []
  let actual = ''
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p
    if (prueba.length > max && actual) {
      lineas.push(actual)
      actual = p
    } else {
      actual = prueba
    }
  }
  if (actual) lineas.push(actual)
  return lineas
}

/**
 * La placa: el nombre del equipo grande, el hito, y los once nombres.
 *
 * Los nombres son el contenido. Un hincha que ve "Chilavert, Bassedas, Basualdo, Trotta" se
 * queda leyendo aunque no conozca el juego, y eso es lo que hace que el posteo funcione.
 */
function svg(e) {
  const [c1, c2] = e.colores
  // Cuántos nombres entran, calculado y no tanteado. La lista arranca en LISTA_Y y no puede
  // pasar de PIE_Y, donde va el link; cada nombre ocupa PASO px con su puesto debajo. Tanteando
  // ya se me escaparon dos veces: con once, el sexto de cada columna quedaba encima del pie.
  const LISTA_Y = 442
  const PIE_Y = 610
  const PASO = 44
  const porColumna = Math.max(1, Math.floor((PIE_Y - LISTA_Y) / PASO) + 1)

  const once = [...e.plantel]
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
    .slice(0, porColumna * 2)
  const izq = once.slice(0, porColumna)
  const der = once.slice(porColumna)

  const nombre = (p, x, y) => `
  <text x="${x}" y="${y}" font-family="${F}" font-size="24" font-weight="600" fill="#E4ECF6">${esc(p.name)}</text>
  <text x="${x}" y="${y + 21}" font-family="${F}" font-size="14" font-weight="600" fill="#6C7F96">${esc(p.position)} · ${p.rating}</text>`

  const hito = e.hito ? cortar(e.hito, 62).slice(0, 2) : []

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#04101f"/><stop offset="0.55" stop-color="#020813"/><stop offset="1" stop-color="#0a1526"/>
    </linearGradient>
    <radialGradient id="club" cx="0.08" cy="0.1" r="0.75">
      <stop offset="0" stop-color="${c1}" stop-opacity="0.30"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="675" fill="url(#fondo)"/>
  <rect width="1200" height="675" fill="url(#club)"/>

  <rect x="0" y="0" width="1200" height="7" fill="${c1}"/>
  <rect x="0" y="7" width="1200" height="7" fill="${c2}"/>

  <text x="64" y="88" font-family="${F}" font-size="17" font-weight="800" letter-spacing="6" fill="#74ACDF">GAMBETA · EL JUEGO DEL FÚTBOL ARGENTINO</text>

  <text x="64" y="168" font-family="${F}" font-size="68" font-weight="800" fill="#FFFFFF">${esc(e.club)}</text>
  <text x="64" y="238" font-family="${F}" font-size="68" font-weight="800" fill="${c1 === '#000000' ? '#F6C750' : c1}">${esc(e.season)}</text>

${hito.map((l, i) => `  <text x="64" y="${290 + i * 30}" font-family="${F}" font-size="23" font-weight="500" fill="#B6C6DA">${esc(l)}</text>`).join('\n')}

  <line x1="64" y1="366" x2="1136" y2="366" stroke="#FFFFFF" stroke-opacity="0.10" stroke-width="2"/>
  <text x="64" y="404" font-family="${F}" font-size="15" font-weight="800" letter-spacing="5" fill="#6C7F96">EL PLANTEL</text>

${izq.map((p, i) => nombre(p, 64, 442 + i * 44)).join('\n')}
${der.map((p, i) => nombre(p, 640, 442 + i * 44)).join('\n')}

  <text x="64" y="648" font-family="${F}" font-size="20" font-weight="800" fill="#74ACDF">GAMBETAFUTBOL.GAMES/EQUIPOS</text>
  <text x="1136" y="648" text-anchor="end" font-family="${F}" font-size="19" font-weight="600" fill="#6C7F96">${e.plantel.length} jugadores · ${e.ovrPromedio} de promedio</text>

  <rect x="0" y="661" width="1200" height="7" fill="${c2}"/>
  <rect x="0" y="668" width="1200" height="7" fill="${c1}"/>
</svg>`
}

/** El texto del tweet. Los nombres primero: es lo que frena el dedo de un hincha. */
function tweet(e) {
  const tres = [...e.plantel].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3)
  const url = `gambetafutbol.games/equipos/${e.slug}/?utm_source=x&utm_medium=social&utm_campaign=equipo_historico`
  return [
    `${e.club} ${e.season}.`,
    '',
    e.hito ?? `El plantel completo, jugador por jugador.`,
    '',
    `${tres.map((p) => p.name).join(', ')} y ${e.plantel.length - 3} más.`,
    '',
    url,
  ].join('\n')
}

fs.mkdirSync(SALIDA, { recursive: true })
const navegador = await chromium.launch()
const pagina = await (await navegador.newContext()).newPage()

for (const e of lote) {
  // El SVG se rasteriza en el navegador y no con rsvg-convert: rsvg no tiene las tipografías del
  // sistema cargadas igual y los nombres largos salían con otro ancho del que se midió acá.
  const doc = svg(e)
  await pagina.setViewportSize({ width: 1200, height: 675 })
  await pagina.setContent(
    `<body style="margin:0">${doc}</body>`,
    { waitUntil: 'load' },
  )
  await pagina.screenshot({ path: path.join(SALIDA, `${e.slug}.png`) })
}
await navegador.close()

const md = [
  '# Placas de equipos históricos',
  '',
  'Generadas con `node scripts/placas-equipos.mjs`. Cada una lleva a su página de equipo, que',
  'tiene el plantel completo y rankea sola en Google.',
  '',
  ...lote.flatMap((e) => [`### ${e.label} → \`${e.slug}.png\``, '', '```', tweet(e), '```', '']),
]
fs.writeFileSync(path.join(SALIDA, 'README.md'), md.join('\n'))

console.log(`${lote.length} placas en data/reports/placas-equipos/`)
