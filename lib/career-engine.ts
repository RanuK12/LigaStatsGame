import clubsData from '@/data/clubs.json'
import ligasData from '@/data/derived/ligas.json'
import creditosEscudos from '@/public/logos/carrera/CREDITOS.json'
import { CONTINENTAL_CLUBS } from './copa-libertadores'
import { simularMundial, resumenMundial, type WorldCupRun } from './world-cup'

/**
 * Single-player career simulation engine.
 * Inspired by Copero.com.ar's career simulator with interactive decision dilemmas,
 * national team call-ups, transfer negotiations, and 3D jersey card statistics.
 */

export type PositionCategory = 'GK' | 'DEF' | 'MID' | 'ATT'

export interface PositionOption {
  code: string
  label: string
  category: PositionCategory
}

export const POSITIONS: PositionOption[] = [
  { code: 'GK', label: 'Arquero', category: 'GK' },
  { code: 'CB', label: 'Defensor Central', category: 'DEF' },
  { code: 'LB', label: 'Lateral Izquierdo', category: 'DEF' },
  { code: 'RB', label: 'Lateral Derecho', category: 'DEF' },
  { code: 'CDM', label: 'Volante Central', category: 'MID' },
  { code: 'CM', label: 'Mediocampista', category: 'MID' },
  { code: 'CAM', label: 'Enganche', category: 'MID' },
  { code: 'LW', label: 'Extremo Izquierdo', category: 'ATT' },
  { code: 'RW', label: 'Extremo Derecho', category: 'ATT' },
  { code: 'CF', label: 'Segunda Punta', category: 'ATT' },
  { code: 'ST', label: 'Delantero Centro', category: 'ATT' },
]

export function positionCategory(code: string): PositionCategory {
  return POSITIONS.find((p) => p.code === code)?.category ?? 'MID'
}

export type Region = 'arg' | 'sudam' | 'euro'
export type ContinentalComp = 'libertadores' | 'sudamericana' | 'champions' | 'europa'

export interface CareerClub {
  id: string
  name: string
  /** El nombre completo, para las pantallas donde entra ("Club Atlético Chacarita Juniors"). */
  nombreLargo?: string
  strength: number
  continental: boolean
  region: Region
  flag?: string
  colors?: string[]
  /** Solo los clubes de data/derived/ligas.json: sin esto no hay ascenso ni descenso. */
  ligaId?: string
  division?: number
  pais?: string
  ciudad?: string
  escudo?: string
}

/** Una liga jugable: la estructura del campeonato, no solo su nombre. */
export interface Liga {
  id: string
  pais: string
  iso: string
  bandera: string
  nombre: string
  division: number
  copa: string
  continental: string
  equipos: number
  formato: 'liga' | 'semestral' | 'playoff'
  asciende: number
  desciende: number
  nota?: string
  clubIds: string[]
}

export interface PaisCarrera {
  nombre: string
  bandera: string
  iso: string
  copa: string
  continental: string
  gentilicio: string
  plazas: { libertadores: number; sudamericana: number }
  ligaIds: string[]
}

/** Argentine clubs from clubs.json, excluding the national team entry. */
export const ARG_CLUBS: CareerClub[] = (clubsData as any[])
  .filter((c) => c.id !== 'argentina')
  .map((c) => ({
    id: c.id,
    name: c.name,
    strength: argClubStrength(c.titles ?? 0, c.Libertadores ?? 0, c.id),
    continental: false,
    region: 'arg' as Region,
    colors: c.colors,
    // La Primera argentina es el techo de su pirámide: sin esto, un club de acá no puede
    // descender y el ascenso desde la Primera Nacional no lleva a ningún lado.
    ligaId: 'ar-1',
    division: 1,
    pais: 'Argentina',
  }))

export const SUDAM_CLUBS: CareerClub[] = CONTINENTAL_CLUBS.filter(
  (c) => !ARG_CLUBS.some((a) => a.id === c.id),
).map((c) => ({
  id: c.id,
  name: c.name,
  strength: c.nivel,
  continental: true,
  region: 'sudam' as Region,
  // El país venía en el dato y se perdía en este map. Sin él, Peñarol y Colo-Colo eran clubes
  // sin nacionalidad: un uruguayo no podía ser buscado por el club de su país porque el motor
  // no sabía que Peñarol era uruguayo.
  pais: c.country,
  flag: c.flag,
  colors: c.colors,
}))

export const EURO_CLUBS: CareerClub[] = [
  { id: 'real-madrid', name: 'Real Madrid', strength: 90, continental: true, region: 'euro', flag: '🇪🇸', escudo: '/logos/clubs/real-madrid.png' },
  { id: 'fc-barcelona', name: 'FC Barcelona', strength: 88, continental: true, region: 'euro', flag: '🇪🇸', escudo: '/logos/clubs/fc-barcelona.png' },
  { id: 'manchester-city', name: 'Manchester City', strength: 90, continental: true, region: 'euro', flag: '🏴', escudo: '/logos/clubs/manchester-city.png' },
  { id: 'arsenal', name: 'Arsenal FC', strength: 87, continental: true, region: 'euro', flag: '🏴', escudo: '/logos/clubs/arsenal.png' },
  { id: 'liverpool', name: 'Liverpool FC', strength: 88, continental: true, region: 'euro', flag: '🏴', escudo: '/logos/clubs/liverpool.png' },
  { id: 'bayern-munich', name: 'Bayern Múnich', strength: 89, continental: true, region: 'euro', flag: '🇩🇪', escudo: '/logos/clubs/bayern-munich.png' },
  { id: 'bayer-leverkusen', name: 'Bayer Leverkusen', strength: 86, continental: true, region: 'euro', flag: '🇩🇪', escudo: '/logos/ligas/bayer-leverkusen.svg' },
  { id: 'paris-saint-germain', name: 'Paris Saint-Germain', strength: 87, continental: true, region: 'euro', flag: '🇫🇷', escudo: '/logos/clubs/paris-saint-germain.png' },
  { id: 'inter-milan', name: 'Inter de Milán', strength: 86, continental: true, region: 'euro', flag: '🇮🇹', escudo: '/logos/clubs/inter-milan.png' },
  { id: 'ac-milan', name: 'AC Milán', strength: 85, continental: true, region: 'euro', flag: '🇮🇹', escudo: '/logos/ligas/ac-milan.svg' },
  { id: 'juventus', name: 'Juventus', strength: 84, continental: true, region: 'euro', flag: '🇮🇹', escudo: '/logos/clubs/juventus.png' },
  { id: 'napoli', name: 'SSC Napoli', strength: 84, continental: true, region: 'euro', flag: '🇮🇹', escudo: '/logos/ligas/napoli.svg' },
  { id: 'manchester-united', name: 'Manchester United', strength: 83, continental: true, region: 'euro', flag: '🏴', escudo: '/logos/clubs/manchester-united.png' },
  { id: 'atletico-madrid', name: 'Atlético Madrid', strength: 85, continental: true, region: 'euro', flag: '🇪🇸', escudo: '/logos/clubs/atletico-madrid.png' },
  { id: 'chelsea', name: 'Chelsea FC', strength: 83, continental: true, region: 'euro', flag: '🏴', escudo: '/logos/clubs/chelsea.png' },
  { id: 'tottenham-hotspur', name: 'Tottenham Hotspur', strength: 83, continental: true, region: 'euro', flag: '🏴', escudo: '/logos/ligas/tottenham-hotspur.svg' },
  { id: 'borussia-dortmund', name: 'Borussia Dortmund', strength: 83, continental: true, region: 'euro', flag: '🇩🇪', escudo: '/logos/clubs/borussia-dortmund.png' },
  { id: 'benfica', name: 'SL Benfica', strength: 82, continental: true, region: 'euro', flag: '🇵🇹', escudo: '/logos/ligas/benfica.svg' },
  { id: 'sporting-cp', name: 'Sporting CP', strength: 82, continental: true, region: 'euro', flag: '🇵🇹', escudo: '/logos/ligas/sporting-cp.svg' },
  { id: 'porto', name: 'FC Porto', strength: 81, continental: true, region: 'euro', flag: '🇵🇹', escudo: '/logos/ligas/porto.svg' },
  { id: 'ajax', name: 'AFC Ajax', strength: 81, continental: true, region: 'euro', flag: '🇳🇱', escudo: '/logos/ligas/ajax.svg' },
  { id: 'psv-eindhoven', name: 'PSV Eindhoven', strength: 81, continental: true, region: 'euro', flag: '🇳🇱', escudo: '/logos/ligas/psv-eindhoven.svg' },
  { id: 'villarreal', name: 'Villarreal CF', strength: 81, continental: true, region: 'euro', flag: '🇪🇸', escudo: '/logos/ligas/villarreal.svg' },
  { id: 'sevilla-fc', name: 'Sevilla FC', strength: 80, continental: true, region: 'euro', flag: '🇪🇸', escudo: '/logos/ligas/sevilla-fc.svg' },
]

/**
 * Los 414 clubes del ascenso argentino y de las ligas de Uruguay, Chile, Colombia, Perú,
 * Paraguay y Brasil (data/derived/ligas.json, generado desde Wikidata).
 *
 * Traen su liga y su división a cuestas porque el modo carrera las necesita: sin división no hay
 * ascenso, y sin ascenso arrancar en la B no significa nada.
 */
/**
 * Los clubes que tienen escudo REAL.
 *
 * Se bajan de Wikimedia Commons y solo los que la propia API declara con licencia libre
 * (dominio público, CC0 o CC BY-SA): `node scripts/data/fetch-crests-commons.mjs`. Los créditos
 * de cada uno quedan en public/logos/carrera/CREDITOS.json.
 *
 * Los que no tienen quedan con el escudo generado, que lleva las franjas del club.
 */
const ESCUDOS_REALES = new Set(Object.keys(creditosEscudos))

export const LIGA_CLUBS: CareerClub[] = (ligasData.clubes as any[])
  // Los que ya están en clubs.json con escudo real y plantel ganan: no se duplican.
  .filter((c) => !ARG_CLUBS.some((a) => a.id === c.id) && !SUDAM_CLUBS.some((s) => s.id === c.id))
  .map((c) => ({
    id: c.id,
    name: c.corto || c.nombre,
    nombreLargo: c.nombre,
    strength: c.fuerza,
    continental: c.division === 1,
    region: (c.pais === 'Argentina' ? 'arg' : 'sudam') as Region,
    flag: c.bandera,
    colors: c.colores,
    ligaId: c.ligaId,
    division: c.division,
    pais: c.pais,
    ciudad: c.ciudad,
    // El escudo real si lo tenemos (bajado de Wikimedia Commons con licencia libre) y el
    // generado si no. La lista de cuáles hay se arma en el build, así que no hay que
    // sincronizar nada a mano.
    escudo: c.escudo || (ESCUDOS_REALES.has(c.id) ? `/logos/carrera/${c.id}.png` : `/logos/ligas/${c.id}.svg`),
  }))

export const LIGAS = ligasData.ligas as Liga[]
export const PAISES_CARRERA = ligasData.paises as PaisCarrera[]

const rawClubs = [...ARG_CLUBS, ...SUDAM_CLUBS, ...EURO_CLUBS, ...LIGA_CLUBS]
const mapClubs = new Map<string, CareerClub>()
for (const c of rawClubs) {
  if (!mapClubs.has(c.id)) mapClubs.set(c.id, c)
}
export const ALL_CLUBS: CareerClub[] = [...mapClubs.values()]

