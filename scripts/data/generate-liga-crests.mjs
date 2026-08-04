// Escudos para los 414 clubes de las ligas del modo carrera.
//
//   node scripts/data/generate-liga-crests.mjs
//
// Son escudos generados, no los reales: los de verdad tienen derechos y bajarlos de un sitio
// cualquiera es pedirse un problema. Con el color y las iniciales alcanza para que en la lista
// de ofertas se distinga un club de otro, que es para lo que están.
//
// Van a public/logos/ligas/<id>.svg. Aparte de public/logos/clubs/, que son los argentinos de
// Primera con escudo real: mezclarlos haría que un escudo generado tape uno bueno.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const { clubes } = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'derived', 'ligas.json'), 'utf8'))
const OUT = path.join(ROOT, 'public', 'logos', 'ligas')

/** Las iniciales que un hincha usaría. */
function iniciales(nombre, corto) {
  const base = (corto || nombre).replace(/[().]/g, '')
  const palabras = base.split(/\s+/).filter((w) => w.length > 1)
  if (!palabras.length) return base.slice(0, 3).toUpperCase()
  if (palabras.length === 1) return palabras[0].slice(0, 3).toUpperCase()
  return palabras.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
}

/** Blanco o casi negro según el fondo, para que las iniciales se lean siempre. */
function tinta(color) {
  const m = /^#([0-9a-f]{6})$/i.exec(color)
  if (!m) return '#ffffff' // los hsl() derivados son todos de luminosidad media
  const n = parseInt(m[1], 16)
  const lum = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
  return lum > 0.6 ? '#0b1220' : '#ffffff'
}

const escapar = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function escudo(club) {
  const [a, b] = club.colores
  const txt = tinta(a)
  const label = iniciales(club.nombre, club.corto)
  // El tamaño baja con la cantidad de letras para que tres iniciales no se salgan del escudo.
  const tam = label.length >= 3 ? 30 : label.length === 2 ? 38 : 46
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-label="${escapar(club.nombre)}">
  <defs>
    <linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${a}"/>
      <stop offset="1" stop-color="${b}"/>
    </linearGradient>
  </defs>
  <path d="M60 6 L106 22 V60 C106 88 86 106 60 114 C34 106 14 88 14 60 V22 Z" fill="url(#f)" stroke="${txt}" stroke-opacity="0.35" stroke-width="3"/>
  <path d="M60 6 L106 22 V60 C106 88 86 106 60 114 Z" fill="#000" fill-opacity="0.12"/>
  <text x="60" y="68" text-anchor="middle" font-family="Impact, 'Arial Black', sans-serif" font-size="${tam}" font-weight="900" fill="${txt}">${escapar(label)}</text>
</svg>
`
}

fs.mkdirSync(OUT, { recursive: true })
let escritos = 0
for (const club of clubes) {
  fs.writeFileSync(path.join(OUT, `${club.id}.svg`), escudo(club))
  escritos += 1
}
console.log(`${escritos} escudos → public/logos/ligas/`)
