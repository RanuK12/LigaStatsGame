"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import playersData from "@/data/players.json"
import squadsData from "@/data/squads.json"
import clubsData from "@/data/clubs.json"
import type { Player, Squad, Club } from "@/lib/types"
import {
  normalizePlayers,
  normalizeSquads,
  normalizeClubs,
} from "@/lib/data-normalizers"
import {
  formations,
  canPlayHere,
  getSquadPlayers,
  calculateTeamScore,
  calculateFullTeamScore,
  GAME_MODES,
  POS_LABELS,
  simulateSeasonMatchByMatch,
  simulateCopaArgentinaMatchByMatch,
} from "@/lib/game-engine"

/* ═══════════════════════════════════════════════════════════════
   POSITION COLORS
   ═══════════════════════════════════════════════════════════════ */
function getEligibleSquadsForSlot(
  squads: Squad[],
  players: Player[],
  slotPosition: string,
  draftedIds: Set<string>
): Squad[] {
  return squads.filter((squad) => {
    const squadPlayers = players.filter((player) => squad.playerIds.includes(player.id))
    return squadPlayers.some((player) => !draftedIds.has(player.id) && canPlayHere(player, slotPosition))
  })
}

const PC: Record<string, string> = {
  GK: "#f59e0b", CB: "#3b82f6", LB: "#06b6d4", RB: "#06b6d4",
  CDM: "#059669", CM: "#10b981", CAM: "#8b5cf6",
  LW: "#ef4444", RW: "#ef4444", ST: "#dc2626", CF: "#ea580c",
  LM: "#14b8a6", RM: "#14b8a6", LWB: "#0891b2", RWB: "#0891b2",
}
const getPC = (pos?: string) => (pos && PC[pos]) || "#6b7280"

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
type Phase = "start" | "ready" | "spinning" | "picking" | "done" | "sim"

interface EnrichedPlayer extends Player {
  isCompatible: boolean
}

/* ═══════════════════════════════════════════════════════════════
   PITCH COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function Pitch({ f, draft, activeSlot, onSlotClick, phase }: {
  f: any; draft: (Player | null)[]; activeSlot: number;
  onSlotClick: (idx: number) => void; phase: Phase
}) {
  return (
    <div className="pitch w-full max-w-[360px] aspect-[68/105] mx-auto relative">
      <div className="pitch-lines" />
      <div className="pitch-center" />
      <div className="pitch-center-dot" />
      <div className="pitch-area-top" />
      <div className="pitch-area-bottom" />
      {f.positions.map((pos: any, i: number) => {
        const pl = draft[i]
        const isActive = i === activeSlot
        const isEmpty = !pl
        return (
          <div key={i}
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)" }}
            className="absolute cursor-pointer transition-all duration-200 hover:scale-110 z-10"
            onClick={() => onSlotClick(i)}>
            {pl ? (
              <div className={`flex flex-col items-center ${isActive ? "scale-110" : ""}`}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 shadow-lg transition-all"
                  style={{
                    backgroundColor: getPC(pos.pos),
                    borderColor: isActive ? "#fbbf24" : "rgba(255,255,255,0.3)"
                  }}>
                  {pl.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="text-[9px] text-white font-semibold mt-0.5 bg-black/40 px-1 rounded max-w-[70px] truncate text-center">
                  {pl.name.split(" ").pop()}
                </div>
                <div className="text-[7px] text-slate-400">{POS_LABELS[pos.pos] || pos.pos}</div>
              </div>
            ) : (
              <div className={`flex flex-col items-center ${isActive ? "scale-110" : ""}`}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold border-2 border-dashed transition-all ${
                  isActive
                    ? "border-yellow-400 bg-yellow-400/10 text-yellow-400 animate-pulse"
                    : "border-slate-500 bg-slate-800/50 text-slate-500"
                }`}>
                  {POS_LABELS[pos.pos] || pos.pos}
                </div>
                <div className="text-[8px] text-slate-500 mt-0.5">{pos.label}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PLAYER CARD (for picker list)
   ═══════════════════════════════════════════════════════════════ */