const CLUB_POR_ID = mapClubs

export function findClub(id: string): CareerClub | undefined {
  // Un Map y no un find(): con 12 clubes daba igual, con 470 esto corre en cada temporada
  // simulada, dentro del lazo de ofertas y del de rivales.
  return CLUB_POR_ID.get(id)
}

/**
 * Los clubes de una liga, de más fuerte a más débil.
 *
 * Mira ALL_CLUBS y no solo los generados: la Primera argentina vive en clubs.json, así que
 * filtrar únicamente LIGA_CLUBS la dejaba vacía y el ascenso no llevaba a ninguna parte.
 */
export function clubesDeLiga(ligaId: string): CareerClub[] {
  return ALL_CLUBS.filter((c) => c.ligaId === ligaId).sort((a, b) => b.strength - a.strength)
}

export function findLiga(id: string): Liga | undefined {
  return LIGAS.find((l) => l.id === id)
}

/**
 * El nivel de una liga, de 0 a 100.
 *
 * Es lo que hace que elegir dónde arrancar signifique algo: la Série A brasileña y el Torneo
 * Federal A no pueden verse igual en la pantalla. Sale de la fuerza media de sus clubes, que ya
 * trae adentro el coeficiente de país y la división.
 */
function mediaDeLiga(ligaId: string): number {
  const c = clubesDeLiga(ligaId)
  if (!c.length) return 0
  // Los diez mejores pesan doble: el nivel de una liga lo marcan sus grandes, no el promedio
  // con los veinte clubes de relleno que Wikidata trae de temporadas viejas.
  const orden = [...c].sort((a, b) => b.strength - a.strength)
  const top = orden.slice(0, 10)
  const mediaTop = top.reduce((a, x) => a + x.strength, 0) / top.length
  const mediaTodos = c.reduce((a, x) => a + x.strength, 0) / c.length
  return mediaTop * 0.66 + mediaTodos * 0.34
}

const NIVEL_CACHE = new Map<string, number>()
export function nivelDeLiga(ligaId: string): number {
  const guardado = NIVEL_CACHE.get(ligaId)
  if (guardado !== undefined) return guardado
  // La escala se estira contra el rango REAL de las ligas cargadas, no contra números escritos
  // a mano: con un piso y un techo fijos todo quedaba apretado entre 5 y 59, y la Primera
  // argentina —que es de las mejores del continente— aparecía como "Media".
  const medias = LIGAS.map((l) => mediaDeLiga(l.id)).filter((m) => m > 0)
  const piso = Math.min(...medias)
  const techo = Math.max(...medias)
  const mia = mediaDeLiga(ligaId)
  const rango = Math.max(techo - piso, 1)
  const n = mia > 0 ? Math.round(clamp(8 + ((mia - piso) / rango) * 92, 5, 100)) : 0
  NIVEL_CACHE.set(ligaId, n)
  return n
}

/** Cómo se llama ese nivel, para no mostrar solo un número. */
export function etiquetaDeNivel(nivel: number): string {
  if (nivel >= 85) return 'Elite'
  if (nivel >= 65) return 'Alta'
  if (nivel >= 45) return 'Media'
  if (nivel >= 25) return 'Baja'
  return 'Amateur'
}

/**
 * La liga de arriba y la de abajo, que es lo que hace posible el ascenso y el descenso.
 * `null` cuando no hay: de la Primera de Brasil no se sube, y de la C no se baja.
 */
export function ligaVecina(ligaId: string, direccion: 'arriba' | 'abajo'): Liga | undefined {
  const liga = findLiga(ligaId)
  if (!liga) return undefined
  const objetivo = direccion === 'arriba' ? liga.division - 1 : liga.division + 1
  // En Argentina la tercera son dos torneos en paralelo (Metro y Federal): se sube al de la
  // misma división y se baja al que corresponde por región, que acá es el primero que haya.
  return LIGAS.find((l) => l.pais === liga.pais && l.division === objetivo)
}

function argClubStrength(titles: number, libertadores: number, id: string): number {
  const cont = CONTINENTAL_CLUBS.find((c) => c.id === id)
  if (cont) return cont.nivel
  return clamp(Math.round(64 + titles * 0.4 + libertadores * 1.5), 64, 82)
}

// ---------- Career decision dilemmas ----------

export interface CareerDecision {
  id: string
  title: string
  description: string
  options: {
    id: string
    label: string
    effectDescription: string
    ovrDelta?: number
    goalBonus?: number
    assistBonus?: number
    titleBonus?: number
  }[]
}

/**
 * Cómo se le describe el efecto de una decisión según el puesto: prometerle goles a un
 * arquero (o a un central) no tiene sentido — su premio son las vallas invictas.
 */
export function effectLabelFor(effectDescription: string, position: string): string {
  const cat = positionCategory(position)
  if (cat === 'GK') {
    if (effectDescription.includes('Goles')) return '+Vallas invictas'
    if (effectDescription.includes('Asistencias')) return '+Seguridad bajo los tres palos'
  }
  if (cat === 'DEF') {
    if (effectDescription.includes('Goles')) return '+Goles de pelota parada'
    if (effectDescription.includes('Asistencias')) return '+Vallas invictas'
  }
  return effectDescription
}

export const CAREER_DILEMMAS: CareerDecision[] = [
  {
    id: 'preseason_training',
    title: 'Enfoque de Pretemporada',
    description: 'El cuerpo técnico te da a elegir tu plano de desarrollo para los próximos meses.',
    options: [
      { id: 'train_finishing', label: '🎯 Potencia & Definición', effectDescription: '+Goles esta temporada', goalBonus: 4 },
      { id: 'train_vision', label: '🧠 Visión & Pase Filtrado', effectDescription: '+Asistencias esta temporada', assistBonus: 4 },
      { id: 'train_physique', label: '💪 Trabajo Físico & Resistencia', effectDescription: '+1 OVR permanente', ovrDelta: 1 },
    ],
  },
  {
    id: 'injury_dilemma',
    title: 'Dilema de Lesión en Cuartos de Final',
    description: 'Sientes un pinchazo muscular antes del cruce decisivo. ¿Arriesgas o te cuidas?',
    options: [
      { id: 'play_injured', label: '🔥 Jugar con Infiltración', effectDescription: '+Chances de título, pero riesgo físico', titleBonus: 0.15 },
      { id: 'rest_patiently', label: '🧊 Cuidarse y Recuperar', effectDescription: 'Preserva OVR sin riesgo de lesión', ovrDelta: 1 },
    ],
  },
  {
    id: 'captaincy',
    title: 'Capitanía & Liderazgo',
    description: 'El entrenador te propone ser el referente y portar la cinta de capitán.',
    options: [
      { id: 'accept_captain', label: '👑 Aceptar la Cinta de Capitán', effectDescription: '+1 OVR de Liderazgo', ovrDelta: 1 },
      { id: 'focus_play', label: '⚡ Enfocarse sólo en jugar', effectDescription: '+2 Goles de rendimiento', goalBonus: 2 },
    ],
  },
  {
    id: 'position_change',
    title: 'El DT te pide cambiar de posición',
    description: 'El entrenador ve que podés rendir en otra zona de la cancha. ¿Te adaptás?',
    options: [
      { id: 'adapt_position', label: '🧠 Adaptarme y aprender', effectDescription: '+1 OVR de versatilidad', ovrDelta: 1 },
      { id: 'refuse_position', label: '📌 Quedarme en lo mío', effectDescription: '+Goles en tu posición', goalBonus: 2 },
    ],
  },
  {
    id: 'mentor',
    title: 'Un juvenil te pide una mano',
    description: 'Una joya de las inferiores te ve como referente. ¿Lo guiás o te enfocás en vos?',
    options: [
      { id: 'mentor_youth', label: '🤝 Ser su mentor', effectDescription: '+1 OVR de liderazgo', ovrDelta: 1 },
      { id: 'focus_self', label: '🎯 Enfocarme en mí', effectDescription: '+Goles esta temporada', goalBonus: 2 },
    ],
  },
  {
    id: 'renewal',
    title: 'El club te ofrece renovar',
    description: 'Te ponen un contrato largo sobre la mesa. ¿Firmás por lealtad o empujás para salir?',
    options: [
      { id: 'renew_loyalty', label: '✍️ Renovar y ganarme al hincha', effectDescription: '+1 OVR de confianza', ovrDelta: 1 },
      { id: 'push_transfer', label: '🧳 Empujar una transferencia', effectDescription: '+Chances de ofertas', titleBonus: 0 },
    ],
  },
  {
    id: 'media',
    title: 'Se te viene la prensa encima',
    description: 'Una polémica en las redes te tiene en el ojo de la tormenta. ¿Cómo lo manejás?',
    options: [
      { id: 'focus_football', label: '🎧 Aislarme y jugar', effectDescription: '+Chances de título', titleBonus: 0.1 },
      { id: 'take_sponsor', label: '💸 Aprovechar y firmar un sponsor', effectDescription: 'Plata extra, sin impacto deportivo' },
    ],
  },
  {
    id: 'workload',
    title: 'Doble turno o descanso',
    description: 'El preparador físico te ofrece intensificar. ¿Doble sesión o cuidar el cuerpo?',
    options: [
      { id: 'double_session', label: '🔥 Doble sesión', effectDescription: '+1 OVR permanente', ovrDelta: 1 },
      { id: 'balanced_train', label: '🧘 Entrenamiento equilibrado', effectDescription: '+Asistencias', assistBonus: 2 },
    ],
  },
  {
    id: 'vestuario',
    title: 'Vestuario: liderazgo o sociedad',
    description: 'El grupo está dividido. ¿Tomás las riendas o armás sociedad con la figura del equipo?',
    options: [
      { id: 'team_leader', label: '🗣️ Poner orden en el grupo', effectDescription: '+Chances de título', titleBonus: 0.1 },
      { id: 'link_up', label: '🤝 Sociedad con el crack', effectDescription: '+Asistencias', assistBonus: 2 },
    ],
  },
]

// Sustancia misteriosa: disponible TODA temporada (el truco es consumirla siempre).
export const SUBSTANCE_DECISION: CareerDecision = {
  id: 'substance',
  title: 'Sustancia Misteriosa 🧪',
  description: 'El utilero te ofrece la famosa sustancia misteriosa. Riesgo y recompensa.',
  options: [
    { id: 'take_substance', label: '🧪 Consumir', effectDescription: '75% de chance de +5 OVR permanente' },
    { id: 'skip_substance', label: '🚱 No arriesgar', effectDescription: 'Sin efecto ni riesgo' },
  ],
}

// Evento barrabravas: aparece cuando la temporada anterior en Argentina fue floja.
export const BARRABRAVAS_DECISION: CareerDecision = {
  id: 'barrabravas',
  title: 'Te apretaron los barrabravas 😰',
  description: 'Tras una temporada floja, la barra te fue a apretar al vestuario. ¿Qué hacés?',
  options: [
    { id: 'barra_rescind', label: '🚪 Rescindir contrato', effectDescription: 'Salís del quilombo, pero perdés valor y 2 OVR' },
    { id: 'barra_stay', label: '💪 Bancar y demostrar', effectDescription: 'Si la rompés, salto a un grande de Europa' },
  ],
}

