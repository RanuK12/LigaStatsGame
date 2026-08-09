// Genera los datasets derivados para no embarcar players.json (2.3MB) en el bundle:
//  - public/data/players-core.json  → campos que usa el draft, servido por fetch
//  - data/derived/records.json      → top-10s para /records (import estático chico)
//  - data/derived/ruleta-wheel.json → top-16 para /ruleta (import estático chico)
// Corre automáticamente vía "prebuild" (npm run build).
import fs from 'node:fs'
import path from 'node:path'
import { normalizePlayers } from './shared-normalizers.mjs'

const ROOT = process.cwd()
const DATA_DIR = path.join(ROOT, 'data')
const DERIVED_DIR = path.join(DATA_DIR, 'derived')
const PUBLIC_DATA_DIR = path.join(ROOT, 'public', 'data')

const CORE_FIELDS = [
  'id', 'name', 'position', 'positions', 'rating', 'legendary',
  'nationality', 'clubs', 'goalsClub', 'capsClub', 'decade',
]

const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'players.json'), 'utf8'))
const players = normalizePlayers(raw)

// 1) players-core: solo lo que consume el draft (el normalizador del cliente
//    rellena defaults para el resto de los campos del schema)
const core = players.map((p) => Object.fromEntries(CORE_FIELDS.map((f) => [f, p[f]])))
fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true })
fs.writeFileSync(path.join(PUBLIC_DATA_DIR, 'players-core.json'), JSON.stringify(core))

// 1 bis) squads-core: los planteles, servidos por fetch igual que los jugadores.
//    `squads.json` son 174 kB y lo importaban tres páginas de cliente —portada, draft y
//    versus— así que viajaban en el bundle antes de que se pudiera tocar nada. La portada ya
//    no lo necesita (usaba solo el total, que está en stats.json); el draft y el versus sí,
//    pero recién cuando el jugador entra a jugar.
fs.copyFileSync(path.join(DATA_DIR, 'squads.json'), path.join(PUBLIC_DATA_DIR, 'squads-core.json'))

// Estadísticas oficiales actualizadas (FIFA / AFA / IFFHS) para Leyendas del Fútbol Argentino
const OFFICIAL_LEGEND_STATS = {
  "messi-lionel-1987": { goalsClub: 794, goalsNT: 125 }, // 794 clubes (Barça, PSG, Inter Miami) + 125 Selección Argentina = 919 goles oficiales
  "alfredo-di-ste-fano-1926": { goalsClub: 480, goalsNT: 29 }, // 480 clubes + 29 Selección = 509
  "sergio-agu-ero-1988": { goalsClub: 384, goalsNT: 42 }, // 384 clubes + 42 Selección Argentina = 426
  "gonzalo-higuai-n-1987": { goalsClub: 335, goalsNT: 31 }, // 335 clubes + 31 Selección Argentina = 366
  "batistuta-gabriel-1969": { goalsClub: 300, goalsNT: 56 }, // 300 clubes + 56 Selección Argentina = 356
  "maradona-diego-1960": { goalsClub: 311, goalsNT: 34 }, // 311 clubes + 34 Selección A = 345
  "mario-kempes": { goalsClub: 304, goalsNT: 20 }, // 304 clubes + 20 Selección Argentina = 324
  "martin-palermo": { goalsClub: 306, goalsNT: 9 }, // 306 clubes + 9 Selección Argentina = 315
  "sand-jose-1980": { goalsClub: 312, goalsNT: 0 }, // 312 clubes = 312
  "carlos-tevez": { goalsClub: 280, goalsNT: 13 }, // 280 clubes + 13 Selección Argentina = 293
  "hernan-crespo": { goalsClub: 273, goalsNT: 35 }, // 273 clubes + 35 Selección Argentina = 308
  "enzo-francescoli": { goalsClub: 220, goalsNT: 17 }, // 220 clubes + 17 Selección Uruguay = 237
  "mauro-icardi-1993": { goalsClub: 220, goalsNT: 1 }, // 220 clubes + 1 Selección = 221
  "daniel-passarella": { goalsClub: 175, goalsNT: 22 }, // 175 clubes + 22 Selección = 197
  "angel-di-maria": { goalsClub: 173, goalsNT: 31 }, // 173 clubes + 31 Selección Argentina = 204
  "angel-di-maria-rc": { goalsClub: 173, goalsNT: 31 }, // 173 clubes + 31 Selección Argentina = 204
  "juan-roman-riquelme": { goalsClub: 147, goalsNT: 17 }, // 147 clubes + 17 Selección Argentina = 164
  "ricardo-bochini": { goalsClub: 107, goalsNT: 0 }, // 107 clubes = 107
  "jose-luis-chilavert": { goalsClub: 62, 'goalsNT': 8 }, // 62 clubes + 8 Selección Paraguay = 70
}

// 2) records: top-10 por rating y por goles totales (clubes + Selección A)
const recordFields = (p) => {
  const custom = OFFICIAL_LEGEND_STATS[p.id]
  const goalsClub = custom ? custom.goalsClub : (p.goalsClub || 0)
  const goalsNT = custom ? custom.goalsNT : 0
  const goalsTotal = goalsClub + goalsNT
  const breakdown = goalsNT > 0 ? `${goalsClub} club + ${goalsNT} Selección` : `${goalsClub} club`
  return {
    id: p.id,
    name: p.name,
    position: p.position,
    decade: p.decade,
    rating: p.rating,
    goalsClub,
    goalsNT,
    goalsTotal,
    breakdown,
  }
}

const topRated = [...players].sort((a, b) => b.rating - a.rating).slice(0, 10).map(recordFields)
const topScorers = [...players]
  .map(recordFields)
  .sort((a, b) => b.goalsTotal - a.goalsTotal)
  .slice(0, 10)

fs.mkdirSync(DERIVED_DIR, { recursive: true })
fs.writeFileSync(path.join(DERIVED_DIR, 'records.json'), JSON.stringify({ topRated, topScorers }, null, 2))

// 3) stats: los números que muestra el Home (para que no queden hardcodeados y envejezcan)
const squads = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'squads.json'), 'utf8'))
const clubs = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'clubs.json'), 'utf8'))
fs.writeFileSync(
  path.join(DERIVED_DIR, 'stats.json'),
  JSON.stringify({
    players: players.length,
    squads: squads.length,
    clubs: clubs.length,
    legends: players.filter((p) => p.legendary).length,
    // Los planteles históricos son el argumento del juego, así que el número va a la portada y
    // sale de acá: escrito a mano se desactualizaría al primer scrape nuevo.
    historicos: squads.filter((s) => s.historico).length,
  }, null, 2),
)

// 4) ruleta: top-16 completos (la página muestra clubs/trofeos/caps del ganador)
const wheel = [...players].sort((a, b) => b.rating - a.rating).slice(0, 16)
fs.writeFileSync(path.join(DERIVED_DIR, 'ruleta-wheel.json'), JSON.stringify(wheel, null, 2))

const kb = (f) => (fs.statSync(f).size / 1024).toFixed(1)
console.log(`players-core.json: ${core.length} jugadores, ${kb(path.join(PUBLIC_DATA_DIR, 'players-core.json'))} KB`)
console.log(`records.json: ${kb(path.join(DERIVED_DIR, 'records.json'))} KB · ruleta-wheel.json: ${kb(path.join(DERIVED_DIR, 'ruleta-wheel.json'))} KB`)
