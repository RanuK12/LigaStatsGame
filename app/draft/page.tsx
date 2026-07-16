"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import squadsData from "@/data/squads.json"
import type { Player, Squad, TournamentResult } from "@/lib/types"
import { normalizeSquads } from "@/lib/data-normalizers"
import { usePlayersCore } from "@/lib/data-loader"
import {
  formations,
  canPlayHere,
  getSquadPlayers,
  calculateTeamScore,
  calculateFullTeamScore,
  GAME_MODES,
  POS_LABELS,
  simulateSeasonWithStats,
  simulateCopaWithStats,
  spinSquadWithPity,
  getSquadTier,
  updatePity,
  PITY_LOW_THRESHOLD,
} from "@/lib/game-engine"
import { loadLifetimeStats, saveLifetimeStats, applyDraftCompleted, applyTournament, saveLastResult } from "@/lib/storage"
import { calculateChemistry } from "@/lib/chemistry"
import ChemistryPanel from "@/components/ChemistryPanel"
import TournamentView from "@/components/tournament/TournamentView"
import SquadRoulette from "@/components/roulette/SquadRoulette"
import PackReveal from "@/components/roulette/PackReveal"
import Pitch from "@/components/pitch/Pitch"
import PlayerTradingCard from "@/components/pitch/PlayerTradingCard"
import { generatePDF } from "@/lib/pdf"
import { getPC, POS_GROUPS } from "@/lib/ui-constants"
import MagneticButton from "@/components/ui/MagneticButton"

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS & HELPERS
   ═══════════════════════════════════════════════════════════════ */

function getEligibleSquadsForSlot(
  squads: Squad[], players: Player[], slotPosition: string, draftedIds: Set<string>
): Squad[] {
  return squads.filter(squad => {
    const sp = players.filter(p => squad.playerIds.includes(p.id))
    return sp.some(p => !draftedIds.has(p.id) && canPlayHere(p, slotPosition))
  })
}

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
type Phase = "start" | "ready" | "pos-select" | "spinning" | "reveal" | "picking" | "done" | "sim"

interface EnrichedPlayer extends Player { isCompatible: boolean }

interface PityState {
  consecutiveLow: number
  lastRatings: number[]
  pityActive: boolean
}

/* ═══════════════════════════════════════════════════════════════
   PITY INDICATOR
   ═══════════════════════════════════════════════════════════════ */
