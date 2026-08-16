// El banco de placas para X. Muchas, y cada una mostrando UNA sola cosa.
//
//   node scripts/placas-x.mjs                 # todas
//   node scripts/placas-x.mjs --familia dilema
//
// Por qué existe: la cuenta venía posteando siempre las mismas cinco capturas del sitio, y una
// captura de una página no es contenido — no se entiende sin entrar. Medido el 2026-08-04,
// @potrero_app usa imagen en el 63 % de sus tweets y cada una muestra UNA cosa concreta: un
// dilema, una carta, un número. Su mejor tweet (5.686 likes) es exactamente eso.
//
// Los datos salen del juego, no de un texto escrito a mano: los dilemas son los de
// career-engine, los países y clubes salen de derived/ligas.json y los equipos de
// derived/equipos.json. Si el juego cambia, las placas cambian solas.
import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'

const ROOT = process.cwd()
const SALIDA = path.join(ROOT, 'data', 'reports', 'placas-x')
const leer = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'))
const ligas = leer('data/derived/ligas.json')
const equipos = leer('data/derived/equipos.json')
const onceIdeal = leer('data/derived/once-ideal.json')

const F = 'Helvetica, Arial, sans-serif'
const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const W = 1200
const H = 675

/** Recorta con puntos suspensivos: en una columna, un nombre cortado al ras se lee como error. */
function recortar(texto, max) {
  const t = String(texto)
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`
}

function cortar(texto, max) {
  const palabras = String(texto).split(' ')
  const lineas = []
  let actual = ''
  for (const p of palabras) {
    const prueba = actual ? `${actual} ${p}` : p
    if (prueba.length > max && actual) {
      lineas.push(actual)
      actual = p
    } else actual = prueba
  }
  if (actual) lineas.push(actual)
  return lineas
}

/** El marco que comparten todas: fondo, banda argentina arriba y abajo, y la firma. */
function marco(acento, contenido, pie = 'GAMBETAFUTBOL.GAMES') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#04101f"/><stop offset="0.55" stop-color="#020813"/><stop offset="1" stop-color="#0a1526"/>
    </linearGradient>
    <radialGradient id="halo" cx="0.5" cy="0.28" r="0.72">
      <stop offset="0" stop-color="${acento}" stop-opacity="0.26"/><stop offset="1" stop-color="${acento}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#fondo)"/>
  <rect width="${W}" height="${H}" fill="url(#halo)"/>
  <rect x="0" y="0" width="${W}" height="6" fill="#74ACDF"/>
  <rect x="0" y="6" width="${W}" height="6" fill="#FFFFFF"/>
  <rect x="0" y="12" width="${W}" height="6" fill="#74ACDF"/>
${contenido}
  <text x="64" y="640" font-family="${F}" font-size="19" font-weight="800" letter-spacing="3" fill="#74ACDF">${esc(pie)}</text>
  <rect x="0" y="657" width="${W}" height="6" fill="#74ACDF"/>
  <rect x="0" y="663" width="${W}" height="6" fill="#FFFFFF"/>
  <rect x="0" y="669" width="${W}" height="6" fill="#74ACDF"/>
</svg>`
}

