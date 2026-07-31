// Escudo para TODO club que el juego pueda mostrar.
//
// El modo carrera pide los escudos desde /logos/clubs/<id>.png para cualquier club: argentino,
// sudamericano o europeo. Los continentales solo existían en /logos/continental/ y los europeos
// no existían en ningún lado, así que al fichar para el Inter de Porto Alegre o para el Real
// Madrid la ficha salía sin escudo. Un club sin escudo en un juego de fútbol se nota enseguida.
//
// Los escudos reales de clubes ajenos no son nuestros para redistribuir: se dibuja uno propio con
// los colores de cada club, igual que se hizo con los argentinos sin crest.
//
//   node scripts/data/completar-escudos.mjs
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = process.cwd()
const DEST = path.join(ROOT, 'public', 'logos', 'clubs')

// Los continentales traen sus colores en el motor de copas.
const cont = fs.readFileSync(path.join(ROOT, 'lib', 'copa-libertadores.ts'), 'utf8')
const continentales = [...cont.matchAll(/\{ id: '([^']+)', name: '([^']+)', country: '[^']+', flag: '[^']+', colors: \['([^']+)', '([^']+)'\]/g)]
  .map((m) => ({ id: m[1], name: m[2], colors: [m[3], m[4]] }))

// Los europeos no tienen colores cargados: se les asigna el suyo, que es parte de su identidad.
const COLORES_EURO = {
  'real-madrid': ['#FEBE10', '#FFFFFF'],
  'fc-barcelona': ['#A50044', '#004D98'],
  'manchester-city': ['#6CABDD', '#FFFFFF'],
  liverpool: ['#C8102E', '#00B2A9'],
  'bayern-munich': ['#DC052D', '#FFFFFF'],
  'paris-saint-germain': ['#004170', '#DA291C'],
  'inter-milan': ['#0068A8', '#000000'],
  juventus: ['#000000', '#FFFFFF'],
  'manchester-united': ['#DA291C', '#FBE122'],
  'atletico-madrid': ['#CB3524', '#1C2C5B'],
  chelsea: ['#034694', '#FFFFFF'],
  'borussia-dortmund': ['#FDE100', '#000000'],
}

const carrera = fs.readFileSync(path.join(ROOT, 'lib', 'career-engine.ts'), 'utf8')
const europeos = [...carrera.matchAll(/\{ id: '([^']+)', name: '([^']+)', strength: \d+, continental: true, region: 'euro'/g)]
  .map((m) => ({ id: m[1], name: m[2], colors: COLORES_EURO[m[1]] || ['#243b53', '#0f2033'] }))

function iniciales(name) {
  const p = name.replace(/[().]/g, '').split(/\s+/).filter((w) => w.length > 1)
  if (p.length === 1) return p[0].slice(0, 3).toUpperCase()
  return p.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
}

const textoLegible = (hex) => {
  const c = hex.replace('#', '')
  const lum = (0.299 * parseInt(c.slice(0, 2), 16) + 0.587 * parseInt(c.slice(2, 4), 16) + 0.114 * parseInt(c.slice(4, 6), 16)) / 255
  return lum > 0.6 ? '#0b1220' : '#ffffff'
}

const escudo = (name, [primary, secondary]) => {
  const label = iniciales(name)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="${name}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${primary}"/>
      <stop offset="1" stop-color="${secondary}"/>
    </linearGradient>
  </defs>
  <path d="M60 6 L104 20 V60 C104 88 84 106 60 114 C36 106 16 88 16 60 V20 Z"
        fill="url(#g)" stroke="#ffffff" stroke-opacity="0.35" stroke-width="3"/>
  <path d="M60 6 L104 20 V60 C104 88 84 106 60 114 C36 106 16 88 16 60 V20 Z"
        fill="none" stroke="#000000" stroke-opacity="0.25" stroke-width="1"/>
  <text x="60" y="70" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="${label.length > 2 ? 30 : 36}" font-weight="800" fill="${textoLegible(primary)}">${label}</text>
</svg>
`
}

fs.mkdirSync(DEST, { recursive: true })
const hechos = []
for (const c of [...continentales, ...europeos]) {
  const png = path.join(DEST, `${c.id}.png`)
  const svg = path.join(DEST, `${c.id}.svg`)
  if (fs.existsSync(png) || fs.existsSync(svg)) continue // el que ya tiene escudo real, no se toca
  fs.writeFileSync(svg, escudo(c.name, c.colors))
  // El juego pide .png en las fichas de carrera, así que se rasteriza también.
  execFileSync('rsvg-convert', ['-w', '256', '-h', '256', svg, '-o', png])
  hechos.push(c.id)
}
console.log(`${hechos.length} escudos nuevos en public/logos/clubs/`)
if (hechos.length) console.log('  ' + hechos.join(', '))
