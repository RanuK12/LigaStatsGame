// Los trofeos del juego, dibujados por nosotros.
//
//   node scripts/data/generate-trophy-svgs.mjs
//
// Los títulos se mostraban con emojis: la Libertadores era 🏆, la Copa Argentina 🥛 (una copa de
// leche) y el Mundial 🌍. Además de quedar pobre al lado de los escudos, cada sistema operativo
// dibuja los emojis distinto, así que la ficha que comparte alguien de iPhone no es la misma que
// la de Android.
//
// No son las copas oficiales —esas tienen derechos— sino una silueta que las evoca: la
// Libertadores es la única con esa base de tres escalones y ese cuenco ancho; la Copa do Brasil
// es alta y angosta; el Mundial es la esfera sostenida. Con eso alcanza para reconocerlas.
//
// Salen a public/logos/trofeos/<id>.svg, al lado de los escudos, que es como está el resto.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const OUT = path.join(ROOT, 'public', 'logos', 'trofeos')

/** El degradado del metal. Cada trofeo trae el suyo para que no se pisen los ids. */
const metal = (id, claro, medio, oscuro) => `
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${claro}"/>
      <stop offset="0.45" stop-color="${medio}"/>
      <stop offset="1" stop-color="${oscuro}"/>
    </linearGradient>`

const ORO = ['#FFF3C4', '#F3C14B', '#A9761A']
const PLATA = ['#F4F8FC', '#C9D6E4', '#7C8C9E']
const BRONCE = ['#F6D9B0', '#C98A45', '#7A4A18']

/** Base de tres escalones: la de la Libertadores y la de las copas grandes. */
const base3 = (g) => `
  <rect x="17" y="50" width="30" height="4.5" rx="1.6" fill="url(#${g})"/>
  <rect x="14" y="54" width="36" height="5" rx="1.8" fill="url(#${g})" opacity="0.92"/>
  <rect x="11" y="58.4" width="42" height="4.6" rx="1.8" fill="url(#${g})" opacity="0.85"/>`

/** Base simple, para las copas menores. */
const base1 = (g) => `
  <rect x="20" y="52" width="24" height="4.5" rx="1.6" fill="url(#${g})"/>
  <rect x="15" y="56" width="34" height="5.5" rx="2" fill="url(#${g})" opacity="0.9"/>`

function envoltorio(nombre, defs, cuerpo) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${nombre}">
  <defs>${defs}
    <linearGradient id="brillo" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.55"/>
      <stop offset="0.4" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
${cuerpo}
</svg>
`
}

/**
 * La Libertadores: cuenco ancho y hondo sobre un pie corto y la base de tres escalones. Es la
 * silueta más reconocible del continente.
 */
function libertadores() {
  return envoltorio(
    'Copa Libertadores',
    metal('lib', ...ORO),
    `  <path d="M18 12 h28 v11 c0 9.5 -6.3 16 -14 16 S18 32.5 18 23 z" fill="url(#lib)"/>
  <path d="M18 14 h6 v9 c0 6.5 2.6 11 6 13 -7 -1.4 -12 -7 -12 -13 z" fill="url(#brillo)"/>
  <path d="M18 16 c-5 0 -8 3 -8 7 s3 7 8 7" fill="none" stroke="url(#lib)" stroke-width="3" stroke-linecap="round"/>
  <path d="M46 16 c5 0 8 3 8 7 s-3 7 -8 7" fill="none" stroke="url(#lib)" stroke-width="3" stroke-linecap="round"/>
  <rect x="29" y="38" width="6" height="12" fill="url(#lib)"/>