// ── Familia 1: los dilemas ──
// Son los de lib/career-engine.ts. Servidos solos, sin explicar y sin decir qué pasa después,
// que es el patrón que a Potrero le hizo 4.884 likes.
const DILEMAS = [
  { id: 'sustancia', volanta: 'Decisión difícil', txt: 'Te ofrecen algo que te sube el nivel de golpe.', a: 'La tomo, total nadie se entera', b: 'Ni en pedo, me la juego limpio', acento: '#C084FC' },
  { id: 'europa', volanta: 'Mercado de pases', txt: 'Te llega la oferta de Europa a los 21.', a: 'Me voy, es la chance de mi vida', b: 'Me quedo, quiero ser ídolo acá', acento: '#F6C750' },
  { id: 'barras', volanta: 'Golpe duro', txt: 'Te esperan los barras afuera del vestuario.', a: 'Doy la cara', b: 'Me voy del club', acento: '#F87171' },
  { id: 'capitania', volanta: 'Decisión difícil', txt: 'Te ofrecen la cinta de capitán.', a: 'La agarro, banco al grupo', b: 'Prefiero jugar tranquilo', acento: '#74ACDF' },
  { id: 'pretemporada', volanta: 'Pretemporada', txt: 'El cuerpo técnico te deja elegir en qué trabajar.', a: 'Definición: quiero hacer goles', b: 'Físico: quiero durar 20 años', acento: '#34d399' },
  { id: 'descenso', volanta: 'Golpe duro', txt: 'Tu club se fue al descenso y te quieren de la A.', a: 'Me quedo a devolverlo a Primera', b: 'Agarro y me voy', acento: '#F87171' },
]

function placaDilema(d) {
  const lineas = cortar(d.txt, 34)
  return marco(
    d.acento,
    `  <text x="64" y="112" font-family="${F}" font-size="19" font-weight="800" letter-spacing="7" fill="${d.acento}">${esc(d.volanta.toUpperCase())}</text>
${lineas.map((l, i) => `  <text x="64" y="${208 + i * 74}" font-family="${F}" font-size="62" font-weight="800" fill="#FFFFFF">${esc(l)}</text>`).join('\n')}
  <rect x="64" y="${228 + lineas.length * 74}" width="1072" height="96" rx="18" fill="#0b1728" stroke="${d.acento}" stroke-opacity="0.45" stroke-width="2"/>
  <text x="100" y="${288 + lineas.length * 74}" font-family="${F}" font-size="30" font-weight="600" fill="#E4ECF6">${esc(d.a)}</text>
  <rect x="64" y="${340 + lineas.length * 74}" width="1072" height="96" rx="18" fill="#0b1728" stroke="${d.acento}" stroke-opacity="0.45" stroke-width="2"/>
  <text x="100" y="${400 + lineas.length * 74}" font-family="${F}" font-size="30" font-weight="600" fill="#E4ECF6">${esc(d.b)}</text>`,
    'MODO CARRERA · GAMBETAFUTBOL.GAMES',
  )
}

// ── Familia 2: un número grande ──
// Un dato del juego, sin adorno. Es lo que se lee de un vistazo pasando el dedo.
const NUMEROS = [
  { id: 'paises', n: '7', txt: 'países para arrancar tu carrera', sub: 'Argentina, Uruguay, Chile, Colombia, Perú, Paraguay, Brasil', acento: '#74ACDF' },
  { id: 'clubes', n: '378', txt: 'clubes jugables', sub: 'De la Primera de Brasil al Federal A', acento: '#F6C750' },
  { id: 'categorias', n: '16', txt: 'categorías', sub: 'Se asciende peleándola y se puede descender', acento: '#34d399' },
  { id: 'historicos', n: '36', txt: 'planteles históricos argentinos', sub: 'Cada jugador cruzado contra tres fuentes', acento: '#F6C750' },
  { id: 'jugadores', n: '3.334', txt: 'jugadores reales', sub: 'Con su puesto, su club y su nivel', acento: '#74ACDF' },
  { id: 'idolatria', n: '5', txt: 'niveles hasta la estatua', sub: 'De uno más del plantel a Leyenda del club', acento: '#C084FC' },
  { id: 'temporadas', n: '15', txt: 'temporadas por carrera', sub: 'Del debut al retiro, con lesiones y declive', acento: '#F87171' },
]

function placaNumero(d) {
  return marco(
    d.acento,
    `  <text x="64" y="112" font-family="${F}" font-size="19" font-weight="800" letter-spacing="7" fill="${d.acento}">GAMBETA</text>
  <text x="64" y="330" font-family="${F}" font-size="210" font-weight="800" fill="${d.acento}">${esc(d.n)}</text>
${cortar(d.txt, 30).map((l, i) => `  <text x="64" y="${400 + i * 56}" font-family="${F}" font-size="46" font-weight="700" fill="#FFFFFF">${esc(l)}</text>`).join('\n')}
  <text x="64" y="${560}" font-family="${F}" font-size="26" font-weight="500" fill="#8FA3BC">${esc(d.sub)}</text>`,
  )
}

