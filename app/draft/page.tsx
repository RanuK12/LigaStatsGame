"use client"
import { useState, Suspense, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import playersData from '@/data/players.json'
import clubsData from '@/data/clubs.json'
import squadsData from '@/data/squads.json'
import {
  formations, canPlayHere, getPlayersForSlot, getSquadPlayers,
  calculateTeamScore, calculateFullTeamScore,
  GAME_MODES, generateShareText,
  simulateSeasonMatchByMatch, simulateCopaArgentinaMatchByMatch,
  POS_LABELS
} from '@/lib/game-engine'
import { Player, Club, Squad, Formation } from '@/lib/types'

/* ═══════════════════════════════════════════════════════════════
   POSITION COLORS
   ═══════════════════════════════════════════════════════════════ */
const PC: Record<string, string> = {
  GK: '#f59e0b', CB: '#3b82f6', LB: '#06b6d4', RB: '#06b6d4',
  LWB: '#0891b2', RWB: '#0891b2',
  CDM: '#059669', CM: '#10b981', CAM: '#8b5cf6',
  LM: '#14b8a6', RM: '#14b8a6',
  LW: '#ef4444', RW: '#ef4444', ST: '#dc2626', CF: '#ea580c'
}

/* ═══════════════════════════════════════════════════════════════
   PITCH COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function Pitch({ f, draft, highlight, onSlotClick, showRatings, slotAvail, activeSlot }: {
  f: any; draft: (Player | null)[]; highlight: number;
  onSlotClick: (idx: number) => void; showRatings: boolean; slotAvail?: number[]; activeSlot?: number
}) {
  return (
    <div className="pitch w-full max-w-[360px] aspect-[68/105] mx-auto relative">
      <div className="pitch-lines" /><div className="pitch-center" /><div className="pitch-center-dot" />
      <div className="pitch-area-top" /><div className="pitch-area-bottom" />
      {f.positions.map((pos: any, i: number) => {
        const pl = draft[i]; const isHighlight = i === highlight; const isActive = i === activeSlot
        const avail = slotAvail ? slotAvail[i] : 0
        return (
          <div key={i} style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)" }}
            className="absolute cursor-pointer transition-all duration-200 hover:scale-110 z-10"
            onClick={() => onSlotClick(i)}>
            {pl ? (
              <div className={`flex flex-col items-center ${isHighlight || isActive ? "scale-110" : ""}`}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 shadow-lg transition-all"
                  style={{ backgroundColor: PC[pos.pos] || "#666", borderColor: isActive ? "#fbbf24" : isHighlight ? "#fff" : "rgba(255,255,255,0.3)" }}>
                  {pl.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="bg-black/80 text-white text-[8px] px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap font-semibold max-w-[70px] truncate">
                  {pl.name.split(" ").pop()}
                </div>
                {showRatings && <div className="text-[8px] font-bold" style={{ color: PC[pos.pos] }}>{pl.rating}</div>}
              </div>
            ) : (
              <div className={`flex flex-col items-center ${isActive ? "animate-pulse" : ""}`}>
                <div className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center text-[10px] font-bold transition-all
                  ${isActive ? "border-yellow-400 bg-yellow-400/20 shadow-lg shadow-yellow-400/20" : isHighlight ? "border-white bg-white/15 shadow-lg shadow-white/10" : "border-white/25 bg-black/50 hover:border-white/50 hover:bg-white/10"}`}
                  style={{ color: PC[pos.pos] }}>
                  {POS_LABELS[pos.pos] || pos.pos}
                </div>
                <div className="text-[7px] text-white/40 mt-0.5 whitespace-nowrap">
                  {avail > 0 ? `${avail} jug.` : pos.label}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PLAYER CARD
   ═══════════════════════════════════════════════════════════════ */
function PlayerCard({ player, mode, onSelect, slotPos }: {
  player: Player; mode: any; onSelect: () => void; slotPos: string
}) {
  const isExact = player.position === slotPos
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onSelect}
      className={`card-gradient rounded-xl p-3 flex items-center gap-3 text-left transition-all w-full
        ${isExact ? 'border-green-500/30 hover:border-green-500/50' : 'hover:border-[#75AADB]/30'}`}>
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 relative"
        style={{ backgroundColor: PC[player.position] || "#666" }}>
        {player.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        {player.legendary && <div className="absolute -top-1 -right-1 text-[10px]">⭐</div>}
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold text-sm truncate text-white">{player.name}</div>
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <span className="font-medium" style={{ color: PC[player.position] }}>{POS_LABELS[player.position] || player.position}</span>
          <span className="text-slate-600">·</span>
          <span className="truncate">{player.clubs?.[0]?.name || ""}</span>
          {player.activeYears && <span className="text-slate-600">· {player.activeYears}</span>}
        </div>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
        {mode.ratingsVisible && <div className="text-lg font-black text-[#75AADB]">{player.rating}</div>}
        <div className="text-[10px] text-slate-500">{player.goalsClub}⚽ {player.capsClub}📋</div>
      </div>
    </motion.button>
  )
}