// Interés de la cantera al arrancar: a mayor OVR inicial, más y mejores clubes te buscan (preferencia de su país).
export function academyInterest(ovr: number, seed: number, nationality?: string): CareerClub[] {
  const rng = makeRng(seed >>> 0 || 1)
  const n = ovr >= 74 ? 4 : ovr >= 68 ? 3 : 2
  const pool = nationality
    ? ALL_CLUBS.filter((c) => c.pais === nationality)
    : []
  const usablePool = pool.length >= 2 ? pool : ALL_CLUBS.filter((c) => c.region === "arg")
  return [...usablePool].sort(() => rng() - 0.5).slice(0, n)
}

// Carreras de leyenda (modo debug). Valores de arranque aproximados, no oficiales.
export interface LegendPreset {
  name: string
  number: number
  position: string
  nationality: string
  flag: string
  ovr: number
  age: number
  clubId: string
}
export const LEGEND_CAREERS: Record<string, LegendPreset> = {
  messi: { name: 'Lionel Messi', number: 10, position: 'RW', nationality: 'Argentina', flag: '🇦🇷', ovr: 74, age: 17, clubId: 'newells' },
  maradona: { name: 'Diego Maradona', number: 10, position: 'CAM', nationality: 'Argentina', flag: '🇦🇷', ovr: 75, age: 16, clubId: 'argentinos-jrs' },
}

// Historias de retiro: 130+ variantes que rotan. {n}=nombre, {c}=último club. El nivel de
// la carrera cambia el pool base (gloria para leyendas, humilde para el montón) y las
// UNIVERSALES agregan giros WOW o caídas (adicciones, estafa piramidal, imperio de comida)
// que pueden tocarle a cualquiera. Es el gag para viralizar.
const RETIRE_UNIVERSAL = [
  '{n} formó una familia enorme, se alejó de los flashes y hoy vive tranquilo en el campo.',
  '{n} cayó en las adicciones, tocó fondo y hoy da charlas de recuperación que llenan estadios.',
  '{n} metió toda su plata en una estafa piramidal y lo perdió todo. Volvió a empezar de cero.',
  '{n} abrió una cadena de comida rápida y se hizo diez veces más rico que jugando.',
  '{n} se aisló del mundo, se compró una isla y no atiende el teléfono desde entonces.',
  '{n} se metió en las cripto, lo rugpullearon y hoy vende sus medallas por Marketplace.',
  '{n} se hizo influencer fitness y tiene más seguidores que cuando jugaba.',
  '{n} puso un boliche que se volvió el más top del país. La joda nunca termina.',
  '{n} se recibió de abogado a los 40 y hoy defiende a otros jugadores.',
  '{n} montó una bodega de vinos y su etiqueta ya gana premios internacionales.',
  '{n} entró en política, prometió mucho y no cumplió nada. Clásico.',
  '{n} se hizo youtuber de reacciones y factura más que en su mejor contrato.',
  '{n} apostó todo al casino una noche y salió sin nada. Hoy labura de lo que puede.',
  '{n} abrió una escuelita de fútbol gratuita para pibes de bajos recursos. Un fenómeno.',
  '{n} se hizo pastor y hoy predica en canchas llenas.',
  '{n} se compró una estancia, cría vacas y jura que es más feliz que nunca.',
  '{n} se separó, se fundió en la división de bienes y arrancó de nuevo con un food truck.',
  '{n} escribió su autobiografía, fue best-seller y ahora la están por hacer serie.',
  '{n} invirtió en el boom del pádel, la pegó y hoy tiene treinta canchas.',
  '{n} desapareció del mapa. Algunos dicen que lo vieron pescando en el sur.',
  '{n} abrió una parrilla que se hizo viral en las redes: hay tres horas de cola.',
  '{n} donó casi toda su fortuna y hoy dirige una fundación enorme.',
  '{n} se metió en un quilombo judicial por evasión y estuvo cerca de perder todo.',
  '{n} se hizo actor, hizo una novela y no lo hizo nada mal.',
  '{n} se compró un club de la B y quiere subirlo a Primera sí o sí.',
  '{n} se hizo DJ, gira por Ibiza y ya nadie se acuerda que jugaba.',
  '{n} tuvo mellizos, se dedicó a la familia y baja fotos zen desde el jardín.',
  '{n} se volvió monje, dejó todo lo material y hoy vive en las montañas.',
  '{n} la pegó con una app de fútbol amateur que usan millones.',
  '{n} se metió a vender autos de lujo y resultó el mejor vendedor del país.',
]
const RETIRE_LEGEND = [
  '{n} se retiró como ídolo eterno. Le hicieron una estatua afuera de la cancha de {c}.',
  '{n} colgó los botines y agarró la Selección. El país entero sueña con él.',
  '{n} es dueño de {c} y lo maneja como un imperio. Nadie discute su palabra.',
  'Hicieron una película sobre {n} y arrasó en los cines de todo el mundo.',
  '{n} se hizo senador con más votos que nadie. Del potrero al Congreso.',
  '{n} montó un imperio gastronómico global. Hoy es diez veces más rico que jugando.',
  '{n} es embajador del fútbol mundial y viaja por el planeta dando cátedra.',
  '{n} compró tres clubes en tres países y armó su propio multiclub.',
  '{n} dirige la Selección y ya la metió en otra final. La historia continúa.',
  '{n} tiene su propia marca deportiva que le compite a las grandes.',
  '{n} abrió un museo con todos sus títulos: visita obligada para los turistas.',
  'Netflix hizo una serie sobre {n} y batió récords de reproducciones.',
  '{n} donó un hospital entero a su ciudad. Lo bautizaron con su nombre.',
  'Le pusieron el nombre de {n} a una calle y hasta a un aeropuerto.',
  '{n} maneja una fundación que saca pibes de la calle a través del fútbol.',
  '{n} es la cara de una campaña mundial y factura millones solo con su imagen.',
  '{n} armó una academia de élite que ya exporta cracks a Europa.',
  'Pese a toda la gloria, {n} lo perdió casi todo en un mal negocio... y se volvió a levantar.',
  '{n} escribió el libro más vendido del año contando su carrera de leyenda.',
  '{n} se retiró en la cima y el mundo del fútbol se paró a aplaudirlo.',
  '{n} se convirtió en el presidente más querido de {c}: reelecto sin oposición.',
  '{n} es comentarista estrella y su palabra mueve el mercado de pases.',
  'Declararon feriado en su ciudad el día que {n} se retiró.',
  '{n} es mentor de las próximas estrellas: todos quieren aprender del maestro.',
  '{n} inauguró un estadio con su nombre, financiado enteramente por él.',
]
const RETIRE_CRACK = [
  '{n} se retiró como gran figura y hoy es ayudante técnico camino a ser DT.',
  '{n} montó una escuela de fútbol que ya llena tres sedes.',
  '{n} lanzó su marca de botines y explota en ventas.',
  '{n} se metió en la dirigencia de {c} y pelea la presidencia.',
  '{n} es panelista estrella y arma quilombo cada domingo.',
  '{n} invirtió bien y hoy vive de sus rentas, tranquilo y feliz.',
  '{n} abrió una cadena de gimnasios que se expandió a todo el país.',
  '{n} se hizo representante de jugadores y maneja varias joyitas.',
  '{n} tuvo su momento de gloria pero se enredó en malas juntas y se fundió.',
  '{n} dirige las inferiores de {c} y ya sacó dos cracks.',
  '{n} se hizo influencer y monetiza cada jugada de su carrera.',
  '{n} puso un complejo de fútbol 5 que nunca está vacío.',
  '{n} se recibió de kinesiólogo y hoy recupera a los que fueron sus rivales.',
  '{n} probó suerte en la música, sacó un tema y sorprendió a todos.',
  '{n} tuvo problemas con el juego pero se recuperó y hoy ayuda a otros.',
  '{n} abrió un restó temático de su carrera y es furor entre los hinchas.',
  '{n} se metió a comentar en la radio y su voz ya es un clásico.',
  '{n} se hizo DT y lo contrató un club del exterior.',
  '{n} lanzó una línea de ropa urbana que la rompe.',
  '{n} se metió en cripto, la pegó justo y salió a tiempo.',
  '{n} fue figura, pero una lesión mal curada lo bajó antes de tiempo. Igual dejó huella.',
  '{n} organiza torneos benéficos que juntan a las viejas glorias.',
  '{n} se retiró querido por todos y hoy da charlas motivacionales.',
  '{n} armó una app de scouting que usan clubes de medio mundo.',
  '{n} vive entre el campo y la ciudad, disfrutando todo lo que ganó.',
]
const RETIRE_SOLID = [
  '{n} abrió un restaurante que se llenó de hinchas, camisetas y anécdotas.',
  '{n} dirige inferiores en un club de ascenso, formando pibes con humildad.',
  '{n} se metió en negocios inmobiliarios y le fue bárbaro.',
  '{n} se hizo relator de radio: su voz narra los goles de otros.',
  '{n} puso una cancha de fútbol 5 y organiza el torneo del barrio.',
  '{n} sorprendió a todos: abrió una hamburguesería viral y se hizo millonario.',
  '{n} se metió en el juego y las apuestas y la pasó mal un tiempo.',
  '{n} se recibió de profe de educación física y da clases en su barrio.',
  '{n} montó un lavadero de autos que ya tiene tres sucursales.',
  '{n} se hizo youtuber de fútbol y de a poco creció un montón.',
  '{n} abrió una distribuidora y dejó el fútbol atrás sin dramas.',
  '{n} se aisló en el sur, pesca y no quiere saber nada de flashes.',
  '{n} invirtió en un food truck de choripán y no para de vender.',
  '{n} tuvo un problema de adicciones pero salió adelante y hoy lo cuenta sin filtros.',
  '{n} se volvió al pueblo, puso un almacén y es el ídolo de la cuadra.',
  '{n} se metió a vender seguros y resultó un fenómeno de las ventas.',
  '{n} montó una escuelita de arqueros única en la zona.',
  '{n} abrió un bar deportivo donde pasan sus mejores partidos en loop.',
  '{n} la pegó con una app y se reinventó como emprendedor.',
  '{n} se dedicó a criar a sus hijos y baja fotos felices del asado.',
  '{n} intentó un negocio que fracasó, pero se levantó con un kiosco que la rompe.',
  '{n} se hizo taxista de día y técnico de baby fútbol de noche.',
  '{n} probó ser DT amateur y le tomó el gusto.',
  '{n} formó su familia, se compró una casa y vive una vida simple y feliz.',
  '{n} se metió en la construcción y hoy tiene su propia empresa chica.',
]
const RETIRE_JOURNEY = [
  '{n} se retiró sin grandes luces pero con dignidad. Tiene un kiosco y juega los picados del domingo.',
  '{n} maneja un remís, con la camiseta colgada en el living como recuerdo.',
  '{n} volvió al pueblo, puso una cancha de fútbol 5 y organiza el torneo del barrio.',
  'Contra todo pronóstico, {n} abrió una cadena de comida y se hizo millonario.',
  '{n} cayó en una estafa piramidal y perdió lo poco que había juntado.',
  '{n} se hizo profe de educación física, querido por todos sus alumnos.',
  '{n} puso una verdulería y se convirtió en el personaje del barrio.',
  '{n} tuvo problemas con el juego y la pasó fea, pero de a poco se recompuso.',
  '{n} se hizo albañil, construyó su propia casa y está orgulloso de eso.',
  '{n} vende choripán afuera de la cancha donde debutó. Un clásico.',
  '{n} se ganó la lotería un martes cualquiera y cambió su vida entera.',
  '{n} se metió a repartidor y sueña con volver como DT de las inferiores.',
  '{n} montó un taller mecánico y hoy vive tranquilo con lo justo.',
  '{n} se hizo viral por un video bailando y ahora es influencer sin querer.',
  '{n} formó una familia numerosa y dejó el fútbol sin mirar atrás.',
  '{n} abrió una parrilla de barrio que se llenó por el boca a boca.',
  '{n} se aisló, se fue a vivir al monte y cultiva su propia huerta.',
  '{n} probó suerte con las cripto, lo estafaron y aprendió a los golpes.',
  '{n} da clases de fútbol gratis a los pibes de la villa todos los sábados.',
  '{n} puso un lavadero y jura que labura menos que entrenando.',
  '{n} se metió a cantante de cumbia y sorprendió con un hit.',
  '{n} intentó mil negocios, fundió varios, pero nunca bajó los brazos.',
  '{n} maneja un colectivo y cuenta sus anécdotas a cada pasajero.',
  '{n} se hizo entrenador personal y tiene la agenda llena.',
  '{n} volvió a jugar en la liga del pueblo y es la estrella indiscutida.',
]

