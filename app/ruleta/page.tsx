"use client"

import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import wheelData from '@/data/derived/ruleta-wheel.json'
import clubsData from '@/data/clubs.json'
import type { Player, Club } from '@/lib/types'
import { normalizePlayers, normalizeClubs } from '@/lib/data-normalizers'

const posColors: Record<string, string> = {
  GK: '#f59e0b',
  CB: '#3b82f6',
  LB: '#06b6d4',
  RB: '#06b6d4',
  CM: '#10b981',
  CDM: '#059669',
  CAM: '#8b5cf6',
  LW: '#ef4444',
  RW: '#ef4444',
  ST: '#dc2626',
  CF: '#ea580c',
  LM: '#ef4444',
  RM: '#ef4444',
  LWB: '#06b6d4',
  RWB: '#06b6d4',
}

const LEGEND_BIOGRAPHIES: Record<string, string> = {
  "messi-lionel-1987": "El mejor jugador de todos los tiempos. Surgido de Newell's y consagrado en el FC Barcelona, lideró a la Selección Argentina a la conquista de la Copa América 2021, la Finalissima 2022 y el Mundial de Qatar 2022, logrando la ansiada tercera estrella.",
  "maradona-diego-1960": "El eterno 'Diez'. Ídolo absoluto y símbolo del fútbol argentino. Su inolvidable campaña en el Mundial de México 1986, con el 'Gol del Siglo' y la 'Mano de Dios' ante Inglaterra, lo consagró como leyenda universal del deporte.",
  "daniel-passarella": "El 'Gran Capitán'. Único futbolista argentino bicampeón del mundo (1978 y 1986). Zaguero central de enorme temperamento, gran cabezazo y uno de los defensores más goleadores en la historia del fútbol mundial.",
  "batistuta-gabriel-1969": "'Batigol'. Uno de los delanteros centro más letales de la historia de la Selección. Goleador histórico indiscutido con potencia física arrolladora y remates devastadores que dejaron huella en Newell's, River, Boca y la Fiorentina.",
  "javier-zanetti": "'Pupi'. Símbolo de constancia, conducta y profesionalismo. Histórico capitán del Inter de Milán y segundo jugador con más presencias en la Selección Argentina. Defensor incansable que brilló en Banfield y el Calcio.",
  "juan-roman-riquelme": "El último gran 'Diez' pensante. Ídolo supremo de Boca Juniors, donde conquistó tres Copas Libertadores e intercontinentales con una visión de juego, control de balón y pegada magistrales que definieron una era.",
  "mario-kempes": "'El Matador'. Héroe indiscutido del primer Mundial ganado por Argentina en 1978, donde fue el goleador del torneo y marcó dos goles en la gran final ante Holanda. Potente delantero que brilló en Central y Valencia.",
  "ubaldo-fillol": "'El Pato'. Considerado por muchos el mejor arquero en la historia del fútbol argentino. Clave en el título mundial de 1978 por sus reflejos felinos y su capacidad única para tapar mano a mano memorables.",
  "angel-di-maria": "'Fideo'. Jugador de partidos decisivos. Marcó los goles de la victoria en las finales de los Juegos Olímpicos 2008, Copa América 2021, Finalissima 2022 y la final del Mundial de Qatar 2022. Leyenda eterna.",
  "martinez-emiliano-1992": "'Dibu'. Arquero carismático y fundamental en la época dorada de la Scaloneta. Sus históricas atajadas ante Francia en la final de Qatar 2022 y en las series de penales lo convirtieron en un prócer nacional.",
  "roberto-perfumo": "'El Mariscal'. Uno de los mejores zagueros de la historia de la Liga. Lideró la defensa de Racing Club en su época dorada ganando la Libertadores e Intercontinental, y luego brilló con clase mundial en River y Cruzeiro.",
  "fernando-redondo": "Un mediocampista central de elegancia pura e inteligencia táctica incomparable. De estilo fino y zurda prodigiosa, brilló en Argentinos Juniors y fue figura consagrada en el Real Madrid ganando múltiples Champions.",
  "juan-sebastian-veron": "'La Brujita'. Volante de pegada excelsa, visión periférica y gran liderazgo. Lideró a Estudiantes de La Plata a ganar la Copa Libertadores 2009 y tuvo una destacada carrera en Europa (Manchester United, Lazio, Inter).",
  "ricardo-bochini": "'El Bocha'. Máximo ídolo de Independiente de Avellaneda, donde jugó toda su carrera ganando 4 Copas Libertadores. Su juego de pases precisos inspiró el término 'pase bochinesco' y al propio Diego Maradona.",
  "carlos-tevez": "'El Apache'. El jugador del pueblo. Ganador serial que conquistó títulos en Boca, Corinthians, Inglaterra e Italia. Dueño de una garra y potencia física indomables que lo hicieron ídolo en cada club que pisó.",
  "enzo-francescoli": "'El Príncipe'. Elegante mediapunta uruguayo e ídolo de River Plate. Lideró al Millonario a la obtención de la Libertadores 1996 con su clase, técnica depurada y goles espectaculares que inspiraron a Zinedine Zidane.",
  "alfredo-di-ste-fano-1926": "La 'Saeta Rubia'. Uno de los más grandes de la historia. Surgido de River, brilló en Millonarios y se hizo eterno en el Real Madrid, donde ganó cinco Copas de Europa consecutivas. Delantero total que definía y creaba juego.",
  "sergio-agu-ero-1988": "'El Kun'. Máximo goleador histórico del Manchester City y de los más letales que dio la Argentina. Su gol en el último minuto para dar el título a los Citizens en 2012 es uno de los más recordados del fútbol inglés.",
  "gonzalo-higuai-n-1987": "'El Pipita'. Uno de los '9' más finos de su generación. Goleador implacable en River, Real Madrid, Napoli (récord de 36 goles en una Serie A) y Juventus. Dueño de una definición y movimientos de área exquisitos.",
  "pablo-aimar-1979": "'El Payaso'. Enganche de gambeta exquisita y clase infinita, ídolo de River y del Valencia. Fue el ídolo confeso de la infancia de Lionel Messi, que lo señaló siempre como su jugador favorito.",
  "esteban-cambiasso-1980": "'El Cuchu'. Volante central inteligente y ganador serial. Motor del Inter del Triplete 2010 y pieza clave del Real Madrid de los Galácticos. Recuperación, orden y llegada al gol desde el mediocampo.",
  "paulo-dybala-1993": "'La Joya'. Talento de zurda mágica y definición de otro planeta. Brilló en la Juventus y fue héroe entrando en la final del Mundial de Qatar 2022, convirtiendo su penal en la histórica consagración argentina.",
  "mauro-icardi-1993": "Killer de área puro. Capitán y goleador histórico del Inter, donde ganó dos veces el título de máximo artillero de la Serie A. Delantero de instinto letal y una eficacia demoledora dentro del área rival."
}

