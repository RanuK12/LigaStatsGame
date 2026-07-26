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

  // Mundial: años reales (2026, 2030, 2034...) => year % 4 === 2
  if (o.year % 4 === 2) {
    if (o.rng() < tier.wcFreq) {
      const wcMatches = Math.round(2 + starterness * 5 + o.rng())
      const roundIdx = clamp(Math.round((tier.strength - 74) / 5 + (o.rng() - 0.35) * 2.5), 0, 4)
      if (roundIdx === 4 && o.rng() < 0.5) {
        out.worldCupChampion = true
        out.highlights.push(`🌍🏆 ¡CAMPEÓN DEL MUNDO ${o.year} con ${o.nationality}! (${wcMatches} partidos)`)
      } else {
        const others = WC_ELIMINATORS.filter((e) => e !== o.nationality)
        const elim = others[Math.floor(o.rng() * others.length)]
        const roundName =
          roundIdx === 4 ? 'la final' : roundIdx === 3 ? 'semifinal' : roundIdx === 2 ? 'cuartos de final' : roundIdx === 1 ? 'octavos' : 'fase de grupos'
        out.highlights.push(
          roundIdx === 0
            ? `🌎 Mundial ${o.year}: ${wcMatches} partidos con ${o.nationality}. Quedaron eliminados en ${roundName}.`
            : `🌎 Mundial ${o.year}: ${wcMatches} partidos con ${o.nationality}. Llegaron a ${roundName}, perdieron con ${elim}.`,
        )
      }
      out.caps += wcMatches
    } else {
      out.highlights.push(`😞 ${o.nationality} no clasificó al Mundial ${o.year}`)
    }
  }
  return out
}