// ---------- Selección nacional (atada a la nacionalidad del jugador) ----------
// strength = nivel de la selección (fuerte cuesta más entrar); wcFreq = con qué frecuencia
// clasifica al Mundial. Una selección débil te llama antes (umbral bajo) y va poco al Mundial.
export interface NationTier { strength: number; wcFreq: number }
export const NATIONALITY_TIERS: Record<string, NationTier> = {
  Argentina: { strength: 90, wcFreq: 0.97 },
  Brasil: { strength: 91, wcFreq: 0.98 },
  Francia: { strength: 89, wcFreq: 0.95 },
  España: { strength: 87, wcFreq: 0.92 },
  Italia: { strength: 84, wcFreq: 0.55 }, // fuerte pero falló clasificaciones recientes
  Uruguay: { strength: 82, wcFreq: 0.85 },
  Colombia: { strength: 80, wcFreq: 0.6 },
  México: { strength: 79, wcFreq: 0.9 },
  Chile: { strength: 78, wcFreq: 0.45 },
  Paraguay: { strength: 74, wcFreq: 0.4 },
}
const DEFAULT_TIER: NationTier = { strength: 76, wcFreq: 0.5 }
const WC_ELIMINATORS = ['Brasil', 'Francia', 'Alemania', 'España', 'Países Bajos', 'Inglaterra', 'Portugal', 'Croacia', 'Italia', 'Marruecos']

export interface NTSeason {
  called: boolean
  debut: boolean
  caps: number
  goals: number
  highlights: string[]
  worldCupChampion: boolean
  /** El Mundial jugado partido por partido (solo en los años que toca y si estás convocado) */
  worldCup?: WorldCupRun
}

/** Simula la temporada de selección de un jugador según su nacionalidad, OVR y rendimiento. */
export function nationalTeamSeason(o: {
  nationality: string
  ovr: number
  performance: number
  year: number
  wasCalledUp: boolean
  position: string
  rng: () => number
}): NTSeason {
  const tier = NATIONALITY_TIERS[o.nationality] || DEFAULT_TIER
  const threshold = tier.strength - 13 // selección fuerte => más OVR para entrar
  const out: NTSeason = { called: false, debut: false, caps: 0, goals: 0, highlights: [], worldCupChampion: false }

  const meets = o.ovr >= threshold && o.performance >= 0.5
  if (!o.wasCalledUp) {
    if (meets && o.rng() < 0.85) {
      out.called = true
      out.debut = true
      out.highlights.push(`🎽 Debutaste en la Selección de ${o.nationality}`)
    } else {
      return out
    }
  } else if (o.ovr >= threshold - 5) {
    out.called = true // seguís en consideración
  } else {
    out.highlights.push(`😔 Te quedaste afuera de la Selección de ${o.nationality} esta temporada`)
    return out
  }

  // Partidos según cuánto superás el umbral (titular vs suplente)
  const starterness = clamp((o.ovr - threshold) / 16, 0.12, 1)
  out.caps = Math.round(2 + starterness * 8 + o.rng() * 2)
  const cat = positionCategory(o.position)
  const gpg = cat === 'ATT' ? 0.42 : cat === 'MID' ? 0.2 : cat === 'GK' ? 0 : 0.05
  out.goals = Math.round(out.caps * gpg * starterness * (0.5 + o.rng()))

  // Mundial: años reales (2026, 2030, 2034...) => year % 4 === 2. Ya no es un sorteo suelto:
  // se juega el torneo entero y queda el recorrido para poder contarlo.
  if (o.year % 4 === 2) {
    if (o.rng() < tier.wcFreq) {
      const wc = simularMundial({
        year: o.year,
        seleccion: o.nationality,
        fuerzaSeleccion: tier.strength,
        ovrJugador: o.ovr,
        categoria: cat,
        rng: o.rng,
      })
      out.worldCup = wc
      out.worldCupChampion = wc.campeon
      out.caps += wc.caps
      out.goals += wc.goles
      out.highlights.push(resumenMundial(wc))
    } else {
      out.highlights.push(`😞 ${o.nationality} no clasificó al Mundial ${o.year}`)
    }
  }
  return out
}

const RETIRE_SAUDI_LUXURY = [
  'Tras amasar una fortuna en petrodólares, {n} compró tres mansiones en The Palm Dubái y hoy pasa sus tardes en yates privados de lujo.',
  '{n} se retiró multimillonario en Arabia: un jeque le regaló un Bugatti bañado en oro y hoy comparte asados de cordero en su palacio en Riad.',
  '{n} vive la vida de un rey entre Dubái y Riad: se compró un zoológico privado de halcones y leones, y se desplaza solo en jet privado.',
  'El rey del lujo: {n} acumuló tantos petrodólares que fundó un resort flotante en los Emiratos y organiza torneos VIP para celebridades mundiales.',
  '{n} colgará los botines pero no la billetera: tras su paso por Arabia Saudita, posee una colección de 15 superdeportivos y una isla privada.',
  '{n} vive como un jeque en las torres de Dubái: invirtió sus millones árabes en bienes raíces y hoy es uno de los ex-futbolistas más ricos de la historia.',
  'Con los millones ganados en Arabia, {n} construyó su propia villa de cristal en el desierto con cancha de fútbol de césped sintetizado y helipuerto.',
  '{n} cerró su carrera en la Saudi Pro League llenándose de oro: hoy asesora a príncipes para comprar clubes europeos desde su yate en las Maldivas.',
]

export function retirementStory(career: CareerState): string {
  const { player } = career
  const peak = Math.max(player.ovr, ...career.history.map((s) => s.nextOvr ?? s.ovr))
  const titles = Object.values(career.trophies).reduce((a, b) => a + b, 0)
  const wc = career.milestones.worldCup
  const lastClub = findClub(career.clubId)?.name || 'su último club'
  const seed = (peak * 131 + titles * 977 + career.startYear * 7 + player.name.length * 13) >>> 0
  const rng = makeRng(seed || 1)

  const jugoEnArabia = career.clubHistory.some((id) => {
    const c = findClub(id)
    return c?.pais === 'Arabia Saudita'
  })

  if (jugoEnArabia && rng() < 0.6) {
    const t = RETIRE_SAUDI_LUXURY[Math.floor(rng() * RETIRE_SAUDI_LUXURY.length)]
    return t.replace(/\{n\}/g, player.name).replace(/\{c\}/g, lastClub)
  }

  let tier: string[]
  if (peak >= 92 || (wc && titles >= 5)) tier = RETIRE_LEGEND
  else if (peak >= 87 || titles >= 3) tier = RETIRE_CRACK
  else if (peak >= 80) tier = RETIRE_SOLID
  else tier = RETIRE_JOURNEY

  const pool = [...tier, ...RETIRE_UNIVERSAL]
  const t = pool[Math.floor(rng() * pool.length)]
  return t.replace(/\{n\}/g, player.name).replace(/\{c\}/g, lastClub)
}

export interface Trophy {
  id: string
  name: string
  icon: string
  count: number
}

export interface TransferOffer {
  clubId: string
  clubName: string
  valueM: number
  strength: number
  region: Region
  flag?: string
}

export interface SeasonResult {
  year: number
  age: number
  clubId: string
  clubName: string
  matchesPlayed: number
  goals: number
  assists: number
  ovr: number
  marketValueM: number
  liga: boolean
  copaArgentina: boolean
  continental: ContinentalComp | null
  continentalWon: boolean
  rating: number
  topScorer: boolean
  highlights: string[]
  cronica: string
  decisionTaken?: string
  nextOvr?: number // OVR ya evolucionado para la próxima temporada (edad + suerte)
  substanceHit?: boolean // consumió la sustancia y pegó el +5
  substanceBad?: boolean // mala reacción a la sustancia (-2 OVR)
  euroScout?: boolean // lo vino a buscar un club de Europa (plus de OVR)
  performance?: number // 0..1, rendimiento de la temporada (para selección/eventos)
  barrabravas?: boolean // temporada floja en Argentina: te apretaron los barras
  cleanSheets?: number // vallas invictas (arqueros/defensores)
  penaltiesSaved?: number // penales atajados (arqueros)
  yellowCards?: number
  redCards?: number
  ballonDor?: boolean // ganaste el Balón de Oro esa temporada
  ntDebut?: boolean // te llamaron por primera vez a la Selección
  euroOffer?: boolean // te llegó la primera oferta de Europa
  lesionado?: boolean
  lesionGrave?: boolean
  ganoTitularidad?: boolean // el año que te ganaste el puesto
  worldCup?: WorldCupRun // el Mundial jugado ese año, partido por partido
  clasificoLibertadores?: boolean // el año que viene se juega la Copa grande
  mundialClubes?: boolean // el club jugó el Mundial de Clubes (por ganar la continental)
  mundialClubesGanado?: boolean
  ascendio?: boolean // el club subió de categoría
  descendio?: boolean
  /** La liga en la que juega el club el año que viene, si cambió de categoría. */
  nuevaLigaId?: string
  /** "🇺🇾 Primera División", para mostrar dónde se jugó esa temporada. */
  ligaNombre?: string
}

export interface Milestones {
  nationalTeam: boolean
  balonDeOro: number
  goldenBoots: number
  worldCup: boolean
  ntCaps?: number // partidos jugados en la Selección
  ntGoals?: number // goles en la Selección
}

export interface CareerPlayer {
  name: string
  number: number
  position: string
  nationality: string
  flag: string
  ovr: number
  age: number
  marketValueM: number
}

export interface CareerState {
  player: CareerPlayer
  clubId: string
  startYear: number
  seasonsPlayed: number
  totals: { matchesPlayed: number; goals: number; assists: number }
  trophies: Record<string, number>
  clubHistory: string[]
  history: SeasonResult[]
  pendingOffers: TransferOffer[]
  nextContinental: 'libertadores' | 'sudamericana'
  milestones: Milestones
  finished: boolean
  selectedDecisionId?: string
  /** Techo de nacimiento del jugador. Sorteado al crear la carrera, fijo el resto. */
  talento?: Talento
  /** El club ganó la continental el año pasado: esta temporada juega el Mundial de Clubes. */
  playsMundialClubes?: boolean
  /**
   * La liga donde juega HOY el club del jugador, cuando ascendió o descendió.
   *
   * El club vive en un archivo generado, con su liga fija: la categoría que cambia es la del
   * club EN ESTA CARRERA. Guardarla acá es lo que permite que Chacarita ascienda en tu partida
   * sin que ascienda en la de todos.
   */
  ligaActualId?: string
}

