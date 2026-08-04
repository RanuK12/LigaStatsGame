// Convierte data/ligas/clubes.json (crudo de Wikidata) en lo que consume el modo carrera:
// data/derived/ligas.json.
//
//   node scripts/data/build-ligas.mjs
//
// Qué agrega sobre el crudo:
//   · un id slug estable, que es el nombre del archivo del escudo;
//   · la FUERZA en la escala del modo carrera (60-90), que sale de la división, del país y de
//     los títulos de liga del club;
//   · los colores del escudo;
//   · la estructura del campeonato de cada país: divisiones, copa nacional y copa continental.
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const crudo = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'ligas', 'clubes.json'), 'utf8'))
const SALIDA = path.join(ROOT, 'data', 'derived', 'ligas.json')

/**
 * Coeficiente de país.
 *
 * Sale del ranking de países de Conmebol: un mediocre de la Série A brasileña le gana a un
 * campeón paraguayo, y el juego tiene que reflejarlo o irse a Brasil no significaría nada.
 * Argentina no está acá porque su Primera ya vive en clubs.json con planteles reales.
 */
const COEF_PAIS = { Brasil: 1.0, Argentina: 0.98, Uruguay: 0.86, Colombia: 0.85, Chile: 0.82, Paraguay: 0.79, Perú: 0.76 }

/** Techo y piso por división, antes del coeficiente de país. */
const RANGO_DIVISION = {
  1: { piso: 62, techo: 80 },
  2: { piso: 55, techo: 68 },
  3: { piso: 50, techo: 60 },
}

/**
 * Colores de los clubes que un hincha reconoce.
 *
 * Wikidata no tiene P465 para ninguno de los 422 (verificado), así que o van a mano o salen de
 * un hash del nombre. A mano solo los grandes: que Peñarol salga violeta rompe la ilusión, que
 * Deportivo Garcilaso salga de un color cualquiera no lo nota nadie.
 */
const COLORES = {
  'club-nacional-de-football': ['#1B3A8C', '#FFFFFF'],
  'club-atletico-penarol': ['#FFD200', '#000000'],
  'defensor-sporting-club': ['#4B2E83', '#FFFFFF'],
  'danubio-futbol-club': ['#FFFFFF', '#000000'],
  'sociedade-esportiva-palmeiras': ['#006437', '#FFFFFF'],
  'clube-de-regatas-do-flamengo': ['#E4002B', '#000000'],
  'santos-futebol-clube': ['#FFFFFF', '#000000'],
  'sao-paulo-futebol-clube': ['#E4002B', '#000000'],
  'sport-club-corinthians-paulista': ['#000000', '#FFFFFF'],
  'club-de-regatas-vasco-da-gama': ['#000000', '#FFFFFF'],
  'gremio-foot-ball-porto-alegrense': ['#0D80BF', '#000000'],
  'sport-club-internacional': ['#E4002B', '#FFFFFF'],
  'cruzeiro-esporte-clube': ['#1B3A8C', '#FFFFFF'],
  'clube-atletico-mineiro': ['#000000', '#E4002B'],
  'fluminense-football-club': ['#7A1E30', '#006437'],
  'botafogo-de-futebol-e-regatas': ['#000000', '#FFFFFF'],
  'millonarios-futbol-club': ['#1B3A8C', '#FFFFFF'],
  'america-de-cali': ['#E4002B', '#FFFFFF'],
  'atletico-nacional': ['#006437', '#FFFFFF'],
  'deportivo-cali': ['#006437', '#FFFFFF'],
  'independiente-santa-fe': ['#E4002B', '#FFFFFF'],
  'junior-de-barranquilla': ['#E4002B', '#FFFFFF'],
  'colo-colo': ['#FFFFFF', '#000000'],
  'club-universidad-de-chile': ['#1B3A8C', '#E4002B'],
  'club-deportivo-universidad-catolica': ['#1B3A8C', '#FFFFFF'],
  'club-alianza-lima': ['#1B3A8C', '#FFFFFF'],
  'club-universitario-de-deportes': ['#8B1A2B', '#FFFFFF'],
  'sporting-cristal': ['#00A3E0', '#FFFFFF'],
  'club-olimpia': ['#FFFFFF', '#000000'],
  'club-cerro-porteno': ['#E4002B', '#1B3A8C'],
  'club-libertad': ['#000000', '#FFFFFF'],
  'club-guarani': ['#FFD200', '#000000'],
  'club-atletico-tigre': ['#E4002B', '#1B3A8C'],
  'quilmes-atletico-club': ['#FFFFFF', '#1B3A8C'],
  'club-ferro-carril-oeste': ['#006437', '#FFFFFF'],
  'club-atletico-chacarita-juniors': ['#E4002B', '#000000'],
  'club-atletico-atlanta': ['#1B3A8C', '#FFD200'],
  'club-atletico-all-boys': ['#000000', '#FFFFFF'],
  'club-atletico-temperley': ['#00A3E0', '#FFFFFF'],
  'club-atletico-nueva-chicago': ['#006437', '#000000'],
  'club-atletico-los-andes': ['#8B1A2B', '#FFFFFF'],
  'club-deportivo-moron': ['#E4002B', '#FFFFFF'],
  'club-almirante-brown': ['#FFD200', '#000000'],
  'club-atletico-san-miguel': ['#006437', '#FFFFFF'],
  'club-atletico-colon': ['#E4002B', '#000000'],
  'club-atletico-patronato': ['#E4002B', '#000000'],
}

