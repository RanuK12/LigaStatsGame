"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import type { TournamentResult, RoundMatch, ScheduleMatch } from "@/lib/types"
import { POS_LABELS } from "@/lib/game-engine"
import { getPC } from "@/lib/ui-constants"
import MatchChronicleFeed from "./MatchChronicleFeed"
import TorneoEnVivo from "./TorneoEnVivo"
import ShareBar from "@/components/ShareBar"
import { urlDeEquipo, type JugadorCompartido } from "@/lib/equipo-link"
import DonationSection from "@/components/DonationSection"
import GuardarProgreso from "@/components/GuardarProgreso"
import EventBurst from "@/components/ui/EventBurst"
import { tocar } from "@/lib/sonido"
import { storyBlob } from "@/lib/story-card"
import { trackEvent, EVENTOS } from "@/components/Analytics"
import Image from "next/image"
import { useT } from "@/lib/i18n"

export default function TournamentView({ result, onBack, onReset, onDownloadPDF, elo, reto, bloques, once, onFinal }: {
  result: TournamentResult
    onBack: () => void
  onReset: () => void
  onDownloadPDF: () => void
  /**
   * Se llama UNA vez, cuando aparece la ficha final.
   *
   * Los carteles de "¡CLASIFICASTE!" y del reto diario cuentan el final del torneo. Si se
   * disparan al entrar acá, se leen mientras todavía se está eligiendo cómo verlo: spoiler.
   */
  onFinal?: () => void
  /** Lo que movió este torneo en el ranking. Sin esto la ficha no cierra: el jugador ve cómo
   *  le fue pero no qué se llevó. */
  elo?: { nuevo: number; delta: number; pts: number } | null
  /** Si la partida salió del reto del día, para que el link compartido lleve al MISMO bombo. */
  reto?: { id: string; titulo: string }
  /** El resultado del reto en cuadraditos de color, listo para pegar en un grupo. */
  bloques?: string
  /** El once armado, para que el link compartido MUESTRE el equipo en vez de llevar a la portada. */
  once?: JugadorCompartido[]
}) {
  const t = useT()
  // Simulation modality state
  // "intro" = choosing mode, "interactive" = playing step-by-step, "animating" = showing match feed,
  // "reveal" = el torneo entero corriendo fecha por fecha, "done" = final results
  const [simState, setSimState] = useState<"intro" | "interactive" | "animating" | "reveal" | "done">("intro")
  const [currentStep, setCurrentStep] = useState(0)
  const [tab, setTab] = useState<"table" | "stats" | "assisters" | "schedule" | "relatos">("table")
  const [matchIdx, setMatchIdx] = useState(0)
  const [chroniclePlaying, setChroniclePlaying] = useState<any | null>(null)

  const isChamp = result.isChampion
  // El estallido de campeón. Ganar la Libertadores pasa una de cada veinte veces con un once
  // bueno, y se festejaba con una estrellita de 28px que hacía un scale. EventBurst ya estaba
  // escrito, ya respeta prefers-reduced-motion y ya es CSS puro: solo faltaba enchufarlo acá.
  const [festejo, setFestejo] = useState(false)
  useEffect(() => {
    if (!isChamp) return
    const t = setTimeout(() => { setFestejo(true); tocar("campeon") }, 350)
    return () => clearTimeout(t)
  }, [isChamp])
  const hasChronicle = (result.chronicle?.length ?? 0) > 0
  const totalRounds = result.rounds?.length ?? 0
  const currentChronicle = result.chronicle?.[matchIdx]

  // Correctly set default tab based on tournament type
  useEffect(() => {
    setTab(result.type === "liga" ? "table" : "stats")
  }, [result])

  // Recalculate intermediate league table up to current step (round index)
  const intermediateTable = useMemo(() => {
    if (result.type !== "liga" || !result.rounds || simState === "done") {
      return result.table || []
    }
    
    interface LigaTeam { name: string; pts: number; gf: number; ga: number; w: number; d: number; l: number; form: string[] }
    const teamsMap: Record<string, LigaTeam> = {}
    
    // Initialize teams list
    const firstRound = result.rounds[0]
    if (firstRound) {
      firstRound.matches.forEach(m => {
        if (!teamsMap[m.home]) teamsMap[m.home] = { name: m.home, pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, form: [] }
        if (!teamsMap[m.away]) teamsMap[m.away] = { name: m.away, pts: 0, gf: 0, ga: 0, w: 0, d: 0, l: 0, form: [] }
      })
    }

    // Accumulate scores up to currentStep (exclusive of active unplayed step)
    const activeStepLimit = simState === "animating" ? currentStep : currentStep
    for (let r = 0; r < activeStepLimit; r++) {
      const round = result.rounds[r]
      if (!round) continue
      round.matches.forEach(m => {
        const h = teamsMap[m.home]
        const a = teamsMap[m.away]
        if (!h || !a) return
        h.gf += m.homeGoals
        h.ga += m.awayGoals
        a.gf += m.awayGoals
        a.ga += m.homeGoals
        if (m.homeGoals > m.awayGoals) {
          h.pts += 3; h.w++; a.l++
          h.form.push('V'); a.form.push('D')
        } else if (m.homeGoals < m.awayGoals) {
          a.pts += 3; a.w++; h.l++
          h.form.push('D'); a.form.push('V')
        } else {
          h.pts++; a.pts++; h.d++; a.d++
          h.form.push('E'); a.form.push('E')
        }
        if (h.form.length > 5) h.form.shift()
        if (a.form.length > 5) a.form.shift()
      })
    }

    return Object.values(teamsMap).sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga) || b.gf - a.gf)
  }, [result, currentStep, simState])

  // Recalculate intermediate player stats up to current step
  const intermediatePlayerStats = useMemo(() => {
    if (!result.playerStats || simState === "done") {
      return {
        list: result.playerStats || [],
        topScorers: result.topScorers || [],
        topAssisters: result.topAssisters || []
      }
    }

    const statsMap: Record<string, any> = {}
    result.playerStats.forEach(p => {
      statsMap[p.playerId] = {
        playerId: p.playerId,
        playerName: p.playerName,
        position: p.position,
        goals: 0,
        assists: 0,
        matchesPlayed: 0,
        yellowCards: 0,
        redCards: 0
      }
    })

    const activeStepLimit = simState === "animating" ? currentStep : currentStep
    for (let r = 0; r < activeStepLimit; r++) {
      const ch = result.chronicle?.[r]
      if (!ch) continue

      Object.keys(statsMap).forEach(id => {
        statsMap[id].matchesPlayed += 1
      })

      // Add goals & assists from match records
      if (ch.myGoalsByPlayer) {
        Object.entries(ch.myGoalsByPlayer).forEach(([playerId, goals]) => {
          if (statsMap[playerId]) statsMap[playerId].goals += goals
        })
      }
      if (ch.myAssistsByPlayer) {
        Object.entries(ch.myAssistsByPlayer).forEach(([playerId, assists]) => {
          if (statsMap[playerId]) statsMap[playerId].assists += assists
        })
      }

      // Add cards from event logs
      if (ch.events) {
        ch.events.forEach(ev => {
          if (ev.type === "amarilla" && ev.playerId && statsMap[ev.playerId]) {
            statsMap[ev.playerId].yellowCards += 1
          }
          if (ev.type === "roja" && ev.playerId && statsMap[ev.playerId]) {
            statsMap[ev.playerId].redCards += 1
          }
        })
      }
    }

    const list = Object.values(statsMap)
    const topScorers = [...list].sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    const topAssisters = [...list].sort((a, b) => b.assists - a.assists || b.goals - a.goals)

    return { list, topScorers, topAssisters }
  }, [result, currentStep, simState])

  // Los partidos que se revelan fecha por fecha. En la liga van TODOS los de la zona, porque con
  // ellos se arma el fixture y la tabla en vivo; en las copas, solo los del usuario.
  const equiposDelReveal = result.type === "liga" ? (result.table ?? []).map((t) => t.name) : undefined
  const partidosDelReveal = useMemo(() => {
    const todos = result.schedule ?? result.rounds?.flatMap((x) => x.matches) ?? []
    return equiposDelReveal ? todos : todos.filter((m) => m.home === result.teamLabel || m.away === result.teamLabel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result])
  const nombreTorneo = result.continental === "libertadores" ? "Copa Libertadores"
    : result.continental === "sudamericana" ? "Copa Sudamericana"
    : result.type === "liga" ? "Liga Profesional" : "Copa Argentina"

  // La ficha final apareció: recién ahí se pueden cantar los carteles que cuentan cómo terminó.
  const finalAvisado = useRef(false)
  useEffect(() => {
    if (simState !== "done" || finalAvisado.current) return
    finalAvisado.current = true
    onFinal?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simState])

  // Get active round details
  const activeRound = result.rounds?.[currentStep]
  const userMatchInRound = useMemo(() => {
    if (!activeRound) return null
    return activeRound.matches.find(m => m.home === result.teamLabel || m.away === result.teamLabel) || null
  }, [activeRound, result.teamLabel])

  const userChronicleForRound = result.chronicle?.[currentStep]

  /**
   * El torneo entero, corriéndose fecha por fecha.
   *
   * Antes esto saltaba directo a la tabla final y el reveal lo lanzaba la página del draft ANTES
   * de llegar acá: el torneo se corría solo y recién después esta pantalla preguntaba cómo querías
   * verlo, o sea que ofrecía simular algo que ya habías visto. Ahora se elige primero y el reveal
   * vive donde vive la decisión. Se saltea tocando la pantalla, que es el "ir al resultado".
   */
  const handleStartFullSim = () => {
    setSimState(partidosDelReveal.length >= 3 ? "reveal" : "done")
  }

  const handleStartStepSim = () => {
    setCurrentStep(0)
    setSimState("interactive")
  }

  const handleStartHalfSim = () => {
    const half = Math.floor(totalRounds / 2)
    setCurrentStep(half)
    setSimState("interactive")
  }

  const handlePlayRound = () => {
    if (userChronicleForRound) {
      setChroniclePlaying(userChronicleForRound)
      setSimState("animating")
    } else {
      // If player team is eliminated in Cup, just advance the round instantly
      handleNextRound()
    }
  }

  const handleNextRound = () => {
    setChroniclePlaying(null)
    const nextStep = currentStep + 1
    if (nextStep >= totalRounds) {
      setSimState("done")
    } else {
      setCurrentStep(nextStep)
      setSimState("interactive")
    }
  }

  // Saltar de a 5 fechas sin perder la tabla ni las estadísticas en vivo
  const handleSkipFive = () => {
    setChroniclePlaying(null)
    const nextStep = currentStep + 5
    if (nextStep >= totalRounds) {
      setSimState("done")
    } else {
      setCurrentStep(nextStep)
      setSimState("interactive")
    }
  }

  // Mensaje ya armado según lo que pasó en el torneo
  const goles = result.playerStats.reduce((a, p) => a + p.goals, 0)
  const asistencias = result.playerStats.reduce((a, p) => a + p.assists, 0)
  const goleador = result.topScorers[0]
  const asistidor = result.topAssisters[0]

  /**
   * El cierre de la ficha, distinto por torneo.
   *
   * En Copa lo que se cuenta es el camino —a quién eliminaste y dónde te quedaste—, que es lo que
   * uno responde cuando le preguntan cómo le fue. En Liga, quién fue el goleador y el asistidor
   * del plantel, que es lo que mira un hincha.
   */
  // La copa continental tiene nombre propio, color propio y una historia propia que contar: no es
  // "la copa" genérica. Todo lo que la distingue sale de acá.
  const copa = result.continental
    ? result.continental === "libertadores"
      ? { nombre: "Copa Libertadores", corto: "Libertadores", gentilicio: "CAMPEÓN DE AMÉRICA", color: "#F6C750", emoji: "🏆" }
      : { nombre: "Copa Sudamericana", corto: "Sudamericana", gentilicio: "CAMPEÓN DE LA SUDAMERICANA", color: "#F0883E", emoji: "🥈" }
    : null
  // Hasta dónde llegaste, dicho como se dice en el fútbol. "Eliminado en Semifinal" es una derrota;
  // "Semifinalista de la Libertadores" es algo que se cuenta.
  const llegadaCopa = !copa ? null
    : result.isChampion ? `Campeón de la ${copa.corto}`
    : result.eliminatedRound === "Final" ? `Finalista de la ${copa.corto}`
    : result.eliminatedRound === "Semifinal" ? `Semifinalista de la ${copa.corto}`
    : result.eliminatedRound === "Cuartos de Final" ? `Cuartos de final de la ${copa.corto}`
    : result.eliminatedRound === "Octavos de Final" ? `Octavos de final de la ${copa.corto}`
    : `Fase de grupos de la ${copa.corto}`

  const cierreFicha = (() => {
    if (copa) {
      const partes = [llegadaCopa!]
      if (result.groupPos) partes.push(`${result.groupPos}° del grupo`)
      if (goleador?.playerName && goleador.goals > 0) partes.push(`${goleador.playerName}, ${goleador.goals} goles`)
      if (!result.isChampion && result.champion) partes.push(`Campeón: ${result.champion}`)
      return partes.join(" · ")
    }
    if (result.type === "copa") {
      const rondas = result.rounds?.length ?? 0
      const llegada = result.isChampion
        ? `Campeón tras ${rondas} rondas`
        : result.eliminated
        ? `Eliminado en ${result.eliminatedRound}`
        : "Subcampeón"
      return goleador?.playerName ? `${llegada} · ${goleador.playerName} fue el goleador` : llegada
    }
    const partes: string[] = []
    if (goleador?.playerName) partes.push(`Goleador: ${goleador.playerName} (${goleador.goals})`)
    if (asistidor?.playerName && asistidor.assists > 0) partes.push(`Asistidor: ${asistidor.playerName} (${asistidor.assists})`)
    if (!result.isChampion && result.champion) partes.push(`Campeón: ${result.champion}`)
    return partes.join(" · ") || undefined
  })()
  // El texto del reto va con el resultado y sin spoiler del once: es lo que hace comparable dos
  // partidas distintas. Sin esto, compartir era "jugué a algo" y el que abría no sabía a qué.
  const sufijoReto = reto ? `\n\nReto de hoy: ${reto.titulo}. Mismo bombo para todos. ¿Cuánto sacás vos?` : ""

  // Cómo terminó, en tres palabras. Es el titular de la ficha y del link que se comparte.
  const tituloResultado = isChamp
    ? "¡Campeón!"
    : result.type === "liga"
    ? `${result.playerPos}° puesto`
    : result.eliminated
    ? `Eliminado en ${result.eliminatedRound}`
    : "Subcampeón"

  /**
   * A dónde lleva el link que se comparte.
   *
   * Antes llevaba a la portada salvo en el reto del día, así que el que lo abría no veía el
   * equipo de nadie. Ahora lleva al once, con el bombo del reto adentro cuando lo hubo: el que
   * abre ve el equipo Y puede jugar la misma partida.
   */
  const urlDelOnce = once && once.length > 0
    ? urlDeEquipo({
        formacion: result.formation,
        once,
        ovr: result.teamScore,
        resultado: tituloResultado,
        torneo: result.type === "liga" ? "Liga Profesional" : "Copa Argentina",
        reto: reto?.id,
      })
    : undefined

  const textoParaCompartir = copa
    ? isChamp
      ? `¡${copa.gentilicio}! ${copa.emoji} Clasifiqué con mi 11 (OVR ${result.teamScore}) y gané la ${copa.nombre} en Gambeta, con ${goles} goles. La plaza se gana jugando la Liga: a ver si llegás`
      : `${llegadaCopa} en Gambeta con mi 11 (OVR ${result.teamScore}). La clasificación me la gané saliendo ${result.groupPos ? "" : ""}entre los primeros de la Liga. Armá el tuyo y contame hasta dónde llegás`
    : isChamp
    ? `¡SALÍ CAMPEÓN en Gambeta! 🏆 Armé mi 11 con ${result.teamLabel} (OVR ${result.teamScore}) y me quedé con la ${result.type === "liga" ? "Liga Profesional" : "Copa Argentina"} con ${goles} goles. ¿Podés hacerlo mejor?`
    : result.type === "liga"
    ? `Terminé ${result.playerPos}° de ${result.table?.length ?? 28} en Gambeta con mi 11 (OVR ${result.teamScore}) y ${goles} goles. A ver si vos armás un equipo mejor 👀`
    : `Jugué la Copa Argentina en Gambeta con mi 11 (OVR ${result.teamScore})${result.eliminated ? ` y quedé en ${result.eliminatedRound}` : ""}. Armá el tuyo y contame`

  const finalTabs = result.type === "liga"
    ? [{ id: "table", label: "Tabla" }, { id: "stats", label: "Goleadores" }, { id: "assisters", label: "Asistencias" }]
    : [{ id: "stats", label: "Goles" }, { id: "assisters", label: "Asistencias" }]
  if (hasChronicle) finalTabs.push({ id: "relatos", label: "Relatos" })

  return (
    <div className="min-h-screen gradient-bg arg-stripe-bg text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence>

          {/* 1. INTRO SCREEN: SELECT SIMULATION SPEED */}
          {simState === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-gradient rounded-3xl p-6 sm:p-10 border border-white/5 text-center"
            >
              <div className="relative w-[50px] h-[70px] mx-auto mb-6">
                <Image src="/logos/afa.png" alt="AFA" fill className="object-contain animate-pulse drop-shadow-lg" />
              </div>
              <h2 className="font-bandera text-2xl sm:text-4xl text-white mb-3 uppercase tracking-[0.14em]">
                {t('TournamentView.modoDeSimulacion', 'MODO DE SIMULACIÓN')}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mb-6 max-w-sm mx-auto font-sans leading-relaxed">
                Elegí cómo querés vivir el torneo de tu 11 ideal en la {result.type === "liga" ? "Liga Profesional" : "Copa Argentina"}.
              </p>

              {/* Dificultad: sale del nivel real de los rivales que tocaron */}
              {typeof result.rivalAvg === "number" && result.rivalAvg > 0 && (() => {
                const d = result.teamScore - result.rivalAvg
                const nivel =
                  d >= 6
                    ? { label: "Dificultad baja", detalle: "Sos favorito del torneo", color: "#34D399" }
                    : d >= -2
                    ? { label: "Dificultad pareja", detalle: "Liga peleada de arriba a abajo", color: "#9CCBF0" }
                    : d >= -8
                    ? { label: "Dificultad alta", detalle: "Hay planteles más fuertes que el tuyo", color: "#FBBF24" }
                    : { label: "Dificultad durísima", detalle: "Te tocó un torneo de época", color: "#F87171" }
                return (
                  <div className="mb-8 inline-flex flex-col items-center gap-1 rounded-2xl border px-5 py-3" style={{ borderColor: `${nivel.color}55`, background: `${nivel.color}12` }}>
                    <span className="font-sport text-[11px] font-black uppercase tracking-widest" style={{ color: nivel.color }}>
                      {nivel.label}
                    </span>
                    <span className="text-[11px] text-slate-400 font-sans">{nivel.detalle}</span>
                    <span className="text-[10px] text-slate-500 font-sport uppercase tracking-wider">
                      Tu 11: {result.teamScore} · Rivales: {result.rivalAvg}
                    </span>
                  </div>
                )
              })()}
              {/* Cada opción dice qué hace: antes eran tres botones que sonaban igual y no se
                  sabía cuál era largo, cuál corto ni cuál te dejaba jugar los partidos. */}
              <div className="mx-auto flex max-w-xs flex-col gap-2.5 font-sport">
                {[
                  {
                    onClick: handleStartStepSim,
                    label: t('TournamentView.partidoAPartido', 'Partido a Partido'),
                    nota: t('TournamentView.notaPartidoAPartido', 'Jugás cada fecha con el relato en vivo'),
                    primario: true,
                  },
                  {
                    onClick: handleStartHalfSim,
                    label: t('TournamentView.simularMitadDeTorneo', 'Simular Mitad de Torneo'),
                    nota: t('TournamentView.notaMitad', 'Arrancás a jugar desde la mitad del torneo'),
                    primario: false,
                  },
                  {
                    onClick: handleStartFullSim,
                    label: t('TournamentView.simularTorneoEntero', 'Simular Torneo Entero'),
                    nota: t('TournamentView.notaEntero', 'Corre solo, fecha por fecha, en segundos'),
                    primario: false,
                  },
                ].map((op) => (
                  <button
                    key={op.label}
                    onClick={op.onClick}
                    className={`group w-full rounded-2xl border px-5 py-3.5 text-left transition-all duration-300 ${
                      op.primario
                        ? 'border-[#74ACDF]/45 bg-[#74ACDF]/[0.10] hover:border-[#74ACDF] hover:bg-[#74ACDF]/[0.16]'
                        : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className={`block text-[11px] font-black uppercase tracking-[0.12em] ${op.primario ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                      {op.label}
                    </span>
                    <span className="mt-1 block font-sans text-[10.5px] leading-snug text-slate-500">{op.nota}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* 2. INTERACTIVE ROUND SCREEN */}
          {simState === "interactive" && activeRound && (
            <motion.div
              key="interactive"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Round Header */}
              <div className="card-gradient rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#74ACDF] tracking-widest uppercase font-sport">
                    {t('TournamentView.simulando', 'Simulando')}
                  </div>
                  <h3 className="font-display text-xl font-black uppercase tracking-tight">
                    {activeRound.round}
                  </h3>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleSkipFive} className="text-[10px] text-slate-500 hover:text-white transition-colors font-sport uppercase tracking-wider font-bold">
                    +5 fechas
                  </button>
                  {/* Saltar es ir al resultado, no arrancar el reveal: el que ya está jugando
                      fecha por fecha y toca esto quiere la tabla final, no otros cinco segundos. */}
                  <button onClick={() => setSimState("done")} className="text-[10px] text-slate-500 hover:text-white transition-colors font-sport uppercase tracking-wider font-bold">
                    {t('TournamentView.saltarSimulacion', 'Saltar simulación ⏩')}
                  </button>
                </div>
              </div>

              {/* User Match Banner */}
              {userMatchInRound && (
                <div className="card-gradient rounded-3xl p-6 border border-[#74ACDF]/20 shadow-[0_0_20px_rgba(116,172,223,0.06)] text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#74ACDF]/40 to-transparent" />
                  <span className="text-[11px] font-bold text-[#74ACDF] uppercase tracking-widest font-sport block mb-3">{t('TournamentView.tuPartido', 'TU PARTIDO')}</span>
                  <div className="flex items-center justify-center gap-4 sm:gap-6">
                    <span className="font-display font-black text-sm sm:text-base text-white max-w-[140px] truncate">{userMatchInRound.home}</span>
                    <span className="px-3.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-black text-[#74ACDF] font-sport">VS</span>
                    <span className="font-display font-black text-sm sm:text-base text-white max-w-[140px] truncate">{userMatchInRound.away}</span>
                  </div>
                  <button onClick={handlePlayRound} className="btn-primary mt-6 px-10 py-3.5 text-[11px] font-bold tracking-widest uppercase font-sport">
                    {t('TournamentView.jugarPartido', 'JUGAR PARTIDO')}
                  </button>
                </div>
              )}

              {/* Rest of Matches in Round */}
              <div className="card-gradient rounded-2xl p-4 border border-white/5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sport mb-3">{t('TournamentView.otrosCrucesDeLa', 'OTROS CRUCES DE LA FECHA')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeRound.matches
                    .filter(m => m.home !== result.teamLabel && m.away !== result.teamLabel)
                    .map((m, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-2 rounded bg-slate-950/40 border border-slate-900/60">
                        <span className="truncate max-w-[90px] text-slate-400 font-medium">{m.home}</span>
                        <span className="font-bold text-slate-500">vs</span>
                        <span className="truncate max-w-[90px] text-slate-400 font-medium text-right">{m.away}</span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Dynamic Standing Table (only for Liga) — tabla COMPLETA, scrolleable */}
              {result.type === "liga" && (
                <div className="card-gradient rounded-xl p-4 border border-slate-900">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sport mb-3">
                    TABLA DE POSICIONES EN VIVO · {intermediateTable.length} EQUIPOS
                  </h4>
                  <div className="overflow-auto max-h-[380px]">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="table-header-sticky text-slate-600 border-b border-white/5 font-bold uppercase">
                          <th className="py-1 text-left">#</th>
                          <th className="py-1 text-left">{t('TournamentView.equipo2', 'Equipo')}</th>
                          <th className="py-1 text-center">Pts</th>
                          <th className="py-1 text-center">PJ</th>
                          <th className="py-1 text-center">DG</th>
                        </tr>
                      </thead>
                      <tbody>
                        {intermediateTable.map((t: any, idx: number) => {
                          const isMe = t.name === result.teamLabel
                          const dg = t.gf - t.ga
                          return (
                            <tr key={idx} className={`table-row-soft ${isMe ? "table-row-highlight font-bold" : ""}`}>
                              <td className="py-1.5 text-slate-500">{idx + 1}</td>
                              <td className="py-1.5 truncate max-w-[130px] text-white">
                                {isMe ? <span className="text-[#74ACDF]">▶ {t.name}</span> : t.name}
                              </td>
                              <td className="py-1.5 text-center text-[#74ACDF] font-bold">{t.pts}</td>
                              <td className="py-1.5 text-center text-slate-500">{t.w + t.d + t.l}</td>
                              <td className={`py-1.5 text-center ${dg > 0 ? "text-green-400" : dg < 0 ? "text-red-400" : "text-slate-500"}`}>
                                {dg > 0 ? "+" : ""}{dg}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Goleadores y asistidores del plantel, actualizados fecha a fecha */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="card-gradient rounded-xl p-4 border border-slate-900">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sport mb-3">{t('TournamentView.goleadores', 'GOLEADORES')}</h4>
                  <div className="space-y-1.5">
                    {intermediatePlayerStats.topScorers.slice(0, 5).map((p: any) => (
                      <div key={p.playerId} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[150px] text-slate-300">{p.playerName}</span>
                        <span className="font-black text-green-400 font-display">{p.goals}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="card-gradient rounded-xl p-4 border border-slate-900">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sport mb-3">{t('TournamentView.asistidores', 'ASISTIDORES')}</h4>
                  <div className="space-y-1.5">
                    {intermediatePlayerStats.topAssisters.slice(0, 5).map((p: any) => (
                      <div key={p.playerId} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[150px] text-slate-300">{p.playerName}</span>
                        <span className="font-black text-blue-400 font-display">{p.assists}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3. PARTIDO ANIMATING / EVENT FEED */}
          {simState === "animating" && chroniclePlaying && (
            <motion.div
              key="animating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              <div className="card-gradient rounded-2xl p-4 sm:p-6 border border-slate-900">
                {/* El marcador ya lo lleva el relato y crece con los goles: repetirlo abajo, con el
                    resultado final, contaba el partido antes de que terminara de contarse. */}
                <MatchChronicleFeed chronicle={chroniclePlaying} local={result.teamLabel} />

                <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
                  <button onClick={handleNextRound} className="btn-primary px-10 py-3.5 text-[11px] font-bold tracking-widest uppercase font-sport">
                    {currentStep + 1 >= totalRounds ? "Ver Resultados Finales" : "Siguiente Fecha"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* 3 bis. EL TORNEO ENTERO, FECHA POR FECHA */}
          {simState === "reveal" && (
            <TorneoEnVivo
              key="reveal"
              partidos={partidosDelReveal}
              equipos={equiposDelReveal}
              equipo={result.teamLabel}
              torneo={nombreTorneo}
              onListo={() => setSimState("done")}
            />
          )}

          {/* 4. FINAL RESULTS VIEW */}
          {simState === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Champion / Result banner */}
              <div className={`rounded-2xl p-6 text-center border relative overflow-hidden ${
                isChamp
                  ? "bg-gradient-to-br from-yellow-500/20 via-amber-500/15 to-yellow-600/10 border-yellow-400/40 shadow-[0_0_40px_rgba(251,191,36,0.25)]"
                  : result.type === "copa" && result.eliminated
                  ? "card-gradient border-slate-900"
                  : "card-gradient border-[#74ACDF]/30"
              }`}>
                {isChamp && (
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: [0, 1.25, 1] }}
                    transition={{ type: "spring", stiffness: 180, damping: 12, delay: 0.15 }}
                    className="flex justify-center mb-3">
                    {/* La copa de verdad, no una estrella genérica de 28px. El SVG ya existe y ya
                        se usa a 80px en el home; acá es el premio, así que va grande. */}
                    {copa ? (
                      <img
                        src={`/logos/trofeos/${result.continental}.svg`}
                        alt={copa.nombre}
                        className="h-32 w-32 object-contain sm:h-40 sm:w-40"
                        style={{ filter: `drop-shadow(0 0 28px ${copa.color}66)` }}
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10">
                        <svg className="h-10 w-10 fill-current text-[#D4AF37]" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* El estallido de campeón: destello, rayos y Sol de Mayo. Es el momento más
                    difícil del juego y hasta ahora se festejaba con un scale de medio segundo. */}
                <EventBurst
                  show={festejo}
                  tone="oro"
                  label={copa ? copa.gentilicio : "¡CAMPEÓN!"}
                  duration={2400}
                  onDone={() => setFestejo(false)}
                />

                {/* LPF logo on the tournament final view if it's Liga */}
                {result.type === "liga" && (
                  <div className="absolute top-4 right-4 w-7 h-10 opacity-30">
                    <Image src="/logos/lpf.png" alt="LPF" fill className="object-contain" />
                  </div>
                )}

                <h1
                  className="font-display text-3xl font-black mb-1 uppercase tracking-tight"
                  style={copa && isChamp ? { color: copa.color } : undefined}
                >
                  {copa
                    ? isChamp ? `¡${copa.gentilicio}!` : llegadaCopa
                    : isChamp
                    ? "¡CAMPEÓN!"
                    : result.type === "copa" && result.eliminated
                    ? `Eliminado en ${result.eliminatedRound}`
                    : result.type === "liga"
                    ? `Posición ${result.playerPos}° de ${result.table?.length}`
                    : "Subcampeón"}
                </h1>
                {isChamp && !copa && (
                  <p className="text-yellow-300 font-bold text-xs mb-2 font-sport tracking-widest uppercase">
                    ¡{result.teamLabel} ES CAMPEÓN DEL TORNEO!
                  </p>
                )}
                {!isChamp && !copa && (
                  <p className="text-slate-400 text-xs mb-2 font-sport uppercase tracking-wider">
                    {result.type === "copa" && result.eliminated
                      ? "Seguí intentando, el próximo draft será mejor."
                      : `El campeón fue ${result.champion}. ¡Mejor suerte en el próximo draft!`}
                  </p>
                )}

                {/* ── La ficha de la copa continental ──
                    Ganarla es lo más difícil que tiene el juego (con un once de 78 pasa una de cada
                    seis veces en la Libertadores), así que la ficha tiene que estar a la altura. Y
                    perderla tampoco es cualquier cosa: llegaste porque clasificaste jugando. */}
                {copa && (
                  <div
                    className="mt-3 mb-3 rounded-2xl border px-4 py-3.5 text-center"
                    style={{
                      borderColor: isChamp ? `${copa.color}66` : "rgba(148,163,184,0.18)",
                      background: isChamp
                        ? `linear-gradient(180deg, ${copa.color}1f, rgba(2,8,19,0.5))`
                        : "rgba(2,8,19,0.4)",
                      boxShadow: isChamp ? `0 0 40px ${copa.color}33` : undefined,
                    }}
                  >
                    <p className="font-sport text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: copa.color }}>
                      {copa.nombre}
                    </p>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-slate-300 font-sans">
                      {isChamp ? (
                        <>
                          {t('TournamentView.disteLaVueltaCon', 'Diste la vuelta con')} <strong className="text-white">{result.teamLabel.replace(/ \(.*\)$/, "")}</strong>.
                          No la elegiste de un menú: la clasificación te la ganaste en la Liga, la jugaste con este
                          mismo once y lo ganaste todo.
                        </>
                      ) : (
                        <>
                          {t('TournamentView.llegasteHasta', 'Llegaste hasta')} <strong className="text-white">{result.eliminatedRound}</strong> con un once
                          que armaste vos y una plaza que te ganaste jugando. El campeón fue{" "}
                          <strong className="text-white">{result.champion}</strong>.
                        </>
                      )}
                    </p>
                    {result.groupPos && (
                      <p className="mt-2 text-[10px] font-sport uppercase tracking-wider text-slate-500">
                        {result.groupPos}° en la fase de grupos · {result.rounds?.length ?? 0} partidos jugados
                        {goles > 0 ? ` · ${goles} goles` : ""}
                      </p>
                    )}
                  </div>
                )}

                {/* Division Outcome Banners for Liga */}
                {result.type === "liga" && result.playerPos && result.playerPos >= (result.table?.length ? result.table.length - 1 : 27) && (
                  <div className="mt-3.5 mb-2.5 p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 text-xs font-bold leading-relaxed text-center shadow-[0_0_12px_rgba(239,68,68,0.1)] uppercase font-sport tracking-wider">
                    {t('TournamentView.zonaDeDescensoTu', 'ZONA DE DESCENSO — Tu equipo quedó en los últimos dos puestos y desciende a la Primera Nacional.')}
                  </div>
                )}
                {result.type === "liga" && result.playerPos && result.playerPos <= 4 && !isChamp && (
                  <div className="mt-3.5 mb-2.5 p-3 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-200 text-xs font-bold leading-relaxed text-center uppercase font-sport tracking-wider">
                    {t('TournamentView.clasificadoALaCopa', 'CLASIFICADO A LA COPA LIBERTADORES — Tu once jugará el torneo continental más prestigioso.')}
                  </div>
                )}
                {result.type === "liga" && result.playerPos && result.playerPos >= 5 && result.playerPos <= 10 && (
                  <div className="mt-3.5 mb-2.5 p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-xs font-bold leading-relaxed text-center uppercase font-sport tracking-wider">
                    {t('TournamentView.clasificadoALaCopa2', 'CLASIFICADO A LA COPA SUDAMERICANA — Aseguraste competencia internacional para la próxima temporada.')}
                  </div>
                )}
                {result.type === "liga" && result.playerPos && result.playerPos >= 11 && result.playerPos <= (result.table?.length ? result.table.length - 2 : 26) && (
                  <div className="mt-3.5 mb-2.5 p-3 rounded-xl border border-slate-700 bg-slate-800/20 text-slate-300 text-xs font-bold leading-relaxed text-center uppercase font-sport tracking-wider">
                    {t('TournamentView.permanenciaAseguradaMantuvisteLa', 'PERMANENCIA ASEGURADA — Mantuviste la categoría en la Liga Profesional de Fútbol.')}
                  </div>
                )}

                <div className="flex items-center justify-center gap-3.5 text-[10px] font-bold uppercase tracking-wider font-sport text-slate-500 flex-wrap">
                  <span>{result.teamLabel}</span>
                  <span>·</span>
                  <span>{result.formation}</span>
                  <span>·</span>
                  <span className="text-[#74ACDF]">Score: {result.teamScore} pts</span>
                </div>
              </div>

              {/* Quick stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="card-gradient rounded-xl p-3 text-center border border-slate-900">
                  <div className="text-2xl font-black text-green-400 font-display">{result.playerStats.reduce((s, p) => s + p.goals, 0)}</div>
                  <div className="text-[11px] text-[#74ACDF]/60 font-bold uppercase tracking-widest font-sport mt-0.5">{t('TournamentView.goles', 'Goles')}</div>
                </div>
                <div className="card-gradient rounded-xl p-3 text-center border border-slate-900">
                  <div className="text-2xl font-black text-blue-400 font-display">{result.playerStats.reduce((s, p) => s + p.assists, 0)}</div>
                  <div className="text-[11px] text-[#74ACDF]/60 font-bold uppercase tracking-widest font-sport mt-0.5">{t('TournamentView.asistencias', 'Asistencias')}</div>
                </div>
                <div className="card-gradient rounded-xl p-3 text-center border border-slate-900">
                  <div className="text-2xl font-black text-yellow-400 font-display">{result.playerStats[0]?.matchesPlayed || 0}</div>
                  <div className="text-[11px] text-[#74ACDF]/60 font-bold uppercase tracking-widest font-sport mt-0.5">{t('TournamentView.partidos', 'Partidos')}</div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 font-sport">
                {finalTabs.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id as any)}
                    className={`px-5 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase whitespace-nowrap transition-all ${
                      tab === t.id ? "tab-active" : "tab-inactive"
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>

              {/* TABLE TAB */}
              {tab === "table" && result.table && (
                <div className="card-gradient rounded-2xl p-4 sm:p-5 border border-[#74ACDF]/10">
                  <div className="overflow-x-auto -mx-1">
                    <table className="w-full text-xs min-w-[520px]">
                      <thead>
                        <tr className="table-header-sticky text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                          <th className="py-2.5 pl-2 text-left w-8">#</th>
                          <th className="py-2.5 text-left">{t('TournamentView.equipo2', 'Equipo')}</th>
                          <th className="py-2.5 text-center w-8">PJ</th>
                          <th className="py-2.5 text-center w-10">Pts</th>
                          <th className="py-2.5 text-center w-8">GF</th>
                          <th className="py-2.5 text-center w-8">GC</th>
                          <th className="py-2.5 text-center w-10">DG</th>
                          <th className="py-2.5 text-center pr-2">{t('TournamentView.forma', 'Forma')}</th>
                        </tr>
                      </thead>
                      <tbody className="table-zebra">
                        {result.table.map((t: any, idx: number) => {
                          const isMe = t.name === result.teamLabel
                          const totalTeams = result.table!.length
                          return (
                            <tr key={idx} className={`border-b border-white/[0.04] transition-colors ${isMe ? "table-row-user font-semibold" : ""}`}>
                              <td className="py-2.5 pl-2 pr-1">
                                <span className={`inline-flex w-5 h-5 items-center justify-center rounded-full text-[11px] font-black font-sport ${
                                  idx < 4
                                    ? "bg-blue-600/25 text-blue-400 border border-blue-500/40"
                                    : idx < 10
                                    ? "bg-emerald-600/25 text-emerald-400 border border-emerald-500/40"
                                    : idx >= totalTeams - 2
                                    ? "bg-red-600/25 text-red-400 border border-red-500/40"
                                    : "bg-slate-950/60 text-slate-500 border border-slate-800"
                                }`}>
                                  {idx + 1}
                                </span>
                              </td>
                              <td className="py-2.5 truncate max-w-[150px]">
                                {isMe
                                  ? <span className="text-[#74ACDF] font-bold">▶ {t.name}</span>
                                  : <span className="text-slate-200">{t.name}</span>}
                              </td>
                              <td className="py-2.5 text-center text-slate-500">{t.w + t.d + t.l}</td>
                              <td className="py-2.5 text-center text-[#74ACDF] font-black text-sm">{t.pts}</td>
                              <td className="py-2.5 text-center text-slate-400">{t.gf}</td>
                              <td className="py-2.5 text-center text-slate-400">{t.ga}</td>
                              <td className={`py-2.5 text-center font-semibold ${t.gf - t.ga > 0 ? "text-green-400" : t.gf - t.ga < 0 ? "text-red-400" : "text-slate-500"}`}>{t.gf - t.ga > 0 ? "+" : ""}{t.gf - t.ga}</td>
                              <td className="py-2.5 text-center pr-2">
                                {t.form.map((r: string, j: number) => (
                                  <span key={j} className={`form-badge ${
                                    r === "V" ? "form-badge-v" : r === "E" ? "form-badge-e" : "form-badge-d"
                                  }`}>{r}</span>
                                ))}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#74ACDF]/10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[11px] font-bold font-sport uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600/30 border border-blue-500/40" /> 1-4: Libertadores</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-600/30 border border-emerald-500/40" /> 5-10: Sudamericana</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600/30 border border-red-500/40" /> {t('TournamentView.ultimos2Descenso', 'Últimos 2: Descenso')}</span>
                  </div>
                </div>
              )}

              {/* SCORERS TAB */}
              {tab === "stats" && (
                <div className="card-gradient rounded-2xl p-4 border border-slate-900">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sport mb-4">{t('TournamentView.tablaDeGoleadores', 'TABLA DE GOLEADORES')}</h3>
                  <div className="space-y-2">
                    {result.topScorers.slice(0, 10).map((p, idx) => (
                      <div key={p.playerId} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                        idx === 0 ? "bg-yellow-500/10 border border-[#D4AF37]/30" : "bg-slate-950/40 border border-slate-900/60"
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-sport ${
                          idx === 0 ? "bg-[#D4AF37] text-black" : "bg-slate-800 text-slate-400"
                        }`}>{idx + 1}</div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 font-sport"
                          style={{ backgroundColor: getPC(p.position) }}>
                          {p.playerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-white truncate">{p.playerName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{POS_LABELS[p.position] || p.position} · {p.matchesPlayed} Partidos</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-green-400 font-display">{p.goals}</div>
                          <div className="text-[11px] text-slate-500">{p.assists} Asistencias</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ASSISTERS TAB */}
              {tab === "assisters" && (
                <div className="card-gradient rounded-2xl p-4 border border-slate-900">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sport mb-4">{t('TournamentView.tablaDeAsistencias', 'TABLA DE ASISTENCIAS')}</h3>
                  <div className="space-y-2">
                    {result.topAssisters.slice(0, 10).map((p, idx) => (
                      <div key={p.playerId} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                        idx === 0 ? "bg-blue-500/10 border border-blue-400/30" : "bg-slate-950/40 border border-slate-900/60"
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-sport ${
                          idx === 0 ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"
                        }`}>{idx + 1}</div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 font-sport"
                          style={{ backgroundColor: getPC(p.position) }}>
                          {p.playerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-white truncate">{p.playerName}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{POS_LABELS[p.position] || p.position} · {p.matchesPlayed} Partidos</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-blue-400 font-display">{p.assists}</div>
                          <div className="text-[11px] text-slate-500">{p.goals} Goles</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tabla del grupo (solo copas continentales: la Copa Argentina no tiene grupos) */}
              {result.type === "copa" && result.groupTable && tab === "stats" && (
                <div className="card-gradient rounded-2xl p-4 border border-white/5 mt-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sport mb-3">
                    {t('TournamentView.faseDeGruposPasan', 'FASE DE GRUPOS · PASAN LOS DOS PRIMEROS')}
                  </h3>
                  <div className="space-y-1">
                    {result.groupTable.map((row, i) => {
                      const soyYo = row.name === result.teamLabel.replace(/ \(.*\)$/, "")
                      return (
                        <div key={row.name} className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                          soyYo ? "bg-[#74ACDF]/10 border-[#74ACDF]/30" : i < 2 ? "bg-emerald-500/5 border-emerald-400/15" : "bg-slate-950/20 border-white/5"
                        }`}>
                          <span className={`w-5 text-center font-black font-sport ${i < 2 ? "text-emerald-300" : "text-slate-600"}`}>{i + 1}</span>
                          <span className={`flex-1 truncate font-bold ${soyYo ? "text-white" : "text-slate-400"}`}>{row.name}</span>
                          <span className="text-[10px] text-slate-500 font-sport">{row.w}-{row.d}-{row.l}</span>
                          <span className="w-10 text-right text-[10px] text-slate-500 font-sport">{row.gf}:{row.ga}</span>
                          <span className="w-7 text-right font-black text-white font-sport">{row.pts}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Copa rounds bracket (if Copa) */}
              {result.type === "copa" && result.rounds && tab === "stats" && (
                <div className="card-gradient rounded-2xl p-4 border border-white/5 mt-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sport mb-4">
                    {result.groupTable ? `CAMINO EN LA ${result.teamLabel.replace(/^.*\(|\)$/g, "").toUpperCase()}` : "CRUCES DE LA COPA ARGENTINA"}
                  </h3>
                  {result.rounds.map((round: any, ri: number) => (
                    <div key={ri} className="mb-5 last:mb-0">
                      <h4 className="text-[10px] font-bold text-[#74ACDF] uppercase tracking-widest font-sport mb-2.5">{round.round}</h4>
                      <div className="space-y-1.5">
                        {round.matches.map((m: any, mi: number) => {
                          const isMe = m.home === result.teamLabel || m.away === result.teamLabel
                          return (
                            <div key={mi} className={`flex items-center justify-between text-xs px-3 py-2 rounded-2xl border ${
                              isMe ? "bg-[#74ACDF]/8 border-[#74ACDF]/20 shadow-[0_0_12px_rgba(116,172,223,0.04)]" : "bg-slate-950/20 border-white/5"
                            }`}>
                              <span className={`flex flex-1 items-center justify-end gap-1.5 truncate font-bold ${m.homeGoals > m.awayGoals ? "text-white" : "text-slate-500"}`}>
                                <span className="truncate max-w-[110px]">{m.home}</span>
                                {m.homeId && <img src={`/logos/continental/${m.homeId}.svg`} alt="" className="h-5 w-5 shrink-0 object-contain" />}
                              </span>
                              <span className="px-3.5 py-0.5 rounded-lg bg-slate-950 font-bold text-[10px] text-slate-300 font-sport">
                                {m.homeGoals} - {m.awayGoals}
                                {m.penalties && <span className="text-[#FFD700] ml-1">({m.penalties}p)</span>}
                              </span>
                              <span className={`flex flex-1 items-center gap-1.5 truncate font-bold ${m.awayGoals > m.homeGoals ? "text-white" : "text-slate-500"}`}>
                                {m.awayId && <img src={`/logos/continental/${m.awayId}.svg`} alt="" className="h-5 w-5 shrink-0 object-contain" />}
                                <span className="truncate max-w-[110px]">{m.away}</span>
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* RELATOS TAB */}
              {tab === "relatos" && hasChronicle && (
                <div className="card-gradient rounded-2xl p-4 border border-slate-900">
                  <select
                    value={matchIdx}
                    onChange={e => setMatchIdx(Number(e.target.value))}
                    className="w-full mb-4 rounded-xl bg-slate-950 border border-slate-900 text-xs font-bold text-white px-3 py-2.5 focus:outline-none focus:border-[#74ACDF]/40 font-sport uppercase tracking-wider">
                    {result.chronicle!.map((c, i) => (
                      <option key={i} value={i} className="bg-[#020813] text-white">
                        {c.roundLabel ? `${c.roundLabel} · ` : `Fecha ${i + 1} · `}
                        {c.isHome ? `${c.myGoals}-${c.oppGoals}` : `${c.oppGoals}-${c.myGoals}`} vs {c.opponent}
                        {c.penalties ? ` (${c.penalties}p)` : ""}
                      </option>
                    ))}
                  </select>
                  {currentChronicle && <MatchChronicleFeed chronicle={currentChronicle} local={result.teamLabel} />}
                </div>
              )}

              {/* Lo que te llevaste al ranking. Antes el torneo terminaba y el ELO se movía sin
                  que se viera: el jugador no tenía forma de saber que había ganado algo. */}
              {elo && (
                <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-[#74ACDF]/25 bg-slate-950/50 px-5 py-4">
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#74ACDF] font-sport">
                      {t('TournamentView.ranking', 'Ranking')}
                    </div>
                    <div className="mt-1 font-display text-xl font-black leading-none text-white">
                      {elo.nuevo} <span className="text-sm text-slate-500">ELO</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-display text-2xl font-black leading-none ${
                        elo.delta >= 0 ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {elo.delta >= 0 ? "+" : ""}
                      {elo.delta}
                    </div>
                    <Link
                      href="/leaderboard"
                      className="mt-1 block text-[10px] font-black uppercase tracking-wider text-slate-500 font-sport transition-colors hover:text-white"
                    >
                      {t('TournamentView.verElRanking', 'Ver el ranking →')}
                    </Link>
                  </div>
                </div>
              )}

              {/* El resultado en cuadraditos, para pegar en un grupo.
                  Es lo que hizo crecer a Wordle: texto plano, sin imagen y sin link, que se lee
                  entero en la vista previa de WhatsApp y provoca sin spoilear —el que lo recibe
                  ve CÓMO te fue, no CON QUÉ—. La imagen y el link ya están abajo para el que
                  los quiera; esto es para el grupo del laburo. */}
              {bloques && <BloquesDelReto texto={bloques} />}

              {/* Compartir el resultado */}
              <ShareBar
                titulo={reto ? "Desafiá a alguien con el mismo bombo" : "Contá cómo te fue"}
                campana={reto ? "reto_diario" : "equipo_share"}
                destino={
                  urlDelOnce ??
                  (reto ? `https://gambetafutbol.games/draft?mode=liga&reto=${reto.id}` : undefined)
                }
                texto={(elo && elo.delta !== 0 ? `${textoParaCompartir} (${elo.delta > 0 ? "+" : ""}${elo.delta} ELO)` : textoParaCompartir) + sufijoReto}
                imagen={(formato) =>
                  storyBlob({
                    volanta: result.type === "liga" ? "Liga Profesional" : "Copa Argentina",
                    titulo: tituloResultado,
                    subtitulo: `${result.teamLabel} · ${result.formation}`,
                    stats: [
                      { valor: `${result.teamScore}`, label: "OVR del 11" },
                      { valor: `${goles}`, label: "Goles" },
                      { valor: `${asistencias}`, label: "Asistencias" },
                      // Lo que te llevaste al ranking: es el número que da ganas de volver a jugar.
                      elo
                        ? { valor: `${elo.delta >= 0 ? "+" : ""}${elo.delta}`, label: "ELO" }
                        : { valor: goleador?.goals ? `${goleador.goals}` : "0", label: "Goleador" },
                    ],
                    pie: cierreFicha,
                    // La copa dibujada, no la palabra "campeón". Cada torneo tiene la suya, y sin
                    // título no va ninguna: una copa de adorno le saca valor a la de verdad.
                    trofeos: isChamp
                      ? [{ id: result.continental ?? (result.type === "liga" ? "lpf" : "copa-arg"), cantidad: 1 }]
                      : undefined,
                    acento: isChamp ? "#F6C750" : "#74ACDF",
                  }, formato)
                }
                className="mb-3"
              />

              {/* Las acciones van PEGADAS a compartir, no treinta píxeles más abajo con dos
                  bloques en el medio. Compartir la ficha, bajarla y volver al equipo son la
                  misma decisión —"qué hago con esto que acabo de lograr"— y estaban separadas
                  por el pedido de cuenta y el de donación. */}
              <div className="mb-6 flex flex-wrap justify-center gap-2.5 font-sport">
                <button
                  onClick={onDownloadPDF}
                  className="btn-gold rounded-2xl px-6 py-3 text-[11px] font-bold uppercase tracking-widest shadow-lg"
                >
                  {t('TournamentView.descargarPdf', 'Descargar PDF')}
                </button>
                <button
                  onClick={onBack}
                  className="btn-secondary rounded-2xl border-[#74ACDF]/25 px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:border-[#74ACDF]/50"
                >
                  {t('TournamentView.verEquipo', 'Ver equipo')}
                </button>
                <button
                  onClick={onReset}
                  className="btn-secondary rounded-2xl border-[#74ACDF]/25 px-6 py-3 text-[11px] font-bold uppercase tracking-widest hover:border-[#74ACDF]/50"
                >
                  {t('TournamentView.nuevoDraft', 'Nuevo draft')}
                </button>
              </div>

              {/* Guardar el progreso ANTES que pedir plata. La cuenta vale más que una donación y
                  dos pedidos en la misma pantalla se anulan entre sí. Al que ya tiene cuenta no se
                  le muestra nada y ve la donación directo. */}
              <GuardarProgreso elo={elo?.delta} />

              {/* Bancar el proyecto, justo después de compartir: es el momento en que la persona
                  la acaba de pasar bien. En el footer del home no lo veía casi nadie. */}
              <DonationSection compacta />

              <Link href="/" className="text-slate-400 hover:text-white transition-colors text-xs font-bold font-sport uppercase tracking-wider block text-center inline-block py-2.5 px-3">
                {t('TournamentView.volverAlInicio', 'Volver al inicio')}
              </Link>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}

/**
 * El resultado del reto en cuadraditos, con un botón para copiarlo.
 *
 * Se muestra el texto tal cual va a quedar pegado, no un preview estilizado: la gracia es que lo
 * que ve acá es exactamente lo que va a ver el grupo, y eso es lo que da ganas de mandarlo.
 */
function BloquesDelReto({ texto }: { texto: string }) {
  const t = useT()
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto)
      trackEvent(EVENTOS.compartido, { red: "bloques" })
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2200)
    } catch {
      /* sin permiso de portapapeles: el texto está a la vista para seleccionarlo a mano */
    }
  }

  return (
    <div className="panel-in rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1728]/90 to-[#050a14]/90 p-5 text-center">
      <span className="font-sport text-[11px] font-black uppercase tracking-[0.3em] text-[#74ACDF]">
        {t('TournamentView.tuResultadoSinSpoilers', 'Tu resultado, sin spoilers')}
      </span>
      <pre className="mx-auto mt-3 w-fit whitespace-pre rounded-2xl border border-white/[0.06] bg-black/30 px-5 py-3 text-left font-sans text-[13px] leading-relaxed text-slate-200">
        {texto}
      </pre>
      <button
        onClick={copiar}
        className="btn-primary mt-3 w-full rounded-2xl py-3 font-sport text-[11px] font-black uppercase tracking-widest"
      >
        {copiado ? "✓ Copiado, pegalo en el grupo" : "📋 Copiar resultado"}
      </button>
    </div>
  )
}