export const MAX_SEASONS = 15

/**
 * Los títulos, con su trofeo dibujado.
 *
 * `icon` era un emoji: la Libertadores 🏆, la Copa Argentina 🥛 (una copa de leche) y el Mundial
 * 🌍. Además de quedar pobre al lado de los escudos, cada sistema dibuja los emojis distinto, así
 * que la ficha que comparte alguien de iPhone no es la misma que la de Android.
 *
 * Ahora cada uno tiene su SVG en /logos/trofeos/. El emoji queda como `emoji` porque hay lugares
 * donde solo entra texto plano —el texto de un tweet, un mensaje de Telegram— y ahí sigue
 * sirviendo.
 */
export const TROPHY_META: Record<string, { name: string; icon: string; emoji: string }> = {
  lpf: { name: 'Liga', icon: '/logos/trofeos/lpf.svg', emoji: '⭐' },
  'copa-arg': { name: 'Copa Argentina', icon: '/logos/trofeos/copa-arg.svg', emoji: '🥛' },
  libertadores: { name: 'Libertadores', icon: '/logos/trofeos/libertadores.svg', emoji: '🏆' },
  sudamericana: { name: 'Sudamericana', icon: '/logos/trofeos/sudamericana.svg', emoji: '🥇' },
  champions: { name: 'Champions League', icon: '/logos/trofeos/champions.svg', emoji: '🌟' },
  europa: { name: 'Europa League', icon: '/logos/trofeos/europa.svg', emoji: '🎖️' },
  mundial: { name: 'Mundial', icon: '/logos/trofeos/mundial.svg', emoji: '🌍' },
  'mundial-clubes': { name: 'Mundial de Clubes', icon: '/logos/trofeos/mundial-clubes.svg', emoji: '🌐' },
  ascenso: { name: 'Ascenso', icon: '/logos/trofeos/ascenso.svg', emoji: '🔼' },
}

/**
 * La copa nacional según el país donde juega el club.
 *
 * Todos los títulos de copa nacional se guardan con el id 'copa-arg' —viene de cuando el juego
 * era solo argentino— pero el trofeo que se muestra tiene que ser el del país: si ganaste la
 * Copa do Brasil, en la ficha va la brasileña.
 */
const COPA_POR_PAIS: Record<string, string> = {
  Argentina: 'copa-arg',
  Uruguay: 'copa-uru',
  Chile: 'copa-chi',
  Colombia: 'copa-col',
  'Perú': 'copa-per',
  Paraguay: 'copa-par',
  Brasil: 'copa-bra',
  'México': 'copa-mx',
}

export function trofeoDeCopaNacional(pais?: string): { name: string; icon: string } {
  const id = (pais && COPA_POR_PAIS[pais]) || 'copa-arg'
  const nombres: Record<string, string> = {
    'copa-arg': 'Copa Argentina', 'copa-uru': 'Copa Uruguay', 'copa-chi': 'Copa Chile',
    'copa-col': 'Copa Colombia', 'copa-per': 'Copa Perú', 'copa-par': 'Copa Paraguay',
    'copa-bra': 'Copa do Brasil', 'copa-mx': 'Copa MX',
  }
  return { name: nombres[id] || 'Copa Nacional', icon: `/logos/trofeos/${id}.svg` }
}

export function makeRng(seed: number): () => number {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

const GOAL_BASE: Record<PositionCategory, number> = { ATT: 14, MID: 6, DEF: 1.5, GK: 0 }
const ASSIST_BASE: Record<PositionCategory, number> = { ATT: 7, MID: 8, DEF: 2, GK: 0 }
// Tarjetas por temporada completa: el que marca y corta es el que se llena de amarillas.
const YELLOW_BASE: Record<PositionCategory, number> = { ATT: 3.5, MID: 6.5, DEF: 8, GK: 1.5 }
const RED_CHANCE: Record<PositionCategory, number> = { ATT: 0.08, MID: 0.16, DEF: 0.26, GK: 0.07 }

// Valor de mercado realista (€M). Curva exponencial por OVR + curva de edad con pico 23-27
// y castigo a los muy jóvenes (potencial sin confirmar). Ej: 59/18≈0, 72/18≈8, 80/24≈50,
// 88/26≈115, 95/25≈200.
export function marketValueFor(ovr: number, age: number): number {
  const q = clamp((ovr - 53) / 42, 0, 1)
  const base = Math.pow(q, 3.3) * 240
  let ageF: number
  if (age <= 17) ageF = 0.5
  else if (age <= 19) ageF = 0.62
  else if (age <= 21) ageF = 0.82
  else if (age <= 27) ageF = 1
  else if (age <= 30) ageF = 0.72
  else if (age <= 33) ageF = 0.42
  else ageF = 0.18
  const v = base * ageF
  // Devolvemos con decimales cuando es chico (canteranos ~0.2-0.3M = 200-300k).
  return clamp(v < 1 ? Math.round(v * 100) / 100 : Math.round(v), 0.05, 220)
}

// Formato de valor: K para <1M, M para el resto (ej: 280 -> "€280K", 45 -> "€45M").
export function formatMarketValue(m: number): string {
  return m >= 1 ? `€${Math.round(m)}M` : `€${Math.round(m * 1000)}K`
}

// Tope de OVR por edad (categórico, por escala): un pibe de <19 no puede pasar de 72; el
// techo sube con la edad hasta el máximo. Aplica en la creación y en el crecimiento.
export function ovrCapForAge(age: number): number {
  if (age < 19) return 72
  if (age === 19) return 76
  if (age === 20) return 80
  if (age === 21) return 84
  if (age === 22) return 88
  if (age === 23) return 92
  if (age === 24) return 95
  return 99
}

// Crecimiento estilo Copero: 100% edad + suerte (el club no influye). El pico es a los 26
// y después solo baja. La sustancia misteriosa suma +5 y un ojeo europeo da un plus.
/**
 * Talento de nacimiento, sorteado UNA vez por carrera y estable el resto (se deriva del nombre
 * y el año de arranque, así no cambia entre temporadas).
 *
 * Sin esto todas las carreras terminaban igual: en 200 simulaciones el pico iba de 71 a 85 y
 * NINGUNA llegaba a 90+, o sea que ser leyenda era imposible. Ahora la mayoría sigue siendo
 * un jugador de liga normal, pero cada tanto sale un fuera de serie — que es lo que hace que
 * valga la pena volver a jugar.
 */
export type Talento = 'normal' | 'destacado' | 'generacional'

/** Se sortea UNA vez al crear la carrera y queda guardado; no se recalcula por temporada. */
export function sortearTalento(rng: () => number = Math.random): Talento {
  const r = rng()
  if (r < 0.04) return 'generacional' // ~1 de cada 25 carreras
  if (r < 0.22) return 'destacado'
  return 'normal'
}

// Cuánto más rápido crece de joven cada talento, y hasta dónde puede llegar.
const CRECIMIENTO_TALENTO: Record<Talento, number> = { normal: 0, destacado: 0.75, generacional: 1.5 }
const TECHO_TALENTO: Record<Talento, number> = { normal: 85, destacado: 89, generacional: 97 }

/**
 * Hasta dónde te deja llegar el lugar donde jugás.
 *
 * Un 9 que se queda toda la vida en el Torneo Federal A no llega a 88 por más que meta cien
 * goles: entrena con lo que hay, juega contra lo que hay y nadie lo ve. Sin este techo el
 * escalón del juego se rompía —quedarse abajo rendía igual que dar el salto— y la escalera de
 * ofertas dejaba de tener sentido: para qué irte si vas a llegar al mismo lado.
 *
 * No es un castigo: es el motivo por el que aceptar la oferta importa. El techo sube apenas
 * cambiás de aire, y el que salta a Europa no tiene ninguno.
 *
 * El nivel de liga va de 8 (Federal A) a 100 (Série A), así que el techo va de 71 a 90; Europa
 * queda libre hasta el techo por talento.
 *
 * El rango tiene que ser ANCHO o el techo no muerde: con 74-92 el de la Primera Nacional daba
 * 82, por encima del techo por edad, así que quedarse y saltar terminaban en el mismo OVR y el
 * escalón no significaba nada. Medido: 81 contra 80.
 */
function techoPorLiga(club: CareerClub | undefined): number {
  if (!club || club.region === 'euro') return 99
  const nivel = club.ligaId ? nivelDeLiga(club.ligaId) : 78
  return Math.round(clamp(70 + (nivel / 100) * 20, 70, 90))
}

function nextOvr(
  ovr: number,
  age: number,
  rng: () => number,
  substanceHit = false,
  euroBonus = 0,
  talento: Talento = 'normal',
  lesionGrave = false,
  techoLiga = 99,
): number {
  const luck = rng()
  let delta: number
  if (age < 24) delta = luck < 0.12 ? 0 : luck < 0.55 ? 2 : 3 // joven: sube fuerte
  else if (age <= 26) delta = luck < 0.28 ? 0 : luck < 0.78 ? 1 : 2 // pico a los 26
  else if (age <= 29) delta = luck < 0.55 ? -1 : 0 // se sostiene, empieza a aflojar
  else if (age <= 31) delta = luck < 0.4 ? -1 : -2
  else if (age <= 34) delta = luck < 0.35 ? -2 : -3 // a los 32 la caída se acelera
  else delta = luck < 0.3 ? -3 : -4 // después de los 35 se cae a pedazos
  // El talento SOLO acelera la subida de joven. No frena el declive: si también amortiguaba
  // la caída, un "destacado" no bajaba nunca y terminaba de leyenda (20% de las carreras
  // llegaban a 90+ en la auditoría, que es cualquier cosa).
  if (delta > 0) delta += CRECIMIENTO_TALENTO[talento]
  if (substanceHit) delta += 5
  if (lesionGrave) delta -= 2 // una lesión seria deja secuela
  delta += euroBonus
  // Tres techos: la edad, el talento con el que naciste y la categoría donde jugás.
  //
  // El de la liga NO baja el OVR que ya tenés —el que llegó a 85 y bajó a la B no se
  // desintegra— sino que frena el crecimiento mientras estés ahí. Por eso se aplica solo
  // cuando el delta es positivo.
  const techo = Math.min(ovrCapForAge(age + 1), TECHO_TALENTO[talento])
  const conDelta = Math.round(ovr + delta)
  if (delta > 0 && conDelta > techoLiga) {
    // Se puede acercar al techo de la categoría, pero no pasarlo.
    return clamp(Math.max(ovr, Math.min(conDelta, techoLiga)), 55, techo)
  }
  return clamp(conDelta, 55, techo)
}

function buildCronica(
  o: {
    name: string
    club: string
    year: number
    age: number
    goals: number
    assists: number
    matches: number
    cat: PositionCategory
    liga: boolean
    copaArgentina: boolean
    continentalWon: boolean
    contName: string
    topScorer: boolean
    rating: number
  },
  rng: () => number,
): string {
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]
  const g = o.goals
  const gk = o.cat === 'GK'

  let head: string
  if (o.continentalWon) {
    head = pick([
      `Noche eterna para ${o.name}: levantó la ${o.contName} y se metió en la historia grande de ${o.club}.`,
      `${o.name} tocó la gloria continental. La ${o.contName} quedó en la vitrina de ${o.club} y su nombre en la leyenda.`,
    ])
  } else if (o.liga) {
    head = pick([
      `Campeón. ${o.name} dio la vuelta con ${o.club} y se ganó el cariño del hincha para siempre.`,
      `${o.name} llevó a ${o.club} a la cima: campeón de Liga en una temporada memorable.`,
    ])
  } else if (o.topScorer) {
    head = pick([
      `${o.name} fue el verdugo de los arqueros: ${g} goles y el título de goleador. Una máquina.`,
      `Botín de oro para ${o.name}: ${g} gritos que lo pusieron en boca de todos.`,
    ])
  } else if (o.copaArgentina) {
    head = `${o.name} y ${o.club} se dieron el gusto en la Copa Argentina. Alegría de campeón.`
  } else if (o.age <= 20) {
    head = gk || o.cat === 'DEF'
      ? pick([
          `Temporada de rodaje para la promesa ${o.name} en ${o.club}: ${o.matches} partidos y personalidad de grande.`,
          `${o.name} sumó minutos en el fondo de ${o.club} y se ganó la confianza del técnico.`,
        ])
      : pick([
          `Temporada de rodaje para la promesa ${o.name} en ${o.club}: ${g} goles en ${o.matches} partidos.`,
          `${o.name} sumó minutos y aprendizaje en ${o.club}. Jerarquía en ascenso.`,
        ])
  } else if (o.age >= 33) {
    head = pick([
      `El tiempo no perdona, pero ${o.name} sigue dando cátedra a los ${o.age} años en ${o.club}.`,
      `${o.name}, con la cinta de referente, puso su jerarquía al servicio de ${o.club}.`,
    ])
  } else {
    head = gk
      ? pick([
          `${o.name} fue una pared bajo los tres palos de ${o.club} durante todo el torneo.`,
          `Seguridad y manos firmes: ${o.name} sostuvo a ${o.club} en las noches bravas.`,
        ])
      : o.cat === 'DEF'
      ? pick([
          `${o.name} fue el mariscal del fondo de ${o.club}: quite, salida limpia y liderazgo.`,
          `Nadie pasó por su lado: temporada seria de ${o.name} en la última línea de ${o.club}.`,
        ])
      : pick([
          `${o.name} cerró un gran año en ${o.club}: ${g} goles y ${o.assists} asistencias en ${o.matches} partidos.`,
          `Regularidad y liderazgo de ${o.name} en ${o.club}.`,
        ])
  }

  const close =
    o.rating >= 8.5
      ? pick([' Una temporada para el afiche.', ' Nivel de crack mundial.'])
      : o.rating < 6.5
        ? pick([' Quedó debiendo, pero la revancha llegará pronto.'])
        : pick([' Paso firme en la carrera.', ''])

  return head + close
}