/**
 * La estructura de cada país, que es lo que hace que una carrera en Perú no se sienta igual a
 * una en Brasil.
 *
 * `plazas` son los cupos continentales, que salen del ranking de Conmebol: Brasil y Argentina
 * meten seis a la Libertadores y los demás cuatro. Es la razón por la que salir cuarto en
 * Brasil vale más que salir tercero en Paraguay.
 *
 * Formato de la temporada 2026. Cambian seguido —Uruguay y Perú los tocan casi todos los
 * años—, así que van con año para saber contra qué compararlos cuando alguien avise que están
 * viejos.
 */
const TEMPORADA_FORMATOS = 2026
const PAISES = {
  Argentina: {
    copa: 'Copa Argentina', continental: 'sudam', gentilicio: 'argentino',
    plazas: { libertadores: 6, sudamericana: 6 },
  },
  Uruguay: {
    copa: 'Copa Uruguay', continental: 'sudam', gentilicio: 'uruguayo',
    plazas: { libertadores: 4, sudamericana: 4 },
  },
  Chile: {
    copa: 'Copa Chile', continental: 'sudam', gentilicio: 'chileno',
    plazas: { libertadores: 4, sudamericana: 4 },
  },
  Colombia: {
    copa: 'Copa Colombia', continental: 'sudam', gentilicio: 'colombiano',
    plazas: { libertadores: 4, sudamericana: 4 },
  },
  Perú: {
    copa: 'Copa Perú', continental: 'sudam', gentilicio: 'peruano',
    plazas: { libertadores: 4, sudamericana: 4 },
  },
  Paraguay: {
    copa: 'Copa Paraguay', continental: 'sudam', gentilicio: 'paraguayo',
    plazas: { libertadores: 4, sudamericana: 4 },
  },
  Brasil: {
    copa: 'Copa do Brasil', continental: 'sudam', gentilicio: 'brasileño',
    plazas: { libertadores: 6, sudamericana: 6 },
  },
}

/**
 * Cómo se juega cada liga. `formato` decide qué campeonato simula el motor:
 *   'liga'      todos contra todos, campeón el de más puntos
 *   'semestral' Apertura y Clausura, dos campeones por año
 *   'playoff'   fase regular y después llaves, que es donde un sexto puede salir campeón
 *
 * `asciende` y `desciende` son los que cambian de categoría, y son la razón por la que arrancar
 * en la B tiene sentido: se sube peleándola.
 */