function PityIndicator({ pity }: { pity: PityState }) {
  if (pity.consecutiveLow === 0) return null
  const isPityActive = pity.pityActive
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex flex-col sm:flex-row items-center gap-2 px-4 py-2 rounded-xl text-xs font-black border ${
        isPityActive
          ? "bg-yellow-500/20 border-yellow-400/40 text-yellow-300 shadow-[0_0_16px_rgba(251,191,36,0.35)]"
          : "bg-blue-500/10 border-blue-400/20 text-[#74ACDF]"
      }`}>
      <div className="flex items-center gap-1.5 uppercase tracking-wider">
        {isPityActive ? (
          <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 0.6 }}>✨</motion.span>
        ) : "🔥"}
        <span>LA CÁBALA (ANTI-MUFA):</span>
      </div>
      <span className="font-medium text-[11px] text-slate-300">
        {isPityActive
          ? "¡ACTIVADA! Próximo spin de élite garantizado por meter 2 picks bajos seguidos."
          : `Llevás ${pity.consecutiveLow} pick${pity.consecutiveLow > 1 ? "s" : ""} de bajo rating (<=60). ¡Si sumás otro, el siguiente se potencia!`}
      </span>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   POSITION SELECTOR MODAL
   ═══════════════════════════════════════════════════════════════ */
function PositionSelector({ formation, drafted, onSelect, onClose, currentPos }: {
  formation: any
  drafted: (Player | null)[]
  onSelect: (pos: string) => void
  onClose: () => void
  currentPos: string
}) {
  // Get unique positions from the formation's remaining empty slots
  const positions = formation.positions
    .filter((p: any, i: number) => !drafted[i])
    .map((p: any) => p.pos)
  const unique = [...new Set<string>(positions)]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
      onClick={onClose}>
      <motion.div
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 20 }}
        className="w-full max-w-sm card-glass p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <h3 className="font-display font-black text-xl mb-1 text-center">¿Qué posición sorteás?</h3>
        <p className="text-slate-400 text-sm text-center mb-5">Elegí la posición para el próximo spin</p>
        <div className="space-y-3">
          {POS_GROUPS.map(group => {
            const available = group.positions.filter(p => unique.includes(p))
            if (available.length === 0) return null
            return (
              <div key={group.label}>
                <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">
                  {group.icon} {group.label}
                </div>
                <div className="flex flex-wrap gap-2">
                  {available.map(pos => (
                    <button key={pos} onClick={() => onSelect(pos)}
                      className={`px-3 py-1.5 rounded-2xl text-sm font-bold border transition-all duration-300 ease-out hover:scale-[1.02] ${
                        pos === currentPos
                          ? "bg-[#75AADB] text-white border-[#75AADB] shadow-lg shadow-[#75AADB]/30"
                          : "bg-slate-800 border-slate-600 text-slate-200 hover:border-[#75AADB]/60 hover:bg-slate-700"
                      }`}
                      style={{ borderColor: pos === currentPos ? undefined : getPC(pos) + "55" }}>
                      <span className="inline-block w-5 h-5 rounded-full text-white text-[9px] font-black mr-1 leading-5 text-center" style={{ backgroundColor: getPC(pos) }}>
                        {POS_LABELS[pos]?.slice(0, 3) || pos.slice(0, 3)}
                      </span>
                      {POS_LABELS[pos] || pos}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        <button onClick={onClose} className="w-full mt-5 py-2 rounded-2xl btn-secondary text-sm">
          Cancelar
        </button>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DRAFT COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function DraftInner() {
  const sp = useSearchParams()
  const modeId = (sp.get("mode") || "clasico") as string
  const mode = GAME_MODES[modeId] || GAME_MODES.clasico

  const { players: playersCore, error: playersError } = usePlayersCore()
  const allP = useMemo(() => playersCore ?? [], [playersCore])
  const allS = useMemo(() => normalizeSquads(squadsData), [])

  // ── Game State ──
  const [started, setStarted] = useState(false)
  const [fm, setFm] = useState<string>("4-3-3")
  const [phase, setPhase] = useState<Phase>("start")
  const [drafted, setDrafted] = useState<(Player | null)[]>([])
  const [draftedIds, setDraftedIds] = useState<Set<string>>(new Set())
  const [activeSlotIdx, setActiveSlotIdx] = useState(0)
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [wildcards, setWildcards] = useState(mode.rerolls || 3)
  const [search, setSearch] = useState("")
  const [simResult, setSimResult] = useState<TournamentResult | null>(null)
  const [confetti, setConfetti] = useState(false)
  const [spinNotice, setSpinNotice] = useState<string | null>(null)
  const [showPosSelector, setShowPosSelector] = useState(false)
  const [pity, setPity] = useState<PityState>({ consecutiveLow: 0, lastRatings: [], pityActive: false })

  const f = formations[fm as keyof typeof formations] || formations["4-3-3"]
  const totalSlots = f.positions.length
  const currentPos = f.positions[activeSlotIdx] || f.positions[0]
  const filledCount = drafted.filter(Boolean).length
  const eligibleSquads = useMemo(
    () => getEligibleSquadsForSlot(allS, allP, currentPos.pos, draftedIds),
    [allS, allP, currentPos.pos, draftedIds]
  )
  const teamScore = useMemo(() => calculateFullTeamScore(drafted, f), [drafted, f])
  const partialScore = useMemo(() => calculateTeamScore(drafted, f), [drafted, f])
  const chemBreakdown = useMemo(() => calculateChemistry(drafted, f), [drafted, f])

  const findNextEmpty = useCallback((from: number, board: (Player | null)[]) => {
    let idx = from
    while (idx < totalSlots && board[idx] !== null) idx++
    return idx < totalSlots ? idx : -1
  }, [totalSlots])

  // ── START ──
  const startGame = useCallback(() => {
    const empty = new Array(totalSlots).fill(null)
    setDrafted(empty)
    setDraftedIds(new Set())
    setActiveSlotIdx(0)
    setCurrentSquad(null)
    setWildcards(mode.rerolls || 3)
    setSearch("")
    setSimResult(null)
    setSpinNotice(null)
    setStarted(true)
    setPity({ consecutiveLow: 0, lastRatings: [], pityActive: false })
    setPhase("ready")
  }, [totalSlots, mode])

  // ── SPIN WHEEL ──
  const spinWheel = useCallback((forcedPos?: string) => {
    if (spinning) return
    const posToUse = forcedPos || currentPos.pos
    // Find the slot index for the forced pos (first empty matching slot)
    if (forcedPos) {
      const idx = f.positions.findIndex((p: any, i: number) => p.pos === forcedPos && !drafted[i])
      if (idx >= 0) setActiveSlotIdx(idx)
    }
    const eligible = getEligibleSquadsForSlot(allS, allP, posToUse, draftedIds)
    if (eligible.length === 0) {
      setSpinNotice("No hay planteles disponibles para esta posición. Probá cambiar de posición o reiniciar.")
      setCurrentSquad(null)
      setPhase("ready")
      return
    }
    // Apply pity system
    const result = spinSquadWithPity(eligible, allP, pity)
    setSpinNotice(null)
    setCurrentSquad(result)
    setSpinning(true)
    setPhase("spinning")
  }, [spinning, allS, allP, currentPos.pos, draftedIds, pity, f, drafted])

  // ── REROLL ──
  const rerollTeam = useCallback(() => {
    if (wildcards <= 0) return
    setWildcards((w: number) => w - 1)
    spinWheel()
  }, [wildcards, spinWheel])

  // ── PICK PLAYER ──
  const pickPlayer = useCallback((player: Player, slotIdx: number) => {
    if (draftedIds.has(player.id)) return
    const requiredPos = f.positions[slotIdx]?.pos
    if (requiredPos && !canPlayHere(player, requiredPos)) return

    const newDrafted = [...drafted]
    newDrafted[slotIdx] = player
    setDrafted(newDrafted)
    setDraftedIds(prev => new Set(prev).add(player.id))

    // Update pity state based on picked player rating
    const newPity = updatePity(pity, player.rating || 60)
    setPity(newPity)

    let nextIdx = slotIdx + 1
    while (nextIdx < newDrafted.length && newDrafted[nextIdx] !== null) nextIdx++

    if (nextIdx < newDrafted.length) {
      setTimeout(() => { setActiveSlotIdx(nextIdx); setCurrentSquad(null); setPhase("ready"); setSearch("") }, 300)
    } else {
      setTimeout(() => { setConfetti(true); setTimeout(() => setConfetti(false), 4000); setPhase("done") }, 300)
    }
  }, [drafted, draftedIds, f, pity])

  // ── SLOT CLICK ──
  const handleSlotClick = useCallback((idx: number) => {
    if (phase === "done") {
      const old = drafted[idx]
      if (old) setDraftedIds(prev => { const n = new Set(prev); n.delete(old.id); return n })
      setDrafted(prev => { const nd = [...prev]; nd[idx] = null; return nd })
      setActiveSlotIdx(idx)
      setCurrentSquad(null)
      setSearch("")
      setSpinNotice(null)
      setPhase("ready")
    } else if (phase === "ready") {
      setActiveSlotIdx(idx)
    }
  }, [phase, drafted])

  // ── REMOVE PLAYER ──
  const removePlayer = useCallback((idx: number) => {
    const old = drafted[idx]
    if (old) setDraftedIds(prev => { const n = new Set(prev); n.delete(old.id); return n })
    setDrafted(prev => { const nd = [...prev]; nd[idx] = null; return nd })
    setActiveSlotIdx(idx)
    setCurrentSquad(null)
    setSpinNotice(null)
    setPhase("ready")
  }, [drafted])

  // ── SIMULATION ──
  const startSim = useCallback((type: "liga" | "copa") => {
    const isP = (x: any): x is Player => x && typeof x.id === "string"
    const players = drafted.filter(isP)
    if (players.length < 11) return
    const virtualSquad: Squad = {
      id: "mi-11-fantasy", clubId: "mi-11", season: "2026",
      competition: "Liga Profesional", label: "Mi 11 Fantasy",
      playerIds: players.map(p => p.id) as [string, ...string[]],
    }
    const score = teamScore || partialScore
    const r = type === "liga"
      ? simulateSeasonWithStats(players, virtualSquad, allS, allP, f, score)
      : simulateCopaWithStats(players, virtualSquad, allS, allP, f, score)
    setSimResult(r)
    setPhase("sim")
    // Récords de por vida + último equipo para /results
    saveLifetimeStats(applyTournament(applyDraftCompleted(loadLifetimeStats(), players, score), r))
    saveLastResult({
      label: virtualSquad.label, score, formation: f.id,
      players: players.map(p => ({ name: p.name, rating: p.rating, position: p.position })),
    })
  }, [drafted, allS, allP, f, teamScore, partialScore])

  // ── RESET ──
  const resetGame = useCallback(() => {
    setStarted(false); setPhase("start"); setDrafted([]); setDraftedIds(new Set())
    setCurrentSquad(null); setSimResult(null); setSpinNotice(null); setActiveSlotIdx(0)
    setPity({ consecutiveLow: 0, lastRatings: [], pityActive: false })
  }, [])

  // ── PICKER PLAYERS ──
  const pickerPlayers = useMemo(() => {
    if (!currentSquad) return []
    const targetPos = f.positions[activeSlotIdx]?.pos || "CM"
    const squadPlayers = getSquadPlayers(currentSquad, allP)
    const available = squadPlayers.filter(p => !draftedIds.has(p.id))
    const enriched: EnrichedPlayer[] = available.map(p => ({ ...p, isCompatible: canPlayHere(p, targetPos) }))
    
    // Filter to keep ONLY compatible players so that incompatible players are not shown in the grid
    const compatible = enriched.filter(p => p.isCompatible)
    
    compatible.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    return compatible.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
  }, [currentSquad, allP, f, activeSlotIdx, search, draftedIds])

  const compatibleCount = pickerPlayers.filter(p => p.isCompatible).length

  /* ── RENDER: START ── */
  if (phase === "start" || !started) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full text-center">
          <img src="/LigaStatsGame/logos/afa.png" alt="AFA" className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h1 className="font-display text-4xl md:text-5xl font-black gradient-text mb-4">Liga Argentina Fans</h1>
          <p className="text-slate-400 mb-6">{mode.icon} {mode.name}</p>
          <div className="card-gradient rounded-3xl p-6 mb-6">
            <h3 className="font-display font-bold text-lg mb-4">Elegí tu formación</h3>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.values(formations).map((fmt: any) => (
                <button key={fmt.id} onClick={() => setFm(fmt.id)}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold uppercase tracking-widest transition-all duration-300 ease-out ${
                    fm === fmt.id ? "bg-[#75AADB] text-white shadow-lg shadow-[#75AADB]/20" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}>{fmt.name}</button>
              ))}
            </div>
            <div className="mt-4"><Pitch f={f} draft={[]} activeSlot={-1} onSlotClick={() => {}} phase="start" /></div>
          </div>
          <div className="card-gradient rounded-3xl p-6 mb-6 text-left">
            <h3 className="font-display font-bold text-lg mb-3">Cómo Jugar</h3>
            <ol className="text-sm text-slate-400 space-y-2">
              <li>1. Elegís la <strong className="text-slate-200">posición</strong> que querés sortear</li>
              <li>2. Girás la ruleta — te toca un <strong className="text-slate-200">equipo + año</strong></li>
              <li>3. Elegís <strong className="text-slate-200">un solo jugador</strong> de esa posición</li>
              <li>4. El sistema de <strong className="text-yellow-300">La Cábala (Anti-Mufa)</strong> garantiza que no te salgan solo jugadores de bajo nivel seguidos</li>
              <li>5. Armá los 11 y <strong className="text-slate-200">simulá el torneo con estadísticas</strong></li>
            </ol>
          </div>
          <MagneticButton>
            <button onClick={startGame} disabled={!playersCore} className="btn-primary px-10 py-4 font-sport">
              {playersCore ? "Comenzar Draft" : "Cargando jugadores..."}
            </button>
          </MagneticButton>
          {playersError && (
            <p className="mt-3 text-xs text-red-400">No se pudo cargar la base de jugadores: {playersError}. Recargá la página.</p>
          )}
          <Link href="/" className="block mt-6 text-slate-400 hover:text-white transition-colors text-xs font-bold font-sport uppercase tracking-wider">Volver al inicio</Link>
        </motion.div>
      </div>
    )
  }

  /* ── RENDER: SIM RESULTS ── */
  if (phase === "sim" && simResult) {
    return (
      <TournamentView
        result={simResult}
        onBack={() => { setPhase("done"); setSimResult(null) }}
        onReset={resetGame}
        onDownloadPDF={() => generatePDF(simResult, drafted, f)}
      />
    )
  }

  /* ── RENDER: MAIN GAME ── */
  return (
    <div className="min-h-screen gradient-bg">
      {/* Position Selector Modal */}
      <AnimatePresence>
        {showPosSelector && (
          <PositionSelector
            formation={f}
            drafted={drafted}
            currentPos={currentPos.pos}
            onSelect={(pos) => {
              setShowPosSelector(false)
              spinWheel(pos)
            }}
            onClose={() => setShowPosSelector(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="pt-6 pb-4 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <img src="/LigaStatsGame/logos/afa.png" alt="AFA" className="w-5 h-5" />
          <span className="text-[10px] font-bold text-slate-500 tracking-widest font-sport uppercase">{mode.name}</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-black gradient-text uppercase tracking-wider">Armá tu 11</h1>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs flex-wrap font-sport uppercase tracking-widest text-slate-400">
          <span>
            Posición: <strong className="text-white font-bold">{POS_LABELS[currentPos.pos] || currentPos.pos}</strong>
            <span className="text-slate-500 ml-1">({activeSlotIdx + 1}/{totalSlots})</span>
          </span>
          <span>·</span>
          <span>Equipo: <strong className="text-[#75AADB] font-bold">{filledCount}/11</strong></span>
          {teamScore > 0 && (
            <>
              <span>·</span>
              <span className="text-[#75AADB] font-bold">OVR: {teamScore}</span>
            </>
          )}
          {wildcards > 0 && (
            <>
              <span>·</span>
              <span className="text-yellow-400 font-bold">COMODINES: {wildcards}</span>
            </>
          )}
        </div>
        {/* Pity indicator */}
        <div className="flex justify-center mt-2">
          <PityIndicator pity={pity} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-20">
        {/* Progress bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6">
          <div className="bg-gradient-to-r from-[#75AADB] to-blue-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(filledCount / totalSlots) * 100}%` }} />
        </div>

        {/* PHASE: READY */}
        {phase === "ready" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {spinNotice && (
              <div className="card-gradient rounded-2xl p-3 mb-4 text-sm text-amber-200 border border-amber-400/20">{spinNotice}</div>
            )}
            <div className="card-gradient rounded-2xl p-4 mb-4 text-center">
              <div className="text-sm text-slate-400 mb-1">Posición {filledCount + 1} de {totalSlots}:</div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: getPC(currentPos.pos) }}>{POS_LABELS[currentPos.pos]}</div>
                <span className="font-display font-bold text-xl text-white">{currentPos.label}</span>
              </div>
            </div>
            <div className="mb-4"><Pitch f={f} draft={drafted} activeSlot={activeSlotIdx} onSlotClick={handleSlotClick} phase={phase} chemistry={chemBreakdown} /></div>
            {filledCount >= 2 && <div className="mb-4"><ChemistryPanel chemistry={chemBreakdown} /></div>}
            <div className="flex gap-3 justify-center flex-wrap font-sport">
              <MagneticButton>
                <button onClick={() => spinWheel()} className="btn-primary px-10 py-4">
                  Girar Ruleta
                </button>
              </MagneticButton>
              <button onClick={() => setShowPosSelector(true)} className="btn-secondary px-6 py-4">
                Elegir posición
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Girá para la posición actual · o elegí otra posición manualmente
            </p>
          </motion.div>
        )}

        {/* PHASE: SPINNING */}
        {phase === "spinning" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            {pity.pityActive && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 px-4 py-2 bg-yellow-500/20 border border-yellow-400/40 rounded-xl text-yellow-300 text-xs font-bold tracking-wider uppercase font-sport shadow-[0_0_20px_rgba(251,191,36,0.15)]">
                LA CÁBALA ACTIVADA - GENERANDO JUGADORES DE ÉLITE
              </motion.div>
            )}
            <p className="text-slate-400 mb-4 text-xs font-bold uppercase tracking-widest font-sport">SORTEANDO PLANTEL COMPATIBLE PARA{" "}
              <strong style={{ color: getPC(currentPos.pos) }}>{POS_LABELS[currentPos.pos]}</strong>
              {" "}({filledCount + 1}/{totalSlots})
            </p>
            <SquadRoulette squads={eligibleSquads} spinning={true} result={currentSquad}
              onSpinComplete={() => { setSpinning(false); setPhase("reveal"); setSearch("") }} />
            <p className="mt-4 text-xs text-slate-500 font-bold uppercase tracking-wider font-sport">Buscando el plantel perfecto para tu equipo...</p>
          </motion.div>
        )}

        {/* PHASE: REVEAL (pack opening) */}
        <AnimatePresence>
          {phase === "reveal" && currentSquad && (() => {
            const { tier, avg } = getSquadTier(currentSquad, allP)
            return (
              <PackReveal squad={currentSquad} tier={tier} avg={avg}
                onContinue={() => setPhase("picking")} />
            )
          })()}
        </AnimatePresence>

        {/* PHASE: PICKING */}
        {phase === "picking" && currentSquad && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="card-gradient rounded-2xl p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={`/LigaStatsGame/logos/clubs/${currentSquad.clubId}.png`} alt=""
                  className="w-12 h-12 rounded-lg object-contain"
                  onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
                <div>
                  <div className="font-display font-bold text-lg">{currentSquad.label}</div>
                  <div className="text-xs text-slate-400">
                    <span className="text-[#75AADB]">{compatibleCount}</span> compatible{compatibleCount !== 1 ? "s" : ""} para{" "}
                    <strong className="text-white">{POS_LABELS[currentPos.pos]}</strong>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={rerollTeam} disabled={wildcards <= 0}
                  className="btn-secondary px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed">
                  🔄 Re-sortear ({wildcards})
                </button>
              </div>
            </div>
            <div className="mb-4"><Pitch f={f} draft={drafted} activeSlot={activeSlotIdx} onSlotClick={handleSlotClick} phase={phase} chemistry={chemBreakdown} /></div>
            <div className="card-gradient rounded-2xl p-4 border border-white/5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-sm">
                  ⚡ Elegí{" "}
                  <span style={{ color: getPC(currentPos.pos) }}>{POS_LABELS[currentPos.pos] || currentPos.pos}</span>
                  {" "}— 1 solo jugador
                </h3>
                <span className="text-xs text-slate-500">{pickerPlayers.length} disp. · {filledCount}/{totalSlots}</span>
              </div>
              <input type="text" placeholder="🔍 Buscar jugador..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="input-field mb-3 text-sm" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[40vh] overflow-y-auto pr-1">
                {pickerPlayers.length === 0 && (
                  <p className="text-slate-500 text-sm text-center col-span-2 py-4">
                    {draftedIds.size > 0 && currentSquad
                      ? "🔄 Todos los jugadores ya fueron elegidos. Girá de nuevo."
                      : "Sin jugadores para esta posición. Usá 🔄 Re-sortear."}
                  </p>
                )}
                {pickerPlayers.map(player => (
                  <PlayerTradingCard key={player.id} player={player}
                    onSelect={() => pickPlayer(player, activeSlotIdx)}
                    showRating={mode.ratingsVisible} />
                ))}
              </div>
              {pickerPlayers.length > 0 && (
                <p className="text-xs text-slate-400 text-center mt-2">
                  {compatibleCount > 0
                    ? `✅ ${compatibleCount} compatible${compatibleCount !== 1 ? "s" : ""} — elegí uno y girá de nuevo`
                    : "⚠️ Ninguno compatible — usá 🔄 Re-sortear"}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* PHASE: DONE */}
        {phase === "done" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            {confetti && (
              <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1] }} transition={{ duration: 0.6 }} className="text-8xl">🎉</motion.div>
              </div>
            )}
            <div className="card-gradient rounded-3xl p-6 mb-6">
              <h2 className="font-display text-3xl font-black gradient-text mb-2">¡11 Armado!</h2>
              <p className="text-slate-400 text-sm mb-4">Tocá cualquier posición para cambiar el jugador</p>
              <div className="mb-4"><Pitch f={f} draft={drafted} activeSlot={activeSlotIdx} onSlotClick={handleSlotClick} phase={phase} chemistry={chemBreakdown} /></div>
              <div className="mb-4"><ChemistryPanel chemistry={chemBreakdown} /></div>
              {/* Player chips */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {f.positions.map((pos: any, i: number) => {
                  const pl = drafted[i]
                  return (
                    <div key={i} className="flex items-center gap-1.5 bg-slate-800/50 rounded-lg px-2.5 py-1.5 border border-slate-700 group relative">
                      <button onClick={() => removePlayer(i)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">✕</button>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                        style={{ backgroundColor: getPC(pos.pos) }}>
                        {pl ? pl.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : POS_LABELS[pos.pos]}
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-white truncate max-w-[80px]">
                          {pl ? pl.name.split(" ").pop() : <span className="text-slate-500 italic">vacío</span>}
                        </div>
                        <div className="text-[8px] text-slate-500">{POS_LABELS[pos.pos] || pos.pos}</div>
                      </div>
                      {pl && mode.ratingsVisible && <span className="text-[10px] font-bold text-[#75AADB]">{pl.rating}</span>}
                    </div>
                  )
                })}
              </div>
              <div className="text-2xl font-display font-black text-[#75AADB]">Score: {teamScore || partialScore} pts</div>
            </div>
            <div className="flex gap-3 justify-center flex-wrap mb-6 font-sport">
              <MagneticButton>
                <button onClick={() => startSim("liga")} className="btn-primary px-8 py-3">Simular Liga</button>
              </MagneticButton>
              <MagneticButton>
                <button onClick={() => startSim("copa")} className="btn-primary px-6 py-3">Simular Copa</button>
              </MagneticButton>
              <button onClick={resetGame} className="btn-secondary px-6 py-3">Nuevo Draft</button>
            </div>
            <Link href="/" className="text-slate-400 hover:text-white transition-colors text-xs font-bold font-sport uppercase tracking-wider block text-center">Volver al inicio</Link>
          </motion.div>
        )}
      </main>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WRAPPER
   ═══════════════════════════════════════════════════════════════ */
export default function DraftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center text-slate-400">Cargando...</div>}>
      <DraftInner />
    </Suspense>
  )
}