export function simulateSeason(
  state: CareerState,
  rng: () => number,
  decisionOptionId?: string,
): { season: SeasonResult; trophiesWon: string[]; offers: TransferOffer[] } {
  const club = findClub(state.clubId)!
  const cat = positionCategory(state.player.position)
  const ovr = state.player.ovr
  const age = state.player.age
  const year = state.startYear + state.seasonsPlayed
  const highlights: string[] = []

  // ── Cuánto jugás: la titularidad se gana ──
  // Antes todos jugaban 28-42 partidos desde el primer año, incluso un pibe de 17 recién
  // subido a un grande. Ahora depende de tu nivel contra el del club y de la edad: un juvenil
  // arranca entrando desde el banco y se va ganando el puesto.
  const brechaClub = ovr - club.strength // +: sos mejor que el promedio del plantel
  const esCrack = ovr >= club.strength + 6
  const primerAnioEnElClub = state.history.length === 0 || state.history[state.history.length - 1].clubId !== club.id
  // brecha -15 → suplente (~13 partidos) · 0 → titular (~25) · +8 → indiscutido (~32)
  let titularidad = clamp(0.75 + brechaClub / 40, 0.3, 1)
  if (age <= 19) titularidad *= 0.62 // los pibes empiezan de a poco
  else if (age <= 21) titularidad *= 0.82
  if (age >= 34) titularidad *= 0.78 // al veterano lo dosifican
  if (primerAnioEnElClub && !esCrack) titularidad *= 0.88 // adaptarse a un club nuevo cuesta
  titularidad = clamp(titularidad, 0.22, 1)

  const matchesPlayed = Math.max(4, Math.round((26 + rng() * 14) * titularidad))
  const esTitular = titularidad >= 0.72
  // Se avisa UNA sola vez, el año que pasás de suplente a titular: es un hito de la carrera.
  const yaFueTitular = state.history.some((h) => (h.matchesPlayed ?? 0) >= 22)
  const ganoTitularidad = esTitular && !yaFueTitular && state.history.length > 0

  let bonusGoals = 0
  let bonusAssists = 0
  let bonusTitle = 0
  let bonusOvr = 0
  const opt = decisionOptionId || ''
  const GOAL_OPTS = new Set(['train_finishing', 'focus_play', 'refuse_position', 'focus_self'])
  const ASSIST_OPTS = new Set(['train_vision', 'balanced_train', 'link_up'])
  const TITLE_OPTS = new Set(['play_injured', 'focus_football', 'team_leader', 'barra_stay'])
  const OVR_OPTS = new Set(['train_physique', 'rest_patiently', 'accept_captain', 'adapt_position', 'mentor_youth', 'double_session', 'renew_loyalty'])
  if (GOAL_OPTS.has(opt)) bonusGoals += opt === 'train_finishing' ? 4 : 2
  if (ASSIST_OPTS.has(opt)) bonusAssists += opt === 'train_vision' ? 4 : 2
  if (TITLE_OPTS.has(opt)) bonusTitle += opt === 'barra_stay' ? 0.06 : 0.1
  if (OVR_OPTS.has(opt)) bonusOvr += 1

  let bonusCleanSheets = 0
  if (cat === 'GK') {
    bonusCleanSheets += bonusGoals + bonusAssists
    bonusGoals = 0
    bonusAssists = 0
  } else if (cat === 'DEF') {
    bonusCleanSheets += Math.round((bonusGoals + bonusAssists) / 2)
    bonusGoals = Math.round(bonusGoals / 2)
    bonusAssists = Math.round(bonusAssists / 2)
  }

  // ── Lesiones ──
  const riesgoLesion = clamp(0.06 + Math.max(0, age - 28) * 0.035 + (decisionOptionId === 'play_injured' ? 0.18 : 0), 0.05, 0.55)
  const lesionado = rng() < riesgoLesion
  const lesionGrave = lesionado && rng() < clamp(0.2 + Math.max(0, age - 31) * 0.06, 0.2, 0.6)

  let lesionDetalle: { tipo: string; meses: number; impacto: string } | undefined = undefined
  if (lesionGrave) {
    const tiposGrave = [
      { tipo: "Rotura de ligamento cruzado anterior", meses: 8, impacto: "-2 OVR · 8 meses fuera" },
      { tipo: "Rotura de menisco interno", meses: 5, impacto: "-1 OVR · 5 meses fuera" },
      { tipo: "Fractura de peroné", meses: 6, impacto: "-1 OVR · 6 meses fuera" },
      { tipo: "Pubalgia crónica grave", meses: 6, impacto: "-1 OVR · 6 meses fuera" },
    ]
    lesionDetalle = tiposGrave[Math.floor(rng() * tiposGrave.length)]
    highlights.push(`🏥 Lesión grave: ${lesionDetalle.tipo} (${lesionDetalle.meses} meses de baja)`)
  } else if (lesionado) {
    const tiposMod = [
      { tipo: "Desgarro muscular de grado 2", meses: 2, impacto: "2 meses fuera" },
      { tipo: "Esguince grave de tobillo", meses: 3, impacto: "3 meses fuera" },
      { tipo: "Distensión de ligamento colateral", meses: 2, impacto: "2 meses fuera" },
    ]
    lesionDetalle = tiposMod[Math.floor(rng() * tiposMod.length)]
    highlights.push(`🩹 Lesión: ${lesionDetalle.tipo} (${lesionDetalle.meses} meses de baja)`)
  }

  const ovrScale = clamp(ovr / 80, 0.6, 1.35)
  const partidosJugados = lesionado
    ? Math.max(3, Math.round(matchesPlayed * (lesionGrave ? 0.35 : 0.65)))
    : matchesPlayed
  const apps = partidosJugados / 38
  const empujeClub = clamp(0.78 + (club.strength - 70) / 55, 0.7, 1.3)
  const goals = Math.max(0, Math.round((GOAL_BASE[cat] * ovrScale * apps * empujeClub * (0.6 + rng() * 0.9)) + bonusGoals))
  const assists = Math.max(0, Math.round((ASSIST_BASE[cat] * ovrScale * apps * empujeClub * (0.5 + rng() * 0.9)) + bonusAssists))
  const keepsCleanSheets = cat === 'GK' || cat === 'DEF'
  const csRate = keepsCleanSheets ? clamp(0.12 + (ovr - 70) / 120 + (club.strength - 72) / 130, 0.05, 0.55) : 0
  const cleanSheets = Math.min(
    partidosJugados,
    Math.round(partidosJugados * csRate * (0.7 + rng() * 0.6)) + bonusCleanSheets,
  )
  const penaltiesFaced = cat === 'GK' ? 2 + Math.floor(rng() * 6) : 0
  const penaltiesSaved = Math.min(
    penaltiesFaced,
    Math.round(penaltiesFaced * clamp(0.18 + (ovr - 70) / 250, 0.08, 0.45) + (rng() < 0.25 ? 1 : 0)),
  )
  const yellowCards = Math.max(0, Math.round(YELLOW_BASE[cat] * apps * (0.5 + rng())))
  const redCards = rng() < RED_CHANCE[cat] * (0.6 + apps) ? 1 : 0

  const maradona = ovr >= 90 ? 6 : 0
  const str = clamp(club.strength + maradona, 60, 92)
  const margin = ovr >= club.strength + 10 ? 1.6 : 1
  const ligaP = clamp(((str - 64) / 19) * 0.32 * margin + 0.005 + bonusTitle, 0.005, 0.45)
  const copaP = clamp(((str - 64) / 19) * 0.26 * margin + 0.03 + bonusTitle, 0.03, 0.38)

  const topTier = state.nextContinental === 'libertadores'
  const contType: ContinentalComp =
    club.region === 'euro' ? (topTier ? 'champions' : 'europa') : topTier ? 'libertadores' : 'sudamericana'
  let contP: number
  if (contType === 'sudamericana' || contType === 'europa') {
    contP = club.strength >= 79 ? 0 : clamp(((str - 64) / 15) * 0.22 * margin + 0.04, 0.02, 0.3)
  } else {
    contP = clamp(((str - 70) / 20) * 0.22 * margin + bonusTitle, 0.01, 0.32)
  }

  const liga = rng() < ligaP
  const ligaDelClub = findLiga(state.ligaActualId ?? club.ligaId ?? '')
  const juegaCopaNacional = club.region === 'arg' || Boolean(ligaDelClub?.copa)
  const copaArgentina = juegaCopaNacional && rng() < copaP
  const continentalWon = rng() < contP

  const trophiesWon: string[] = []
  if (liga) trophiesWon.push('lpf')
  if (copaArgentina) trophiesWon.push('copa-arg')
  if (continentalWon) trophiesWon.push(contType)

  let ascendio = false
  let descendio = false
  let nuevaLigaId: string | undefined
  if (ligaDelClub) {
    const arriba = ligaVecina(ligaDelClub.id, 'arriba')
    const abajo = ligaVecina(ligaDelClub.id, 'abajo')
    const rivales = clubesDeLiga(ligaDelClub.id)
    const puesto = Math.max(0, rivales.findIndex((c) => c.id === club.id))
    const relativo = 1 - puesto / Math.max(rivales.length, 1)
    const enTorneo = Math.max(ligaDelClub.equipos || rivales.length, 8)
    if (arriba && ligaDelClub.asciende > 0) {
      const empuje = clamp((ovr - club.strength) / 40, -0.05, 0.15)
      const pAsc = clamp((ligaDelClub.asciende / enTorneo) * Math.pow(relativo, 1.6) * 2.4 + empuje, 0, 0.5)
      ascendio = rng() < pAsc
      if (ascendio) {
        nuevaLigaId = arriba.id
        trophiesWon.push('ascenso')
      }
    }
    if (!ascendio && abajo && ligaDelClub.desciende > 0) {
      const salvavidas = clamp((ovr - club.strength) / 50, 0, 0.12)
      const pDesc = clamp((ligaDelClub.desciende / enTorneo) * Math.pow(1 - relativo, 1.6) * 2.2 - salvavidas, 0, 0.45)
      descendio = rng() < pDesc
      if (descendio) nuevaLigaId = abajo.id
    }
  }

  // Mundial de Clubes: se entra por ser campeón de la Libertadores (o de la Champions). El
  // torneo se juega al año siguiente, así que lo dispara el estado que dejó la temporada
  // anterior. Ganarlo es difícil: el campeón de América llega de igual a igual con Europa,
  // pero los europeos son favoritos.
  const mundialClubes = Boolean(state.playsMundialClubes)
  let mundialClubesGanado = false
  if (mundialClubes) {
    const chanceMundialito = contType === 'champions' || club.region === 'euro' ? 0.5 : 0.32
    mundialClubesGanado = rng() < clamp(chanceMundialito + (ovr - 80) / 200, 0.12, 0.62)
    if (mundialClubesGanado) trophiesWon.push('mundial-clubes')
  }

  // Clasificación a la Copa grande del año siguiente (lo que se anuncia con cartel)
  const clasificoLibertadores = liga || continentalWon

  // Rendimiento por posición: arquero/defensor rinden por vallas invictas, no por goles.
  let performance: number
  if (keepsCleanSheets) {
    const csRatio = partidosJugados > 0 ? cleanSheets / partidosJugados : 0
    performance = clamp((csRatio / 0.45) * 0.85 + ((goals + assists) / 8) * 0.15, 0, 1)
  } else {
    const expected = (GOAL_BASE[cat] + ASSIST_BASE[cat]) * ovrScale || 1
    performance = clamp((goals + assists) / (expected * 1.1), 0, 1)
  }

  const scorerThreshold = cat === 'ATT' ? 15 : cat === 'MID' ? 12 : 999
  const topScorer = goals >= scorerThreshold && rng() < 0.7
  // Premio a la valla menos vencida (arqueros con muchas vallas invictas).
  const goldenGlove = cat === 'GK' && cleanSheets >= Math.round(partidosJugados * 0.4) && rng() < 0.6

  // Nota realista: el OVR marca el techo (un 59 no puede sacar 9). Rinde = OVR + rendimiento.
  const ratingBase = 4.8 + (clamp(ovr, 55, 98) - 55) / 43 * 4.2 // 55->4.8, 98->9.0
  const rating = clamp(
    Math.round((ratingBase * 0.6 + (5 + performance * 4) * 0.4 + trophiesWon.length * 0.15) * 10) / 10,
    4.5,
    9.9,
  )

  const CONT_NAME: Record<ContinentalComp, string> = {
    libertadores: 'Copa Libertadores',
    sudamericana: 'Copa Sudamericana',
    champions: 'Champions League',
    europa: 'Europa League',
  }
  // El ascenso va PRIMERO: en la B es el título del año y le gana a cualquier otra cosa.
  if (ascendio) {
    const arriba = ligaVecina(ligaDelClub!.id, 'arriba')
    highlights.push(`🔼 ¡ASCENSO! ${club.name} sube a ${arriba?.nombre ?? 'la categoría de arriba'}`)
  }
  if (descendio) {
    const abajo = ligaVecina(ligaDelClub!.id, 'abajo')
    highlights.push(`🔽 ${club.name} se fue al descenso: el año que viene, ${abajo?.nombre ?? 'una categoría menos'}`)
  }
  if (liga) {
    highlights.push(
      ligaDelClub
        ? `🏆 Campeón de ${ligaDelClub.nombre} con ${club.name}`
        : `🏆 Campeón de la Liga con ${club.name}`,
    )
  }
  if (continentalWon) highlights.push(`${TROPHY_META[contType]?.icon || '🌎'} Levantaste la ${CONT_NAME[contType]}`)
  if (copaArgentina) highlights.push(`🥛 Campeón de la ${ligaDelClub?.copa || 'Copa Argentina'}`)
  if (mundialClubesGanado) highlights.push(`🌐 ¡CAMPEÓN DEL MUNDO DE CLUBES! Le ganaste a Europa`)
  else if (mundialClubes) highlights.push(`🌐 Jugaste el Mundial de Clubes representando a Sudamérica`)
  if (clasificoLibertadores) highlights.push(`🏆 Clasificaste a la próxima Copa Libertadores`)
  if (topScorer) highlights.push(`🥇 Goleador del torneo con ${goals} goles`)
  else if (goals >= 10 && cat === 'ATT') highlights.push(`⚽ Gran temporada: ${goals} goles`)
  if (cat !== 'ATT' && assists >= 10) highlights.push(`🎯 Temporada de ${assists} asistencias`)
  // Arqueros y defensores: carteles por vallas invictas (no por goles).
  if (goldenGlove) highlights.push(`🧤 Arquero menos vencido: ${cleanSheets} vallas invictas`)
  else if (keepsCleanSheets && cleanSheets >= 8) highlights.push(`🧤 ${cleanSheets} vallas invictas`)
  if (cat === 'GK') {
    if (penaltiesSaved >= 1) highlights.push(`🖐️ ${penaltiesSaved} ${penaltiesSaved === 1 ? 'penal atajado' : 'penales atajados'}`)
    if (penaltiesSaved >= 1 && (liga || copaArgentina || continentalWon) && rng() < 0.55)
      highlights.push(`🧤 Héroe en la definición: le atajaste el penal decisivo al rival en la final`)
    if (cleanSheets >= partidosJugados * 0.5 && rng() < 0.5)
      highlights.push(`🧱 Racha histórica: dejaste el arco en cero en más de la mitad del torneo`)
  }
  if (cat === 'DEF' && goals >= 4) highlights.push(`🎯 ${goals} goles de pelota parada: un lujo para un defensor`)
  if (ganoTitularidad) highlights.push(`🔥 Te ganaste la titularidad: el técnico ya no te saca`)
  if (lesionGrave) highlights.push(`🏥 Lesión seria: te perdiste media temporada`)
  else if (lesionado) highlights.push(`🤕 Te lesionaste y te perdiste varias fechas`)
  if (yellowCards >= 10) highlights.push(`🟨 ${yellowCards} amarillas: te perdiste fechas por acumulación`)
  if (redCards > 0) highlights.push(cat === 'GK' ? `🟥 Expulsado por salir a destiempo fuera del área` : `🟥 Te fuiste expulsado y dejaste al equipo con diez`)
  // Jugador del mes: chance según la nota (podés ganarlo varias veces al año).
  const potm = Math.round(clamp((rating - 7) * (0.4 + rng()) * 2.2, 0, 4))
  if (potm >= 1) highlights.push(`🏅 Jugador del Mes ×${potm}`)
  // Jugador del Año de la Liga: solo con una temporada de crack.
  if (rating >= 8.9 && (liga || topScorer || goldenGlove) && rng() < 0.45)
    highlights.push(`🏆 Mejor Jugador del Año de la Liga`)
  if (rating >= 9) highlights.push(`⭐ Figura del año (nota ${rating.toFixed(1)})`)

  const cronica = buildCronica(
    {
      name: state.player.name,
      club: club.name,
      year,
      age,
      goals,
      assists,
      matches: partidosJugados,
      cat,
      liga,
      copaArgentina,
      continentalWon,
      contName: CONT_NAME[contType],
      topScorer,
      rating,
    },
    rng,
  )

  // Sustancia misteriosa: un VERDADERO riesgo (antes casi siempre +5, te hacía crack solo).
  // 40% pega (+5), 30% nada, 30% mala reacción (-2 OVR). Apostás.
  let substanceHit = false
  let substanceBad = false
  if (decisionOptionId === 'take_substance') {
    const r = rng()
    if (r < 0.4) { substanceHit = true; highlights.push('🧪 La sustancia pegó fuerte: +5 OVR') }
    else if (r < 0.7) highlights.push('🧪 La sustancia no hizo nada esta vez')
    else { substanceBad = true; highlights.push('🧪 Mala reacción a la sustancia: -2 OVR') }
  }
  // Fortuna europea: cada tanto te vienen a buscar de Europa y te da un plus de OVR.
  const euroScout = club.region !== 'euro' && ovr >= 78 && rng() < 0.1
  const euroBonus = euroScout ? 2 : 0
  if (euroScout) highlights.push('✈️ Un grande de Europa puso el ojo en vos: +2 OVR de proyección')

  // Carreras guardadas de antes no traen talento: se tratan como normales.
  const talento = state.talento ?? 'normal'
  // El techo de la categoría donde juega: quedarse toda la vida en el Ascenso no puede rendir
  // lo mismo que dar el salto, o la escalera de ofertas no significa nada.
  const techoLiga = techoPorLiga(club)
  let grownOvr = nextOvr(ovr, age, rng, substanceHit, euroBonus, talento, lesionGrave, techoLiga)
  // Bonus de OVR de la decisión (trabajo físico, capitanía, adaptarse, mentor, renovar...).
  // También respeta el techo de la categoría: entrenar no reemplaza jugar contra buenos.
  if (bonusOvr) grownOvr = clamp(grownOvr + bonusOvr, 55, Math.min(ovrCapForAge(age + 1), Math.max(grownOvr, techoLiga)))
  // Mala reacción a la sustancia: -2 OVR (el riesgo real de apostar).
  if (substanceBad) grownOvr = clamp(grownOvr - 2, 55, ovrCapForAge(age + 1))
  // Barrabravas: efecto de la decisión tomada.
  if (decisionOptionId === 'barra_rescind') {
    grownOvr = clamp(grownOvr - 2, 55, 99)
    highlights.push('📉 Rescindiste el contrato para salir del quilombo: perdiste valor y nivel.')
  } else if (decisionOptionId === 'barra_stay') {
    highlights.push(performance >= 0.6 ? '💪 Bancaste la presión y la rompiste: un grande te tiene en la mira.' : '😬 Bancaste, pero la temporada no acompañó.')
  }

  // Trigger de barrabravas: temporada floja jugando en Argentina.
  const badSeason = trophiesWon.length === 0 && rating < 6.4
  const barrabravas = club.region === 'arg' && badSeason && rng() < 0.4
  if (barrabravas) highlights.push('😰 Los barrabravas te apretaron tras una temporada floja. Tenés que decidir.')

  const season: SeasonResult = {
    year,
    age,
    clubId: club.id,
    clubName: club.name,
    matchesPlayed: partidosJugados,
    goals,
    assists,
    ovr,
    marketValueM: state.player.marketValueM,
    liga,
    copaArgentina,
    continental: contType,
    continentalWon,
    rating,
    topScorer,
    highlights,
    cronica,
    decisionTaken: decisionOptionId,
    nextOvr: grownOvr,
    substanceHit,
    substanceBad,
    euroScout,
    performance,
    barrabravas,
    lesionado,
    lesionGrave,
    ganoTitularidad,
    clasificoLibertadores,
    mundialClubes,
    mundialClubesGanado,
    cleanSheets,
    penaltiesSaved,
    yellowCards,
    redCards,
    ascendio,
    descendio,
    nuevaLigaId,
    ligaNombre: ligaDelClub ? `${ligaDelClub.bandera} ${ligaDelClub.nombre}` : undefined,
  }

  const offers = generateOffers(state, performance, rng, decisionOptionId)

  return { season, trophiesWon, offers }
}

