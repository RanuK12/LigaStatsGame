"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import type { TournamentResult, RoundMatch, ScheduleMatch } from "@/lib/types"
import { POS_LABELS } from "@/lib/game-engine"
import { getPC } from "@/lib/ui-constants"
import MatchChronicleFeed from "./MatchChronicleFeed"
import Image from "next/image"

export default function TournamentView({ result, onBack, onReset, onDownloadPDF }: {
  result: TournamentResult
    onBack: () => void
  onReset: () => void
  onDownloadPDF: () => void
}) {
  // Simulation modality state
  // "intro" = choosing mode, "interactive" = playing step-by-step, "animating" = showing match feed, "done" = final results
  const [simState, setSimState] = useState<"intro" | "interactive" | "animating" | "done">("intro")
  const [currentStep, setCurrentStep] = useState(0)
  const [tab, setTab] = useState<"table" | "stats" | "assisters" | "schedule" | "relatos">("table")
  const [matchIdx, setMatchIdx] = useState(0)
  const [chroniclePlaying, setChroniclePlaying] = useState<any | null>(null)

  const isChamp = result.isChampion
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

  // Get active round details
  const activeRound = result.rounds?.[currentStep]
  const userMatchInRound = useMemo(() => {
    if (!activeRound) return null
    return activeRound.matches.find(m => m.home === result.teamLabel || m.away === result.teamLabel) || null
  }, [activeRound, result.teamLabel])

  const userChronicleForRound = result.chronicle?.[currentStep]

  const handleStartFullSim = () => {
    setSimState("done")
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

  const finalTabs = result.type === "liga"
    ? [{ id: "table", label: "Tabla" }, { id: "stats", label: "Goleadores" }, { id: "assisters", label: "Asistencias" }]
    : [{ id: "stats", label: "Goles" }, { id: "assisters", label: "Asistencias" }]
  if (hasChronicle) finalTabs.push({ id: "relatos", label: "Relatos" })

  return (
    <div className="min-h-screen gradient-bg arg-stripe-bg text-white px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          
          {/* 1. INTRO SCREEN: SELECT SIMULATION SPEED */}
          {simState === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="card-gradient rounded-3xl p-6 sm:p-10 border border-white/5 text-center"
            >
              <div className="relative w-[50px] h-[70px] mx-auto mb-6">
                <Image src="/logos/afa.png" alt="AFA" fill className="object-contain animate-pulse drop-shadow-lg" />
              </div>
              <h2 className="font-bandera text-2xl sm:text-4xl text-white mb-3 uppercase tracking-[0.14em]">
                MODO DE SIMULACIÓN
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mb-10 max-w-sm mx-auto font-sans leading-relaxed">
                Elegí cómo querés vivir el torneo de tu 11 ideal en la {result.type === "liga" ? "Liga Profesional" : "Copa Argentina"}.
              </p>
              <div className="flex flex-col gap-3.5 max-w-xs mx-auto font-sport">
                <button onClick={handleStartStepSim} className="btn-primary py-4 text-xs font-bold tracking-widest uppercase">
                  Partido a Partido
                </button>
                <button onClick={handleStartHalfSim} className="btn-secondary py-4 text-xs font-bold tracking-widest uppercase">
                  Simular Mitad de Torneo
                </button>
                <button onClick={handleStartFullSim} className="btn-secondary py-4 text-xs font-bold tracking-widest uppercase">
                  Simular Torneo Entero
                </button>
              </div>
            </motion.div>
          )}

          {/* 2. INTERACTIVE ROUND SCREEN */}
          {simState === "interactive" && activeRound && (
            <motion.div
              key="interactive"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-5"
            >
              {/* Round Header */}
              <div className="card-gradient rounded-2xl p-5 border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-[#74ACDF] tracking-widest uppercase font-sport">
                    Simulando
                  </div>
                  <h3 className="font-display text-xl font-black uppercase tracking-tight">
                    {activeRound.round}
                  </h3>
                </div>
                 <button onClick={handleStartFullSim} className="text-[10px] text-slate-500 hover:text-white transition-colors font-sport uppercase tracking-wider font-bold">
                  Saltar simulación ⏩
                </button>
              </div>

              {/* User Match Banner */}
              {userMatchInRound && (
                <div className="card-gradient rounded-3xl p-6 border border-[#74ACDF]/20 shadow-[0_0_20px_rgba(116,172,223,0.06)] text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#74ACDF]/40 to-transparent" />
                  <span className="text-[9px] font-bold text-[#74ACDF] uppercase tracking-widest font-sport block mb-3">TU PARTIDO</span>
                  <div className="flex items-center justify-center gap-4 sm:gap-6">
                    <span className="font-display font-black text-sm sm:text-base text-white max-w-[140px] truncate">{userMatchInRound.home}</span>
                    <span className="px-3.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-black text-[#74ACDF] font-sport">VS</span>
                    <span className="font-display font-black text-sm sm:text-base text-white max-w-[140px] truncate">{userMatchInRound.away}</span>
                  </div>
                  <button onClick={handlePlayRound} className="btn-primary mt-6 px-10 py-3.5 text-[11px] font-bold tracking-widest uppercase font-sport">
                    JUGAR PARTIDO
                  </button>
                </div>
              )}

              {/* Rest of Matches in Round */}
              <div className="card-gradient rounded-2xl p-4 border border-white/5">
                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sport mb-3">OTROS CRUCES DE LA FECHA</h4>
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

              {/* Dynamic Standing Table Preview (only for Liga) */}
              {result.type === "liga" && (
                <div className="card-gradient rounded-xl p-4 border border-slate-900">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-sport mb-3">TABLA DE POSICIONES EN VIVO</h4>
                  <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-600 border-b border-white/5 font-bold uppercase">
                          <th className="py-1 text-left">#</th>
                          <th className="py-1 text-left">Equipo</th>
                          <th className="py-1 text-center">Pts</th>
                          <th className="py-1 text-center">PJ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {intermediateTable.slice(0, 6).map((t: any, idx: number) => {
                          const isMe = t.name === result.teamLabel
                          return (
                            <tr key={idx} className={`table-row-soft ${isMe ? "table-row-highlight font-bold" : ""}`}>
                              <td className="py-1.5 text-slate-500">{idx + 1}</td>
                              <td className="py-1.5 truncate max-w-[130px] text-white">
                                {isMe ? <span className="text-[#74ACDF]">▶ {t.name}</span> : t.name}
                              </td>
                              <td className="py-1.5 text-center text-[#74ACDF] font-bold">{t.pts}</td>
                              <td className="py-1.5 text-center text-slate-500">{t.w + t.d + t.l}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* 3. PARTIDO ANIMATING / EVENT FEED */}
          {simState === "animating" && chroniclePlaying && (
            <motion.div
              key="animating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="card-gradient rounded-2xl p-6 border border-slate-900">
                <MatchChronicleFeed chronicle={chroniclePlaying} />

                {/* Show score when feed concludes */}
                <div className="mt-8 pt-6 border-t border-slate-900 text-center flex flex-col items-center">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-sport block mb-2">RESULTADO FINAL</span>
                  <div className="flex items-center gap-4 justify-center text-2xl font-black font-display mb-6">
                    <span className="text-white">{result.teamLabel}</span>
                    <span className="text-[#74ACDF]">{chroniclePlaying.myGoals} - {chroniclePlaying.oppGoals}</span>
                    <span className="text-white">{chroniclePlaying.opponent}</span>
                  </div>
                  <button onClick={handleNextRound} className="btn-primary px-10 py-3.5 text-[11px] font-bold tracking-widest uppercase font-sport">
                    {currentStep + 1 >= totalRounds ? "Ver Resultados Finales" : "Siguiente Fecha"}
                  </button>
                </div>
              </div>
            </motion.div>
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
                    initial={{ scale: 0 }} animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.6 }}
                    className="flex justify-center mb-3">
                    <div className="w-14 h-14 rounded-full border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-center">
                      <svg className="w-7 h-7 text-[#D4AF37] fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                      </svg>
                    </div>
                  </motion.div>
                )}
                
                {/* LPF logo on the tournament final view if it's Liga */}
                {result.type === "liga" && (
                  <div className="absolute top-4 right-4 w-7 h-10 opacity-30">
                    <Image src="/logos/lpf.png" alt="LPF" fill className="object-contain" />
                  </div>
                )}

                <h1 className="font-display text-3xl font-black mb-1 uppercase tracking-tight">
                  {isChamp
                    ? "¡CAMPEÓN!"
                    : result.type === "copa" && result.eliminated
                    ? `Eliminado en ${result.eliminatedRound}`
                    : result.type === "liga"
                    ? `Posición ${result.playerPos}° de ${result.table?.length}`
                    : "Subcampeón"}
                </h1>
                {isChamp && (
                  <p className="text-yellow-300 font-bold text-xs mb-2 font-sport tracking-widest uppercase">
                    ¡{result.teamLabel} ES CAMPEÓN DEL TORNEO!
                  </p>
                )}
                {!isChamp && (
                  <p className="text-slate-400 text-xs mb-2 font-sport uppercase tracking-wider">
                    {result.type === "copa" && result.eliminated
                      ? "Seguí intentando, el próximo draft será mejor."
                      : `El campeón fue ${result.champion}. ¡Mejor suerte en el próximo draft!`}
                  </p>
                )}

                {/* Division Outcome Banners for Liga */}
                {result.type === "liga" && result.playerPos && result.playerPos >= 25 && (
                  <div className="mt-3.5 mb-2.5 p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-200 text-xs font-bold leading-relaxed text-center shadow-[0_0_12px_rgba(239,68,68,0.1)] uppercase font-sport tracking-wider">
                    ZONA DE DESCENSO — Tu equipo quedó en zona de promoción/descenso.
                  </div>
                )}
                {result.type === "liga" && result.playerPos && result.playerPos <= 4 && !isChamp && (
                  <div className="mt-3.5 mb-2.5 p-3 rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-200 text-xs font-bold leading-relaxed text-center uppercase font-sport tracking-wider">
                    CLASIFICADO A LA COPA LIBERTADORES — Tu once jugará el torneo continental más prestigioso.
                  </div>
                )}
                {result.type === "liga" && result.playerPos && result.playerPos >= 5 && result.playerPos <= 8 && (
                  <div className="mt-3.5 mb-2.5 p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-xs font-bold leading-relaxed text-center uppercase font-sport tracking-wider">
                    CLASIFICADO A LA COPA SUDAMERICANA — Aseguraste competencia internacional para la próxima temporada.
                  </div>
                )}
                {result.type === "liga" && result.playerPos && result.playerPos >= 9 && result.playerPos <= 24 && (
                  <div className="mt-3.5 mb-2.5 p-3 rounded-xl border border-slate-700 bg-slate-800/20 text-slate-300 text-xs font-bold leading-relaxed text-center uppercase font-sport tracking-wider">
                    PERMANENCIA ASEGURADA — Mantuviste la categoría en la Liga Profesional de Fútbol.
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
                  <div className="text-[9px] text-[#74ACDF]/60 font-bold uppercase tracking-widest font-sport mt-0.5">Goles</div>
                </div>
                <div className="card-gradient rounded-xl p-3 text-center border border-slate-900">
                  <div className="text-2xl font-black text-blue-400 font-display">{result.playerStats.reduce((s, p) => s + p.assists, 0)}</div>
                  <div className="text-[9px] text-[#74ACDF]/60 font-bold uppercase tracking-widest font-sport mt-0.5">Asistencias</div>
                </div>
                <div className="card-gradient rounded-xl p-3 text-center border border-slate-900">
                  <div className="text-2xl font-black text-yellow-400 font-display">{result.playerStats[0]?.matchesPlayed || 0}</div>
                  <div className="text-[9px] text-[#74ACDF]/60 font-bold uppercase tracking-widest font-sport mt-0.5">Partidos</div>
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
                          <th className="py-2.5 text-left">Equipo</th>
                          <th className="py-2.5 text-center w-8">PJ</th>
                          <th className="py-2.5 text-center w-10">Pts</th>
                          <th className="py-2.5 text-center w-8">GF</th>
                          <th className="py-2.5 text-center w-8">GC</th>
                          <th className="py-2.5 text-center w-10">DG</th>
                          <th className="py-2.5 text-center pr-2">Forma</th>
                        </tr>
                      </thead>
                      <tbody className="table-zebra">
                        {result.table.map((t: any, idx: number) => {
                          const isMe = t.name === result.teamLabel
                          const totalTeams = result.table!.length
                          return (
                            <tr key={idx} className={`border-b border-white/[0.04] transition-colors ${isMe ? "table-row-user font-semibold" : ""}`}>
                              <td className="py-2.5 pl-2 pr-1">
                                <span className={`inline-flex w-5 h-5 items-center justify-center rounded-full text-[9px] font-black font-sport ${
                                  idx < 4
                                    ? "bg-blue-600/25 text-blue-400 border border-blue-500/40"
                                    : idx < 8
                                    ? "bg-emerald-600/25 text-emerald-400 border border-emerald-500/40"
                                    : idx >= totalTeams - 4
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

                  <div className="mt-4 pt-3 border-t border-[#74ACDF]/10 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[9px] font-bold font-sport uppercase tracking-wider text-slate-400">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600/30 border border-blue-500/40" /> 1-4: Libertadores</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-600/30 border border-emerald-500/40" /> 5-8: Sudamericana</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-600/30 border border-red-500/40" /> Últimos 4: Descenso</span>
                  </div>
                </div>
              )}

              {/* SCORERS TAB */}
              {tab === "stats" && (
                <div className="card-gradient rounded-2xl p-4 border border-slate-900">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sport mb-4">TABLA DE GOLEADORES</h3>
                  <div className="space-y-2">
                    {result.topScorers.slice(0, 10).map((p, idx) => (
                      <div key={p.playerId} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                        idx === 0 ? "bg-yellow-500/10 border border-[#D4AF37]/30" : "bg-slate-950/40 border border-slate-900/60"
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-sport ${
                          idx === 0 ? "bg-[#D4AF37] text-black" : "bg-slate-800 text-slate-400"
                        }`}>{idx + 1}</div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 font-sport"
                          style={{ backgroundColor: getPC(p.position) }}>
                          {p.playerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-white truncate">{p.playerName}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{POS_LABELS[p.position] || p.position} · {p.matchesPlayed} Partidos</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-green-400 font-display">{p.goals}</div>
                          <div className="text-[9px] text-slate-500">{p.assists} Asistencias</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ASSISTERS TAB */}
              {tab === "assisters" && (
                <div className="card-gradient rounded-2xl p-4 border border-slate-900">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sport mb-4">TABLA DE ASISTENCIAS</h3>
                  <div className="space-y-2">
                    {result.topAssisters.slice(0, 10).map((p, idx) => (
                      <div key={p.playerId} className={`flex items-center gap-3 p-2.5 rounded-xl ${
                        idx === 0 ? "bg-blue-500/10 border border-blue-400/30" : "bg-slate-950/40 border border-slate-900/60"
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-sport ${
                          idx === 0 ? "bg-blue-500 text-white" : "bg-slate-800 text-slate-400"
                        }`}>{idx + 1}</div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 font-sport"
                          style={{ backgroundColor: getPC(p.position) }}>
                          {p.playerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-xs text-white truncate">{p.playerName}</div>
                          <div className="text-[9px] text-slate-500 mt-0.5">{POS_LABELS[p.position] || p.position} · {p.matchesPlayed} Partidos</div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-blue-400 font-display">{p.assists}</div>
                          <div className="text-[9px] text-slate-500">{p.goals} Goles</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Copa rounds bracket (if Copa) */}
              {result.type === "copa" && result.rounds && tab === "stats" && (
                <div className="card-gradient rounded-2xl p-4 border border-white/5 mt-4">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-sport mb-4">CRUCES DE LA COPA ARGENTINA</h3>
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
                              <span className={`flex-1 text-right truncate max-w-[120px] font-bold ${m.homeGoals > m.awayGoals ? "text-white" : "text-slate-500"}`}>{m.home}</span>
                              <span className="px-3.5 py-0.5 rounded-lg bg-slate-950 font-bold text-[10px] text-slate-300 font-sport">
                                {m.homeGoals} - {m.awayGoals}
                                {m.penalties && <span className="text-[#FFD700] ml-1">({m.penalties}p)</span>}
                              </span>
                              <span className={`flex-1 truncate max-w-[120px] font-bold ${m.awayGoals > m.homeGoals ? "text-white" : "text-slate-500"}`}>{m.away}</span>
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
                  {currentChronicle && <MatchChronicleFeed chronicle={currentChronicle} />}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 justify-center flex-wrap mb-6 font-sport">
                <button onClick={onDownloadPDF} className="btn-gold px-8 py-3.5 text-[11px] font-bold tracking-widest uppercase rounded-2xl shadow-lg">
                  Descargar PDF
                </button>
                <button onClick={onBack} className="btn-secondary px-7 py-3.5 text-[11px] font-bold tracking-widest uppercase border-[#74ACDF]/25 hover:border-[#74ACDF]/50">Ver equipo</button>
                <button onClick={onReset} className="btn-secondary px-7 py-3.5 text-[11px] font-bold tracking-widest uppercase border-[#74ACDF]/25 hover:border-[#74ACDF]/50">Nuevo Draft</button>
              </div>
              <Link href="/" className="text-slate-400 hover:text-white transition-colors text-xs font-bold font-sport uppercase tracking-wider block text-center">
                Volver al inicio
              </Link>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  )
}