// Los dos íconos máximos: reveal aún más especial.
const ICONS = new Set(["messi-lionel-1987", "maradona-diego-1960"])

const FULL_SPINS = 7
const ANIMATION_DURATION_MS = 3600

export default function RuletaPage() {
  const allPlayers = useMemo(() => normalizePlayers(wheelData), [])
  const allClubs = useMemo(() => normalizeClubs(clubsData), [])
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Player | null>(null)
  const [spinCount, setSpinCount] = useState(0)
  const [history, setHistory] = useState<Player[]>([])
  const [rotation, setRotation] = useState(0)
  const [targetIndex, setTargetIndex] = useState<number | null>(null)

  const wheelPlayers = useMemo(() => {
    const sorted = [...allPlayers]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 16)

    return sorted.length > 0 ? sorted : allPlayers.slice(0, 16)
  }, [allPlayers])

  const sectorAngle = wheelPlayers.length > 0 ? 360 / wheelPlayers.length : 360

  const spin = () => {
    if (spinning || wheelPlayers.length === 0) return

    setSpinning(true)
    setResult(null)

    const randomIdx = Math.floor(Math.random() * wheelPlayers.length)
    const player = wheelPlayers[randomIdx]
    const sectorCenter = randomIdx * sectorAngle + sectorAngle / 2
    const targetAngle = (360 - sectorCenter) % 360
    const currentMod = rotation % 360
    let delta = targetAngle - currentMod
    if (delta < 0) delta += 360
    const newRotation = rotation + FULL_SPINS * 360 + delta

    setTargetIndex(randomIdx)
    setRotation(newRotation)

    setTimeout(() => {
      setResult(player)
      setSpinning(false)
      setSpinCount((count) => count + 1)
      setHistory((current) => [player, ...current].slice(0, 10))
    }, ANIMATION_DURATION_MS)
  }

  const getClubInfo = (player: Player): Club | undefined => {
    return allClubs.find((club) =>
      player.clubs?.some((playerClub) => playerClub.id === club.id || playerClub.name === club.name)
    )
  }

  const resultClub = result ? getClubInfo(result) : undefined
  const isLegend = (result?.rating || 0) >= 89
  const isIcon = result ? ICONS.has(result.id) : false

  return (
    <div className="min-h-screen gradient-bg">
      <header className="pt-12 pb-6 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="mb-3 text-sm font-bold uppercase tracking-[0.35em] text-[#74ACDF]">
            Scouting argentino
          </p>

          <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight uppercase">
            <span className="bg-gradient-to-r from-[#74ACDF] via-white to-[#D4AF37] bg-clip-text text-transparent">Ruleta del Fútbol</span>
          </h1>

          <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">
            Girá la ruleta y descubrí una leyenda o figura histórica del fútbol argentino.
          </p>
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-20 space-y-8">
        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="relative z-20 mb-[-6px]">
            <div className="h-0 w-0 border-l-[18px] border-r-[18px] border-t-[34px] border-l-transparent border-r-transparent border-t-[#D4AF37] drop-shadow-[0_0_14px_rgba(212,175,55,0.75)]" />
          </div>

          <div className="relative h-72 w-72 md:h-96 md:w-96">
            <div className="absolute -inset-8 rounded-full bg-gradient-to-br from-[#74ACDF]/20 via-[#74ACDF]/8 to-[#D4AF37]/14 blur-3xl" />
            <div className="absolute -inset-2 rounded-full border border-white/10" />
            <div className="absolute inset-0 rounded-full wheel-shell" />

            <motion.div
              className="relative z-10 h-full w-full overflow-hidden rounded-full border-[10px] border-white/5 bg-slate-900 shadow-inner"
              animate={{
                rotate: rotation,
                scale: spinning ? [1, 1.025, 1] : 1,
                filter: spinning ? 'blur(0.4px)' : 'blur(0px)',
              }}
              transition={{
                rotate: { duration: ANIMATION_DURATION_MS / 1000, ease: [0.12, 0.75, 0.22, 1] },
                scale: { duration: 0.35, repeat: spinning ? Infinity : 0 },
              }}
            >
              <svg viewBox="0 0 100 100" className="h-full w-full">
                {wheelPlayers.map((player, i) => {
                  const startAngle = i * sectorAngle
                  const endAngle = (i + 1) * sectorAngle
                  const startRad = (startAngle - 90) * Math.PI / 180
                  const endRad = (endAngle - 90) * Math.PI / 180
                  const x1 = 50 + 50 * Math.cos(startRad)
                  const y1 = 50 + 50 * Math.sin(startRad)
                  const x2 = 50 + 50 * Math.cos(endRad)
                  const y2 = 50 + 50 * Math.sin(endRad)
                  const midRad = ((startAngle + endAngle) / 2 - 90) * Math.PI / 180
                  const textX = 50 + 31 * Math.cos(midRad)
                  const textY = 50 + 31 * Math.sin(midRad)
                  // Paleta celeste/navy visible sobre el fondo oscuro (el texto es blanco).
                  const colors = ['#3a6ea5','#1e3a5f','#4f86bd','#274b73','#3a6ea5','#1e3a5f','#4f86bd','#274b73','#3a6ea5','#1e3a5f','#4f86bd','#274b73','#3a6ea5','#1e3a5f','#4f86bd','#274b73']
                  const textAngle = (startAngle + endAngle) / 2
                  const selected = targetIndex === i && spinning

                  return (
                    <g key={player.id}>
                      <path
                        d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                        fill={selected ? '#74ACDF' : colors[i % colors.length]}
                        stroke="#94a3b8"
                        strokeWidth="0.25"
                      />
                      <text
                        x={textX}
                        y={textY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="3"
                        fontWeight="900"
                        transform={`rotate(${textAngle}, ${textX}, ${textY})`}
                      >
                        {player.name.split(' ').pop()?.slice(0, 10)}
                      </text>
                    </g>
                  )
                })}

                <circle cx="50" cy="50" r="10" fill="#020617" stroke="#D4AF37" strokeWidth="0.8"/>
                <path d="M50,46.5 L51.2,49.5 L54.5,49.5 L51.8,51.5 L52.8,54.5 L50,52.5 L47.2,54.5 L48.2,51.5 L45.5,49.5 L48.8,49.5 Z" fill="#D4AF37" />
              </svg>
            </motion.div>

            <motion.div
              className="absolute left-1/2 top-1/2 z-20 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 shadow-[0_0_24px_rgba(116,172,223,0.16)]"
              animate={spinning ? { rotate: [0, -8, 8, -4, 4, 0] } : { rotate: 0 }}
              transition={{ duration: 0.35, repeat: spinning ? Infinity : 0 }}
            >
              <svg className="w-8 h-8 text-[#D4AF37] fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
              </svg>
            </motion.div>
          </div>

          {spinning && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-full border border-orange-400/20 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-200"
            >
              Buscando una joya del fútbol argentino...
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: spinning ? 1 : 1.02 }}
            whileTap={{ scale: spinning ? 1 : 0.98 }}
            onClick={spin}
            disabled={spinning || wheelPlayers.length === 0}
            className={`mt-8 px-10 py-4.5 text-base font-bold uppercase tracking-[0.35em] rounded-2xl shadow-xl transition-all font-sport ${
              spinning
                ? 'cursor-not-allowed bg-slate-900 border border-slate-800 text-slate-500 opacity-50'
                : 'btn-gold shadow-yellow-500/10 hover:shadow-yellow-500/20'
            }`}
          >
            {spinning ? 'GIRANDO...' : 'GIRAR RULETA'}
          </motion.button>

          <div className="mt-4 text-sm text-slate-500">
            {spinCount > 0 ? `${spinCount} giros realizados` : `${wheelPlayers.length} candidatos en la rueda`}
          </div>
        </motion.section>

        <AnimatePresence>
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 40, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto max-w-md"
            >
              <div className={`card-glass relative rounded-3xl border p-8 shadow-2xl ${isIcon ? 'border-[#FFD700] shadow-[0_0_90px_rgba(255,215,0,0.5)] ring-1 ring-[#74ACDF]/40' : isLegend ? 'border-[#D4AF37]/30 shadow-[0_0_60px_rgba(212,175,55,0.22)]' : 'border-white/5'}`}>
                {isIcon && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-4xl drop-shadow-[0_2px_8px_rgba(255,215,0,0.6)] animate-bounce">👑</div>
                )}
                {isLegend && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
                    {Array.from({ length: 14 }).map((_, i) => (
                      <span
                        key={i}
                        className="absolute animate-pulse text-[#D4AF37]"
                        style={{ left: `${8 + (i * 6) % 84}%`, top: `${10 + (i * 11) % 76}%`, opacity: 0.45 + (i % 3) * 0.1 }}
                      >
                        ✦
                      </span>
                    ))}
                  </div>
                )}
                <div className="mb-6 text-center">
                  <div className={`mb-2 text-xs font-black uppercase tracking-[0.25em] font-sport ${isIcon ? 'text-[#FFD700] animate-pulse' : 'text-slate-500'}`}>
                    {isIcon ? '★ ÍCONO ETERNO ★' : 'LEYENDA SORTEADA'}
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-black text-white shadow-lg font-sport"
                      style={{ backgroundColor: posColors[result.position] || '#666' }}
                    >
                      {result.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    <div className="text-left">
                      <h2 className="text-2xl font-black">{result.name}</h2>
                      <div className="text-sm text-slate-400">
                        {result.position} • {result.decade}
                      </div>

                      {result.clubs && result.clubs.length > 0 && (
                        <div className="mt-1 text-sm text-slate-400">
                          {result.clubs[0].name} ({result.clubs[0].years})
                        </div>
                      )}

                      {resultClub && (
                        <div className="mt-1 text-xs text-[#75AADB]">
                          {resultClub.nickname}
                        </div>
                      )}
                    </div>
                  </div>

                  {result.legendary && (
                    <div className="mt-2 text-xs font-bold uppercase tracking-wider text-yellow-400 font-sport">Jugador legendario</div>
                  )}
                </div>

                {LEGEND_BIOGRAPHIES[result.id] && (
                  <div className="mb-6 border-l-2 border-[#74ACDF]/50 pl-3 py-1 text-xs sm:text-sm text-slate-300 italic font-sans leading-relaxed text-left">
                    "{LEGEND_BIOGRAPHIES[result.id]}"
                  </div>
                )}

                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center backdrop-blur-md">
                    <div className="text-2xl font-black text-yellow-400">{result.rating}</div>
                    <div className="text-xs text-slate-400">Rating</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center backdrop-blur-md">
                    <div className="text-2xl font-black text-green-400">{result.goalsClub}</div>
                    <div className="text-xs text-slate-400">Goles Club</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center backdrop-blur-md">
                    <div className="text-2xl font-black text-blue-400">{result.capsClub}</div>
                    <div className="text-xs text-slate-400">Partidos</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center backdrop-blur-md">
                    <div className="text-2xl font-black text-purple-400">{result.goalsNationalTeam}</div>
                    <div className="text-xs text-slate-400">Goles Selección</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center backdrop-blur-md">
                    <div className="text-2xl font-black text-cyan-400">{result.capsNationalTeam}</div>
                    <div className="text-xs text-slate-400">Partidos Selección</div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-3 text-center backdrop-blur-md">
                    <div className="text-2xl font-black text-orange-400">{result.assistsClub}</div>
                    <div className="text-xs text-slate-400">Asistencias</div>
                  </div>
                </div>

                {result.clubs && result.clubs.length > 0 && (
                  <div className="mb-4 rounded-2xl bg-white/5 border border-white/5 p-4 backdrop-blur-md">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-sport text-left">Trayectoria de Clubes</div>
                    {result.clubs.map((club, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="font-semibold">{club.name}</span>
                        <span className="text-slate-400">{club.years}</span>
                      </div>
                    ))}
                  </div>
                )}

                {result.trophies && result.trophies.length > 0 && (
                  <div className="rounded-2xl bg-white/5 border border-white/5 p-4 backdrop-blur-md">
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 font-sport text-left">Títulos y Palmarés</div>
                    <div className="flex flex-wrap gap-2">
                      {result.trophies.slice(0, 6).map((t, i) => (
                        <span key={i} className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs text-yellow-300">
                          {t.competition} {t.year}
                        </span>
                      ))}
                      {result.trophies.length > 6 && (
                        <span className="rounded-lg bg-slate-700 px-2 py-1 text-xs text-slate-300">
                          +{result.trophies.length - 6} más
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {history.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <h2 className="font-display text-sm font-bold tracking-widest text-[#74ACDF] uppercase">HISTORIAL DE SORTEOS ({history.length})</h2>

            <div className="flex gap-3 overflow-x-auto pb-2">
              {history.map((p, i) => (
                <div
                  key={`${p.id}-${i}`}
                  className="w-40 flex-shrink-0 rounded-xl border border-slate-900 bg-slate-950/40 p-3"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white font-sport shrink-0"
                      style={{ backgroundColor: posColors[p.position] }}
                    >
                      {p.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-sport">OVR: {p.rating}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        <div className="pt-4 text-center">
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary px-8 py-4 text-xs font-sport"
            >
              VOLVER AL INICIO
            </motion.button>
          </Link>
        </div>
      </main>
    </div>
  )
}
