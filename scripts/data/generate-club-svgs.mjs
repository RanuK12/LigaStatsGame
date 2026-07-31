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

function initials(name) {
  const words = name.replace(/[()]/g, '').split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
}

function readableText(hex) {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.6 ? '#0b1220' : '#ffffff'
}

function shieldSvg(name, colors) {
  const primary = colors?.[0] || '#243b53'
  const secondary = colors?.[1] || primary
  const txt = readableText(primary)
  const label = initials(name)
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
        font-size="34" font-weight="800" fill="${txt}">${label}</text>
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
  const svg = shieldSvg(club.name, club.colors)
  for (const dir of OUT_DIRS) {
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, `${id}.svg`), svg)
    written++
  }
  console.log(`${id}: ${initials(club.name)} (${(club.colors || []).join(', ')})`)
}
console.log(`Done. Wrote ${written} SVG files.`)
