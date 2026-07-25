import clubsData from '@/data/clubs.json'
import { CONTINENTAL_CLUBS } from './copa-libertadores'

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
  strength: number
  continental: boolean
  region: Region
  flag?: string
  colors?: string[]
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
  }))

export const SUDAM_CLUBS: CareerClub[] = CONTINENTAL_CLUBS.filter(
  (c) => !ARG_CLUBS.some((a) => a.id === c.id),
).map((c) => ({ id: c.id, name: c.name, strength: c.strength.overall, continental: true, region: 'sudam' as Region }))

export const EURO_CLUBS: CareerClub[] = [
  { id: 'real-madrid', name: 'Real Madrid', strength: 90, continental: true, region: 'euro', flag: '🇪🇸' },
  { id: 'fc-barcelona', name: 'FC Barcelona', strength: 88, continental: true, region: 'euro', flag: '🇪🇸' },
  { id: 'manchester-city', name: 'Manchester City', strength: 90, continental: true, region: 'euro', flag: '🏴' },
  { id: 'liverpool', name: 'Liverpool', strength: 88, continental: true, region: 'euro', flag: '🏴' },
  { id: 'bayern-munich', name: 'Bayern Múnich', strength: 89, continental: true, region: 'euro', flag: '🇩🇪' },
  { id: 'paris-saint-germain', name: 'Paris Saint-Germain', strength: 87, continental: true, region: 'euro', flag: '🇫🇷' },
  { id: 'inter-milan', name: 'Inter de Milán', strength: 85, continental: true, region: 'euro', flag: '🇮🇹' },
  { id: 'juventus', name: 'Juventus', strength: 84, continental: true, region: 'euro', flag: '🇮🇹' },
  { id: 'manchester-united', name: 'Manchester United', strength: 83, continental: true, region: 'euro', flag: '🏴' },
  { id: 'atletico-madrid', name: 'Atlético Madrid', strength: 84, continental: true, region: 'euro', flag: '🇪🇸' },
  { id: 'chelsea', name: 'Chelsea', strength: 83, continental: true, region: 'euro', flag: '🏴' },
  { id: 'borussia-dortmund', name: 'Borussia Dortmund', strength: 82, continental: true, region: 'euro', flag: '🇩🇪' },
]

export const ALL_CLUBS: CareerClub[] = [...ARG_CLUBS, ...SUDAM_CLUBS, ...EURO_CLUBS]

export function findClub(id: string): CareerClub | undefined {
  return ALL_CLUBS.find((c) => c.id === id)
}