// ── Familia 3: los niveles de idolatría ──
function placaIdolatria() {
  const niveles = [
    ['▫️', 'Uno más', 'Recién llegás'],
    ['👏', 'Querido', 'El hincha empieza a bancarte'],
    ['💙', 'Referente', 'El equipo te mira a vos'],
    ['⭐', 'Ídolo', 'Tu nombre es canción de tribuna'],
    ['🗿', 'Leyenda', 'Tenés tu estatua en el estadio'],
  ]
  return marco(
    '#F6C750',
    `  <text x="64" y="112" font-family="${F}" font-size="19" font-weight="800" letter-spacing="7" fill="#F6C750">LA IDOLATRÍA</text>
  <text x="64" y="192" font-family="${F}" font-size="58" font-weight="800" fill="#FFFFFF">El camino a la estatua</text>
  <text x="64" y="240" font-family="${F}" font-size="26" font-weight="500" fill="#8FA3BC">Se sube quedándote. Cambiar de club por plata te aleja.</text>
${niveles
  .map(
    ([ic, n, d], i) => `  <text x="72" y="${316 + i * 62}" font-family="${F}" font-size="34">${ic}</text>
  <text x="132" y="${316 + i * 62}" font-family="${F}" font-size="34" font-weight="800" fill="${i === 4 ? '#F6C750' : '#FFFFFF'}">${esc(n)}</text>
  <text x="392" y="${316 + i * 62}" font-family="${F}" font-size="26" font-weight="500" fill="#8FA3BC">${esc(d)}</text>`,
  )
  .join('\n')}`,
    'MODO CARRERA · GAMBETAFUTBOL.GAMES',
  )
}

// ── Familia 4: una liga con sus clubes ──
// Los nombres son el contenido: un hincha ve Peñarol y Nacional y se queda leyendo.
function placaLiga(liga) {
  const clubes = liga.clubIds
    .map((id) => ligas.clubes.find((c) => c.id === id))
    .filter(Boolean)
    .sort((a, b) => b.fuerza - a.fuerza)
  // Cuántos entran, calculado contra el espacio real y no tanteado.
  const LISTA_Y = 320
  const PIE_Y = 600
  const PASO = 46
  const porColumna = Math.max(1, Math.floor((PIE_Y - LISTA_Y) / PASO) + 1)
  const vis = clubes.slice(0, porColumna * 3)
  const col = (i) => 64 + Math.floor(i / porColumna) * 360
  const fila = (i) => LISTA_Y + (i % porColumna) * PASO

  return marco(
    '#74ACDF',
    `  <text x="64" y="112" font-family="${F}" font-size="19" font-weight="800" letter-spacing="7" fill="#74ACDF">MODO CARRERA</text>
  <text x="64" y="196" font-family="${F}" font-size="64" font-weight="800" fill="#FFFFFF">${esc(liga.bandera)} ${esc(liga.nombre)}</text>
  <text x="64" y="248" font-family="${F}" font-size="27" font-weight="500" fill="#8FA3BC">${esc(liga.pais)} · ${clubes.length} clubes${liga.asciende ? ` · suben ${liga.asciende}` : ''}</text>
${vis
  .map(
    (c, i) => `  <text x="${col(i)}" y="${fila(i)}" font-family="${F}" font-size="27" font-weight="600" fill="#E4ECF6">${esc(recortar(c.corto, 21))}</text>`,
  )
  .join('\n')}
${clubes.length > vis.length ? `  <text x="1136" y="640" text-anchor="end" font-family="${F}" font-size="23" font-weight="600" fill="#6C7F96">y ${clubes.length - vis.length} clubes más</text>` : ''}`,
  )
}

