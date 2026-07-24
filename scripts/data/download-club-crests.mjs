// Baja escudos limpios y uniformes de TODOS los clubes desde el CDN de Copero
// (SVG transparentes) y los rasteriza a PNG en /public/logos y /public/logos/clubs.
// Los que Copero no tenga se dejan como están.
//   node scripts/data/download-club-crests.mjs
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'

const ROOT = process.cwd()
const clubs = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'clubs.json'), 'utf8'))
const CDN = 'https://media.copero.com.ar/logos/football/teams/ARG/L'
const OUT = [path.join(ROOT, 'public', 'logos'), path.join(ROOT, 'public', 'logos', 'clubs')]

const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[^\x00-\x7f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// Candidatos manuales para ids que no coinciden con el slug de Copero
const ALIASES = {
  velez: ['velez-sarsfield'],
  'estudiantes-lp': ['estudiantes-lp', 'estudiantes-de-la-plata'],
  newells: ['newells-old-boys'],
  'argentinos-jrs': ['argentinos-juniors'],
  'talleres-cba': ['talleres', 'talleres-cordoba'],
  'gimnasia-lp': ['gimnasia-la-plata', 'gimnasia-y-esgrima-la-plata', 'gimnasia'],
  belgrano: ['belgrano', 'belgrano-cordoba'],
  instituto: ['instituto', 'instituto-cordoba'],
  'union-sf': ['union', 'union-santa-fe', 'union-de-santa-fe'],
  'sarmiento-j': ['sarmiento', 'sarmiento-junin'],
  ferro: ['ferro-carril-oeste', 'ferro'],
  chacarita: ['chacarita-juniors', 'chacarita'],
  'atl-tucuman': ['atletico-tucuman'],
  colon: ['colon-santa-fe'],
  'central-cordoba': ['central-cordoba-sde', 'central-cordoba'],
  riestra: ['riestra', 'deportivo-riestra'],
  tigre: ['tigre', 'club-atletico-tigre'],
}

async function fetchSvg(candidate) {
  try {
    const res = await fetch(`${CDN}/${candidate}.svg`)
    if (!res.ok) return null
    const txt = await res.text()
    return txt.includes('<svg') ? txt : null
  } catch {
    return null
  }
}

const ok = []
const missing = []

for (const c of clubs) {
  if (c.id === 'argentina') continue
  const candidates = [
    ...(ALIASES[c.id] || []),
    c.id,
    slug(c.name),
    slug(c.shortName || ''),
  ].filter(Boolean)

  let svg = null
  let used = null
  for (const cand of [...new Set(candidates)]) {
    svg = await fetchSvg(cand)
    if (svg) { used = cand; break }
  }

  if (!svg) { missing.push(c.id); continue }

  const tmp = path.join(ROOT, `.tmp-${c.id}.svg`)
  fs.writeFileSync(tmp, svg)
  for (const dir of OUT) {
    fs.writeFileSync(path.join(dir, `${c.id}.svg`), svg)
    execFileSync('rsvg-convert', ['-w', '512', '-h', '512', tmp, '-o', path.join(dir, `${c.id}.png`)])
  }
  fs.unlinkSync(tmp)
  ok.push(`${c.id} <- ${used}`)
}

console.log(`OK (${ok.length}):`)
ok.forEach((x) => console.log('  ' + x))
console.log(`\nSin escudo en Copero (${missing.length}, se dejan como están): ${missing.join(', ') || 'ninguno'}`)
