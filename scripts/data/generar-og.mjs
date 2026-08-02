// La placa que se ve cuando alguien pega un link de Gambeta en WhatsApp, X o Facebook.
//
// Hasta ahora no existía ninguna: `og:image` estaba ausente en todas las páginas, así que cada
// link compartido salía como una línea de texto gris. El 0,9 % de la gente que comparte estaba
// mandando algo que nadie tenía ganas de tocar.
//
// Una por sección, porque el que recibe "vení a jugar el draft" y el que recibe "mirá mi carrera"
// no están mirando lo mismo. Los números salen del dataset, no de la memoria: si el dataset crece,
// se vuelve a correr y la placa dice la verdad.
//
//   node scripts/data/generar-og.mjs
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = process.cwd()
const DEST = path.join(ROOT, 'public', 'social')

const leer = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'))
const lista = (x) => (Array.isArray(x) ? x : x.players || x.squads || x.clubs || [])

const jugadores = lista(leer('players.json')).length
const planteles = lista(leer('squads.json'))
const historicos = planteles.filter((s) => s.historico).length

const F = 'Helvetica, Arial, sans-serif'

/** Un recuadro con un número grande y su etiqueta. */
const dato = (x, valor, etiqueta, color) => `
  <rect x="${x}" y="392" width="250" height="126" rx="22" fill="rgba(2,8,19,0.55)" stroke="${color}" stroke-opacity="0.45" stroke-width="2"/>
  <text x="${x + 125}" y="452" text-anchor="middle" font-family="${F}" font-size="50" font-weight="800" fill="${color}">${valor}</text>
  <text x="${x + 125}" y="486" text-anchor="middle" font-family="${F}" font-size="19" font-weight="600" fill="#94A3B8">${etiqueta}</text>`

const placa = ({ kicker, linea1, linea2, bajada, datos, pie }) => `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#04101f"/>
      <stop offset="0.55" stop-color="#020813"/>
      <stop offset="1" stop-color="#0a1526"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.18" cy="0.15" r="0.6">
      <stop offset="0" stop-color="#74ACDF" stop-opacity="0.22"/>
      <stop offset="1" stop-color="#74ACDF" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowOro" cx="0.85" cy="0.85" r="0.5">
      <stop offset="0" stop-color="#F6C750" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#F6C750" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#fondo)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#glowOro)"/>

  <rect x="0" y="0" width="1200" height="8" fill="#74ACDF"/>
  <rect x="0" y="8" width="1200" height="8" fill="#FFFFFF"/>
  <rect x="0" y="16" width="1200" height="8" fill="#74ACDF"/>

  <text x="70" y="110" font-family="${F}" font-size="22" font-weight="800" letter-spacing="8" fill="#74ACDF">${kicker}</text>

  <text x="70" y="204" font-family="${F}" font-size="74" font-weight="800" fill="#FFFFFF">${linea1}</text>
  <text x="70" y="286" font-family="${F}" font-size="74" font-weight="800" fill="#F6C750">${linea2}</text>

  <text x="70" y="344" font-family="${F}" font-size="27" font-weight="500" fill="#B6C6DA">${bajada}</text>
${datos.map((d, i) => dato(70 + i * 270, d[0], d[1], d[2])).join('')}

  <text x="70" y="586" font-family="${F}" font-size="21" font-weight="500" fill="#7C8DA3">${pie}</text>
</svg>`

const AZUL = '#74ACDF'
const ORO = '#F6C750'
const PIE = 'Gratis · sin registro para jugar · hecho en Argentina'

const PLACAS = {
  // La del sitio. Es la que se ve cuando comparten la home o cualquier página sin placa propia.
  og: {
    kicker: 'GAMBETAFUTBOL.GAMES',
    linea1: 'El juego del',
    linea2: 'fútbol argentino',
    bajada: 'Armá tu 11 con planteles reales, simulá el torneo y jugá tu carrera.',
    datos: [
      [jugadores.toLocaleString('es-AR'), 'jugadores reales', AZUL],
      [String(planteles.length), 'planteles', AZUL],
      [String(historicos), 'equipos históricos', ORO],
      ['15', 'temporadas de carrera', ORO],
    ],
    pie: PIE,
  },
  'og-draft': {
    kicker: 'DRAFT DE LEYENDAS',
    linea1: 'Tirá la ruleta,',
    linea2: 'armá tu 11',
    bajada: 'Te toca un plantel real. Elegís un jugador. No podés repetir club.',
    datos: [
      [String(planteles.length), 'planteles en el bombo', AZUL],
      [String(historicos), 'equipos históricos', ORO],
      ['4', 'formaciones', AZUL],
      ['1', 'torneo al final', ORO],
    ],
    pie: PIE,
  },
  'og-carrera': {
    kicker: 'MODO CARRERA',
    linea1: 'Empezás a los 16.',
    linea2: 'Terminás leyenda.',
    bajada: 'Titularidad, lesiones, ofertas de Europa, el Mundial y el día del retiro.',
    datos: [
      ['15', 'temporadas', ORO],
      ['35', 'clubes argentinos', AZUL],
      ['12', 'clubes de Europa', AZUL],
      ['1', 'ficha de retiro', ORO],
    ],
    pie: PIE,
  },
  'og-daily': {
    kicker: 'RETO DIARIO',
    linea1: 'Un reto nuevo',
    linea2: 'cada día',
    bajada: 'El mismo bombo para todos. Sumá racha y subí en el ranking.',
    datos: [
      ['1', 'reto por día', ORO],
      ['00:00', 'rota solo', AZUL],
      ['+3', 'ELO por día de racha', AZUL],
      ['8', 'consignas distintas', ORO],
    ],
    pie: PIE,
  },
}

fs.mkdirSync(DEST, { recursive: true })
for (const [nombre, cfg] of Object.entries(PLACAS)) {
  const svg = path.join(DEST, `${nombre}.svg`)
  const png = path.join(DEST, `${nombre}.png`)
  fs.writeFileSync(svg, placa(cfg))
  // WhatsApp y X quieren PNG o JPG: el SVG no se les muestra a ninguno de los dos.
  execFileSync('rsvg-convert', ['-w', '1200', '-h', '630', svg, '-o', png])
  console.log(`${nombre}.png`)
}
