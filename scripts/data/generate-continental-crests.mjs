// Escudos de los clubes de la Libertadores y la Sudamericana.
//
// Los escudos reales de clubes extranjeros no son nuestros para redistribuir, así que se genera
// uno propio por club con sus colores y sus iniciales: el mismo escudo de placeholder que ya usan
// los clubes argentinos sin crest (scripts/data/generate-club-svgs.mjs). Sin escudo, un cruce de
// copa es una lista de texto.
//
//   node scripts/data/generate-continental-crests.mjs
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'public', 'logos', 'continental')

// Los clubes salen del propio motor, para que nunca queden desincronizados con el juego.
const fuente = fs.readFileSync(path.join(ROOT, 'lib', 'copa-libertadores.ts'), 'utf8')
const clubes = [...fuente.matchAll(/\{ id: '([^']+)', name: '([^']+)',[^\]]*?colors: \['([^']+)', '([^']+)'\]/g)]
  .map((m) => ({ id: m[1], name: m[2], colors: [m[3], m[4]] }))

function iniciales(name) {
  const palabras = name.replace(/[().]/g, '').split(/\s+/).filter((w) => w.length > 1)
  if (palabras.length === 1) return palabras[0].slice(0, 3).toUpperCase()
  return palabras.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
}

function textoLegible(hex) {
  const c = hex.replace('#', '')
  const lum = (0.299 * parseInt(c.slice(0, 2), 16) + 0.587 * parseInt(c.slice(2, 4), 16) + 0.114 * parseInt(c.slice(4, 6), 16)) / 255
  return lum > 0.6 ? '#0b1220' : '#ffffff'
}

function escudo(name, [primary, secondary]) {
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

fs.mkdirSync(OUT, { recursive: true })
const vistos = new Set()
for (const c of clubes) {
  if (vistos.has(c.id)) continue
  vistos.add(c.id)
  fs.writeFileSync(path.join(OUT, `${c.id}.svg`), escudo(c.name, c.colors))
}
console.log(`${vistos.size} escudos continentales en public/logos/continental/`)