function PlayerCard({ player, onSelect, showRating }: {
  player: EnrichedPlayer; onSelect: () => void; showRating: boolean
}) {
  return (
    <button onClick={onSelect}
      className={`flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all duration-150 ${
        player.isCompatible
          ? "bg-slate-800/80 border border-[#75AADB]/30 hover:border-[#75AADB] hover:bg-slate-700/80 cursor-pointer"
          : "bg-slate-900/40 border border-slate-800 opacity-40 hover:opacity-60 cursor-not-allowed"
      }`}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
        style={{ backgroundColor: getPC(player.position) }}>
        {player.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white truncate">{player.name}</div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
            player.isCompatible ? "bg-[#75AADB]/20 text-[#75AADB]" : "bg-slate-800 text-slate-500"
          }`}>
            {POS_LABELS[player.position] || player.position}
          </span>
          <span className="text-[10px] text-slate-500">
            {player.goalsClub}⚽ {player.capsClub}📋
          </span>
          {player.legendary && <span className="text-[10px]">⭐</span>}
        </div>
      </div>
      {showRating && (
        <div className="text-right shrink-0">
          <div className="text-lg font-black text-[#75AADB]">{player.rating}</div>
        </div>
      )}
    </button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ROULETTE WHEEL
   ═══════════════════════════════════════════════════════════════ */
function RouletteWheel({ squads, spinning, result }: {
  squads: Squad[]; spinning: boolean; result: Squad | null
}) {
  const [rotation, setRotation] = useState(0)
  const visibleSquads = useMemo(() => squads.slice(0, 18), [squads])
  const segCount = visibleSquads.length
  const segAngle = segCount > 0 ? 360 / segCount : 360

  const abbrevLabel = (label: string) => {
    const words = label.replace(/['’]/g, '').split(/\s+/).filter(Boolean)
    if (words.length === 0) return label.slice(0, 8)
    return words.map((word) => word[0]).join('').slice(0, 4).toUpperCase()
  }

  useEffect(() => {
    if (spinning && result && segCount > 0) {
      const idx = visibleSquads.findIndex(s => s.id === result.id)
      if (idx >= 0) {
        const target = 360 * 6 + (360 - (idx % segCount) * segAngle - segAngle / 2)
        setRotation(prev => prev + target)
      }
    }
  }, [spinning, result, visibleSquads, segCount, segAngle])

  const colors = [
    '#dc2626', '#ea580c', '#d97706', '#65a30d', '#16a34a', '#0d9488',
    '#0891b2', '#0284c7', '#2563eb', '#4f46e5', '#7c3aed', '#9333ea',
    '#c026d3', '#db2777', '#e11d48', '#dc2626', '#ea580c', '#d97706',
    '#65a30d', '#16a34a', '#0d9488', '#0891b2', '#0284c7', '#2563eb',
    '#4f46e5', '#7c3aed', '#9333ea', '#c026d3', '#db2777', '#e11d48'
  ]

  if (segCount === 0) {
    return (
      <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 text-center text-sm text-slate-400">
        No hay planteles disponibles para esta posición.
      </div>
    )
  }

  return (
    <div className="relative mx-auto h-64 w-64 overflow-hidden rounded-full border-4 border-slate-600 bg-slate-950 shadow-[0_0_0_8px_rgba(117,170,219,0.08),0_0_50px_rgba(249,115,22,0.18)]">
      <div className="absolute -inset-8 rounded-full bg-orange-500/15 blur-2xl" />
      <div className="absolute -top-1 left-1/2 z-30 h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_0_10px_rgba(255,255,255,0.85)]" />

      <motion.div
        animate={{ rotate: rotation, scale: spinning ? [1, 1.03, 1] : 1, y: spinning ? [0, -1, 1, 0] : 0 }}
        transition={{
          rotate: { duration: spinning ? 3.4 : 0, ease: [0.17, 0.67, 0.12, 0.99] },
          scale: { duration: 0.35, repeat: spinning ? Infinity : 0 },
          y: { duration: 0.35, repeat: spinning ? Infinity : 0 },
        }}
        className="absolute inset-0 z-10"
      >
        <svg viewBox="0 0 100 100" className="h-full w-full">
          {visibleSquads.map((squad, index) => {
            const startAngle = index * segAngle
            const endAngle = (index + 1) * segAngle
            const startRad = (startAngle - 90) * Math.PI / 180
            const endRad = (endAngle - 90) * Math.PI / 180
            const x1 = 50 + 50 * Math.cos(startRad)
            const y1 = 50 + 50 * Math.sin(startRad)
            const x2 = 50 + 50 * Math.cos(endRad)
            const y2 = 50 + 50 * Math.sin(endRad)
            const midRad = ((startAngle + endAngle) / 2 - 90) * Math.PI / 180
            const textX = 50 + 31 * Math.cos(midRad)
            const textY = 50 + 31 * Math.sin(midRad)
            const isSelected = spinning && result?.id === squad.id

            return (
              <g key={squad.id}>
                <path
                  d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                  fill={isSelected ? '#f97316' : colors[index % colors.length]}
                  stroke="#94a3b8"
                  strokeWidth="0.25"
                />
                <text
                  x={textX}
                  y={textY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize="3.1"
                  fontWeight="900"
                  transform={`rotate(${(startAngle + endAngle) / 2}, ${textX}, ${textY})`}
                >
                  {abbrevLabel(squad.label)}
                </text>
              </g>
            )
          })}

          <circle cx="50" cy="50" r="10" fill="#020617" stroke="#f97316" strokeWidth="0.8" />
          <text x="50" y="51.5" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="6">⚽</text>
        </svg>
      </motion.div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN DRAFT COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function DraftInner() {
  const sp = useSearchParams()
  const modeId = (sp.get("mode") || "clasico") as string
  const mode = GAME_MODES[modeId] || GAME_MODES.clasico

  const allP = useMemo(() => normalizePlayers(playersData), [])
  const allS = useMemo(() => normalizeSquads(squadsData), [])
  const allC = useMemo(() => normalizeClubs(clubsData), [])

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
  const [simResult, setSimResult] = useState<any>(null)
  const [confetti, setConfetti] = useState(false)
  const [spinNotice, setSpinNotice] = useState<string | null>(null)
  const draftedRef = useRef<(Player | null)[]>([])

  const f = formations[fm as keyof typeof formations] || formations["4-3-3"]
  const totalSlots = f.positions.length
  const currentPos = f.positions[activeSlotIdx] || f.positions[0]
  const filledCount = drafted.filter(Boolean).length
  const eligibleSquads = useMemo(
    () => getEligibleSquadsForSlot(allS, allP, currentPos.pos, draftedIds),
    [allS, allP, currentPos.pos, draftedIds]
  )

  // ── Score ──
  const teamScore = useMemo(() => calculateFullTeamScore(drafted, f), [drafted, f])
  const partialScore = useMemo(() => calculateTeamScore(drafted, f), [drafted, f])

  // ── Find next empty slot ──
  const findNextEmpty = useCallback((from: number, board: (Player | null)[]) => {
    let idx = from
    while (idx < totalSlots && board[idx] !== null) idx++
    return idx < totalSlots ? idx : -1
  }, [totalSlots])

  // ═══════════════════════════════════════════════════════════
  //  START GAME
  // ═══════════════════════════════════════════════════════════
  const startGame = useCallback(() => {
    const empty = new Array(totalSlots).fill(null)
    setDrafted(empty)
    setDraftedIds(new Set())
    draftedRef.current = empty
    setActiveSlotIdx(0)
    setCurrentSquad(null)
    setWildcards(mode.rerolls || 3)
    setSearch("")
    setSimResult(null)
    setSpinNotice(null)
    setStarted(true)
    setPhase("ready")
  }, [totalSlots, mode])

  // ═══════════════════════════════════════════════════════════
  //  SPIN WHEEL
  // ═══════════════════════════════════════════════════════════
  const spinWheel = useCallback(() => {
    if (spinning) return
    const eligible = getEligibleSquadsForSlot(allS, allP, currentPos.pos, draftedIds)
    if (eligible.length === 0) {
      setSpinNotice("No hay planteles disponibles para esta posición. Probá cambiar de formación o reiniciar.")
      setCurrentSquad(null)
      setSpinning(false)
      setPhase("ready")
      return
    }
    const result = eligible[Math.floor(Math.random() * eligible.length)]
    setSpinNotice(null)
    setCurrentSquad(result)
    setSpinning(true)
    setPhase("spinning")
    setTimeout(() => {
      setSpinning(false)
      setPhase("picking")
      setSearch("")
    }, 2800)
  }, [spinning, allS, allP, currentPos.pos, draftedIds])

  // ═══════════════════════════════════════════════════════════
  //  REROLL (wildcard)
  // ═══════════════════════════════════════════════════════════
  const rerollTeam = useCallback(() => {
    if (wildcards <= 0) return
    setWildcards((w: number) => w - 1)
    spinWheel()
  }, [wildcards, spinWheel])

  // ═══════════════════════════════════════════════════════════
  //  PICK PLAYER (ONE per spin — then back to ready)
  // ═══════════════════════════════════════════════════════════
  const pickPlayer = useCallback((player: Player, slotIdx: number) => {
    // Block if player already drafted (safety check)
    if (draftedIds.has(player.id)) return
    // Restriccion de posicion: un jugador NO puede ir en un slot incompatible (un CB no va de ST). (fix 06-29)
    const requiredPos = f.positions[slotIdx]?.pos
    if (requiredPos && !canPlayHere(player, requiredPos)) return

    // Compute the new board locally to avoid stale closure
    const newDrafted = [...drafted]
    newDrafted[slotIdx] = player

    setDrafted(newDrafted)
    draftedRef.current = newDrafted
    setDraftedIds(prev => new Set(prev).add(player.id))

    // Find next empty slot from the LOCAL new board (not stale state)
    let nextIdx = slotIdx + 1
    while (nextIdx < newDrafted.length && newDrafted[nextIdx] !== null) nextIdx++

    if (nextIdx < newDrafted.length) {
      // More positions → force back to READY (must spin again)
      setTimeout(() => {
        setActiveSlotIdx(nextIdx)
        setCurrentSquad(null)
        setPhase("ready")
        setSearch("")
      }, 300)
    } else {
      // All 11 filled!
      setTimeout(() => {
        setConfetti(true)
        setTimeout(() => setConfetti(false), 4000)
        setPhase("done")
      }, 300)
    }
  }, [drafted, draftedIds, f])

  // ═══════════════════════════════════════════════════════════
  //  SLOT CLICK (on pitch)
  // ═══════════════════════════════════════════════════════════
  const handleSlotClick = useCallback((idx: number) => {
    if (phase === "done") {
      // Clicking a slot in done phase → replace that player
      // Remove the old player from draftedIds
      const oldPlayer = drafted[idx]
      if (oldPlayer) {
        setDraftedIds(prev => {
          const next = new Set(prev)
          next.delete(oldPlayer.id)
          return next
        })
      }
      // Clear the slot
      setDrafted(prev => {
        const nd = [...prev]; nd[idx] = null; return nd
      })
      setActiveSlotIdx(idx)
      setCurrentSquad(null)
      setSearch("")
      setSpinNotice(null)
      setPhase("ready")
    }
    // During "picking" → DO NOT allow switching slots (forces one pick per spin)
    // During "ready" → can click to change which slot to fill next spin
    else if (phase === "ready") {
      setActiveSlotIdx(idx)
    }
  }, [phase, drafted])

  // ═══════════════════════════════════════════════════════════
  //  REMOVE PLAYER (done phase)
  // ═══════════════════════════════════════════════════════════
  const removePlayer = useCallback((idx: number) => {
    const oldPlayer = drafted[idx]
    if (oldPlayer) {
      setDraftedIds(prev => {
        const next = new Set(prev)
        next.delete(oldPlayer.id)
        return next
      })
    }
    setDrafted(prev => {
      const nd = [...prev]; nd[idx] = null; return nd
    })
    setActiveSlotIdx(idx)
    setCurrentSquad(null)
    setSpinNotice(null)
    setPhase("ready")
  }, [drafted])

  // ═══════════════════════════════════════════════════════════
  //  SIMULATION
  // ═══════════════════════════════════════════════════════════
  const startSim = useCallback((type: 'liga' | 'copa') => {
    const isPlayer = (x: any): x is Player => x && typeof x.id === 'string' && typeof x.name === 'string'
    const players = drafted.filter(isPlayer)
    if (players.length < 11) return
    // Create a virtual "Mi 11" squad since players come from different teams
    const virtualSquad: Squad = {
      id: 'mi-11-fantasy',
      clubId: 'mi-11',
      season: '2026',
      competition: 'Liga Profesional',
      label: 'Mi 11 Fantasy',
      playerIds: (() => {
        const ids = players.map(p => p.id);
        if (ids.length === 0) throw new Error('playerIds cannot be empty');
        return ids as [string, ...string[]];
      })(),
    }
    if (type === 'liga') {
      const r = simulateSeasonMatchByMatch(players, virtualSquad, allS, allP, f)
      setSimResult({ type: 'liga', ...r })
    } else {
      const r = simulateCopaArgentinaMatchByMatch(players, virtualSquad, allS, allP, f)
      setSimResult({ type: 'copa', ...r })
    }
    setPhase("sim")
  }, [drafted, allS, allP, f])

  // ═══════════════════════════════════════════════════════════
  //  PLAYER LIST FOR PICKER (no repeats, one per spin!)
  // ═══════════════════════════════════════════════════════════
  const pickerPlayers = useMemo(() => {
    if (!currentSquad) return []
    const targetPos = f.positions[activeSlotIdx]?.pos || "CM"
    const squadPlayers = getSquadPlayers(currentSquad, allP)

    // FILTER OUT already-drafted players — NO REPEATS ALLOWED
    const available = squadPlayers.filter(p => !draftedIds.has(p.id))

    const enriched: EnrichedPlayer[] = available.map(p => ({
      ...p,
      isCompatible: canPlayHere(p, targetPos),
    }))
    // Compatibles first, then by rating
    enriched.sort((a, b) => {
      if (a.isCompatible !== b.isCompatible) return a.isCompatible ? -1 : 1
      return (b.rating || 0) - (a.rating || 0)
    })
    // Filter by search only
    return enriched.filter(p =>
      !search || p.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [currentSquad, allP, f, activeSlotIdx, search, draftedIds])

  const compatibleCount = pickerPlayers.filter(p => p.isCompatible).length

  // ═══════════════════════════════════════════════════════════
  //  RESET
  // ═══════════════════════════════════════════════════════════
  const resetGame = useCallback(() => {
    setStarted(false)
    setPhase("start")
    setDrafted([])
    setDraftedIds(new Set())
    setCurrentSquad(null)
    setSimResult(null)
    setSpinNotice(null)
    setActiveSlotIdx(0)
  }, [])

  /* ═══════════════════════════════════════════════════════════
     RENDER: START SCREEN
     ═══════════════════════════════════════════════════════════ */
  if (phase === "start" || !started) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full text-center">
          <img src="/LigaStatsGame/logos/afa.png" alt="AFA" className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h1 className="font-display text-4xl md:text-5xl font-black gradient-text mb-4">
            Liga Argentina Fans
          </h1>
          <p className="text-slate-400 mb-6">{mode.icon} {mode.name}</p>

          <div className="card-gradient rounded-2xl p-6 mb-6">
            <h3 className="font-display font-bold text-lg mb-4">Elegí tu formación</h3>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.values(formations).map((fmt: any) => (
                <button key={fmt.id} onClick={() => setFm(fmt.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    fm === fmt.id
                      ? "bg-[#75AADB] text-white shadow-lg shadow-[#75AADB]/20"
                      : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                  }`}>
                  {fmt.name}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <Pitch f={f} draft={[]} activeSlot={-1} onSlotClick={() => {}} phase="start" />
            </div>
          </div>

          <div className="card-gradient rounded-2xl p-6 mb-6 text-left">
            <h3 className="font-display font-bold text-lg mb-3">Cómo Jugar</h3>
            <ol className="text-sm text-slate-400 space-y-2">
              <li>1. Girás la ruleta — te toca un <strong className="text-slate-200">equipo + año</strong></li>
              <li>2. Elegís <strong className="text-slate-200">un solo jugador</strong> para la posición que toca</li>
              <li>3. Girás de nuevo para la <strong className="text-slate-200">siguiente posición</strong></li>
              <li>4. Usá comodines para <strong className="text-slate-200">cambiar equipo</strong></li>
              <li>5. Armá los 11 y <strong className="text-slate-200">simulá la temporada</strong></li>
            </ol>
          </div>

          <button onClick={startGame}
            className="px-10 py-4 bg-gradient-to-r from-[#75AADB] to-blue-600 rounded-xl font-bold text-lg shadow-lg shadow-[#75AADB]/25 hover:shadow-[#75AADB]/40 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]">
            🚀 Comenzar Draft
          </button>
          <Link href="/"
            className="block mt-6 text-slate-400 hover:text-white transition-colors text-sm">
            ← Volver al inicio
          </Link>
        </motion.div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER: SIMULATION RESULTS
     ═══════════════════════════════════════════════════════════ */
  if (phase === "sim" && simResult) {
    return (
      <div className="min-h-screen gradient-bg px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl font-black gradient-text text-center mb-6">
              {simResult.type === "copa" ? "🏅 Copa Argentina" : "🏆 Liga Argentina"}
            </h1>

            {simResult.type === "liga" && (
              <div className="card-gradient rounded-2xl p-6 mb-6">
                <h2 className="font-display font-bold text-lg mb-2 text-center">
                  Posición final: <span className="text-[#75AADB] text-2xl">#{simResult.playerPos}</span>
                </h2>
                <div className="text-center text-sm text-slate-400 mb-4">
                  Campeón: <strong className="text-white">{simResult.champion}</strong>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-500 text-xs border-b border-slate-700">
                        <th className="py-1.5 text-left">#</th>
                        <th className="py-1.5 text-left">Equipo</th>
                        <th className="py-1.5 text-center">PJ</th>
                        <th className="py-1.5 text-center">Pts</th>
                        <th className="py-1.5 text-center">GF</th>
                        <th className="py-1.5 text-center">GC</th>
                        <th className="py-1.5 text-center">DG</th>
                        <th className="py-1.5 text-center">Forma</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simResult.table.map((t: any, i: number) => {
                        const isPlayer = t.name === "Mi 11 Fantasy"
                        return (
                          <tr key={i} className={`border-b border-slate-800 ${
                            isPlayer ? "bg-[#75AADB]/10 font-semibold" : ""
                          }`}>
                            <td className="py-1.5 text-slate-400">{i + 1}</td>
                            <td className="py-1.5 text-white truncate max-w-[180px]">{t.name}</td>
                            <td className="py-1.5 text-center text-slate-400">
                              {t.w + t.d + t.l}
                            </td>
                            <td className="py-1.5 text-center text-[#75AADB] font-bold">{t.pts}</td>
                            <td className="py-1.5 text-center text-slate-400">{t.gf}</td>
                            <td className="py-1.5 text-center text-slate-400">{t.ga}</td>
                            <td className="py-1.5 text-center text-slate-400">{t.gf - t.ga}</td>
                            <td className="py-1.5 text-center text-xs">
                              {t.form.map((r: string, j: number) => (
                                <span key={j} className={`inline-block w-5 h-5 leading-5 text-center rounded text-[10px] font-bold ${
                                  r === "V" ? "bg-green-600 text-white" :
                                  r === "E" ? "bg-yellow-600 text-white" :
                                  "bg-red-600 text-white"
                                }`}>{r}</span>
                              ))}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {simResult.type === "copa" && (
              <div className="card-gradient rounded-2xl p-6 mb-6">
                <h2 className="font-display font-bold text-lg mb-4 text-center">
                  {simResult.eliminated
                    ? `Eliminado en ${simResult.eliminatedRound}`
                    : `🏅 ¡Campeón! 🏅`
                  }
                </h2>
                {simResult.rounds.map((round: any, ri: number) => (
                  <div key={ri} className="mb-4">
                    <h3 className="text-sm font-bold text-slate-400 mb-2">{round.round}</h3>
                    <div className="space-y-1">
                      {round.matches.map((m: any, mi: number) => {
                        const isPlayer = m.home === "Mi 11 Fantasy" || m.away === "Mi 11 Fantasy"
                        return (
                          <div key={mi} className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                            isPlayer ? "bg-[#75AADB]/10" : ""
                          }`}>
                            <span className={`flex-1 text-right ${m.winner === m.home ? "font-bold text-white" : "text-slate-400"}`}>
                              {m.home}
                            </span>
                            <span className="px-3 font-bold text-slate-300">
                              {m.hg} - {m.ag}
                              {m.penalties && <span className="text-slate-500 ml-1">({m.penalties} p)</span>}
                            </span>
                            <span className={`flex-1 ${m.winner === m.away ? "font-bold text-white" : "text-slate-400"}`}>
                              {m.away}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap mb-6">
              <button onClick={() => { setPhase("done"); setSimResult(null) }}
                className="btn-secondary px-6 py-3">
                ← Volver al equipo
              </button>
              <button onClick={resetGame}
                className="btn-secondary px-6 py-3">
                🔄 Nuevo Draft
              </button>
            </div>
            <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm text-center block">
              ← Volver al inicio
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER: MAIN GAME (ready / spinning / picking / done)
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen gradient-bg">
      {/* ── Header ── */}
      <header className="pt-6 pb-4 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <img src="/LigaStatsGame/logos/afa.png" alt="AFA" className="w-6 h-6" />
          <span className="text-xs font-medium text-slate-500">{mode.icon} {mode.name}</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-black gradient-text">
          Armá tu 11
        </h1>
        <div className="flex items-center justify-center gap-4 mt-2 text-sm">
          <span className="text-slate-400">
            Posición: <strong className="text-white">{POS_LABELS[currentPos.pos] || currentPos.pos}</strong>
            <span className="text-slate-500 ml-1">({activeSlotIdx + 1}/{totalSlots})</span>
          </span>
          <span className="text-slate-400">
            Equipo: <strong className="text-[#75AADB]">{filledCount}/11</strong>
          </span>
          {teamScore > 0 && (
            <span className="text-[#75AADB] font-bold">⭐ {teamScore} pts</span>
          )}
          {wildcards > 0 && (
            <span className="text-yellow-400">💎 {wildcards}</span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pb-20">
        {/* ── Progress bar ── */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 mb-6">
          <div className="bg-gradient-to-r from-[#75AADB] to-blue-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(filledCount / totalSlots) * 100}%` }} />
        </div>

        {/* ═══ PHASE: READY — Spin button ═══ */}
        {phase === "ready" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {spinNotice && (
              <div className="card-gradient rounded-xl p-3 mb-4 text-sm text-amber-200 border border-amber-400/20">
                {spinNotice}
              </div>
            )}
            <div className="card-gradient rounded-xl p-4 mb-4 text-center">
              <div className="text-sm text-slate-400 mb-1">
                Posición {filledCount + 1} de {totalSlots}:
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: getPC(currentPos.pos) }}>
                  {POS_LABELS[currentPos.pos]}
                </div>
                <span className="font-display font-bold text-xl text-white">{currentPos.label}</span>
              </div>
            </div>

            <div className="mb-4">
              <Pitch f={f} draft={drafted} activeSlot={activeSlotIdx}
                onSlotClick={handleSlotClick} phase={phase} />
            </div>

            <div className="text-center">
              <button onClick={spinWheel}
                className="px-10 py-4 bg-gradient-to-r from-[#75AADB] to-blue-600 rounded-xl font-bold text-lg shadow-lg shadow-[#75AADB]/25 hover:shadow-[#75AADB]/40 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]">
                🎲 ¡Girar Ruleta!
              </button>
              <p className="text-xs text-slate-500 mt-2">
                Elegí 1 posición en la cancha o girá para la siguiente
              </p>
            </div>
          </motion.div>
        )}

        {/* ═══ PHASE: SPINNING ═══ */}
        {phase === "spinning" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <p className="text-slate-400 mb-4 text-sm">🎰 Girando la ruleta para{" "}
              <strong style={{ color: getPC(currentPos.pos) }}>
                {POS_LABELS[currentPos.pos]}
              </strong>
              {" "}({filledCount + 1}/{totalSlots})
            </p>
            <RouletteWheel squads={eligibleSquads} spinning={true} result={currentSquad} />
            <p className="mt-4 text-sm text-slate-500">Buscando un plantel elegible para la posición actual...</p>
          </motion.div>
        )}

        {/* ═══ PHASE: PICKING — Show squad + player picker ═══ */}
        {phase === "picking" && currentSquad && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Team info card */}
            <div className="card-gradient rounded-xl p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={`/LigaStatsGame/logos/clubs/${currentSquad.clubId}.png`} alt=""
                  className="w-12 h-12 rounded-lg object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
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
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  🔄 Re-sortear ({wildcards})
                </button>
              </div>
            </div>

            {/* Pitch */}
            <div className="mb-4">
              <Pitch f={f} draft={drafted} activeSlot={activeSlotIdx}
                onSlotClick={handleSlotClick} phase={phase} />
            </div>

            {/* Player picker panel */}
            <div className="card-gradient rounded-xl p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-sm">
                  ⚡ Elegí{" "}
                  <span style={{ color: getPC(currentPos.pos) }}>
                    {POS_LABELS[currentPos.pos] || currentPos.pos}
                  </span>
                  {" "}— 1 solo jugador
                </h3>
                <span className="text-xs text-slate-500">
                  {pickerPlayers.length} disp. · {filledCount}/{totalSlots}
                </span>
              </div>

              {/* Search */}
              <input type="text" placeholder="🔍 Buscar jugador..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-[#75AADB] focus:outline-none w-full mb-3" />

              {/* Player list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[40vh] overflow-y-auto pr-1">
                {pickerPlayers.length === 0 && (
                  <p className="text-slate-500 text-sm text-center col-span-2 py-4">
                    {draftedIds.size > 0 && currentSquad
                      ? "🔄 Todos los jugadores de este plantel ya fueron elegidos. Girá de nuevo."
                      : "Sin jugadores para esta posición. Usá 🔄 Re-sortear."}
                  </p>
                )}
                {pickerPlayers.map(player => (
                  <PlayerCard key={player.id} player={player}
                    onSelect={() => pickPlayer(player, activeSlotIdx)}
                    showRating={mode.ratingsVisible} />
                ))}
              </div>
              {pickerPlayers.length > 0 && (
                <p className="text-xs text-slate-500 text-center mt-2">
                  {compatibleCount > 0
                    ? `✅ ${compatibleCount} compatible${compatibleCount !== 1 ? "s" : ""} — elegí uno y girá de nuevo`
                    : "⚠️ Ninguno compatible — usá 🔄 Re-sortear"}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ═══ PHASE: DONE — Full team ═══ */}
        {phase === "done" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            {confetti && (
              <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1] }}
                  transition={{ duration: 0.6 }} className="text-8xl">🎉</motion.div>
              </div>
            )}
            <div className="card-gradient rounded-2xl p-6 mb-6">
              <h2 className="font-display text-3xl font-black gradient-text mb-2">¡11 Armado!</h2>
              <p className="text-slate-400 text-sm mb-4">Tocá cualquier posición para cambiar el jugador</p>
              <div className="mb-4">
                <Pitch f={f} draft={drafted} activeSlot={activeSlotIdx}
                  onSlotClick={handleSlotClick} phase={phase} />
              </div>
              {/* Player chips */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {f.positions.map((pos: any, i: number) => {
                  const pl = drafted[i]
                  return (
                    <div key={i}
                      className="flex items-center gap-1.5 bg-slate-800/50 rounded-lg px-2.5 py-1.5 border border-slate-700 group relative">
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
                      {pl && mode.ratingsVisible && (
                        <span className="text-[10px] font-bold text-[#75AADB]">{pl.rating}</span>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="text-2xl font-display font-black text-[#75AADB]">
                Score: {teamScore || partialScore} pts
              </div>
            </div>

            <div className="flex gap-3 justify-center flex-wrap mb-6">
              <button onClick={() => startSim("liga")}
                className="btn-primary text-lg px-8 py-3">
                🏆 Simular Liga
              </button>
              <button onClick={() => startSim("copa")}
                className="btn-primary text-lg px-6 py-3">
                🏅 Simular Copa
              </button>
              <button onClick={resetGame}
                className="btn-secondary px-6 py-3">
                🔄 Nuevo Draft
              </button>
            </div>
            <Link href="/"
              className="text-slate-400 hover:text-white transition-colors text-sm">
              ← Volver al inicio
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WRAPPER (Suspense boundary for useSearchParams)
   ═══════════════════════════════════════════════════════════════ */
export default function DraftPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-bg flex items-center justify-center text-slate-400">
        Cargando...
      </div>
    }>
      <DraftInner />
    </Suspense>
  )
}