const FORMATOS = {
  'ar-2': { equipos: 38, formato: 'playoff', asciende: 2, desciende: 4, nota: 'Dos zonas; sube el campeón de cada una y el reducido da la segunda plaza.' },
  'ar-3': { equipos: 20, formato: 'playoff', asciende: 2, desciende: 2, nota: 'Campeón directo y reducido por la segunda plaza.' },
  'ar-3f': { equipos: 36, formato: 'playoff', asciende: 2, desciende: 4, nota: 'Zonas regionales y llaves finales.' },
  'uy-1': { equipos: 16, formato: 'semestral', asciende: 0, desciende: 2, nota: 'Apertura, Clausura y la Tabla Anual; el campeón uruguayo sale de una final entre esos.' },
  'uy-2': { equipos: 15, formato: 'liga', asciende: 3, desciende: 2 },
  'cl-1': { equipos: 16, formato: 'liga', asciende: 0, desciende: 2, nota: 'Todos contra todos, ida y vuelta.' },
  'cl-2': { equipos: 16, formato: 'liga', asciende: 2, desciende: 2 },
  'co-1': { equipos: 20, formato: 'playoff', asciende: 0, desciende: 1, nota: 'Apertura y Finalización; cada uno cierra con cuadrangulares y final. Se desciende por promedio.' },
  'co-2': { equipos: 18, formato: 'playoff', asciende: 2, desciende: 0 },
  'pe-1': { equipos: 19, formato: 'playoff', asciende: 0, desciende: 3, nota: 'Apertura y Clausura; los dos campeones definen el título en una llave.' },
  'pe-2': { equipos: 16, formato: 'playoff', asciende: 2, desciende: 2 },
  'py-1': { equipos: 12, formato: 'semestral', asciende: 0, desciende: 2, nota: 'Apertura y Clausura, dos campeones por año.' },
  'py-2': { equipos: 16, formato: 'liga', asciende: 2, desciende: 2 },
  'br-1': { equipos: 20, formato: 'liga', asciende: 0, desciende: 4, nota: 'Puntos corridos, ida y vuelta: el campeonato más largo del continente.' },
  'br-2': { equipos: 20, formato: 'liga', asciende: 4, desciende: 4 },
}

const sinAcentos = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const slug = (s) =>
  sinAcentos(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/** Color estable a partir del nombre, para los clubes que no están en la lista de arriba. */
function colorDerivado(nombre) {
  let h = 0
  for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) >>> 0
  // Se saltea la franja 45-70° (amarillo verdoso), que sobre fondo oscuro se lee sucia.
  const tono = h % 315
  const hue = tono < 45 ? tono : tono + 25
  return [`hsl(${hue}, 62%, 42%)`, `hsl(${(hue + 200) % 360}, 55%, 26%)`]
}

/**
 * Nombre corto: "Club Atlético Chacarita Juniors" no entra en una tarjeta.
 *
 * ABREVIA en vez de borrar. La primera versión iba sacando palabras, y así "Universidad de
 * Concepción" y "Deportes Concepción" terminaban llamándose los dos "Concepción", y "Junior de
 * Barranquilla" quedaba en "de Barranquilla". Abreviando, cada club conserva lo que lo
 * distingue y entra igual.
 */
/**
 * Cómo los nombra la gente. Ninguna regla automática va a sacar "Flamengo" de "Clube de Regatas
 * do Flamengo" ni "Peñarol" de "Club Atlético Peñarol": estos van a mano, y son pocos porque
 * solo hacen falta los que alguien reconoce.
 */
const NOMBRE_CORTO = {
  'clube-de-regatas-do-flamengo': 'Flamengo',
  'club-de-regatas-vasco-da-gama': 'Vasco da Gama',
  'sociedade-esportiva-palmeiras': 'Palmeiras',
  'sport-club-corinthians-paulista': 'Corinthians',
  'gremio-foot-ball-porto-alegrense': 'Grêmio',
  'sport-club-internacional': 'Inter de Porto Alegre',
  'clube-atletico-mineiro': 'Atlético Mineiro',
  'cruzeiro-esporte-clube': 'Cruzeiro',
  'botafogo-de-futebol-e-regatas': 'Botafogo',
  'fluminense-football-club': 'Fluminense',
  'santos-futebol-clube': 'Santos',
  'sao-paulo-futebol-clube': 'São Paulo',
  'club-nacional-de-football': 'Nacional',
  'club-atletico-penarol': 'Peñarol',
  'defensor-sporting-club': 'Defensor Sporting',
  'club-atletico-boston-river': 'Boston River',
  'millonarios-futbol-club': 'Millonarios',
  'independiente-santa-fe': 'Santa Fe',
  'junior-de-barranquilla': 'Junior',
  'club-universidad-de-chile': 'Universidad de Chile',
  'club-deportivo-universidad-catolica': 'U. Católica',
  'club-universitario-de-deportes': 'Universitario',
  'club-alianza-lima': 'Alianza Lima',
  'club-cerro-porteno': 'Cerro Porteño',
  'club-atletico-chacarita-juniors': 'Chacarita',
  'club-ferro-carril-oeste': 'Ferro',
  'quilmes-atletico-club': 'Quilmes',
  'club-atletico-nueva-chicago': 'Nueva Chicago',
}

