// Placa para compartir las novedades en redes.
//
// Se dibuja en SVG y se rasteriza con rsvg-convert (el mismo camino que los escudos). Los números
// NO se escriben a mano: salen de data/derived/stats.json y de data/squads.json, así que la placa
// no puede quedar mintiendo cuando la base cambie.
//
//   node scripts/data/generate-social-card.mjs
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'public', 'social')
const stats = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'derived', 'stats.json'), 'utf8'))
const squads = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'squads.json'), 'utf8'))
const curiosidades = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'derived', 'curiosidades.json'), 'utf8'))

const historicos = squads.filter((s) => s.historico)
const anios = historicos.map((s) => Number(s.season))
const desde = Math.min(...anios)
const hasta = Math.max(...anios)

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const CELESTE = '#74ACDF'
const ORO = '#F6C750'

/** Una tarjeta de dato, como las del juego. */
const tarjeta = (x, y, w, h, color, titulo, sub) => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="22" fill="rgba(2,8,19,0.55)" stroke="${color}" stroke-opacity="0.45" stroke-width="2"/>
  <text x="${x + w / 2}" y="${y + 62}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="52" font-weight="800" fill="${color}">${esc(titulo)}</text>
  <text x="${x + w / 2}" y="${y + 96}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="20" font-weight="600" fill="#94A3B8">${esc(sub)}</text>`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#04101f"/>
      <stop offset="0.55" stop-color="#020813"/>
      <stop offset="1" stop-color="#0a1526"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.18" cy="0.15" r="0.6">
      <stop offset="0" stop-color="${CELESTE}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${CELESTE}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowOro" cx="0.85" cy="0.85" r="0.5">
      <stop offset="0" stop-color="${ORO}" stop-opacity="0.16"/>
      <stop offset="1" stop-color="${ORO}" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1200" height="630" fill="url(#fondo)"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <rect width="1200" height="630" fill="url(#glowOro)"/>

  <!-- banda argentina -->
  <rect x="0" y="0" width="1200" height="8" fill="${CELESTE}"/>
  <rect x="0" y="8" width="1200" height="8" fill="#FFFFFF"/>
  <rect x="0" y="16" width="1200" height="8" fill="${CELESTE}"/>

  <text x="70" y="108" font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="800" letter-spacing="8" fill="${CELESTE}">GAMBETA · GAMBETAFUTBOL.GAMES</text>

  <text x="70" y="196" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="800" fill="#FFFFFF">Los mejores equipos</text>
  <text x="70" y="272" font-family="Helvetica, Arial, sans-serif" font-size="72" font-weight="800" fill="${ORO}">del fútbol argentino</text>

  <text x="70" y="330" font-family="Helvetica, Arial, sans-serif" font-size="27" font-weight="500" fill="#B6C6DA">El Vélez del 94 · Los Boca de Bianchi · El River del 96 · El Estudiantes de Verón</text>

  ${tarjeta(70, 380, 250, 130, ORO, historicos.length, `planteles históricos`)}
  ${tarjeta(340, 380, 250, 130, CELESTE, stats.players.toLocaleString('es-AR'), 'jugadores reales')}
  ${tarjeta(610, 380, 250, 130, CELESTE, stats.squads, 'planteles en total')}
  ${tarjeta(880, 380, 250, 130, ORO, curiosidades.mazo.length, 'datos curiosos')}

  <text x="70" y="562" font-family="Helvetica, Arial, sans-serif" font-size="25" font-weight="700" fill="#FFFFFF">Libertadores y Sudamericana: no se eligen, se clasifican</text>
  <text x="70" y="596" font-family="Helvetica, Arial, sans-serif" font-size="21" font-weight="500" fill="#7C8DA3">Gratis, sin registro para jugar · ${desde}-${hasta} · Hecho en Argentina</text>
</svg>
`

fs.mkdirSync(OUT, { recursive: true })
const rutaSvg = path.join(OUT, 'novedades.svg')
const rutaPng = path.join(OUT, 'novedades.png')
fs.writeFileSync(rutaSvg, svg)
execFileSync('rsvg-convert', ['-w', '1200', '-h', '630', rutaSvg, '-o', rutaPng])
console.log(`placa: ${path.relative(ROOT, rutaPng)} (${(fs.statSync(rutaPng).size / 1024).toFixed(0)} KB)`)
console.log(`  ${historicos.length} históricos · ${stats.players} jugadores · ${stats.squads} planteles · ${curiosidades.mazo.length} datos`)