/**
 * Lo máximo que ese club puede pagar por un pase, en millones.
 *
 * Sin esto salían cosas como "Boca Juniors te ofrece €146M" o "Aldosivi €60M": el valor se
 * calculaba solo desde el jugador, sin mirar quién pagaba. En el fútbol real el techo de un
 * club argentino son unos pocos millones, y las cifras grandes solo existen en Europa.
 */
export function topeTraspaso(club: CareerClub): number {
  if (club.pais === 'Arabia Saudita') return 250
  if (club.region === 'euro') {
    if (club.strength >= 88) return 180
    if (club.strength >= 84) return 110
    return 65
  }
  if (club.region === 'sudam') return club.strength >= 80 ? 22 : 10
  // Argentina: los grandes se estiran, el resto compra barato o a préstamo
  if (club.strength >= 80) return 12
  if (club.strength >= 72) return 5
  return 2
}

/**
 * El nivel del club en la escalera, 0-100.
 *
 * Los europeos no están en ninguna liga del archivo: son el último escalón y van por encima de
 * todo lo demás, escalados desde su propia fuerza para que Real Madrid no valga lo mismo que
 * Borussia Dortmund.
 */
const NIVEL_CLUB_CACHE = new Map<string, number>()

function nivelDelClub(c: CareerClub): number {
  if (c.region === 'euro') return 100 + (c.strength - 82) * 2
  if (c.ligaId) return nivelDeLiga(c.ligaId)

  const guardado = NIVEL_CLUB_CACHE.get(c.id)
  if (guardado !== undefined) return guardado

  // Los rivales continentales escritos a mano (copa-libertadores.ts) no tienen liga. Muchos SON
  // el mismo club que ya está en una: Flamengo, Palmeiras y Peñarol están en las dos listas con
  // ids distintos. Sin esto se les calculaba el nivel con su fuerza y daban 96-100 —más que
  // cualquier liga—, así que desde la Primera B Metropolitana llegaban ofertas de "Bolívar" y
  // "Caracas" en el primer pase.
  const mismo = LIGA_CLUBS.find(
    (x) => x.ligaId && normalizarNombre(x.nombreLargo ?? x.name) === normalizarNombre(c.name),
  )
  const n = mismo?.ligaId ? nivelDeLiga(mismo.ligaId) : clamp((c.strength - 50) * 3, 5, 100)
  NIVEL_CLUB_CACHE.set(c.id, n)
  return n
}