// ── Familia 5: la pregunta suelta ──
// Sin datos, sin link: solo la pregunta, grande. Es lo que la gente contesta.
const PREGUNTAS = [
  { id: 'donde-debutas', txt: '¿En qué club debutarías?', sub: '378 para elegir, de siete países', acento: '#74ACDF' },
  { id: 'ascenso-o-grande', txt: '¿Arrancás en un grande o en la B?', sub: 'En un grande peleás el puesto. En la B sos la bandera.', acento: '#F6C750' },
  { id: 'idolo-o-plata', txt: '¿Ídolo de un club o campeón de todo?', sub: 'Saltar de equipo te aleja de la estatua', acento: '#C084FC' },
  { id: 'mejor-5', txt: '¿El mejor 5 del fútbol argentino?', sub: '', acento: '#34d399' },
  { id: 'mejor-9', txt: '¿El 9 que más goles te hizo gritar?', sub: '', acento: '#F87171' },
  { id: 'plantel-historico', txt: '¿Qué plantel argentino te gustaría dirigir?', sub: '36 históricos en el bombo', acento: '#F6C750' },
]

function placaPregunta(p) {
  const lineas = cortar(p.txt, 26)
  const y0 = p.sub ? 250 : 300
  return marco(
    p.acento,
    `  <text x="64" y="112" font-family="${F}" font-size="19" font-weight="800" letter-spacing="7" fill="${p.acento}">GAMBETA</text>
${lineas.map((l, i) => `  <text x="64" y="${y0 + i * 86}" font-family="${F}" font-size="74" font-weight="800" fill="#FFFFFF">${esc(l)}</text>`).join('\n')}
${p.sub ? `  <text x="64" y="${y0 + lineas.length * 86 + 30}" font-family="${F}" font-size="28" font-weight="500" fill="#8FA3BC">${esc(p.sub)}</text>` : ''}`,
  )
}

// ── Familia 6: la novedad ──
const NOVEDADES = [
  { id: 'siete-paises', titulo: 'El modo carrera se juega en 7 países', bullets: ['Argentina, Uruguay, Chile, Colombia', 'Perú, Paraguay y Brasil', '16 categorías · 378 clubes'], acento: '#74ACDF' },
  { id: 'ascenso', titulo: 'Ahora podés empezar en el Ascenso', bullets: ['Primera Nacional', 'Primera B Metropolitana', 'Torneo Federal A'], acento: '#F6C750' },
  { id: 'link', titulo: 'Tu carrera tiene link propio', bullets: ['El que lo abre ve tu carrera entera', 'Clubes, títulos y cómo terminaste', 'Sin registrarse'], acento: '#34d399' },
  { id: 'leyenda', titulo: 'Al retirarte te compara con una leyenda', bullets: ['Según cómo jugaste, no al azar', 'Puesto, goles, títulos y clubes', 'Contra jugadores reales'], acento: '#C084FC' },
]

function placaNovedad(n) {
  const lineas = cortar(n.titulo, 26)
  return marco(
    n.acento,
    `  <text x="64" y="112" font-family="${F}" font-size="19" font-weight="800" letter-spacing="7" fill="${n.acento}">NOVEDAD</text>
${lineas.map((l, i) => `  <text x="64" y="${210 + i * 76}" font-family="${F}" font-size="64" font-weight="800" fill="#FFFFFF">${esc(l)}</text>`).join('\n')}
${n.bullets
  .map(
    (b, i) => `  <text x="64" y="${300 + lineas.length * 76 + i * 54}" font-family="${F}" font-size="32" font-weight="500" fill="#E4ECF6">▸ ${esc(b)}</text>`,
  )
  .join('\n')}`,
  )
}

