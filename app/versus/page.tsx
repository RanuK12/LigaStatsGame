"use client"

import { useState, useMemo, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { usePlayersCore } from "@/lib/data-loader"
import squadsData from "@/data/squads.json"
import { normalizeSquads } from "@/lib/data-normalizers"
import {
  formations,
  POS_LABELS,
  canPlayHere,
  spinSquadWithPity,
  getSquadPlayers,
  calculateTeamScore,
  teamToStrength,
  simulateMatchGoals
} from "@/lib/game-engine"
import type { Player, Squad, FormationConfig } from "@/lib/types"
import { calculateChemistry } from "@/lib/chemistry"
import { getPC } from "@/lib/ui-constants"
import MatchChronicleFeed from "@/components/tournament/MatchChronicleFeed"

function getEligibleSquadsForSlot(
  squads: Squad[], players: Player[], slotPosition: string, draftedIds: Set<string>
): Squad[] {
  return squads.filter(squad => {
    const sp = players.filter(p => squad.playerIds.includes(p.id))
    return sp.some(p => !draftedIds.has(p.id) && canPlayHere(p, slotPosition))
  })
}

// Custom types for Versus Mode
interface PlayerDraftState {
  name: string
  formationKey: string
  drafted: (Player | null)[]
  draftedIds: Set<string>
  activeSlotIdx: number
  currentSquad: Squad | null
  spinning: boolean
  wildcards: number
  pity: {
    consecutiveLow: number
    lastRatings: number[]
    pityActive: boolean
  }
}

// Custom chronicle events for Versus Match
interface VersusMatchEvent {
  minute: number
  type: "inicio" | "gol" | "atajada" | "amarilla" | "roja" | "entretiempo" | "final"
  text: string
  team: "home" | "away"
  playerId?: string
  playerName?: string
}

export default function VersusPage() {
  const { players: playersCore, error: playersError } = usePlayersCore()
  const allP = useMemo(() => playersCore ?? [], [playersCore])
  const allS = useMemo(() => normalizeSquads(squadsData), [])

  // ── Mode Phase ──
  // "setup" = choosing names/formations
  // "draft1" = player 1 drafting
  // "transition" = prompting to hand over device
  // "draft2" = player 2 drafting
  // "complete" = side-by-side lineups preview
  // "simulation" = match animation & final result
  const [phase, setPhase] = useState<"setup" | "draft1" | "transition" | "draft2" | "complete" | "simulation">("setup")

  // ── Players Data State ──
  const [dt1, setDt1] = useState<PlayerDraftState>({
    name: "DT Local",
    formationKey: "4-3-3",
    drafted: new Array(11).fill(null),
    draftedIds: new Set(),
    activeSlotIdx: 0,
    currentSquad: null,
    spinning: false,
    wildcards: 3,
    pity: { consecutiveLow: 0, lastRatings: [], pityActive: false }
  })

  const [dt2, setDt2] = useState<PlayerDraftState>({
    name: "DT Visitante",
    formationKey: "4-3-3",
    drafted: new Array(11).fill(null),
    draftedIds: new Set(),
    activeSlotIdx: 0,
    currentSquad: null,
    spinning: false,
    wildcards: 3,
    pity: { consecutiveLow: 0, lastRatings: [], pityActive: false }
  })

  // Which DT is currently drafting
  const activeDTKey = phase === "draft1" ? "dt1" : "dt2"
  const activeDT = phase === "draft1" ? dt1 : dt2
  const setActiveDT = phase === "draft1" ? setDt1 : setDt2

  // Get configuration of active DT
  const activeF = formations[activeDT.formationKey as keyof typeof formations] || formations["4-3-3"]
  const currentSlot = activeF.positions[activeDT.activeSlotIdx] || activeF.positions[0]

  // Global drafted IDs to make sure there are no duplicate players across BOTH teams!
  const globalDraftedIds = useMemo(() => {
    const ids = new Set<string>()
    dt1.drafted.forEach(p => { if (p) ids.add(p.id) })
    dt2.drafted.forEach(p => { if (p) ids.add(p.id) })
    return ids
  }, [dt1.drafted, dt2.drafted])

  // Get squads that have at least one player compatible with current position and not already drafted anywhere
  const eligibleSquads = useMemo(() => {
    return getEligibleSquadsForSlot(allS, allP, currentSlot.pos, globalDraftedIds)
  }, [allS, allP, currentSlot.pos, globalDraftedIds])

  // Chemistry & Scores
  const dt1Chem = useMemo(() => calculateChemistry(dt1.drafted, formations[dt1.formationKey as keyof typeof formations] || formations["4-3-3"]), [dt1.drafted, dt1.formationKey])
  const dt2Chem = useMemo(() => calculateChemistry(dt2.drafted, formations[dt2.formationKey as keyof typeof formations] || formations["4-3-3"]), [dt2.drafted, dt2.formationKey])
  const dt1Score = useMemo(() => calculateTeamScore(dt1.drafted, formations[dt1.formationKey as keyof typeof formations] || formations["4-3-3"]), [dt1.drafted, dt1.formationKey])
  const dt2Score = useMemo(() => calculateTeamScore(dt2.drafted, formations[dt2.formationKey as keyof typeof formations] || formations["4-3-3"]), [dt2.drafted, dt2.formationKey])

  // Simulation states
  const [matchChronicle, setMatchChronicle] = useState<any | null>(null)
  const [matchDone, setMatchDone] = useState(false)
  const [matchResult, setMatchResult] = useState<{ homeGoals: number; awayGoals: number } | null>(null)

  // ── WHEEL SPIN MECHANICS ──
  const spinWheel = useCallback(() => {
    if (activeDT.spinning) return

    if (eligibleSquads.length === 0) {
      alert("No hay planteles disponibles con jugadores libres para esta posición. Elegí otra posición o reiniciá.")
      return
    }

    const resultSquad = spinSquadWithPity(eligibleSquads, allP, activeDT.pity)

    setActiveDT(prev => ({
      ...prev,
      currentSquad: resultSquad,
      spinning: true
    }))

    // Simulate roulette spinning animation delay
    setTimeout(() => {
      setActiveDT(prev => ({
        ...prev,
        spinning: false
      }))
    }, 1000)
  }, [activeDT.spinning, eligibleSquads, allP, activeDT.pity, setActiveDT])

  // ── SELECT PLAYER ──
  const selectPlayer = useCallback((player: Player) => {
    const fConfig = formations[activeDT.formationKey as keyof typeof formations] || formations["4-3-3"]
    
    setActiveDT(prev => {
      const nextBoard = [...prev.drafted]
      nextBoard[prev.activeSlotIdx] = player
      
      const nextIds = new Set(prev.draftedIds)
      nextIds.add(player.id)

      // Find next empty slot
      let nextIdx = prev.activeSlotIdx
      let found = false
      for (let i = 0; i < fConfig.positions.length; i++) {
        if (!nextBoard[i]) {
          nextIdx = i
          found = true
          break
        }
      }

      return {
        ...prev,
        drafted: nextBoard,
        draftedIds: nextIds,
        activeSlotIdx: found ? nextIdx : prev.activeSlotIdx,
        currentSquad: null
      }
    })
  }, [activeDT.formationKey, activeDT.activeSlotIdx, setActiveDT])

  // ── REROLL WHEEL ──
  const reroll = useCallback(() => {
    if (activeDT.wildcards <= 0 || activeDT.spinning) return
    setActiveDT(prev => ({
      ...prev,
      wildcards: prev.wildcards - 1,
      currentSquad: null
    }))
  }, [activeDT.wildcards, activeDT.spinning, setActiveDT])

  // ── FINISH PLAYER DRAFT ──
  const handleFinishP1 = () => {
    setPhase("transition")
  }

  const handleStartP2 = () => {
    setPhase("draft2")
  }

  const handleFinishP2 = () => {
    setPhase("complete")
  }

  // ── SIMULATE MATCH ──
  const handleStartSim = () => {
    const f1 = formations[dt1.formationKey as keyof typeof formations] || formations["4-3-3"]
    const f2 = formations[dt2.formationKey as keyof typeof formations] || formations["4-3-3"]

    // Filter out potential nulls (should be full anyway)
    const t1 = dt1.drafted.filter(Boolean) as Player[]
    const t2 = dt2.drafted.filter(Boolean) as Player[]

    const s1 = teamToStrength(t1, f1, "clasico")
    const s2 = teamToStrength(t2, f2, "clasico")

    const res = simulateMatchGoals(s1, s2)
    setMatchResult(res)

    // Build interactive custom match chronicle
    const events: VersusMatchEvent[] = []
    events.push({ minute: 0, type: "inicio", text: "Pitazo inicial. ¡Comienza el partido!", team: "home" })

    let currentHomeGoals = 0
    let currentAwayGoals = 0

    // Distribute goals
    const goalsList: { minute: number; team: "home" | "away"; scorer: Player; assister?: Player }[] = []

    for (let g = 0; g < res.homeGoals; g++) {
      const min = Math.floor(Math.random() * 88) + 1
      const attackers = t1.filter(p => ["RW", "LW", "ST", "CF", "CAM", "RM", "LM"].includes(p.position))
      const scorer = attackers.length > 0 ? attackers[Math.floor(Math.random() * attackers.length)] : t1[Math.floor(Math.random() * t1.length)]
      const eligibleAssisters = t1.filter(p => p.id !== scorer.id)
      const assister = Math.random() > 0.35 && eligibleAssisters.length > 0 ? eligibleAssisters[Math.floor(Math.random() * eligibleAssisters.length)] : undefined
      goalsList.push({ minute: min, team: "home", scorer, assister })
    }

    for (let g = 0; g < res.awayGoals; g++) {
      const min = Math.floor(Math.random() * 88) + 1
      const attackers = t2.filter(p => ["RW", "LW", "ST", "CF", "CAM", "RM", "LM"].includes(p.position))
      const scorer = attackers.length > 0 ? attackers[Math.floor(Math.random() * attackers.length)] : t2[Math.floor(Math.random() * t2.length)]
      const eligibleAssisters = t2.filter(p => p.id !== scorer.id)
      const assister = Math.random() > 0.35 && eligibleAssisters.length > 0 ? eligibleAssisters[Math.floor(Math.random() * eligibleAssisters.length)] : undefined
      goalsList.push({ minute: min, team: "away", scorer, assister })
    }

    // Sort goals chronologically
    goalsList.sort((a, b) => a.minute - b.minute)

    // Add goals to timeline
    goalsList.forEach(g => {
      if (g.minute === 45) g.minute += 1
      if (g.team === "home") currentHomeGoals++
      else currentAwayGoals++

      const text = g.assister
        ? `¡GOOOOOOL de ${g.scorer.name}! Remate espectacular asistido por ${g.assister.name}. [${currentHomeGoals} - ${currentAwayGoals}]`
        : `¡GOOOOOOL de ${g.scorer.name}! Golazo individual que rompe las redes. [${currentHomeGoals} - ${currentAwayGoals}]`

      events.push({
        minute: g.minute,
        type: "gol",
        text,
        team: g.team,
        playerId: g.scorer.id,
        playerName: g.scorer.name
      })
    })

    // Random cards & saves events
    const minutesUsed = new Set(goalsList.map(g => g.minute))
    
    // Cards
    const totalCards = Math.floor(Math.random() * 4) + 1 // 1 to 4 cards
    for (let c = 0; c < totalCards; c++) {
      let min = Math.floor(Math.random() * 88) + 1
      while (minutesUsed.has(min)) min = Math.floor(Math.random() * 88) + 1
      minutesUsed.add(min)

      const isHomeCard = Math.random() > 0.5
      const cardTeam = isHomeCard ? t1 : t2
      const targetPlayer = cardTeam[Math.floor(Math.random() * cardTeam.length)]
      const isRed = Math.random() > 0.85

      events.push({
        minute: min,
        type: isRed ? "roja" : "amarilla",
        text: isRed
          ? `Tarjeta ROJA directa para ${targetPlayer.name} por una falta temeraria.`
          : `Tarjeta amarilla para ${targetPlayer.name} por infracción.`,
        team: isHomeCard ? "home" : "away",
        playerId: targetPlayer.id,
        playerName: targetPlayer.name
      })
    }

    // Goalkeeper Saves
    const totalSaves = Math.floor(Math.random() * 3) + 2 // 2 to 4 saves
    const gk1 = t1.find(p => p.position === "GK") || t1[0]
    const gk2 = t2.find(p => p.position === "GK") || t2[0]
    
    for (let s = 0; s < totalSaves; s++) {
      let min = Math.floor(Math.random() * 88) + 1
      while (minutesUsed.has(min)) min = Math.floor(Math.random() * 88) + 1
      minutesUsed.add(min)

      const isHomeGkSave = Math.random() > 0.5
      const targetGk = isHomeGkSave ? gk1 : gk2
      
      events.push({
        minute: min,
        type: "atajada",
        text: `Atajada brillante de ${targetGk.name} enviando la pelota al córner.`,
        team: isHomeGkSave ? "home" : "away",
        playerId: targetGk.id,
        playerName: targetGk.name
      })
    }

    // Midtime & Final
    events.push({ minute: 45, type: "entretiempo", text: `Entretiempo. Marcador parcial: ${goalsList.filter(g => g.minute <= 45 && g.team === "home").length} - ${goalsList.filter(g => g.minute <= 45 && g.team === "away").length}`, team: "home" })
    events.push({ minute: 90, type: "final", text: `¡Final del partido! Resultado definitivo: ${res.homeGoals} - ${res.awayGoals}`, team: "home" })

    // Sort all events chronologically
    events.sort((a, b) => {
      if (a.minute !== b.minute) return a.minute - b.minute
      // Make sure start is first and final is last
      if (a.type === "inicio") return -1
      if (b.type === "inicio") return 1
      if (a.type === "final") return 1
      if (b.type === "final") return -1
      return 0
    })

    // Custom format compatible with MatchChronicleFeed
    const normalizedEvents = events.map(ev => ({
      minute: ev.minute,
      type: ev.type,
      text: ev.text,
      team: ev.team === "home" ? "propio" as const : "rival" as const,
      playerId: ev.playerId,
      playerName: ev.playerName
    }))

    setMatchChronicle({
      opponent: dt2.name,
      isHome: true,
      myGoals: res.homeGoals,
      oppGoals: res.awayGoals,
      events: normalizedEvents
    })

    setPhase("simulation")
    setMatchDone(false)
  }

  const handleRestart = () => {
    setDt1({
      name: "DT Local",
      formationKey: "4-3-3",
      drafted: new Array(11).fill(null),
      draftedIds: new Set(),
      activeSlotIdx: 0,
      currentSquad: null,
      spinning: false,
      wildcards: 3,
      pity: { consecutiveLow: 0, lastRatings: [], pityActive: false }
    })
    setDt2({
      name: "DT Visitante",
      formationKey: "4-3-3",
      drafted: new Array(11).fill(null),
      draftedIds: new Set(),
      activeSlotIdx: 0,
      currentSquad: null,
      spinning: false,
      wildcards: 3,
      pity: { consecutiveLow: 0, lastRatings: [], pityActive: false }
    })
    setMatchChronicle(null)
    setMatchResult(null)
    setMatchDone(false)
    setPhase("setup")
  }

  // Compatible squad players list
  const compatiblePlayersInSquad = useMemo(() => {
    if (!activeDT.currentSquad) return []
    const players = getSquadPlayers(activeDT.currentSquad, allP)
    return players.filter(p => {
      // Filter out players already selected in EITHER team
      if (globalDraftedIds.has(p.id)) return false
      // Filter by position compatibility
      const isCompat = p.position === currentSlot.pos || (p.positions && p.positions.includes(currentSlot.pos))
      return isCompat
    })
  }, [activeDT.currentSquad, allP, currentSlot.pos, globalDraftedIds])

  return (
    <div className="min-h-screen bg-[#020813] text-white px-4 py-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Title */}
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold text-[#74ACDF] tracking-widest uppercase font-sport block mb-1">
            MODO MULTIJUGADOR LOCAL
          </span>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight">
            DUELO VERSUS 1V1
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-sport uppercase tracking-wider">
            Armá tu equipo con un amigo en la misma pantalla y simulen el partido de la fecha
          </p>
        </div>

        <AnimatePresence>

          {/* ───────────────────────────────────────────────────────────
             1. SETUP PHASE: NAMES & FORMATIONS
             ─────────────────────────────────────────────────────────── */}
          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-gradient rounded-3xl p-6 sm:p-8 border border-white/5"
            >
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sport mb-6 text-center">Configurá a los Directores Técnicos</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* DT 1 Setup */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                    <span className="text-xs font-bold text-[#75AADB] font-sport">LOCAL</span>
                    <h4 className="font-display font-bold text-white uppercase tracking-wider text-sm">DT LOCAL</h4>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-sport">Nombre del DT</label>
                    <input
                      type="text"
                      value={dt1.name}
                      onChange={e => setDt1(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-sport">Formación Táctica</label>
                    <select
                      value={dt1.formationKey}
                      onChange={e => setDt1(prev => ({ ...prev, formationKey: e.target.value }))}
                      className="input-field text-sm"
                    >
                      {Object.keys(formations).map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* DT 2 Setup */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-900">
                    <span className="text-xs font-bold text-[#75AADB] font-sport">VISITANTE</span>
                    <h4 className="font-display font-bold text-white uppercase tracking-wider text-sm">DT VISITANTE</h4>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-sport">Nombre del DT</label>
                    <input
                      type="text"
                      value={dt2.name}
                      onChange={e => setDt2(prev => ({ ...prev, name: e.target.value }))}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5 font-sport">Formación Táctica</label>
                    <select
                      value={dt2.formationKey}
                      onChange={e => setDt2(prev => ({ ...prev, formationKey: e.target.value }))}
                      className="input-field text-sm"
                    >
                      {Object.keys(formations).map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setPhase("draft1")}
                className="btn-primary w-full py-4 text-xs font-bold tracking-widest uppercase font-sport"
              >
                Comenzar Draft Versus
              </button>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────────────────────
             2. DRAFTING PHASES (DRAFT1 & DRAFT2)
             ─────────────────────────────────────────────────────────── */}
          {(phase === "draft1" || phase === "draft2") && (
            <motion.div
              key="draft"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              {/* Left Column: Tactic Board & Score Card */}
              <div className="lg:col-span-7 space-y-5">
                {/* Active DT indicator */}
                <div className="card-gradient rounded-2xl p-4 border border-white/5 flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-[4px]" style={{ backgroundColor: activeDTKey === "dt1" ? "#74ACDF" : "#a855f7" }} />
                  <div>
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-sport">Cancha de Selección</div>
                    <h3 className="font-display text-lg font-black uppercase text-white mt-0.5 font-sport tracking-wider">
                      TURNO DE {activeDT.name}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-sport text-[#74ACDF] block">{activeDT.drafted.filter(Boolean).length}/11 jugadores</span>
                    <span className="text-[10px] text-slate-500 font-sans">Química: {activeDTKey === "dt1" ? dt1Chem.total : dt2Chem.total}/100</span>
                  </div>
                </div>

                {/* Tactical board layout */}
                <div className="card-gradient rounded-3xl p-5 border border-white/5 relative overflow-hidden aspect-[4/5] sm:aspect-[4.5/5] flex flex-col justify-between select-none">
                  {/* Soccer field lines */}
                  <div className="absolute inset-0 border-[2px] border-slate-800/40 rounded-2xl m-3 pointer-events-none" />
                  <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-800/30 pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 border border-slate-800/30 rounded-full pointer-events-none" />
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-40 h-20 border border-slate-800/30 rounded-t-lg pointer-events-none" />
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 w-40 h-20 border border-slate-800/30 rounded-b-lg pointer-events-none" />

                  {/* Render lineup positions */}
                  <div className="relative z-10 w-full h-full flex flex-col justify-between py-6">
                    {/* Rows grouping (GK, DEF, MID, FWD) */}
                    {["FWD", "MID", "DEF", "GK"].map((rowGroup) => {
                      const slots = activeF.positions.map((p, idx) => ({ ...p, idx })).filter(p => {
                        if (rowGroup === "FWD") return ["RW", "LW", "ST", "CF", "ED", "EI", "DC"].includes(p.pos)
                        if (rowGroup === "MID") return ["CM", "CDM", "CAM", "LM", "RM", "MC", "MCD", "MCO"].includes(p.pos)
                        if (rowGroup === "DEF") return ["CB", "LB", "RB", "LWB", "RWB", "DEF", "LI", "LD"].includes(p.pos)
                        return ["GK", "POR"].includes(p.pos)
                      })

                      if (slots.length === 0) return null

                      return (
                        <div key={rowGroup} className="flex justify-center gap-4 w-full">
                          {slots.map(slot => {
                            const draftedPlayer = activeDT.drafted[slot.idx]
                            const isActive = activeDT.activeSlotIdx === slot.idx
                            return (
                              <button
                                key={slot.idx}
                                onClick={() => {
                                  if (!draftedPlayer) {
                                    setActiveDT(prev => ({ ...prev, activeSlotIdx: slot.idx }))
                                  }
                                }}
                                className={`relative flex flex-col items-center justify-center rounded-xl p-1 w-14 h-16 sm:w-16 sm:h-20 border transition-all ${
                                  isActive
                                    ? "bg-[#74ACDF]/15 border-[#74ACDF] shadow-lg shadow-[#74ACDF]/15 scale-105"
                                    : draftedPlayer
                                    ? "bg-slate-950/40 border-slate-900"
                                    : "bg-slate-950/20 border-slate-900 hover:border-slate-800"
                                }`}
                              >
                                {/* Position Tag */}
                                <div className="absolute -top-2 px-1.5 py-0.5 rounded bg-slate-950 text-[10px] font-black border border-slate-900 uppercase font-sport scale-90"
                                  style={{ color: getPC(slot.pos), borderColor: getPC(slot.pos) + "40" }}>
                                  {POS_LABELS[slot.pos]?.slice(0, 3) || slot.pos.slice(0, 3)}
                                </div>

                                {draftedPlayer ? (
                                  <>
                                    <div className="text-white text-[11px] font-black font-sport mb-0.5">
                                      {draftedPlayer.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                    </div>
                                    <span className="text-[10px] text-slate-500 font-bold tracking-tight truncate w-full px-0.5 text-center">
                                      {draftedPlayer.name.split(" ").pop()}
                                    </span>
                                    <span className="text-[10px] text-yellow-400 font-black mt-1 font-display">
                                      {draftedPlayer.rating}
                                    </span>
                                  </>
                                ) : (
                                  <div className="text-xl text-slate-700 animate-pulse">+</div>
                                )}
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Continue button when fully drafted */}
                {activeDT.drafted.filter(Boolean).length === 11 && (
                  <button
                    onClick={phase === "draft1" ? handleFinishP1 : handleFinishP2}
                    className="btn-primary w-full py-4 text-xs font-bold tracking-widest uppercase font-sport shadow-[0_4px_20px_rgba(116,172,223,0.15)]"
                  >
                    {phase === "draft1" ? "Finalizar Turno y Pasar a DT 2" : "Ver Resultados Finales"}
                  </button>
                )}
              </div>

              {/* Right Column: Wheel Spin Controls & Compatible Players Grid */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* 1. WHEEL CONTROL CARD */}
                <div className="card-gradient rounded-3xl p-5 border border-white/5 text-center relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-slate-900 via-[#74ACDF]/20 to-slate-900" />
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-sport block mb-1">RULETA DE CLUBES</span>
                  <h4 className="font-display font-black text-xs text-[#74ACDF] uppercase tracking-wider mb-4">
                    Buscando para: {POS_LABELS[currentSlot.pos] || currentSlot.pos}
                  </h4>

                  {/* Roulette wheel element */}
                  <div className="relative w-28 h-28 mx-auto my-5">
                    <motion.div
                      animate={activeDT.spinning ? { rotate: 360 * 3 } : { rotate: 0 }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full border-[6px] border-slate-950 bg-slate-900 flex items-center justify-center shadow-inner"
                    >
                      {activeDT.currentSquad ? (
                        <div className="relative w-12 h-12">
                          <Image
                            src={`/logos/clubs/${activeDT.currentSquad.id.replace(/-20\d\ds$/, "")}.png`}
                            alt="Logo"
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <svg className="w-6 h-6 text-[#D4AF37] fill-current" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      )}
                    </motion.div>
                    {/* Spinner Arrow Indicator */}
                    <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-yellow-400 border-2 border-slate-950 rotate-45 z-10 rounded-br" />
                  </div>

                  {activeDT.currentSquad ? (
                    <div className="mb-5">
                      <div className="text-white font-display text-sm font-bold uppercase">{activeDT.currentSquad.label}</div>
                      <div className="text-[10px] text-slate-500 font-sport font-bold uppercase tracking-widest mt-0.5">Año: {activeDT.currentSquad.season}</div>
                    </div>
                  ) : (
                    <div className="mb-5 text-[10px] text-slate-500 font-sans italic leading-relaxed py-1.5">
                      Girá la ruleta para conseguir un plantel real del fútbol argentino y elegir tu jugador.
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={spinWheel}
                      disabled={activeDT.spinning}
                      className="btn-primary flex-1 py-3 text-[10px] font-bold tracking-widest uppercase font-sport"
                    >
                      {activeDT.currentSquad ? "Girar de nuevo" : "Girar Ruleta"}
                    </button>
                    {activeDT.currentSquad && activeDT.wildcards > 0 && (
                      <button
                        onClick={reroll}
                        className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 text-[10px] font-bold tracking-widest uppercase font-sport"
                      >
                        Re-sortear ({activeDT.wildcards})
                      </button>
                    )}
                  </div>
                </div>

                {/* 2. PLAYERS SELECTION LIST */}
                {activeDT.currentSquad && (
                  <div className="card-gradient rounded-2xl p-5 border border-slate-900">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-sport">JUGADORES DISPONIBLES</h4>
                      <span className="text-[11px] text-[#74ACDF] font-bold">{compatiblePlayersInSquad.length} disponibles</span>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {compatiblePlayersInSquad.map(player => (
                        <button
                          key={player.id}
                          onClick={() => selectPlayer(player)}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-900/60 hover:border-[#74ACDF]/30 hover:bg-slate-900/10 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 font-sport"
                              style={{ backgroundColor: getPC(player.position) }}>
                              {player.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-white group-hover:text-[#74ACDF] transition-colors">{player.name}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{POS_LABELS[player.position] || player.position} · {player.nationality}</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-black text-yellow-400 font-display">{player.rating}</div>
                            <div className="text-[11px] text-slate-500 mt-0.5">OVR</div>
                          </div>
                        </button>
                      ))}

                      {compatiblePlayersInSquad.length === 0 && (
                        <div className="text-center py-6 text-xs text-slate-600 font-sans italic">
                          Ningún jugador compatible o libre en esta plantilla. ¡Volvé a girar!
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────────────────────
             3. TRANSITION PHASE: HAND DEVICE TO PLAYER 2
             ─────────────────────────────────────────────────────────── */}
          {phase === "transition" && (
            <motion.div
              key="transition"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-gradient rounded-2xl p-8 sm:p-12 border border-slate-900 text-center"
            >
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#74ACDF]/30 bg-[#74ACDF]/10 text-xs font-black text-[#74ACDF] font-sport uppercase tracking-widest animate-pulse">
                PASAR DISPOSITIVO
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-black uppercase tracking-tight mb-2">
                TURNO DEL JUGADOR 2
              </h3>
              <p className="text-[#a855f7] text-sm font-bold uppercase tracking-wider font-sport mb-4">
                {dt2.name}
              </p>
              <p className="text-slate-400 text-xs sm:text-sm mb-10 max-w-sm mx-auto leading-relaxed">
                Entregá el teléfono o dispositivo a tu amigo para que pueda hacer su draft táctico con las cartas restantes.
              </p>

              <button
                onClick={handleStartP2}
                className="px-12 py-4 bg-[#a855f7] hover:bg-[#9333ea] text-white rounded-xl text-xs font-bold tracking-widest uppercase font-sport transition-all shadow-[0_4px_25px_rgba(168,85,247,0.25)]"
              >
                Comenzar Turno
              </button>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────────────────────
             4. COMPLETE DRAFT PREVIEW (SIDE-BY-SIDE)
             ─────────────────────────────────────────────────────────── */}
          {phase === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Lineup 1 Preview */}
                <div className="card-gradient rounded-2xl p-5 border border-slate-900 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-[#74ACDF]" />
                  <h4 className="font-display font-black text-white uppercase text-base mb-1">{dt1.name}</h4>
                  <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider font-sport text-slate-500 mb-4">
                    <span>{dt1.formationKey}</span>
                    <span>OVR: {dt1Score}</span>
                    <span>Química: {dt1Chem.total}%</span>
                  </div>

                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {dt1.drafted.map((player, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-slate-950/40 border border-slate-900/60 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-black text-[#74ACDF] font-sport shrink-0 w-6">
                            {POS_LABELS[formations[dt1.formationKey as keyof typeof formations].positions[idx].pos]?.slice(0, 3).toUpperCase()}
                          </span>
                          <span className="font-bold text-white truncate max-w-[150px]">{player?.name || "Vacío"}</span>
                        </div>
                        <span className="text-yellow-400 font-black font-display text-sm shrink-0">{player?.rating || "-"}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lineup 2 Preview */}
                <div className="card-gradient rounded-2xl p-5 border border-slate-900 relative overflow-hidden">
                  <div className="absolute top-0 left-0 bottom-0 w-[4px] bg-[#a855f7]" />
                  <h4 className="font-display font-black text-white uppercase text-base mb-1">{dt2.name}</h4>
                  <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider font-sport text-slate-500 mb-4">
                    <span>{dt2.formationKey}</span>
                    <span>OVR: {dt2Score}</span>
                    <span>Química: {dt2Chem.total}%</span>
                  </div>

                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                    {dt2.drafted.map((player, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-slate-950/40 border border-slate-900/60 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-[11px] font-black text-[#a855f7] font-sport shrink-0 w-6">
                            {POS_LABELS[formations[dt2.formationKey as keyof typeof formations].positions[idx].pos]?.slice(0, 3).toUpperCase()}
                          </span>
                          <span className="font-bold text-white truncate max-w-[150px]">{player?.name || "Vacío"}</span>
                        </div>
                        <span className="text-yellow-400 font-black font-display text-sm shrink-0">{player?.rating || "-"}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              <div className="flex gap-3 font-sport">
                <button
                  onClick={handleStartSim}
                  className="btn-primary flex-1 py-4 text-xs font-bold tracking-widest uppercase shadow-[0_4px_25px_rgba(116,172,223,0.15)]"
                >
                  SIMULAR DUELO VERSUS
                </button>
                <button
                  onClick={handleRestart}
                  className="px-6 py-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 text-xs font-bold tracking-widest uppercase transition-colors"
                >
                  Reiniciar todo
                </button>
              </div>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────────────────────
             5. SIMULATION & FINAL VERSUS RESULTS
             ─────────────────────────────────────────────────────────── */}
          {phase === "simulation" && matchChronicle && (
            <motion.div
              key="simulation"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-5"
            >
              <div className="card-gradient rounded-2xl p-6 border border-slate-900">
                <MatchChronicleFeed chronicle={matchChronicle} />

                {/* Conclusion summary */}
                <div className="mt-8 pt-6 border-t border-slate-900 text-center flex flex-col items-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-sport block mb-2">RESULTADO DEL DUELO</span>
                  <div className="flex items-center gap-4 sm:gap-6 justify-center font-display mb-8">
                    <span className="text-base sm:text-lg font-black text-white max-w-[140px] truncate">{dt1.name}</span>
                    <span className="px-4 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xl sm:text-2xl font-black text-[#74ACDF] font-sport">
                      {matchResult?.homeGoals} - {matchResult?.awayGoals}
                    </span>
                    <span className="text-base sm:text-lg font-black text-white max-w-[140px] truncate">{dt2.name}</span>
                  </div>

                  {matchResult && (
                    <h3 className="font-display text-xl sm:text-2xl font-black uppercase text-yellow-400 mb-8 tracking-wide font-sport">
                      {matchResult.homeGoals > matchResult.awayGoals
                        ? `¡${dt1.name} ES EL CAMPEÓN DEL DUELO!`
                        : matchResult.homeGoals < matchResult.awayGoals
                        ? `¡${dt2.name} ES EL CAMPEÓN DEL DUELO!`
                        : "¡EMPATE HISTÓRICO EN EL DUELO!"}
                    </h3>
                  )}

                  <div className="flex gap-3 w-full font-sport">
                    <button
                      onClick={handleStartSim}
                      className="btn-primary flex-1 py-3.5 text-xs font-bold tracking-widest uppercase"
                    >
                      Jugar Revancha (Simular otra vez)
                    </button>
                    <button
                      onClick={handleRestart}
                      className="px-6 py-3.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 text-xs font-bold tracking-widest uppercase transition-colors"
                    >
                      Volver al inicio / Nuevo Draft
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Back Link */}
        {phase === "setup" && (
          <div className="text-center mt-6">
            <Link href="/" className="text-xs text-slate-500 hover:text-white transition-colors font-sport uppercase tracking-wider">
              ← Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
