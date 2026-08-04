// OBSOLETO desde el 2026-08-04: los dos logos que generaba eran placeholders idénticos con
// una "L" y una "S" adentro, y no distinguían una copa de la otra. Los reemplazan los
// trofeos de scripts/data/generate-trophy-svgs.mjs, que tienen la forma y el metal de cada
// una. Se deja el archivo porque nada lo llama y borrarlo no aporta.
//
// Logos de las dos copas continentales para el home.
//
// Los trofeos reales son marcas de la Conmebol y no son nuestros para redistribuir, así que se
// dibuja una copa propia con el color de cada torneo. Misma lógica que los escudos generados.
//
//   node scripts/data/generate-copa-logos.mjs
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'public', 'logos', 'copas')

const COPAS = [
  { id: 'libertadores', color: '#F6C750', sombra: '#B98F1E', label: 'L' },
  { id: 'sudamericana', color: '#F0883E', sombra: '#B4541A', label: 'S' },
]

const copa = ({ color, sombra, label }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img">
  <defs>
    <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${color}"/>
      <stop offset="1" stop-color="${sombra}"/>
    </linearGradient>
  </defs>
  <!-- asas -->
  <path d="M34 30 C14 30 14 58 36 60" fill="none" stroke="url(#c)" stroke-width="6" stroke-linecap="round"/>
  <path d="M86 30 C106 30 106 58 84 60" fill="none" stroke="url(#c)" stroke-width="6" stroke-linecap="round"/>
  <!-- copa -->
  <path d="M32 22 H88 V44 C88 66 76 78 60 78 C44 78 32 66 32 44 Z" fill="url(#c)"/>
  <!-- pie -->
  <rect x="55" y="78" width="10" height="14" fill="url(#c)"/>
  <rect x="40" y="92" width="40" height="8" rx="3" fill="url(#c)"/>
  <rect x="34" y="100" width="52" height="9" rx="4" fill="url(#c)"/>
  <text x="60" y="56" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
        font-size="30" font-weight="800" fill="rgba(2,8,19,0.65)">${label}</text>
</svg>
`

fs.mkdirSync(OUT, { recursive: true })
for (const c of COPAS) fs.writeFileSync(path.join(OUT, `${c.id}.svg`), copa(c))
console.log(`${COPAS.length} logos de copa en public/logos/copas/`)