function argClubStrength(titles: number, libertadores: number, id: string): number {
  const cont = CONTINENTAL_CLUBS.find((c) => c.id === id)
  if (cont) return cont.strength.overall
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

// Interés de la cantera al arrancar: a mayor OVR inicial, más y mejores clubes te buscan.
export function academyInterest(ovr: number, seed: number): CareerClub[] {
  const rng = makeRng(seed >>> 0 || 1)
  const n = ovr >= 74 ? 4 : ovr >= 68 ? 3 : 2
  return [...ARG_CLUBS].sort(() => rng() - 0.5).slice(0, n)
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
  euroScout?: boolean // lo vino a buscar un club de Europa (plus de OVR)
}

export interface Milestones {
  nationalTeam: boolean
  balonDeOro: number
  goldenBoots: number
  worldCup: boolean
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
}

export const MAX_SEASONS = 15

export const TROPHY_META: Record<string, { name: string; icon: string }> = {
  lpf: { name: 'Liga', icon: '⭐' },
  'copa-arg': { name: 'Copa Argentina', icon: '🥛' },
  libertadores: { name: 'Libertadores', icon: '🏆' },
  sudamericana: { name: 'Sudamericana', icon: '🥇' },
  champions: { name: 'Champions League', icon: '🌟' },
  europa: { name: 'Europa League', icon: '🎖️' },
  mundial: { name: 'Mundial', icon: '🌍' },
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

export function marketValueFor(ovr: number, age: number): number {
  const base = Math.pow(clamp(ovr - 59, 1, 41) / 40, 2) * 180
  const ageFactor = age <= 27 ? 1 : Math.max(0.25, 1 - (age - 27) * 0.13)
  return clamp(Math.round(base * ageFactor), 0, 220)
}

// Crecimiento estilo Copero: 100% edad + suerte (el club no influye). El pico es a los 26
// y después solo baja. La sustancia misteriosa suma +5 y un ojeo europeo da un plus.
function nextOvr(
  ovr: number,
  age: number,
  rng: () => number,
  substanceHit = false,
  euroBonus = 0,
): number {
  const luck = rng()
  let delta: number
  if (age < 24) delta = luck < 0.12 ? 0 : luck < 0.55 ? 2 : 3 // joven: sube fuerte
  else if (age <= 26) delta = luck < 0.28 ? 0 : luck < 0.78 ? 1 : 2 // pico a los 26
  else if (age <= 29) delta = luck < 0.55 ? -1 : 0 // empieza a bajar
  else if (age <= 32) delta = luck < 0.35 ? -1 : -2
  else delta = -3 // veterano
  if (substanceHit) delta += 5
  delta += euroBonus
  return clamp(ovr + delta, 55, 99)
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
    head = pick([
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
      ? pick([`${o.name} fue una pared bajo los tres palos de ${o.club} durante todo el torneo.`])
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

  const matchesPlayed = 28 + Math.floor(rng() * 14)

  let bonusGoals = 0
  let bonusAssists = 0
  let bonusTitle = 0

  if (decisionOptionId === 'train_finishing') bonusGoals += 4
  if (decisionOptionId === 'train_vision') bonusAssists += 4
  if (decisionOptionId === 'play_injured') bonusTitle += 0.12
  if (decisionOptionId === 'focus_play') bonusGoals += 2

  const ovrScale = clamp(ovr / 80, 0.6, 1.35)
  const apps = matchesPlayed / 38
  const goals = Math.max(0, Math.round((GOAL_BASE[cat] * ovrScale * apps * (0.6 + rng() * 0.9)) + bonusGoals))
  const assists = Math.max(0, Math.round((ASSIST_BASE[cat] * ovrScale * apps * (0.5 + rng() * 0.9)) + bonusAssists))

  // --- Probabilidades de título estilo Copero (del tweet) ---
  // Efecto Maradona: con 90+ de OVR el juego sube un nivel la reputación del club.
  const maradona = ovr >= 90 ? 6 : 0
  const str = clamp(club.strength + maradona, 60, 92)
  // Margen de OVR: si superás en +10 lo que pide el club, todo x1.6.
  const margin = ovr >= club.strength + 10 ? 1.6 : 1
  // Un club grande gana la liga ~70%, uno chico ~1%.
  const ligaP = clamp(((str - 64) / 19) * 0.7 * margin + 0.005 + bonusTitle, 0.005, 0.9)
  const copaP = clamp(((str - 64) / 19) * 0.45 * margin + 0.04 + bonusTitle, 0.04, 0.55)

  const topTier = state.nextContinental === 'libertadores'
  const contType: ContinentalComp =
    club.region === 'euro' ? (topTier ? 'champions' : 'europa') : topTier ? 'libertadores' : 'sudamericana'
  // Sudamericana / Europa League: solo la ganan los clubes del montón; los grandes 0%.
  // Libertadores / Champions: reservada para los grandes.
  let contP: number
  if (contType === 'sudamericana' || contType === 'europa') {
    contP = club.strength >= 79 ? 0 : clamp(((str - 64) / 15) * 0.35 * margin + 0.05, 0.02, 0.42)
  } else {
    contP = clamp(((str - 70) / 20) * 0.4 * margin + bonusTitle, 0.01, 0.55)
  }

  const liga = rng() < ligaP
  const copaArgentina = club.region === 'arg' && rng() < copaP
  const continentalWon = rng() < contP

  const trophiesWon: string[] = []
  if (liga) trophiesWon.push('lpf')
  if (copaArgentina) trophiesWon.push('copa-arg')
  if (continentalWon) trophiesWon.push(contType)

  const expected = (GOAL_BASE[cat] + ASSIST_BASE[cat]) * ovrScale || 1
  const performance = clamp((goals + assists) / (expected * 1.1), 0, 1)

  const scorerThreshold = cat === 'ATT' ? 15 : cat === 'MID' ? 12 : 999
  const topScorer = goals >= scorerThreshold && rng() < 0.7

  const rating = clamp(Math.round((5.5 + performance * 3.6 + trophiesWon.length * 0.25) * 10) / 10, 5.5, 9.9)

  const CONT_NAME: Record<ContinentalComp, string> = {
    libertadores: 'Copa Libertadores',
    sudamericana: 'Copa Sudamericana',
    champions: 'Champions League',
    europa: 'Europa League',
  }
  const highlights: string[] = []
  if (liga) highlights.push(`🏆 Campeón de la Liga con ${club.name}`)
  if (continentalWon) highlights.push(`${TROPHY_META[contType]?.icon || '🌎'} Levantaste la ${CONT_NAME[contType]}`)
  if (copaArgentina) highlights.push(`🥛 Campeón de la Copa Argentina`)
  if (topScorer) highlights.push(`🥇 Goleador del torneo con ${goals} goles`)
  else if (goals >= 10 && cat === 'ATT') highlights.push(`⚽ Gran temporada: ${goals} goles`)
  if (cat !== 'ATT' && assists >= 10) highlights.push(`🎯 Temporada de ${assists} asistencias`)
  if (rating >= 9) highlights.push(`⭐ Figura del año (nota ${rating.toFixed(1)})`)

  const cronica = buildCronica(
    {
      name: state.player.name,
      club: club.name,
      year,
      age,
      goals,
      assists,
      matches: matchesPlayed,
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

  // Sustancia misteriosa: 75% de +5 OVR (consumila siempre, dice el tweet).
  const substanceHit = decisionOptionId === 'take_substance' && rng() < 0.75
  if (decisionOptionId === 'take_substance') {
    highlights.push(substanceHit ? '🧪 La sustancia misteriosa pegó: +5 OVR' : '🧪 La sustancia no hizo efecto esta vez')
  }
  // Fortuna europea: cada tanto te vienen a buscar de Europa y te da un plus de OVR.
  const euroScout = club.region !== 'euro' && ovr >= 78 && rng() < 0.1
  const euroBonus = euroScout ? 2 : 0
  if (euroScout) highlights.push('✈️ Un grande de Europa puso el ojo en vos: +2 OVR de proyección')

  const grownOvr = nextOvr(ovr, age, rng, substanceHit, euroBonus)

  const season: SeasonResult = {
    year,
    age,
    clubId: club.id,
    clubName: club.name,
    matchesPlayed,
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
    euroScout,
  }

  const offers = generateOffers(state, performance, rng)

  return { season, trophiesWon, offers }
}

function generateOffers(state: CareerState, performance: number, rng: () => number): TransferOffer[] {
  const current = findClub(state.clubId)!
  const value = state.player.marketValueM
  const offerChance = clamp(performance * 0.9 + (state.player.ovr - 75) / 100, 0, 0.95)
  if (rng() > offerChance) return []

  const canEurope = state.player.ovr >= 79 && performance >= 0.5
  const count = 1 + Math.floor(rng() * 3)
  const candidates = ALL_CLUBS.filter((c) => {
    if (c.id === state.clubId) return false
    if (c.region === 'euro') return canEurope && c.strength >= current.strength - 4
    return c.strength >= current.strength - 1
  }).sort(() => rng() - 0.5)

  return candidates.slice(0, count).map((c) => ({
    clubId: c.id,
    clubName: c.name,
    strength: c.strength,
    region: c.region,
    flag: c.flag,
    valueM: Math.max(1, Math.round(value * (1.1 + rng() * 0.6) * (c.region === 'euro' ? 1.4 : 1))),
  }))
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