/* ═══════════════════════════════════════════════════════════════
   ROULETTE ANIMATION COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function RouletteWheel({ squads, spinning, result }: { squads: Squad[]; spinning: boolean; result: Squad | null }) {
  const [rotation, setRotation] = useState(0)
  const segCount = Math.min(squads.length, 24)
  const segAngle = 360 / segCount

  useEffect(() => {
    if (spinning && result) {
      const idx = squads.findIndex(s => s.id === result.id)
      const target = 360 * 5 + (360 - (idx % segCount) * segAngle - segAngle / 2)
      setRotation(prev => prev + target)
    }
  }, [spinning, result, squads, segCount, segAngle])

  return (
    <div className="w-56 h-56 mx-auto rounded-full border-4 border-slate-600 relative overflow-hidden"
      style={{ background: `conic-gradient(from 0deg, ${Array.from({ length: segCount }, (_, i) => `hsl(${i * segAngle + 20}, 65%, ${25 + i % 2 * 8}%)`).join(',')})` }}>
      <motion.div animate={{ rotate: rotation }} transition={{ duration: spinning ? 4 : 0, ease: [0.17, 0.67, 0.12, 0.99] }} className="absolute inset-0" />
      <div className="absolute inset-[30%] bg-slate-900 rounded-full flex items-center justify-center text-2xl shadow-lg border-2 border-slate-700 z-10">⚽</div>
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-white z-20" />
    </div>
  )
}

import { useEffect } from 'react'

/* ═══════════════════════════════════════════════════════════════
   MAIN DRAFT COMPONENT
   ═══════════════════════════════════════════════════════════════ */