/** Para emparejar el mismo club escrito de dos formas ("Peñarol" y "Club Atlético Peñarol"). */
function normalizarNombre(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(club|atletico|futbol|de|do|dos|da|regatas|sport|sociedade|esportiva|clube|fc|sc|ac)\b/g, '')
    .replace(/[^a-z]/g, '')
}

function generateOffers(state: CareerState, performance: number, rng: () => number, decisionOptionId?: string): TransferOffer[] {
  const current = findClub(state.clubId)!
  const value = state.player.marketValueM
  // Bancar a los barras y romperla => un grande de Europa te viene a buscar (salto asegurado).
  if (decisionOptionId === 'barra_stay' && performance >= 0.6) {
    const bigEuro = EURO_CLUBS.filter((c) => c.strength >= 84).sort(() => rng() - 0.5)[0]
    if (bigEuro) {
      return [{
        clubId: bigEuro.id, clubName: bigEuro.name, strength: bigEuro.strength, region: bigEuro.region,
        flag: bigEuro.flag,
        valueM: Math.max(20, Math.round(Math.min(value * (1.8 + rng() * 0.8), topeTraspaso(bigEuro)))),
      }]
    }
  }
  const pushBonus = decisionOptionId === 'push_transfer' ? 0.35 : 0
  const offerChance = clamp(performance * 0.9 + (state.player.ovr - 75) / 100 + pushBonus, 0, 0.97)
  if (rng() > offerChance) return []

  const ovr = state.player.ovr
  const count = 1 + Math.floor(rng() * 3)

  // ── La escalera ──
  //
  // El filtro de antes solo miraba la FUERZA del club, no dónde jugaba. Con 470 clubes eso
  // significa que a alguien del Torneo Federal A le podía llegar una oferta de la Segunda
  // uruguaya, de la Liga 2 peruana y de la Primera B chilena el mismo año, todas equivalentes:
  // no había ninguna carrera que construir, solo clubes intercambiables.
  //
  // Ahora la carrera sube por escalones: primero un club mejor de tu misma categoría, después
  // la de arriba de tu país, después un país más fuerte, y al final Europa. El salto que podés
  // pegar depende de cuánto estés por encima de tu club: un fenómeno en la B se saltea etapas,
  // el resto las camina.
  const nivelActual = nivelDelClub(current)
  // Cada punto de OVR por encima del club habilita más salto. Un jugador parejo con su equipo
  // sube un escalón; uno que le saca 10 puntos puede pegar el salto largo.
  const brecha = ovr - current.strength
  // El tope importa tanto como la fórmula. Con 70, un OVR 68 en la B Metropolitana (nivel 12)
  // recibía oferta de Colo-Colo (nivel 81) en el primer pase. Pero bajarlo a 42 creó el
  // problema opuesto y peor: un OVR 78 en el Torneo Federal A tenía techo de nivel 50, y los 64
  // clubes que podían ficharlo por su nivel estaban de 66 para arriba. Cero ofertas en 120
  // temporadas simuladas — la escalera convertida en jaula.
  //
  // La brecha manda: un jugador parejo con su club sube un escalón, uno que le saca 25 puntos
  // se saltea etapas porque en su categoría ya no hay nadie que lo pueda comprar.
  const saltoMaximo = clamp(12 + brecha * 1.9 + (performance - 0.5) * 14, 8, 66)

  const candidates = ALL_CLUBS.filter((c) => {
    if (c.id === state.clubId) return false
    // Un club NO ficha a alguien muy por debajo de su nivel (nada de River con un OVR bajo).
    if (ovr < c.strength - 7) return false
    // Ni muy por encima: un club chico no compra a una figura, no le da el bolsillo.
    if (c.region !== 'euro' && ovr > c.strength + 8) return false
    const nivelDestino = nivelDelClub(c)

    // Europa es el ÚLTIMO escalón, no un atajo. Este `return` estaba antes del cálculo de nivel
    // y se salteaba la escalera entera: un OVR 78 jugando en el Torneo Federal A recibía oferta
    // del Manchester United sin haber pisado nunca una primera división. Ahora, además del OVR,
    // hay que estar jugando en una liga que ya sea de nivel alto.
    if (c.region === 'euro') {
      if (current.pais === 'Arabia Saudita') {
        // Desde Arabia Saudita, los clubes de Europa rarísimamente vuelven a ofertar.
        return ovr >= 86 && rng() < 0.05
      }
      return ovr >= 78 && performance >= 0.5 && nivelActual >= 60 && c.strength >= current.strength - 3
    }
    // Ni un salto imposible ni un paso atrás grande: nadie deja la Série A por la Primera B.
    if (nivelDestino > nivelActual + saltoMaximo) return false
    if (nivelDestino < nivelActual - 22) return false
    // Y dentro de la misma categoría, tiene que ser un paso adelante.
    if (nivelDestino <= nivelActual + 4 && c.strength < current.strength + 1) return false
    return true
  }).sort(() => rng() - 0.5)

  const aOferta = (c: CareerClub): TransferOffer => {
    const bruto = value * (1.1 + rng() * 0.6) * (c.region === 'euro' ? 1.4 : 1)
    const pagado = Math.min(bruto, topeTraspaso(c))
    return {
      clubId: c.id,
      clubName: c.name,
      strength: c.strength,
      region: c.region,
      flag: c.flag,
      // Bajo 1M se muestra con decimal (un pase de ascenso son cientos de miles, no "1M").
      // El redondeo nunca puede pasarse del tope del club.
      valueM: pagado >= 1
        ? Math.min(Math.round(pagado), topeTraspaso(c))
        : Math.max(0.2, Math.round(pagado * 10) / 10),
    }
  }

  // ── Europa no llama de a uno ──
  const europeos = candidates.filter((c) => c.region === 'euro')
  if (europeos.length >= 2) {
    const patota = europeos.slice(0, clamp(2 + Math.floor(rng() * 3), 2, europeos.length))
    const deAca = candidates.find((c) => c.region !== 'euro')
    const resultOffers = [...patota, ...(deAca ? [deAca] : [])].map(aOferta)

    // Oferta tentadora de Petrodólares de Arabia Saudita
    if (ovr >= 78 && rng() < 0.45) {
      const saudiClub = ALL_CLUBS.filter((c) => c.pais === "Arabia Saudita").sort(() => rng() - 0.5)[0]
      if (saudiClub) {
        resultOffers.unshift({
          clubId: saudiClub.id,
          clubName: `${saudiClub.name}`,
          strength: saudiClub.strength,
          region: saudiClub.region,
          flag: saudiClub.flag,
          valueM: Math.min(Math.round(value * (2.5 + rng() * 2.0)), topeTraspaso(saudiClub)),
        })
      }
    }
    return resultOffers
  }

  // ── Los de tu país te siguen ──
  //
  // Un club te ficha porque te vio, y al que más te ven es en tu país: un peruano que la rompe
  // en el Torneo Federal A lo miran primero de Perú. Es preferencia, no encierro — el resto de
  // las ofertas sigue saliendo de donde salía, así que la carrera no queda atada a la
  // nacionalidad.
  //
  // Europa queda afuera de esta regla a propósito: no hay clubes europeos con nacionalidad
  // argentina, y Europa ya tiene su propia puerta más arriba.
  const paisanos = candidates.filter((c) => c.pais === state.player.nationality)
  const resto = candidates.filter((c) => c.pais !== state.player.nationality)
  const elegidos = paisanos.length
    ? [...paisanos.slice(0, Math.max(1, count - 1)), ...resto].slice(0, count)
    : candidates.slice(0, count)

  return elegidos.map(aOferta)
}

export function advancePlayer(state: CareerState, season: SeasonResult): CareerPlayer {
  const age = state.player.age + 1
  // El OVR ya se evolucionó en simulateSeason (edad + suerte + sustancia + Europa).
  const ovr = season.nextOvr ?? clamp(state.player.ovr, 55, 99)
  return {
    ...state.player,
    age,
    ovr,
    marketValueM: marketValueFor(ovr, age),
  }
}

export function nextContinentalFrom(season: SeasonResult): 'libertadores' | 'sudamericana' {
  return season.liga || season.continentalWon ? 'libertadores' : 'sudamericana'
}

/** ¿El año que viene el club juega el Mundial de Clubes? Se entra ganando la continental. */
export function playsMundialClubesFrom(season: SeasonResult): boolean {
  return Boolean(season.continentalWon)
}
