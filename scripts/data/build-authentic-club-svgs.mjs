import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIRS = [
  path.join(ROOT, 'public', 'logos'),
  path.join(ROOT, 'public', 'logos', 'clubs')
]

for (const dir of OUT_DIRS) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

// Mapa de generadores de SVG de Alta Fidelidad
const CREST_GENERATORS = {
  // 1. Arsenal de Sarandí (Celeste y Rojo divididos con banda diagonal roja, balón y texto Arsenal F.C.)
  'arsenal': () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <clipPath id="c-ars"><path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z"/></clipPath>
    <linearGradient id="g-ars" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7EC0EE"/><stop offset="1" stop-color="#4F94CD"/>
    </linearGradient>
  </defs>
  <!-- Contorno exterior blanco y dorado -->
  <path d="M60 4 L108 18 V60 C108 90 86 110 60 118 C34 110 12 90 12 60 V18 Z" fill="#FFFFFF" stroke="#D4AF37" stroke-width="2"/>
  <path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z" fill="url(#g-ars)"/>
  <g clip-path="url(#c-ars)">
    <!-- Mitad derecha roja -->
    <path d="M60 0 H120 V120 H60 Z" fill="#E4002B"/>
    <!-- Banda diagonal roja -->
    <path d="M-10 20 L130 90 L130 110 L-10 40 Z" fill="#D20000" stroke="#FFFFFF" stroke-width="2"/>
    <!-- Banner superior -->
    <rect x="0" y="0" width="120" height="26" fill="#111827"/>
  </g>
  <!-- Texto Superior -->
  <text x="60" y="18" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-size="11" font-weight="900" fill="#FFFFFF">ARSENAL F. C.</text>
  <!-- Balón en el centro -->
  <circle cx="60" cy="62" r="14" fill="#FFFFFF" stroke="#111827" stroke-width="1.5"/>
  <polygon points="60,54 65,58 63,64 57,64 55,58" fill="#111827"/>
  <!-- Borde final -->
  <path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z" fill="none" stroke="#111827" stroke-width="2.5"/>
</svg>`,

  // 2. Colón de Santa Fe (Mitad Roja, Mitad Negra, Banner C. A. COLON)
  'colon': () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <clipPath id="c-col"><path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z"/></clipPath>
  </defs>
  <path d="M60 4 L108 18 V60 C108 90 86 110 60 118 C34 110 12 90 12 60 V18 Z" fill="#FFFFFF" stroke="#D4AF37" stroke-width="2"/>
  <g clip-path="url(#c-col)">
    <rect x="0" y="0" width="60" height="120" fill="#E30613"/>
    <rect x="60" y="0" width="60" height="120" fill="#000000"/>
    <rect x="0" y="0" width="120" height="26" fill="#000000"/>
    <line x1="0" y1="26" x2="120" y2="26" stroke="#D4AF37" stroke-width="2"/>
  </g>
  <text x="60" y="18" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-size="11" font-weight="900" fill="#FFFFFF">C. A. COLÓN</text>
  <text x="60" y="75" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="900" fill="#FFFFFF" letter-spacing="1">SANTA FE</text>
  <path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z" fill="none" stroke="#000000" stroke-width="2.5"/>
</svg>`,

  // 3. Central Córdoba (Franjas verticales blanco y negro, Banner C.A.C.C.)
  'central-cordoba': () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <clipPath id="c-cc"><path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z"/></clipPath>
  </defs>
  <path d="M60 4 L108 18 V60 C108 90 86 110 60 118 C34 110 12 90 12 60 V18 Z" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
  <g clip-path="url(#c-cc)">
    <rect x="0" y="0" width="120" height="120" fill="#FFFFFF"/>
    <rect x="17" y="0" width="17" height="120" fill="#000000"/>
    <rect x="51" y="0" width="18" height="120" fill="#000000"/>
    <rect x="86" y="0" width="17" height="120" fill="#000000"/>
    <rect x="0" y="0" width="120" height="28" fill="#000000"/>
    <line x1="0" y1="28" x2="120" y2="28" stroke="#D4AF37" stroke-width="2"/>
  </g>
  <text x="60" y="20" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-size="12" font-weight="900" fill="#FFFFFF" letter-spacing="2">C. A. C. C.</text>
  <path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z" fill="none" stroke="#000000" stroke-width="2.5"/>
</svg>`,

  // 4. Barracas Central (Franjas verticales rojo y blanco, Banner azul)
  'barracas-central': () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <clipPath id="c-bar"><path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z"/></clipPath>
  </defs>
  <path d="M60 4 L108 18 V60 C108 90 86 110 60 118 C34 110 12 90 12 60 V18 Z" fill="#FFFFFF" stroke="#091E42" stroke-width="2"/>
  <g clip-path="url(#c-bar)">
    <rect x="0" y="0" width="120" height="120" fill="#E30613"/>
    <rect x="17" y="0" width="17" height="120" fill="#FFFFFF"/>
    <rect x="51" y="0" width="18" height="120" fill="#FFFFFF"/>
    <rect x="86" y="0" width="17" height="120" fill="#FFFFFF"/>
    <rect x="0" y="0" width="120" height="28" fill="#091E42"/>
  </g>
  <text x="60" y="20" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-size="10" font-weight="900" fill="#FFFFFF" letter-spacing="1">BARRACAS</text>
  <path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z" fill="none" stroke="#091E42" stroke-width="2.5"/>
</svg>`,

  // 5. Deportivo Riestra (Escudo negro con franjas blancas verticales y D. RIESTRA)
  'riestra': () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <clipPath id="c-rie"><path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z"/></clipPath>
  </defs>
  <path d="M60 4 L108 18 V60 C108 90 86 110 60 118 C34 110 12 90 12 60 V18 Z" fill="#FFFFFF" stroke="#000000" stroke-width="2"/>
  <g clip-path="url(#c-rie)">
    <rect x="0" y="0" width="120" height="120" fill="#000000"/>
    <rect x="25" y="26" width="12" height="94" fill="#FFFFFF"/>
    <rect x="54" y="26" width="12" height="94" fill="#FFFFFF"/>
    <rect x="83" y="26" width="12" height="94" fill="#FFFFFF"/>
    <rect x="0" y="0" width="120" height="26" fill="#000000"/>
  </g>
  <text x="60" y="18" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-size="10" font-weight="900" fill="#FFFFFF" letter-spacing="1">D. RIESTRA</text>
  <path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z" fill="none" stroke="#000000" stroke-width="2.5"/>
</svg>`,

  // 6. Independiente Rivadavia (Escudo azul marino, doble borde blanco y C.S.I.R.)
  'independiente-rivadavia': () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <clipPath id="c-ir"><path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z"/></clipPath>
  </defs>
  <path d="M60 4 L108 18 V60 C108 90 86 110 60 118 C34 110 12 90 12 60 V18 Z" fill="#FFFFFF" stroke="#091E42" stroke-width="2"/>
  <g clip-path="url(#c-ir)">
    <rect x="0" y="0" width="120" height="120" fill="#0B1D3A"/>
    <path d="M-10 30 L130 100 L130 115 L-10 45 Z" fill="#FFFFFF"/>
  </g>
  <text x="60" y="70" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-size="15" font-weight="900" fill="#0B1D3A" letter-spacing="1">C. S. I. R.</text>
  <path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z" fill="none" stroke="#FFFFFF" stroke-width="3"/>
  <path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z" fill="none" stroke="#0B1D3A" stroke-width="1.5"/>
</svg>`,

  // 7. Aldosivi (Franjas verde y amarillo, silueta de tiburón y C.A.A.)
  'aldosivi': () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <clipPath id="c-ald"><path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z"/></clipPath>
  </defs>
  <path d="M60 4 L108 18 V60 C108 90 86 110 60 118 C34 110 12 90 12 60 V18 Z" fill="#FFFFFF" stroke="#006837" stroke-width="2"/>
  <g clip-path="url(#c-ald)">
    <rect x="0" y="0" width="120" height="120" fill="#006837"/>
    <rect x="20" y="0" width="20" height="120" fill="#FFF200"/>
    <rect x="60" y="0" width="20" height="120" fill="#FFF200"/>
    <rect x="100" y="0" width="20" height="120" fill="#FFF200"/>
    <rect x="0" y="0" width="120" height="26" fill="#006837"/>
  </g>
  <text x="60" y="18" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-size="11" font-weight="900" fill="#FFF200" letter-spacing="1">ALDOSIVI</text>
  <!-- Tiburón estilizado en azul -->
  <path d="M45 60 Q60 45 75 58 Q65 72 45 60 Z" fill="#0B1D3A"/>
  <path d="M60 6 L106 20 V60 C106 88 85 108 60 116 C35 108 14 60 14 20 Z" fill="none" stroke="#006837" stroke-width="2.5"/>
</svg>`
}

let count = 0
for (const [id, gen] of Object.entries(CREST_GENERATORS)) {
  const svg = gen()
  for (const dir of OUT_DIRS) {
    fs.writeFileSync(path.join(dir, `${id}.svg`), svg)
    count++
  }
}

console.log(`✅ Creados ${count} escudos vectoriales de alta fidelidad heráldica.`)

// Rasterizado de PNGs de Alta Definición con Playwright
const { chromium } = await import('playwright')
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 240, height: 240 } })

for (const id of Object.keys(CREST_GENERATORS)) {
  const svgPath = path.join(ROOT, 'public', 'logos', 'clubs', `${id}.svg`)
  const pngPath = path.join(ROOT, 'public', 'logos', 'clubs', `${id}.png`)
  const rootPngPath = path.join(ROOT, 'public', 'logos', `${id}.png`)

  const svgContent = fs.readFileSync(svgPath, 'utf8')
  await page.setContent(`<!DOCTYPE html><html><body style="margin:0;background:transparent;">${svgContent}</body></html>`)
  const buf = await page.screenshot({ omitBackground: true })

  fs.writeFileSync(pngPath, buf)
  fs.writeFileSync(rootPngPath, buf)
  console.log(`🖼️ PNG generado: ${id}.png`)
}

await browser.close()
console.log('✨ Proceso de escudos vectoriales fieles completado al 100%.')