// ── Familia 7: el equipo histórico, en versión corta ──
// La placa larga con los once ya existe (placas-equipos.mjs). Esta es la de un dato al pasar.
function placaEquipo(e) {
  const figura = [...e.plantel].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0]
  const [c1] = e.colores
  return marco(
    c1 === '#000000' ? '#F6C750' : c1,
    `  <text x="64" y="112" font-family="${F}" font-size="19" font-weight="800" letter-spacing="7" fill="#74ACDF">EN EL BOMBO</text>
  <text x="64" y="228" font-family="${F}" font-size="86" font-weight="800" fill="#FFFFFF">${esc(e.club)}</text>
  <text x="64" y="330" font-family="${F}" font-size="86" font-weight="800" fill="${c1 === '#000000' ? '#F6C750' : c1}">${esc(e.season)}</text>
${cortar(e.hito ?? 'El plantel completo, jugador por jugador.', 56)
  .slice(0, 2)
  .map((l, i) => `  <text x="64" y="${412 + i * 42}" font-family="${F}" font-size="31" font-weight="500" fill="#B6C6DA">${esc(l)}</text>`)
  .join('\n')}
  <text x="64" y="540" font-family="${F}" font-size="27" font-weight="600" fill="#8FA3BC">La figura: ${esc(figura?.name ?? '')} · ${figura?.rating ?? ''}</text>`,
  )
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * El once ideal histórico, dibujado en la cancha.
 *
 * Es la única placa con los once puestos a la vez: las demás muestran una cosa sola a propósito,
 * pero acá el equipo ES la cosa. Sale de data/derived/once-ideal.json, o sea de la base: si
 * mañana entra una leyenda nueva, la placa cambia sin tocar este archivo.
 */
function placaOnceIdeal() {
  const ORO = '#D4AF37'
  // La cancha ocupa la mitad derecha; el texto, la izquierda.
  const CX = 640, CY = 96, CW = 500, CH = 500
  const px = (x) => CX + (x / 100) * CW
  const py = (y) => CY + (y / 100) * CH

  const fichas = onceIdeal.once.map((j) => {
    const x = px(j.x), y = py(j.y)
    const apellido = j.nombre.split(' ').slice(-1)[0]
    return `  <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="24" fill="#02101d" stroke="${ORO}" stroke-opacity="0.75" stroke-width="2"/>
  <text x="${x.toFixed(1)}" y="${(y + 7).toFixed(1)}" text-anchor="middle" font-family="${F}" font-size="21" font-weight="800" fill="${ORO}">${j.ovr}</text>
  <text x="${x.toFixed(1)}" y="${(y + 42).toFixed(1)}" text-anchor="middle" font-family="${F}" font-size="16" font-weight="700" fill="#FFFFFF">${esc(apellido)}</text>`
  }).join('\n')

  return marco(
    ORO,
    `  <text x="64" y="112" font-family="${F}" font-size="19" font-weight="800" letter-spacing="7" fill="#74ACDF">EL ONCE IDEAL DE LA HISTORIA</text>
  <text x="64" y="208" font-family="${F}" font-size="60" font-weight="800" fill="#FFFFFF">ONCE TÍTULOS,</text>
  <text x="64" y="276" font-family="${F}" font-size="60" font-weight="800" fill="${ORO}">ONCE LEYENDAS</text>
  <text x="64" y="344" font-family="${F}" font-size="26" font-weight="500" fill="#B6C6DA">El mejor equipo que se puede armar</text>
  <text x="64" y="382" font-family="${F}" font-size="26" font-weight="500" fill="#B6C6DA">con la base entera del juego.</text>
  <text x="64" y="500" font-family="${F}" font-size="76" font-weight="800" fill="${ORO}">${onceIdeal.ovr}</text>
  <text x="168" y="500" font-family="${F}" font-size="21" font-weight="700" letter-spacing="3" fill="#8FA3BC">OVR DEL ONCE</text>
  <text x="168" y="470" font-family="${F}" font-size="21" font-weight="700" letter-spacing="3" fill="#8FA3BC">${onceIdeal.formacion}</text>
  <rect x="${CX}" y="${CY}" width="${CW}" height="${CH}" rx="18" fill="#0b2a17" stroke="#1f5c36" stroke-width="2"/>
  <line x1="${CX}" y1="${CY + CH / 2}" x2="${CX + CW}" y2="${CY + CH / 2}" stroke="#2f7a4c" stroke-width="2"/>
  <circle cx="${CX + CW / 2}" cy="${CY + CH / 2}" r="56" fill="none" stroke="#2f7a4c" stroke-width="2"/>
  <rect x="${CX + CW * 0.22}" y="${CY + CH - 78}" width="${CW * 0.56}" height="78" fill="none" stroke="#2f7a4c" stroke-width="2"/>
  <rect x="${CX + CW * 0.22}" y="${CY}" width="${CW * 0.56}" height="78" fill="none" stroke="#2f7a4c" stroke-width="2"/>
${fichas}`,
  )
}

