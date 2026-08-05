import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const CLUBS_JSON = path.join(ROOT, 'data', 'clubs.json')
const CLUBS_DIR = path.join(ROOT, 'public', 'logos', 'clubs')
const CARRERA_DIR = path.join(ROOT, 'public', 'logos', 'carrera')

if (!fs.existsSync(CLUBS_DIR)) fs.mkdirSync(CLUBS_DIR, { recursive: true })

const clubs = JSON.parse(fs.readFileSync(CLUBS_JSON, 'utf8'))
const carreraFiles = fs.readdirSync(CARRERA_DIR)

// Mapa de correspondencia entre ID corto de club y archivo oficial en logos/carrera
const MAPPING = {
  'atletico-nacional': 'atletico-nacional.png',
  'america-cali': 'america-de-cali.png',
  'colo-colo': 'club-social-y-deportivo-colo-colo.png',
  'universitario': 'club-universitario-de-deportes.png',
  'sporting-cristal': 'club-sporting-cristal.png',
  'olimpia': 'club-olimpia.png',
  'cerro-porteno': 'club-cerro-porteno.png',
  'penarol': 'club-atletico-penarol.png',
  'nacional-uru': 'club-nacional-de-football.png',
  'santos-fc': 'santos-futebol-clube.png',
  'sao-paulo': 'sao-paulo-futebol-clube.png',
  'flamengo': 'clube-de-regatas-do-flamengo.png',
  'palmeiras': 'sociedade-esportiva-palmeiras.png',
  'corinthians': 'sport-club-corinthians-paulista.png',
  'atletico-mineiro': 'clube-atletico-mineiro.png',
  'vasco': 'club-de-regatas-vasco-da-gama.png',
  'fluminense': 'fluminense-football-club.png',
  'gremio': 'gremio-foot-ball-porto-alegrense.png',
  'internacional': 'sport-club-internacional.png',
  'botafogo': 'botafogo-de-futebol-e-regatas.png',
  'cruzeiro': 'cruzeiro-esporte-clube.png',
  'deportivo-cali': 'deportivo-cali.png',
  'junior': 'junior-de-barranquilla.png',
  'millonarios': 'millonarios-futbol-club.png',
  'santa-fe': 'independiente-santa-fe.png',
  'medellin': 'deportivo-independiente-medellin.png',
  'once-caldas': 'once-caldas.png',
  'universidad-catolica': 'club-deportivo-universidad-catolica.png',
  'universidad-de-chile': 'club-universidad-de-chile.png',
  'cobreloa': 'cobreloa.png',
  'alianza-lima': 'club-alianza-lima.png',
  'melgar': 'futbol-club-melgar.png',
  'cienciano': 'club-cienciano.png',
  'libertad': 'club-libertad.png',
  'danubio': 'danubio-futbol-club.png',
  'defensor': 'defensor-sporting-club.png',
  'wanderers': 'montevideo-wanderers-futbol-club.png',
  'barcelona-sc': 'barcelona-sc.png',
  'emelec': 'emelec.png',
  'ldu-quito': 'ldu-quito.png',
  'ind-del-valle': 'ind-del-valle.png'
}

let copiados = 0
for (const [id, carreraFile] of Object.entries(MAPPING)) {
  const src = path.join(CARRERA_DIR, carreraFile)
  const dest = path.join(CLUBS_DIR, `${id}.png`)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest)
    copiados++
  }
}

console.log(`✅ Sincronizados ${copiados} escudos oficiales HD de carrera a public/logos/clubs/`)
