// Generate polished placeholder shield SVGs for clubs lacking a real crest.
// Uses each club's real colors from data/clubs.json. Writes <id>.svg into both
// public/logos/ and public/logos/clubs/ (matching the existing naming convention).
//   node scripts/data/generate-club-svgs.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const clubs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'clubs.json'), 'utf8'))

// Clubs that currently only have a placeholder PNG and no SVG.
const TARGET_IDS = [
  'colon',
  'central-cordoba',
  'barracas-central',
  'riestra',
  'independiente-rivadavia',
  'aldosivi',
  'arsenal',
]

const OUT_DIRS = [path.join(ROOT, 'public', 'logos'), path.join(ROOT, 'public', 'logos', 'clubs')]

/**
 * Las iniciales que un hincha usaría.
 *
 * Se arman del nombre CORTO, no del largo: "Arsenal de Sarandí" daba "ADS", que no lo dice
 * nadie y encima se leía como un escudo roto. Del corto sale "ARS", que sí.
 */
function initials(club) {
  const base = (club.shortName || club.name).replace(/[()]/g, '')
  const palabras = base.split(/\s+/).filter((w) => w.length > 2 && !/^(de|del|la|el|los)$/i.test(w))
  if (palabras.length === 0) return base.slice(0, 3).toUpperCase()
  if (palabras.length === 1) return palabras[0].slice(0, 3).toUpperCase()
  return palabras.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
}

function readableText(hex) {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#0b1220' : '#ffffff'
}

/**
 * El escudo generado, con las franjas del club.
 *
 * El anterior era un degradado plano de un color al otro con las iniciales encima, y al lado de
 * los escudos reales se veía como una imagen rota — Emilio lo reportó como bug.
 *
 * Los clubes con dos colores llevan sus FRANJAS (verticales, que es lo más común en el fútbol
 * argentino), y eso ya lo hace parecer una camiseta en vez de un cuadrado de color. Más un
 * borde metálico y una banda superior, como los escudos de verdad.
 */
function shieldSvg(club) {
  const colors = club.colors || []
  const primary = colors[0] || '#243b53'
  const secondary = colors[1] || primary
  const dosColores = colors.length > 1 && colors[0] !== colors[1]
  const txt = readableText(primary)
  const label = initials(club)
  // Tres iniciales entran más chicas que dos: si no, se salen del escudo.
  const tam = label.length >= 3 ? 30 : 38
  const CONTORNO = 'M60 5 L106 19 V59 C106 88 85 107 60 115 C35 107 14 88 14 59 V19 Z'

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="${club.name}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${primary}"/>
      <stop offset="1" stop-color="${secondary}"/>
    </linearGradient>
    <linearGradient id="luz" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.25"/>
      <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.28"/>
    </linearGradient>
    <clipPath id="dentro"><path d="${CONTORNO}"/></clipPath>
  </defs>

  <path d="${CONTORNO}" fill="${dosColores ? primary : 'url(#base)'}"/>
  ${dosColores ? `<g clip-path="url(#dentro)">
    <rect x="34" y="0" width="16" height="120" fill="${secondary}"/>
    <rect x="70" y="0" width="16" height="120" fill="${secondary}"/>
  </g>` : ''}
  <g clip-path="url(#dentro)">
    <rect x="0" y="0" width="120" height="22" fill="#000000" fill-opacity="0.22"/>
    <rect x="0" y="0" width="120" height="120" fill="url(#luz)"/>
  </g>
  <path d="${CONTORNO}" fill="none" stroke="#ffffff" stroke-opacity="0.45" stroke-width="3"/>
  <path d="${CONTORNO}" fill="none" stroke="#000000" stroke-opacity="0.30" stroke-width="1"/>
  <text x="60" y="${label.length >= 3 ? 73 : 76}" text-anchor="middle" font-family="Impact, 'Arial Black', Arial, sans-serif"
        font-size="${tam}" font-weight="900" fill="${txt}" stroke="${txt === '#ffffff' ? '#0b1220' : '#ffffff'}"
        stroke-width="1.2" paint-order="stroke">${label}</text>
</svg>
`
}

let written = 0
for (const id of TARGET_IDS) {
  const club = clubs.find((c) => c.id === id)
  if (!club) {
    console.warn(`skip ${id}: not in clubs.json`)
    continue
  }
  const svg = shieldSvg(club)
  for (const dir of OUT_DIRS) {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, `${id}.svg`), svg)
    written++
  }
  console.log(`${id}: ${initials(club)} (${(club.colors || []).join(', ')})`)
}

// Y el PNG, porque casi todo el sitio pide `/logos/clubs/<id>.png`. Sin esto el escudo nuevo
// solo se veía donde el código pedía el SVG, y en el home —que usa PNG— seguía el viejo, que es
// justamente donde Emilio lo reportó.
const { chromium } = await import('playwright')
const navegador = await chromium.launch()
const pagina = await navegador.newPage({ viewport: { width: 120, height: 120 }, deviceScaleFactor: 4 })
for (const id of TARGET_IDS) {
  const svg = fs.readFileSync(path.join(ROOT, 'public', 'logos', 'clubs', `${id}.svg`), 'utf8')
  await pagina.setContent(`<body style="margin:0;background:transparent">${svg}</body>`)
  for (const dir of OUT_DIRS) {
    await pagina.screenshot({
      path: path.join(dir, `${id}.png`),
      omitBackground: true,
      clip: { x: 0, y: 0, width: 120, height: 120 },
    })
  }
}
await navegador.close()

console.log(`\nListo: ${written} SVG y ${TARGET_IDS.length * OUT_DIRS.length} PNG.`)