export function retirementStory(career: CareerState): string {
  const { player } = career
  const peak = Math.max(player.ovr, ...career.history.map((s) => s.nextOvr ?? s.ovr))
  const titles = Object.values(career.trophies).reduce((a, b) => a + b, 0)
  const wc = career.milestones.worldCup
  const lastClub = findClub(career.clubId)?.name || 'su último club'
  const seed = (peak * 131 + titles * 977 + career.startYear * 7 + player.name.length * 13) >>> 0
  const rng = makeRng(seed || 1)

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
  euroScout?: boolean // lo vino a buscar un club de Europa (plus de OVR)
  performance?: number // 0..1, rendimiento de la temporada (para selección/eventos)
  barrabravas?: boolean // temporada floja en Argentina: te apretaron los barras
  cleanSheets?: number // vallas invictas (arqueros/defensores)
  ballonDor?: boolean // ganaste el Balón de Oro esa temporada
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

// Valor de mercado realista (€M). Curva exponencial por OVR + curva de edad con pico 23-27
// y castigo a los muy jóvenes (potencial sin confirmar). Ej: 59/18≈0, 72/18≈8, 80/24≈50,
// 88/26≈115, 95/25≈200.
export function marketValueFor(ovr: number, age: number): number {
  const q = clamp((ovr - 55) / 40, 0, 1)
  const base = Math.pow(q, 3.2) * 230
  let ageF: number
  if (age <= 17) ageF = 0.45
  else if (age <= 19) ageF = 0.62
  else if (age <= 21) ageF = 0.82
  else if (age <= 27) ageF = 1
  else if (age <= 30) ageF = 0.72
  else if (age <= 33) ageF = 0.42
  else ageF = 0.18
  return clamp(Math.round(base * ageF), 0, 220)
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
  // El OVR de la próxima temporada respeta el techo por edad (age+1).
  return clamp(ovr + delta, 55, ovrCapForAge(age + 1))
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
  // Barrabravas: bancar da un empujón a la chance de romperla (y saltar a Europa).
  if (decisionOptionId === 'barra_stay') bonusTitle += 0.06

  const ovrScale = clamp(ovr / 80, 0.6, 1.35)
  const apps = matchesPlayed / 38
  const goals = Math.max(0, Math.round((GOAL_BASE[cat] * ovrScale * apps * (0.6 + rng() * 0.9)) + bonusGoals))
  const assists = Math.max(0, Math.round((ASSIST_BASE[cat] * ovrScale * apps * (0.5 + rng() * 0.9)) + bonusAssists))
  // Vallas invictas (arqueros/defensores): dependen del OVR y la fuerza del club.
  const keepsCleanSheets = cat === 'GK' || cat === 'DEF'
  const csRate = keepsCleanSheets ? clamp(0.12 + (ovr - 70) / 120 + (club.strength - 72) / 130, 0.05, 0.55) : 0
  const cleanSheets = Math.round(matchesPlayed * csRate * (0.7 + rng() * 0.6))

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

  // Rendimiento por posición: arquero/defensor rinden por vallas invictas, no por goles.
  let performance: number
  if (keepsCleanSheets) {
    const csRatio = matchesPlayed > 0 ? cleanSheets / matchesPlayed : 0
    performance = clamp((csRatio / 0.45) * 0.85 + ((goals + assists) / 8) * 0.15, 0, 1)
  } else {
    const expected = (GOAL_BASE[cat] + ASSIST_BASE[cat]) * ovrScale || 1
    performance = clamp((goals + assists) / (expected * 1.1), 0, 1)
  }

  const scorerThreshold = cat === 'ATT' ? 15 : cat === 'MID' ? 12 : 999
  const topScorer = goals >= scorerThreshold && rng() < 0.7
  // Premio a la valla menos vencida (arqueros con muchas vallas invictas).
  const goldenGlove = cat === 'GK' && cleanSheets >= Math.round(matchesPlayed * 0.4) && rng() < 0.6

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
  const highlights: string[] = []
  if (liga) highlights.push(`🏆 Campeón de la Liga con ${club.name}`)
  if (continentalWon) highlights.push(`${TROPHY_META[contType]?.icon || '🌎'} Levantaste la ${CONT_NAME[contType]}`)
  if (copaArgentina) highlights.push(`🥛 Campeón de la Copa Argentina`)
  if (topScorer) highlights.push(`🥇 Goleador del torneo con ${goals} goles`)
  else if (goals >= 10 && cat === 'ATT') highlights.push(`⚽ Gran temporada: ${goals} goles`)
  if (cat !== 'ATT' && assists >= 10) highlights.push(`🎯 Temporada de ${assists} asistencias`)
  // Arqueros y defensores: carteles por vallas invictas (no por goles).
  if (goldenGlove) highlights.push(`🧤 Arquero menos vencido: ${cleanSheets} vallas invictas`)
  else if (keepsCleanSheets && cleanSheets >= 8) highlights.push(`🧤 ${cleanSheets} vallas invictas`)
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

  let grownOvr = nextOvr(ovr, age, rng, substanceHit, euroBonus)
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
    performance,
    barrabravas,
    cleanSheets,
  }

  const offers = generateOffers(state, performance, rng, decisionOptionId)

  return { season, trophiesWon, offers }
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
        flag: bigEuro.flag, valueM: Math.max(20, Math.round(value * (1.8 + rng() * 0.8))),
      }]
    }
  }
  const offerChance = clamp(performance * 0.9 + (state.player.ovr - 75) / 100, 0, 0.95)
  if (rng() > offerChance) return []

  const ovr = state.player.ovr
  const count = 1 + Math.floor(rng() * 3)
  const candidates = ALL_CLUBS.filter((c) => {
    if (c.id === state.clubId) return false
    // Un club NO ficha a alguien muy por debajo de su nivel (nada de River con un OVR bajo).
    if (ovr < c.strength - 7) return false
    if (c.region === 'euro') return ovr >= 78 && performance >= 0.5 && c.strength >= current.strength - 3
    // Tiene que ser un paso adelante (o lateral), no un club peor.
    return c.strength >= current.strength - 2
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