function DraftInner() {
  const sp = useSearchParams()
  const modeId = (sp.get("mode") || "clasico") as string
  const mode = GAME_MODES[modeId] || GAME_MODES.clasico
  const allP = useMemo(() => playersData as Player[], [])
  const allC = useMemo(() => clubsData as Club[], [])
  const allS = useMemo(() => squadsData as Squad[], [])
  const cMap = useMemo(() => Object.fromEntries(allC.map(c => [c.id, c])), [allC])

  // ── Game State ──
  const [started, setStarted] = useState(false)
  const [fm, setFm] = useState<Formation>("4-3-3")
  const [drafted, setDrafted] = useState<(Player | null)[]>([])
  const [currentPosIdx, setCurrentPosIdx] = useState(0)
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [wildcards, setWildcards] = useState(mode.rerolls || 3)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [phase, setPhase] = useState<"start" | "spinning" | "picking" | "done" | "sim">("start")
  const [simResult, setSimResult] = useState<any>(null)
  const [simIdx, setSimIdx] = useState(0)
  const [confetti, setConfetti] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSlotIdx, setPickerSlotIdx] = useState(0)
  const [swapMode, setSwapMode] = useState(false) // for done phase: swapping a player
  const draftedRef = useRef<(Player | null)[]>([])

  const f = formations[fm]
  const totalSlots = f.positions.length
  const currentPos = f.positions[currentPosIdx] || f.positions[0]
  const teamScore = calculateFullTeamScore(drafted, f)
  const partialScore = calculateTeamScore(drafted, f)
  const filledCount = drafted.filter(Boolean).length

  // ── Slot availability per position ──
  const slotAvailability = useMemo(() => {
    if (!currentSquad) return f.positions.map(() => 0)
    return f.positions.map((pos: any) => getPlayersForSlot(currentSquad, allP, pos.pos).length)
  }, [currentSquad, allP, f])

  // ── Players for the current picker slot ──
  const pickerPlayers = useMemo(() => {
    if (!currentSquad) return []
    const slotPos = f.positions[pickerSlotIdx]?.pos || 'CM'
    let pool = getPlayersForSlot(currentSquad, allP, slotPos)
    // Fallback: if no compatible players, show all squad players
    if (pool.length === 0) {
      pool = allP.filter(p => currentSquad.playerIds.includes(p.id))
    }
    return pool
      .filter(p => {
        if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
        if (filter !== "all" && p.position !== filter) return false
        return true
      })
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
  }, [currentSquad, allP, f, pickerSlotIdx, search, filter])

  // ── Available players count for current position ──
  const currentPosAvailable = useMemo(() => {
    if (!currentSquad) return 0
    return getPlayersForSlot(currentSquad, allP, currentPos.pos).length
  }, [currentSquad, allP, currentPos])

  // ─────────────────────────────────────────────────────────────
  //  SPIN: pick random squad for the CURRENT position
  // ─────────────────────────────────────────────────────────────
  const spinWheel = useCallback(() => {
    if (spinning) return
    setSpinning(true)
    setPhase("spinning")
    setShowPicker(false)
    const valid = allS.filter(s => s.playerIds.length >= 11)
    if (valid.length === 0) { setSpinning(false); setPhase("picking"); return }
    const result = valid[Math.floor(Math.random() * valid.length)]
    setTimeout(() => {
      setCurrentSquad(result)
      setSpinning(false)
      setPhase("picking")
      setPickerSlotIdx(currentPosIdx) // SYNC: picker always opens for current position
      setShowPicker(true)
      setFilter("all")
      setSearch("")
    }, 2500)
  }, [spinning, allS, currentPosIdx])

  // ─────────────────────────────────────────────────────────────
  //  REROLL: spin again with wildcard
  // ─────────────────────────────────────────────────────────────
  const rerollTeam = useCallback(() => {
    if (wildcards <= 0) return
    setWildcards((w: number) => w - 1)
    spinWheel()
  }, [wildcards, spinWheel])

  // ─────────────────────────────────────────────────────────────
  //  PICK PLAYER: place in slot and advance
  // ─────────────────────────────────────────────────────────────
  const pickPlayer = useCallback((player: Player, slotIdx?: number) => {
    const idx = slotIdx !== undefined ? slotIdx : currentPosIdx
    setDrafted(prev => {
      const nd = [...prev]; nd[idx] = player
      draftedRef.current = nd
      // Advance after a tick
      setTimeout(() => {
        // Find next empty slot
        let nextIdx = idx + 1
        while (nextIdx < totalSlots && nd[nextIdx] !== null) nextIdx++
        if (nextIdx < totalSlots) {
          setCurrentPosIdx(nextIdx)
          setPickerSlotIdx(nextIdx)
          setPhase("picking")
          setShowPicker(false) // Will re-spin for next position
          setCurrentSquad(null) // Reset squad for next spin
        } else {
          setConfetti(true)
          setTimeout(() => setConfetti(false), 4000)
          setPhase("done")
          setShowPicker(false)
        }
      }, 100)
      return nd
    })
  }, [currentPosIdx, totalSlots])

  // ─────────────────────────────────────────────────────────────
  //  SLOT CLICK: in picking phase or done phase
  // ─────────────────────────────────────────────────────────────
  const handleSlotClick = useCallback((idx: number) => {
    if (phase === "done" || swapMode) {
      // Done phase: allow swapping
      if (drafted[idx]) {
        setSwapMode(true)
        setPickerSlotIdx(idx)
        setCurrentPosIdx(idx)
        setShowPicker(true)
        setFilter("all")
        setSearch("")
      }
    } else if (phase === "picking" && currentSquad) {
      // Picking phase: change which position to fill
      setPickerSlotIdx(idx)
      setCurrentPosIdx(idx)
      setShowPicker(true)
      setFilter("all")
      setSearch("")
    }
  }, [phase, swapMode, drafted, currentSquad])

  // ─────────────────────────────────────────────────────────────
  //  REMOVE PLAYER (done phase)
  // ─────────────────────────────────────────────────────────────
  const removePlayer = useCallback((idx: number) => {
    setDrafted(prev => {
      const nd = [...prev]; nd[idx] = null
      draftedRef.current = nd
      return nd
    })
    setSwapMode(false)
    setShowPicker(false)
  }, [])

  // ─────────────────────────────────────────────────────────────
  //  START / RESET
  // ─────────────────────────────────────────────────────────────
  const startGame = useCallback(() => {
    const initialDraft = new Array(totalSlots).fill(null) as (Player | null)[]
    draftedRef.current = initialDraft
    setDrafted(initialDraft)
    setStarted(true)
    setCurrentPosIdx(0)
    setPickerSlotIdx(0)
    setPhase("spinning")
    setCurrentSquad(null)
    setWildcards(mode.rerolls || 3)
    setSwapMode(false)
    // Auto-spin for first position
    setSpinning(true)
    const valid = allS.filter(s => s.playerIds.length >= 11)
    const result = valid[Math.floor(Math.random() * valid.length)]
    setTimeout(() => {
      setCurrentSquad(result)
      setSpinning(false)
      setPhase("picking")
      setPickerSlotIdx(0)
      setShowPicker(true)
    }, 2500)
  }, [totalSlots, allS, mode.rerolls])

  const resetGame = useCallback(() => {
    setStarted(false)
    setDrafted([])
    draftedRef.current = []
    setCurrentSquad(null)
    setCurrentPosIdx(0)
    setPickerSlotIdx(0)
    setPhase("start")
    setShowPicker(false)
    setSimResult(null)
    setSwapMode(false)
    setWildcards(mode.rerolls || 3)
    setFilter("all")
    setSearch("")
  }, [mode.rerolls])

  // ─────────────────────────────────────────────────────────────
  //  SIMULATION
  // ─────────────────────────────────────────────────────────────
  const startSim = useCallback(() => {
    const tp = drafted.filter(Boolean) as Player[]
    if (tp.length === 0 || !currentSquad) return
    if (modeId === "copa") setSimResult({ type: "copa", ...simulateCopaArgentinaMatchByMatch(tp, currentSquad, allS, allP, f) })
    else setSimResult({ type: "liga", ...simulateSeasonMatchByMatch(tp, currentSquad, allS, allP, f) })
    setSimIdx(0); setPhase("sim")
  }, [drafted, currentSquad, allS, allP, f, modeId])

  // ─────────────────────────────────────────────────────────────
  //  SHARE IMAGE
  // ─────────────────────────────────────────────────────────────
  const generateShareImage = useCallback(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920
    const ctx = canvas.getContext('2d')!
    const bg = ctx.createLinearGradient(0, 0, 0, 1920); bg.addColorStop(0, '#071422'); bg.addColorStop(0.5, '#0a1929'); bg.addColorStop(1, '#071422')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920)
    ctx.fillStyle = '#75AADB'; ctx.font = 'bold 52px Space Grotesk, sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('LIGA ARGENTINA FANS', 540, 100)
    ctx.font = '28px Inter, sans-serif'; ctx.fillStyle = '#94a3b8'
    ctx.fillText(`${currentSquad?.label || 'Mi 11'} · ${fm} · Score: ${teamScore || partialScore}`, 540, 150)
    ctx.fillStyle = '#1a6b2a'; ctx.fillRect(80, 200, 920, 800)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2; ctx.strokeRect(80, 200, 920, 800)
    f.positions.forEach((pos: any, i: number) => {
      const pl = drafted[i]; if (!pl) return
      const x = 80 + (pos.x / 100) * 920; const y = 200 + (pos.y / 100) * 800
      ctx.beginPath(); ctx.arc(x, y, 28, 0, Math.PI * 2); ctx.fillStyle = PC[pos.pos] || '#666'; ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Inter'; ctx.textAlign = 'center'
      ctx.fillText(pl.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(), x, y + 6)
      ctx.font = '14px Inter'; ctx.fillStyle = '#fff'; ctx.fillText(pl.name.split(' ').pop() || pl.name, x, y + 48)
      if (mode.ratingsVisible) { ctx.font = 'bold 14px Inter'; ctx.fillStyle = '#75AADB'; ctx.fillText(`${pl.rating}`, x, y + 66) }
    })
    let yPos = 1040; const best = drafted.filter(Boolean).sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))[0]
    const scorer = drafted.filter(Boolean).sort((a: any, b: any) => (b.goalsClub || 0) - (a.goalsClub || 0))[0]
    ctx.textAlign = 'center'; ctx.font = 'bold 32px Space Grotesk'; ctx.fillStyle = '#D4AF37'
    ctx.fillText('MEJOR JUGADOR', 540, yPos); yPos += 45
    if (best) { ctx.font = 'bold 28px Inter'; ctx.fillStyle = '#fff'; ctx.fillText(`${best.name} (${best.rating})`, 540, yPos); yPos += 55 }
    ctx.font = 'bold 32px Space Grotesk'; ctx.fillStyle = '#D4AF37'
    ctx.fillText('GOLEADOR', 540, yPos); yPos += 45
    if (scorer) { ctx.font = 'bold 28px Inter'; ctx.fillStyle = '#fff'; ctx.fillText(`${scorer.name} — ${scorer.goalsClub} goles`, 540, yPos); yPos += 55 }
    ctx.font = 'bold 60px Space Grotesk'; ctx.fillStyle = '#75AADB'; ctx.fillText(`${teamScore || partialScore}`, 540, yPos + 60); yPos += 90
    ctx.font = '24px Inter'; ctx.fillStyle = '#94a3b8'; ctx.fillText('RATING DEL EQUIPO', 540, yPos + 20)
    ctx.font = '20px Inter'; ctx.fillStyle = '#475569'; ctx.fillText('Liga Argentina Fans', 540, 1880)
    const link = document.createElement('a'); link.download = `liga-argentina-fans.png`
    link.href = canvas.toDataURL('image/png'); link.click()
  }, [drafted, f, currentSquad, fm, teamScore, partialScore, mode])

  /* ═══════════════════════════════════════════════════════════
     START SCREEN
     ═══════════════════════════════════════════════════════════ */
  if (!started) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full text-center">
          <img src="/LigaStatsGame/logos/afa.png" alt="AFA" className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h1 className="font-display text-4xl md:text-5xl font-black gradient-text mb-4">Liga Argentina Fans</h1>
          <p className="text-slate-400 mb-6">{mode.icon} {mode.name}</p>
          <div className="card-gradient rounded-2xl p-6 mb-6">
            <h3 className="font-display font-bold text-lg mb-4">Formación</h3>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.values(formations).map((fmt: any) => (
                <button key={fmt.id} onClick={() => setFm(fmt.id)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${fm === fmt.id ? "bg-[#75AADB] text-white shadow-lg shadow-[#75AADB]/20" : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"}`}>
                  {fmt.name}
                </button>
              ))}
            </div>
            <div className="mt-4"><Pitch f={f} draft={[]} highlight={-1} onSlotClick={() => {}} showRatings={false} /></div>
          </div>
          <div className="card-gradient rounded-2xl p-6 mb-6 text-left">
            <h3 className="font-display font-bold text-lg mb-3">Cómo Jugar</h3>
            <ol className="text-sm text-slate-400 space-y-2">
              <li>1. Girás la ruleta — te toca un <strong className="text-slate-200">equipo + año</strong></li>
              <li>2. Elegís <strong className="text-slate-200">un solo jugador</strong> para la posición que toca</li>
              <li>3. Girás de nuevo para la <strong className="text-slate-200">siguiente posición</strong></li>
              <li>4. Usá comodines para <strong className="text-slate-200">cambiar equipo</strong> si no hay jugadores</li>
              <li>5. Armá los 11 y <strong className="text-slate-200">simulá la temporada</strong></li>
            </ol>
          </div>
          <button onClick={startGame}
            className="px-10 py-4 bg-gradient-to-r from-[#75AADB] to-blue-600 rounded-xl font-bold text-lg shadow-lg shadow-[#75AADB]/25 hover:shadow-[#75AADB]/40 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]">
            🚀 Comenzar Draft
          </button>
          <Link href="/" className="block mt-6 text-slate-400 hover:text-white transition-colors text-sm">← Volver al inicio</Link>
        </motion.div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════
     SIMULATION RESULTS
     ═══════════════════════════════════════════════════════════ */
  if (phase === "sim" && simResult) {
    return (
      <div className="min-h-screen gradient-bg px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-display text-3xl font-black gradient-text text-center mb-6">
              {simResult.type === 'copa' ? '🏅 Copa Argentina' : '🏆 Liga Argentina'}
            </h1>
            {simResult.type === 'liga' ? (
              <div className="card-gradient rounded-2xl p-6">
                <h2 className="font-display font-bold text-xl mb-4 text-center">
                  Posición final: <span className="text-[#75AADB]">#{simResult.playerPos}</span>
                </h2>
                <p className="text-center text-slate-400 text-sm mb-4">
                  Campeón: <strong className="text-white">{simResult.champion}</strong>
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-slate-500 text-xs">
                      <th className="text-left py-1">#</th><th className="text-left py-1">Equipo</th>
                      <th className="text-center py-1">Pts</th><th className="text-center py-1">PJ</th>
                      <th className="text-center py-1">G</th><th className="text-center py-1">E</th>
                      <th className="text-center py-1">P</th><th className="text-center py-1">GF</th>
                      <th className="text-center py-1">GC</th>
                    </tr></thead>
                    <tbody>
                      {simResult.table.slice(0, 30).map((t: any, i: number) => {
                        const isPlayer = drafted.some(p => p && currentSquad && t.name === currentSquad.label)
                        return (
                          <tr key={i} className={`border-t border-slate-800 ${isPlayer ? 'bg-[#75AADB]/10 font-bold' : ''}`}>
                            <td className="py-1.5 text-slate-400">{i + 1}</td>
                            <td className="py-1.5">{t.name}</td>
                            <td className="text-center py-1.5 font-bold">{t.pts}</td>
                            <td className="text-center py-1.5">{t.w + t.d + t.l}</td>
                            <td className="text-center py-1.5 text-green-400">{t.w}</td>
                            <td className="text-center py-1.5 text-yellow-400">{t.d}</td>
                            <td className="text-center py-1.5 text-red-400">{t.l}</td>
                            <td className="text-center py-1.5">{t.gf}</td>
                            <td className="text-center py-1.5">{t.ga}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card-gradient rounded-2xl p-6">
                <h2 className="font-display font-bold text-xl mb-4 text-center">
                  {simResult.eliminated ? `Eliminado en ${simResult.eliminatedRound}` : `🏆 ¡Campeón!`}
                </h2>
                {simResult.rounds.map((round: any, ri: number) => (
                  <div key={ri} className="mb-4">
                    <h3 className="text-sm font-bold text-slate-400 mb-2">{round.round}</h3>
                    <div className="space-y-1">
                      {round.matches.map((m: any, mi: number) => {
                        const isPlayer = m.home === currentSquad?.label || m.away === currentSquad?.label
                        return (
                          <div key={mi} className={`text-sm px-3 py-1.5 rounded ${isPlayer ? 'bg-[#75AADB]/10 border border-[#75AADB]/30' : 'bg-slate-800/30'}`}>
                            <span className={m.winner === m.home ? 'font-bold' : 'text-slate-400'}>{m.home}</span>
                            <span className="mx-2 text-slate-500">{m.hg} - {m.ag}</span>
                            <span className={m.winner === m.away ? 'font-bold' : 'text-slate-400'}>{m.away}</span>
                            {m.penalties && <span className="text-xs text-yellow-400 ml-2">({m.penalties} pen.)</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 justify-center mt-6 flex-wrap">
              <button onClick={resetGame} className="btn-primary px-6 py-3">🔄 Nuevo Draft</button>
              <Link href="/" className="btn-secondary px-6 py-3">🏠 Inicio</Link>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════════════════
     SPINNING / PICKING / DONE PHASES
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen gradient-bg px-4 py-6">
      <div className="max-w-2xl mx-auto">
        {/* ── Progress Bar ── */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Posición {Math.min(filledCount + 1, totalSlots)} de {totalSlots}</span>
            <span className="text-xs text-slate-400">{filledCount} armados</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-[#75AADB] to-blue-400"
              initial={false} animate={{ width: `${(filledCount / totalSlots) * 100}%` }} transition={{ duration: 0.4 }} />
          </div>
        </div>

        {/* ── Current Position Header ── */}
        {phase !== "done" && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border"
              style={{ borderColor: (PC[currentPos?.pos] || '#666') + "40", backgroundColor: (PC[currentPos?.pos] || '#666') + "15" }}>
              <span className="font-bold" style={{ color: PC[currentPos?.pos] }}>{POS_LABELS[currentPos?.pos] || currentPos?.pos}</span>
              <span className="text-slate-300 text-sm">{currentPos?.label}</span>
            </div>
          </div>
        )}

        {/* ── Spinning Phase ── */}
        {phase === "spinning" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-6">
            <p className="text-slate-400 mb-4 text-sm">🎰 Girando la ruleta...</p>
            <RouletteWheel squads={allS} spinning={true} result={null} />
          </motion.div>
        )}

        {/* ── Need to spin for next position ── */}
        {phase === "picking" && !currentSquad && !spinning && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            {/* Pitch still visible */}
            <div className="mb-6">
              <Pitch f={f} draft={drafted} highlight={-1} onSlotClick={() => {}} showRatings={mode.ratingsVisible} slotAvail={slotAvailability} activeSlot={currentPosIdx} />
            </div>
            <div className="card-gradient rounded-2xl p-8">
              <p className="text-slate-300 mb-2">Posición a completar:</p>
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: PC[currentPos?.pos] }}>
                  {POS_LABELS[currentPos?.pos]}
                </span>
                <span className="font-display font-bold text-xl">{currentPos?.label}</span>
              </div>
              <button onClick={spinWheel}
                className="px-10 py-4 bg-gradient-to-r from-rose-600 to-orange-600 rounded-xl font-bold text-lg shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]">
                🎰 ¡Girar Ruleta!
              </button>
              {filledCount > 0 && (
                <p className="text-xs text-slate-500 mt-4">{filledCount}/11 armados — te faltan {totalSlots - filledCount}</p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Team Result after spin ── */}
        {phase === "picking" && currentSquad && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {/* Team Info Card */}
            <div className="card-gradient rounded-xl p-4 mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={`/LigaStatsGame/img/${currentSquad.clubId}-128.png`} alt="" className="w-10 h-10 rounded-lg object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                <div>
                  <div className="font-display font-bold text-lg">{currentSquad.label}</div>
                  <div className="text-xs text-slate-400">
                    {currentPosAvailable > 0
                      ? `${currentPosAvailable} jugador${currentPosAvailable > 1 ? 'es' : ''} para ${POS_LABELS[currentPos?.pos] || currentPos?.pos}`
                      : `Sin jugadores para ${POS_LABELS[currentPos?.pos] || currentPos?.pos}`}
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

            {/* Wildcards info */}
            {wildcards > 0 && (
              <p className="text-xs text-slate-500 text-center mb-3">
                💎 {wildcards} comodín{wildcards > 1 ? 'es' : ''} disponible{wildcards > 1 ? 's' : ''} — usalo si no hay jugadores para esta posición
              </p>
            )}

            {/* Pitch */}
            <div className="mb-4">
              <Pitch f={f} draft={drafted} highlight={-1} onSlotClick={handleSlotClick}
                showRatings={mode.ratingsVisible} slotAvail={slotAvailability} activeSlot={pickerSlotIdx} />
            </div>

            {/* Player Picker Panel */}
            <AnimatePresence>
              {showPicker && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                  <div className="card-gradient rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display font-bold text-sm">
                        Elegí un <span style={{ color: PC[f.positions[pickerSlotIdx]?.pos] }}>{POS_LABELS[f.positions[pickerSlotIdx]?.pos] || f.positions[pickerSlotIdx]?.pos}</span>
                        {pickerSlotIdx !== currentPosIdx && (
                          <span className="text-slate-500 font-normal ml-2">(posición {pickerSlotIdx + 1})</span>
                        )}
                      </h3>
                      {currentPosAvailable === 0 && (
                        <button onClick={rerollTeam} disabled={wildcards <= 0}
                          className="px-3 py-1 rounded-lg text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 disabled:opacity-30 transition-all">
                          🔄 Girar de nuevo
                        </button>
                      )}
                    </div>

                    {/* Search */}
                    <input type="text" placeholder="Buscar jugador..." value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-[#75AADB] focus:outline-none w-full mb-3" />

                    {/* Player list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[40vh] overflow-y-auto pr-1">
                      {pickerPlayers.length === 0 && (
                        <p className="text-slate-500 text-sm text-center col-span-2 py-4">
                          Sin jugadores para esta posición. Usá un comodín para re-sortear.
                        </p>
                      )}
                      {pickerPlayers.slice(0, 30).map(player => (
                        <PlayerCard key={player.id} player={player} mode={mode}
                          onSelect={() => pickPlayer(player, pickerSlotIdx)}
                          slotPos={f.positions[pickerSlotIdx]?.pos || 'CM'} />
                      ))}
                    </div>
                    {pickerPlayers.length > 30 && (
                      <p className="text-xs text-slate-500 text-center mt-2">
                        Mostrando 30 de {pickerPlayers.length} — filtrá con la lupa
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ── DONE Phase ── */}
        {phase === "done" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            {confetti && (
              <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
                <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.5, 1] }} transition={{ duration: 0.6 }}
                  className="text-8xl">🎉</motion.div>
              </div>
            )}
            <div className="card-gradient rounded-2xl p-6 mb-6">
              <h2 className="font-display text-3xl font-black gradient-text mb-2">¡11 Armado!</h2>
              <p className="text-slate-400 text-sm mb-4">Tocá cualquier posición para cambiar el jugador</p>
              <div className="mb-4">
                <Pitch f={f} draft={drafted} highlight={-1} onSlotClick={handleSlotClick}
                  showRatings={mode.ratingsVisible} slotAvail={slotAvailability} />
              </div>
              {/* Player chips */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {f.positions.map((pos: any, i: number) => {
                  const pl = drafted[i]
                  return (
                    <div key={i} className="flex items-center gap-1.5 bg-slate-800/50 rounded-lg px-2.5 py-1.5 border border-slate-700 group relative">
                      <button onClick={() => { removePlayer(i); handleSlotClick(i) }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">✕</button>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
                        style={{ backgroundColor: PC[pos.pos] || '#666' }}>
                        {pl ? pl.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : POS_LABELS[pos.pos]}
                      </div>
                      <div>
                        <div className="text-[10px] font-semibold text-white truncate max-w-[80px]">
                          {pl ? pl.name.split(' ').pop() : <span className="text-slate-500 italic">vacío</span>}
                        </div>
                        <div className="text-[8px] text-slate-500">{POS_LABELS[pos.pos] || pos.pos}</div>
                      </div>
                      {pl && mode.ratingsVisible && <span className="text-[10px] font-bold text-[#75AADB]">{pl.rating}</span>}
                    </div>
                  )
                })}
              </div>
              <div className="text-2xl font-display font-black text-[#75AADB]">
                Score: {teamScore || partialScore} pts
              </div>
            </div>
            <div className="flex gap-3 justify-center flex-wrap mb-6">
              <button onClick={startSim} className="btn-primary text-lg px-8 py-3">🏆 Simular Temporada</button>
              <button onClick={generateShareImage} className="btn-secondary px-6 py-3">📸 Compartir</button>
              <button onClick={resetGame} className="btn-secondary px-6 py-3">🔄 Nuevo Draft</button>
            </div>
            <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">← Volver al inicio</Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WRAPPER (Suspense boundary for useSearchParams)
   ═══════════════════════════════════════════════════════════════ */
export default function DraftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center text-slate-400">Cargando...</div>}>
      <DraftInner />
    </Suspense>
  )
}