${base3('lib')}
  <circle cx="32" cy="22" r="5.2" fill="none" stroke="#7A4A18" stroke-opacity="0.55" stroke-width="1.6"/>`,
  )
}

/** La Sudamericana: la misma familia pero en plata y con el cuenco más chico. */
function sudamericana() {
  return envoltorio(
    'Copa Sudamericana',
    metal('sud', ...PLATA),
    `  <path d="M20 14 h24 v9 c0 8 -5.4 13.5 -12 13.5 S20 31 20 23 z" fill="url(#sud)"/>
  <path d="M20 15.5 h5 v7.5 c0 5.5 2.2 9.4 5 11 -6 -1.2 -10 -6 -10 -11 z" fill="url(#brillo)"/>
  <path d="M20 17 c-4.4 0 -7 2.6 -7 6 s2.6 6 7 6" fill="none" stroke="url(#sud)" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M44 17 c4.4 0 7 2.6 7 6 s-2.6 6 -7 6" fill="none" stroke="url(#sud)" stroke-width="2.6" stroke-linecap="round"/>
  <rect x="29.5" y="36" width="5" height="14" fill="url(#sud)"/>
${base3('sud')}`,
  )
}

/** La liga: el escudo con la estrella, que es como se cuenta un campeonato local. */
function liga() {
  return envoltorio(
    'Campeón de Liga',
    metal('lg', ...ORO),
    `  <path d="M32 7 L53 14 v17 c0 12.5 -8.6 21.5 -21 25.5 C19.6 52.5 11 43.5 11 31 V14 z" fill="url(#lg)"/>
  <path d="M32 7 L21 10.7 v20.3 c0 9.5 4.4 16.6 11 21 -12.4 -4 -21 -13 -21 -25.5 V14 z" fill="url(#brillo)"/>
  <path d="M32 18 l3.6 7.6 8.1 1.1 -5.9 5.8 1.5 8.2 -7.3 -4 -7.3 4 1.5 -8.2 -5.9 -5.8 8.1 -1.1 z" fill="#5A3B08" fill-opacity="0.55"/>`,
  )
}

/** El ascenso: la flecha subiendo dentro del escudo. En la B se festeja más que una copa. */
function ascenso() {
  return envoltorio(
    'Ascenso',
    metal('asc', '#D8F6E4', '#34d399', '#12694C'),
    `  <path d="M32 7 L53 14 v17 c0 12.5 -8.6 21.5 -21 25.5 C19.6 52.5 11 43.5 11 31 V14 z" fill="url(#asc)"/>
  <path d="M32 7 L21 10.7 v20.3 c0 9.5 4.4 16.6 11 21 -12.4 -4 -21 -13 -21 -25.5 V14 z" fill="url(#brillo)"/>
  <path d="M32 17 l11 12 h-6.5 v11 h-9 V29 H21 z" fill="#0C3E2C" fill-opacity="0.6"/>`,
  )
}

/** El Mundial: la esfera sostenida por dos brazos que suben. */
function mundial() {
  return envoltorio(
    'Mundial',
    metal('mun', ...ORO),
    // Dos brazos que se abren desde la base y sostienen la esfera arriba: es la silueta del
    // Mundial y lo que la separa de una copa cualquiera. La primera versión tenía la esfera
    // chica y pegada al pie, y el conjunto parecía un peón de ajedrez.
    `  <path d="M24 50 C18 40 19 27 27 20" fill="none" stroke="url(#mun)" stroke-width="5.5" stroke-linecap="round"/>
  <path d="M40 50 C46 40 45 27 37 20" fill="none" stroke="url(#mun)" stroke-width="5.5" stroke-linecap="round"/>
  <circle cx="32" cy="18" r="11" fill="url(#mun)"/>
  <path d="M21 18 a11 11 0 0 1 11 -11 v22 a11 11 0 0 1 -11 -11 z" fill="url(#brillo)"/>
  <path d="M21 18 h22 M32 7 c4.4 5 4.4 17 0 22 M32 7 c-4.4 5 -4.4 17 0 22" fill="none" stroke="#7A4A18" stroke-opacity="0.5" stroke-width="1.3"/>
${base1('mun')}`,
  )
}

/** El Mundial de Clubes: la esfera con la banda, sobre un pie más alto. */
function mundialClubes() {
  return envoltorio(
    'Mundial de Clubes',
    metal('mc', ...ORO),
    `  <circle cx="32" cy="21" r="12" fill="url(#mc)"/>
  <path d="M20 21 a12 12 0 0 1 12 -12 v24 a12 12 0 0 1 -12 -12 z" fill="url(#brillo)"/>
  <ellipse cx="32" cy="21" rx="12" ry="4.6" fill="none" stroke="#7A4A18" stroke-opacity="0.5" stroke-width="1.4"/>
  <ellipse cx="32" cy="21" rx="4.6" ry="12" fill="none" stroke="#7A4A18" stroke-opacity="0.5" stroke-width="1.4"/>
  <rect x="29.5" y="33" width="5" height="17" fill="url(#mc)"/>
${base3('mc')}`,
  )
}

/** La Champions: las orejonas, que es de lo único que se la reconoce. */
function champions() {
  return envoltorio(
    'Champions League',
    metal('ch', ...PLATA),
    `  <path d="M20 12 h24 v13 c0 8 -5.4 13.5 -12 13.5 S20 33 20 25 z" fill="url(#ch)"/>
  <path d="M20 13.5 h5 v11.5 c0 5.5 2.2 9.4 5 11 -6 -1.2 -10 -6 -10 -11 z" fill="url(#brillo)"/>
  <path d="M20 14 c-8 0 -11 4 -11 9 s3 9 11 9" fill="none" stroke="url(#ch)" stroke-width="3.4" stroke-linecap="round"/>
  <path d="M44 14 c8 0 11 4 11 9 s-3 9 -11 9" fill="none" stroke="url(#ch)" stroke-width="3.4" stroke-linecap="round"/>
  <rect x="29.5" y="38" width="5" height="12" fill="url(#ch)"/>
${base1('ch')}`,
  )
}

/** La Europa League: la misma silueta más chica, en bronce, para que no se confundan. */
function europa() {
  return envoltorio(
    'Europa League',
    metal('eu', ...BRONCE),
    `  <path d="M22 14 h20 v11 c0 7 -4.6 11.5 -10 11.5 S22 32 22 25 z" fill="url(#eu)"/>
  <path d="M22 15.5 h4.5 v9.5 c0 4.6 1.8 8 4 9.5 -5.2 -1 -8.5 -5 -8.5 -9.5 z" fill="url(#brillo)"/>
  <path d="M22 17 c-5.5 0 -8 3 -8 6.5 s2.5 6.5 8 6.5" fill="none" stroke="url(#eu)" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M42 17 c5.5 0 8 3 8 6.5 s-2.5 6.5 -8 6.5" fill="none" stroke="url(#eu)" stroke-width="2.6" stroke-linecap="round"/>
  <rect x="30" y="36" width="4" height="15" fill="url(#eu)"/>
${base1('eu')}`,
  )
}

/**
 * Las copas nacionales.
 *
 * Cada país con su color y su forma: la Copa Argentina es ancha y baja, la do Brasil alta y
 * angosta, la de Chile con asas rectas. No son las oficiales, pero se distinguen entre sí, que
 * es lo que hace falta cuando en una ficha hay tres.
 */
const NACIONALES = [
  { id: 'copa-arg', nombre: 'Copa Argentina', c: ['#DCEBFA', '#74ACDF', '#2C5F91'], forma: 'ancha' },
  { id: 'copa-uru', nombre: 'Copa Uruguay', c: ['#EAF2FB', '#8AB6DE', '#33628F'], forma: 'alta' },
  { id: 'copa-chi', nombre: 'Copa Chile', c: ['#FBDEDE', '#E4002B', '#7C0016'], forma: 'recta' },
  { id: 'copa-col', nombre: 'Copa Colombia', c: ['#FFF0C2', '#F6C750', '#8A6410'], forma: 'ancha' },
  { id: 'copa-per', nombre: 'Copa Perú', c: ['#FBDEDE', '#D91023', '#6E0A13'], forma: 'alta' },
  { id: 'copa-par', nombre: 'Copa Paraguay', c: ['#E2ECFF', '#3B5CA8', '#1D2E56'], forma: 'recta' },
  { id: 'copa-bra', nombre: 'Copa do Brasil', c: ['#D9F5E4', '#006437', '#00301B'], forma: 'alta' },
]

const FORMAS = {
  ancha: (g) => `  <path d="M18 14 h28 v9 c0 8.5 -6 14 -14 14 S18 31.5 18 23 z" fill="url(#${g})"/>
  <path d="M18 15.5 h6 v7.5 c0 6 2.4 10.2 5.5 12 -6.8 -1.3 -11.5 -6.4 -11.5 -12 z" fill="url(#brillo)"/>
  <path d="M18 17 c-4.6 0 -7.4 2.6 -7.4 6 s2.8 6 7.4 6" fill="none" stroke="url(#${g})" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M46 17 c4.6 0 7.4 2.6 7.4 6 s-2.8 6 -7.4 6" fill="none" stroke="url(#${g})" stroke-width="2.6" stroke-linecap="round"/>
  <rect x="29" y="37" width="6" height="13" fill="url(#${g})"/>
${base1(g)}`,
  alta: (g) => `  <path d="M23 9 h18 v18 c0 7 -4 11.5 -9 11.5 S23 34 23 27 z" fill="url(#${g})"/>
  <path d="M23 10.5 h4.5 v16.5 c0 4.6 1.6 8 3.8 9.6 -5 -1 -8.3 -5 -8.3 -9.6 z" fill="url(#brillo)"/>
  <path d="M24.5 13 c-5.4 0 -8 2.6 -8 6 s2.6 6 8 6" fill="none" stroke="url(#${g})" stroke-width="2.6" stroke-linecap="round"/>
  <path d="M39.5 13 c5.4 0 8 2.6 8 6 s-2.6 6 -8 6" fill="none" stroke="url(#${g})" stroke-width="2.6" stroke-linecap="round"/>
  <rect x="30" y="38.5" width="4" height="12" fill="url(#${g})"/>
${base1(g)}`,
  recta: (g) => `  <path d="M21 12 h22 l-2.5 16 c-0.6 5.6 -4.2 9 -8.5 9 s-7.9 -3.4 -8.5 -9 z" fill="url(#${g})"/>
  <path d="M21 13.5 h5 l2 14.5 c0.5 4.4 2 7 4 8 -5.4 -0.9 -8.8 -4.4 -9.4 -9.5 z" fill="url(#brillo)"/>
  <path d="M22 16 h-6 v6 h5" fill="none" stroke="url(#${g})" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
  <path d="M42 16 h6 v6 h-5" fill="none" stroke="url(#${g})" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
  <rect x="30" y="37" width="4" height="14" fill="url(#${g})"/>
${base1(g)}`,
}

/**
 * Los cinco niveles de idolatría.
 *
 * En la ficha se mostraban con emoji (▫️👏💙⭐🗿) y el de Leyenda —🗿, un moái— se veía como una
 * piedra gris al lado de los trofeos dorados. Son una escala, así que se dibujan como una: el
 * mismo escudo con más adentro y más color a medida que se sube.
 */
function idolatria(id, nombre, colores, adentro) {
  return envoltorio(
    nombre,
    metal(`id${id}`, ...colores),
    `  <path d="M32 7 L52 14 v16 c0 12 -8.2 20.5 -20 24.5 C20.2 50.5 12 42 12 30 V14 z" fill="url(#id${id})"/>
  <path d="M32 7 L22 10.5 v19.5 c0 9 4.2 15.8 10 20 -11.8 -4 -20 -12.5 -20 -24.5 V14 z" fill="url(#brillo)"/>
${adentro}`,
  )
}

const TINTA_ESCUDO = '#0b1220'
const IDOLATRIA = {
  'idolatria-uno-mas': idolatria('um', 'Uno más', ['#E7EDF4', '#93A5B9', '#4C5A6B'],
    `  <circle cx="32" cy="26" r="5.5" fill="${'#0b1220'}" fill-opacity="0.45"/>
  <path d="M22 42 c0 -6 4.5 -10 10 -10 s10 4 10 10 z" fill="#0b1220" fill-opacity="0.45"/>`),
  'idolatria-querido': idolatria('qu', 'Querido', ['#DCEBFA', '#74ACDF', '#2C5F91'],
    // Dos manos aplaudiendo, resueltas como dos formas simples: a este tamaño una mano con
    // dedos no se lee.
    `  <path d="M25 20 l7 5 -4 15 -8 -4 z" fill="#0b1220" fill-opacity="0.42"/>
  <path d="M39 20 l-7 5 4 15 8 -4 z" fill="#0b1220" fill-opacity="0.42"/>`),
  'idolatria-referente': idolatria('re', 'Referente', ['#CFE4FF', '#4E8FD6', '#1E4A78'],
    // La cinta de capitán.
    `  <rect x="19" y="24" width="26" height="8.5" rx="2" fill="#0b1220" fill-opacity="0.42"/>
  <path d="M24 32.5 l4 9 4 -4 4 4 4 -9 z" fill="#0b1220" fill-opacity="0.42"/>`),
  'idolatria-idolo': idolatria('io', 'Ídolo', ['#FFF3C4', '#F3C14B', '#A9761A'],
    `  <path d="M32 17 l3.8 8 8.6 1.1 -6.3 6.1 1.6 8.7 -7.7 -4.3 -7.7 4.3 1.6 -8.7 -6.3 -6.1 8.6 -1.1 z" fill="#5A3B08" fill-opacity="0.55"/>`),
  'idolatria-leyenda': idolatria('le', 'Leyenda', ['#FFF9DE', '#FFD700', '#8A6410'],
    // La estatua en el pedestal: es lo que se gana al llegar arriba.
    `  <circle cx="32" cy="21" r="4.4" fill="#5A3B08" fill-opacity="0.55"/>
  <path d="M26.5 27 c0 -2.6 2.4 -4.4 5.5 -4.4 s5.5 1.8 5.5 4.4 v12 h-11 z" fill="#5A3B08" fill-opacity="0.55"/>
  <rect x="22" y="39.5" width="20" height="4" rx="1.2" fill="#5A3B08" fill-opacity="0.55"/>
  <rect x="19.5" y="43.5" width="25" height="4" rx="1.2" fill="#5A3B08" fill-opacity="0.42"/>`),
}

const TROFEOS = {
  ...IDOLATRIA,
  libertadores: libertadores(),
  sudamericana: sudamericana(),
  champions: champions(),
  europa: europa(),
  mundial: mundial(),
  'mundial-clubes': mundialClubes(),
  lpf: liga(),
  ascenso: ascenso(),
}
for (const n of NACIONALES) {
  TROFEOS[n.id] = envoltorio(n.nombre, metal(n.id.replace(/-/g, ''), ...n.c), FORMAS[n.forma](n.id.replace(/-/g, '')))
}

fs.mkdirSync(OUT, { recursive: true })
for (const [id, svg] of Object.entries(TROFEOS)) {
  fs.writeFileSync(path.join(OUT, `${id}.svg`), svg)
}
console.log(`${Object.keys(TROFEOS).length} trofeos → public/logos/trofeos/`)
console.log(`  ${Object.keys(TROFEOS).join(', ')}`)