const ABREVIA = [
  [/^Club (Atl[ée]tico|Atlético) /i, 'Atl. '],
  [/^Club Deportivo /i, 'Dep. '],
  [/^(Club|Clube|Sociedade Esportiva|Sport Club|Associação|Asociación|Centro) /i, ''],
  [/\bAtl[ée]tico\b/gi, 'Atl.'],
  [/\bDeportivo\b/gi, 'Dep.'],
  [/\bUniversidad\b/gi, 'U.'],
  [/\bUniversidade\b/gi, 'U.'],
  [/\bInternacional\b/gi, 'Inter'],
  [/\bSporting\b/gi, 'Sp.'],
  [/\b(Futebol|F[úu]tbol|Football|Foot-Ball)\b\s*/gi, ''],
  [/\b(Clube|Club|FC|F\.C\.|SC|AC|CF|EC)\b\s*/gi, ''],
  [/\bEsportiva?\b\s*/gi, ''],
  [/\bRegatas\b/gi, 'Regatas'],
]

function corto(nombre) {
  let n = nombre
  for (const [re, rep] of ABREVIA) {
    if (n.length <= 22) break
    n = n.replace(re, rep).replace(/\s+/g, ' ').trim()
  }
  // Las abreviaturas pueden dejar conectores sueltos ("Botafogo de e Regatas").
  let previo
  do {
    previo = n
    n = n.replace(/\s+(de|del|da|do|dos|das|y|e)\s+(de|del|da|do|dos|das|y|e)\s+/gi, ' $1 ')
      .replace(/\s+(de|del|da|do|dos|das|y|e)$/i, '')
      // Y quitar "Clube" de "Clube de Regatas do Flamengo" deja la preposición al frente.
      .replace(/^(de|del|da|do|dos|das|y|e)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim()
  } while (n !== previo)
  if (!n) n = nombre
  return n.length > 24 ? n.slice(0, 24).trim() : n
}

/**
 * La Primera argentina, que vive en clubs.json con escudos reales y planteles.
 *
 * Entra a la pirámide como una liga más y sin duplicar clubes: sin esto `ligaVecina('ar-2',
 * 'arriba')` no encuentra nada y desde la Primera Nacional no se puede ascender, que es
 * justamente el camino "de pibe del Ascenso a la Liga" que el modo carrera tiene que permitir.
 */
const clubsArg = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'clubs.json'), 'utf8'))
const LIGA_PRIMERA_AR = {
  id: 'ar-1',
  pais: 'Argentina',
  iso: 'AR',
  bandera: '🇦🇷',
  nombre: 'Liga Profesional',
  division: 1,
  copa: PAISES.Argentina.copa,
  continental: 'sudam',
  equipos: 30,
  formato: 'playoff',
  asciende: 0,
  desciende: 2,
  nota: 'Dos zonas y playoffs; se desciende por tabla anual y por promedios.',
  // Los ids son los de clubs.json: los clubes NO se redefinen acá, solo se listan.
  clubIds: clubsArg.filter((c) => c.id !== 'argentina').map((c) => c.id),
}

const ligas = []
const clubesTotales = []