const familias = {
  dilema: DILEMAS.map((d) => ({ nombre: `dilema-${d.id}`, svg: placaDilema(d) })),
  numero: NUMEROS.map((d) => ({ nombre: `numero-${d.id}`, svg: placaNumero(d) })),
  idolatria: [{ nombre: 'idolatria-niveles', svg: placaIdolatria() }],
  liga: ligas.ligas.map((l) => ({ nombre: `liga-${l.id}`, svg: placaLiga(l) })),
  pregunta: PREGUNTAS.map((p) => ({ nombre: `pregunta-${p.id}`, svg: placaPregunta(p) })),
  novedad: NOVEDADES.map((n) => ({ nombre: `novedad-${n.id}`, svg: placaNovedad(n) })),
  equipo: equipos.map((e) => ({ nombre: `equipo-${e.slug}`, svg: placaEquipo(e) })),
  once: [{ nombre: 'once-ideal', svg: placaOnceIdeal() }],
}

const pedida = process.argv.includes('--familia') ? process.argv[process.argv.indexOf('--familia') + 1] : null
const lote = pedida ? { [pedida]: familias[pedida] } : familias
if (pedida && !familias[pedida]) {
  console.error(`familia desconocida. Opciones: ${Object.keys(familias).join(', ')}`)
  process.exit(1)
}

fs.mkdirSync(SALIDA, { recursive: true })
const navegador = await chromium.launch()
const pagina = await navegador.newPage({ viewport: { width: W, height: H } })
let total = 0
const indice = []

for (const [familia, placas] of Object.entries(lote)) {
  for (const p of placas) {
    await pagina.setContent(
      `<html><body style="margin:0">${p.svg}</body></html>`,
      { waitUntil: 'load' },
    )
    const archivo = path.join(SALIDA, `${p.nombre}.png`)
    await pagina.screenshot({ path: archivo, clip: { x: 0, y: 0, width: W, height: H } })
    indice.push({ familia, archivo: `${p.nombre}.png` })
    total += 1
  }
  console.log(`  ${familia}: ${placas.length}`)
}
await navegador.close()

// El índice se FUSIONA con lo que ya había: correr `--familia liga` no puede dejar al bot sin
// las otras 60 placas, que siguen en disco. Pasó: el catálogo quedó en 16 de 76.
const rutaIndice = path.join(SALIDA, 'indice.json')
let previo = []
try {
  previo = JSON.parse(fs.readFileSync(rutaIndice, 'utf8'))
} catch {
  /* primera corrida */
}
const fusionado = [...previo.filter((p) => !indice.some((n) => n.archivo === p.archivo)), ...indice]
  .filter((p) => fs.existsSync(path.join(SALIDA, p.archivo)))
  .sort((a, b) => a.familia.localeCompare(b.familia) || a.archivo.localeCompare(b.archivo))
fs.writeFileSync(rutaIndice, JSON.stringify(fusionado, null, 1))
console.log(`\n${total} placas generadas · ${fusionado.length} en el índice → data/reports/placas-x/`)