for (const l of crudo.ligas) {
  const coef = COEF_PAIS[l.pais] ?? 0.8
  const { piso, techo } = RANGO_DIVISION[l.division] ?? RANGO_DIVISION[3]
  // Los títulos se normalizan DENTRO de la liga: no se comparan los 11 de Palmeiras contra los
  // 10 de Nacional, que se ganaron en campeonatos distintos.
  const maxTitulos = Math.max(1, ...l.clubes.map((c) => c.titulos))

  // La antigüedad rompe el empate. Sin esto, en la Segunda uruguaya once de trece clubes
  // quedaban con la misma fuerza —ninguno tiene títulos de esa liga en Wikidata— y la categoría
  // se veía como una lista de clones. Un club de 1900 no es lo mismo que uno de 1990.
  const años = l.clubes.map((c) => c.fundado).filter(Boolean)
  const masViejo = Math.min(...años, 1900)
  const masNuevo = Math.max(...años, masViejo + 1)

  const clubes = l.clubes.map((c) => {
    const id = slug(c.nombre)
    const nombreCorto = NOMBRE_CORTO[id] ?? corto(c.nombre)
    // Raíz cuadrada: el salto de 0 a 1 título importa más que el de 10 a 11.
    const pesoTitulos = Math.sqrt(c.titulos / maxTitulos)
    const pesoEdad = c.fundado ? 1 - (c.fundado - masViejo) / (masNuevo - masViejo) : 0.35
    // Los títulos mandan; la antigüedad solo desempata.
    const peso = pesoTitulos * 0.78 + pesoEdad * 0.22
    const fuerza = Math.round((piso + (techo - piso) * peso) * coef + (1 - coef) * 55)
    return {
      id,
      qid: c.qid,
      nombre: c.nombre,
      corto: nombreCorto,
      ciudad: c.ciudad,
      estadio: c.estadio,
      fundado: c.fundado,
      titulos: c.titulos,
      fuerza,
      colores: COLORES[id] ?? colorDerivado(c.nombre),
      ligaId: l.id,
      pais: l.pais,
      bandera: l.bandera,
      division: l.division,
    }
  })

  ligas.push({
    id: l.id,
    pais: l.pais,
    iso: l.iso,
    bandera: l.bandera,
    nombre: l.nombre,
    division: l.division,
    copa: PAISES[l.pais]?.copa ?? '',
    continental: PAISES[l.pais]?.continental ?? 'sudam',
    ...(FORMATOS[l.id] ?? { formato: 'liga', asciende: 0, desciende: 2 }),
    clubIds: clubes.map((c) => c.id),
  })
  clubesTotales.push(...clubes)
}

// Un mismo club puede figurar en dos divisiones (ascendió y Wikidata tiene las dos): gana la
// división más alta, que es donde está hoy.
const porId = new Map()
for (const c of clubesTotales) {
  const previo = porId.get(c.id)
  if (!previo || c.division < previo.division) porId.set(c.id, c)
}
const clubes = [...porId.values()]

// Y las ligas apuntan solo a los clubes que sobrevivieron a esa poda.
for (const l of ligas) l.clubIds = l.clubIds.filter((id) => porId.get(id)?.ligaId === l.id)

// La Primera argentina se suma al final: sus clubes ya existen en clubs.json y no se tocan.
ligas.push(LIGA_PRIMERA_AR)

// Dos clubes con el mismo nombre corto en la misma liga son indistinguibles en la pantalla de
// elección: "Cerro Porteño" y "Cerro Porteño" no le dicen a nadie cuál es cuál. Se desempata
// con la ciudad, que es como los distingue un hincha.
const porLigaYCorto = new Map()
for (const c of clubes) {
  const k = `${c.ligaId}|${c.corto}`
  if (!porLigaYCorto.has(k)) porLigaYCorto.set(k, [])
  porLigaYCorto.get(k).push(c)
}
for (const grupo of porLigaYCorto.values()) {
  if (grupo.length < 2) continue
  for (const c of grupo) {
    if (!c.ciudad) continue
    const cand = `${c.corto} (${c.ciudad})`
    if (cand.length <= 26) c.corto = cand
  }
}

const paises = [...new Set(ligas.map((l) => l.pais))].map((p) => ({
  nombre: p,
  bandera: ligas.find((l) => l.pais === p).bandera,
  iso: ligas.find((l) => l.pais === p).iso,
  ...PAISES[p],
  ligaIds: ligas.filter((l) => l.pais === p).sort((a, b) => a.division - b.division).map((l) => l.id),
}))

fs.mkdirSync(path.dirname(SALIDA), { recursive: true })
fs.writeFileSync(
  SALIDA,
  JSON.stringify({ generado: crudo.generado, temporadaFormatos: TEMPORADA_FORMATOS, paises, ligas, clubes }, null, 1),
)

console.log(`${paises.length} países · ${ligas.length} ligas · ${clubes.length} clubes → data/derived/ligas.json`)
for (const p of paises) {
  const n = clubes.filter((c) => c.pais === p.nombre).length
  console.log(`  ${p.bandera} ${p.nombre.padEnd(10)} ${String(n).padStart(3)} clubes · ${p.ligaIds.length} divisiones · ${p.copa}`)
}
const dup = clubesTotales.length - clubes.length
if (dup) console.log(`\n${dup} clubes estaban en dos divisiones: se quedó la más alta.`)
