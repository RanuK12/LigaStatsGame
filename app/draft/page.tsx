"use client"
import { useState, Suspense, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import playersData from '@/data/players.json'
import clubsData from '@/data/clubs.json'
import squadsData from '@/data/squads.json'
import {
  formations, canPlayHere, getPlayersForSlot,
  calculateTeamScore, calculateFullTeamScore,
  GAME_MODES, generateShareText,
  simulateSeasonMatchByMatch, simulateCopaArgentinaMatchByMatch,
  POS_LABELS
} from '@/lib/game-engine'
import { Player, Club, Squad, Formation } from '@/lib/types'

const PC: Record<string, string> = {
  GK: '#f59e0b', CB: '#3b82f6', LB: '#06b6d4', RB: '#06b6d4',
  LWB: '#0891b2', RWB: '#0891b2',
  CDM: '#059669', CM: '#10b981', CAM: '#8b5cf6',
  LM: '#14b8a6', RM: '#14b8a6',
  LW: '#ef4444', RW: '#ef4444', ST: '#dc2626', CF: '#ea580c'
}

function Pitch({ f, draft, highlight, onSlotClick, showRatings, slotAvail }: {
  f: any; draft: (Player | null)[]; highlight: number;
  onSlotClick: (idx: number) => void; showRatings: boolean; slotAvail?: number[]
}) {
  return (
    <div className="pitch w-full max-w-[360px] aspect-[68/105] mx-auto relative">
      <div className="pitch-lines" /><div className="pitch-center" /><div className="pitch-center-dot" />
      <div className="pitch-area-top" /><div className="pitch-area-bottom" />
      {f.positions.map((pos: any, i: number) => {
        const pl = draft[i]; const active = i === highlight
        const avail = slotAvail ? slotAvail[i] : 0
        return (
          <div key={i} style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)" }}
            className="absolute cursor-pointer transition-all duration-200 hover:scale-110 z-10"
            onClick={() => onSlotClick(i)}>
            {pl ? (
              <div className={`flex flex-col items-center ${active ? "scale-110" : ""}`}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 shadow-lg transition-all"
                  style={{ backgroundColor: PC[pos.pos] || "#666", borderColor: active ? "#fff" : "rgba(255,255,255,0.3)" }}>
                  {pl.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="bg-black/80 text-white text-[8px] px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap font-semibold max-w-[70px] truncate">
                  {pl.name.split(" ").pop()}
                </div>
                {showRatings && <div className="text-[8px] font-bold" style={{ color: PC[pos.pos] }}>{pl.rating}</div>}
              </div>
            ) : (
              <div className={`flex flex-col items-center ${active ? "animate-pulse" : ""}`}>
                <div className={`w-10 h-10 rounded-full border-2 border-dashed flex items-center justify-center text-[10px] font-bold transition-all
                  ${active ? "border-white bg-white/15 shadow-lg shadow-white/10" : "border-white/25 bg-black/50 hover:border-white/50 hover:bg-white/10"}`}
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

function DraftInner() {
  const sp = useSearchParams()
  const modeId = (sp.get("mode") || "clasico") as string
  const mode = GAME_MODES[modeId] || GAME_MODES.clasico
  const allP = useMemo(() => playersData as Player[], [])
  const allC = useMemo(() => clubsData as Club[], [])
  const allS = useMemo(() => squadsData as Squad[], [])
  const cMap = useMemo(() => Object.fromEntries(allC.map(c => [c.id, c])), [allC])

  const [started, setStarted] = useState(false)
  const [fm, setFm] = useState<Formation>("4-3-3")
  const [drafted, setDrafted] = useState<(Player | null)[]>([])
  const [currentPosIdx, setCurrentPosIdx] = useState(0)
  const [currentSquad, setCurrentSquad] = useState<Squad | null>(null)
  const [spinning, setSpinning] = useState(false)
  const [wildcards, setWildcards] = useState(mode.rerolls || 3)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [phase, setPhase] = useState<"start"|"spin"|"pick"|"done"|"sim">("start")
  const [simResult, setSimResult] = useState<any>(null)
  const [simIdx, setSimIdx] = useState(0)
  const [confetti, setConfetti] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSlotIdx, setPickerSlotIdx] = useState(0)
  const draftedRef = useRef<(Player | null)[]>([])

  const f = formations[fm]
  const totalSlots = f.positions.length
  const currentPos = f.positions[currentPosIdx] || f.positions[0]
  const teamScore = calculateFullTeamScore(drafted, f)
  const partialScore = calculateTeamScore(drafted, f)
  const filledCount = drafted.filter(Boolean).length

  const spinWheel = useCallback(() => {
    if (spinning) return
    setSpinning(true); setPhase("spin")
    const valid = allS.filter(s => s.playerIds.length >= 11)
    if (valid.length === 0) { setSpinning(false); setPhase("pick"); return }
    const result = valid[Math.floor(Math.random() * valid.length)]
    setTimeout(() => { setCurrentSquad(result); setSpinning(false); setPhase("pick"); setShowPicker(true) }, 2200)
  }, [spinning, allS])

  const rerollTeam = useCallback(() => { if (wildcards > 0) { setWildcards((w: number) => w - 1); spinWheel() } }, [wildcards, spinWheel])

  const changeYear = useCallback(() => {
    if (wildcards <= 0 || !currentSquad) return
    setWildcards((w: number) => w - 1)
    const same = allS.filter(s => s.clubId === currentSquad.clubId && s.season !== currentSquad.season && s.playerIds.length >= 11)
    if (same.length > 0) setCurrentSquad(same[Math.floor(Math.random() * same.length)])
  }, [wildcards, currentSquad, allS])

  const advanceAfterPick = useCallback((nd: (Player | null)[], pickedIdx: number) => {
    let nextIdx = pickedIdx + 1
    while (nextIdx < totalSlots && nd[nextIdx] !== null) nextIdx++
    if (nextIdx < totalSlots) { setCurrentPosIdx(nextIdx); setPhase("pick"); setShowPicker(true) }
    else { setConfetti(true); setTimeout(() => setConfetti(false), 4000); setPhase("done"); setShowPicker(false) }
  }, [totalSlots])

  // FIXED: Use functional state update to avoid stale closure
  const pickPlayer = useCallback((player: Player, slotIdx?: number) => {
    setDrafted(prev => {
      const idx = slotIdx !== undefined ? slotIdx : currentPosIdx
      const nd = [...prev]; nd[idx] = player
      draftedRef.current = nd
      // Defer advance after state update
      setTimeout(() => advanceAfterPick(nd, idx), 0)
      return nd
    })
    setShowPicker(false)
  }, [currentPosIdx, advanceAfterPick])

  const handleSlotClick = useCallback((idx: number) => {
    setPickerSlotIdx(idx); setCurrentPosIdx(idx); setShowPicker(true)
  }, [])

  const removePlayer = useCallback((idx: number) => {
    setDrafted(prev => {
      const nd = [...prev]; nd[idx] = null
      draftedRef.current = nd
      return nd
    })
  }, [])

  // Pre-compute which slots have available players
  const slotAvailability = useMemo(() => {
    if (!currentSquad) return f.positions.map(() => 0)
    return f.positions.map((pos: any) => getPlayersForSlot(currentSquad, allP, pos.pos).length)
  }, [currentSquad, allP, f])

  const pickerPlayers = useMemo(() => {
    if (!currentSquad) return []
    const slotPos = f.positions[pickerSlotIdx]?.pos || 'CM'
    let pool = getPlayersForSlot(currentSquad, allP, slotPos)
    // Smart fallback: if current slot has 0 players, show ALL squad players
    // so the user can see what's available and click a different slot
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

  const startGame = useCallback(() => {
    const initialDraft = new Array(totalSlots).fill(null) as (Player | null)[]
    draftedRef.current = initialDraft
    setDrafted(initialDraft)
    setStarted(true)
    setPhase("start")
    // Auto-spin
    spinWheel()
  }, [totalSlots, spinWheel])

  const startSim = useCallback(() => {
    const tp = drafted.filter(Boolean) as Player[]
    if (tp.length === 0 || !currentSquad) return
    if (modeId === "copa") setSimResult({ type: "copa", ...simulateCopaArgentinaMatchByMatch(tp, currentSquad, allS, allP, f) })
    else setSimResult({ type: "liga", ...simulateSeasonMatchByMatch(tp, currentSquad, allS, allP, f) })
    setSimIdx(0); setPhase("sim")
  }, [drafted, currentSquad, allS, allP, f, modeId])

  const resetGame = useCallback(() => {
    setStarted(false)
    setDrafted([])
    draftedRef.current = []
    setCurrentSquad(null)
    setCurrentPosIdx(0)
    setPhase("start")
    setShowPicker(false)
    setSimResult(null)
    setWildcards(mode.rerolls || 3)
    setFilter("all")
    setSearch("")
  }, [mode.rerolls])

  const generateShareImage = useCallback(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920
    const ctx = canvas.getContext('2d')!
    const bg = ctx.createLinearGradient(0, 0, 0, 1920); bg.addColorStop(0, '#071422'); bg.addColorStop(0.5, '#0a1929'); bg.addColorStop(1, '#071422')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920)
    ctx.fillStyle = '#75AADB'; ctx.font = 'bold 52px Space Grotesk, sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('LIGA ARGENTINA FANS', 540, 100)
    ctx.font = '28px Inter, sans-serif'; ctx.fillStyle = '#94a3b8'
    ctx.fillText(`${currentSquad?.label} · ${fm} · Score: ${teamScore || partialScore}`, 540, 150)
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
    const link = document.createElement('a'); link.download = `liga-argentina-fans-${currentSquad?.clubId}.png`
    link.href = canvas.toDataURL('image/png'); link.click()
  }, [drafted, f, currentSquad, fm, teamScore, partialScore, mode])

  if (!started) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full text-center">
          <img src="/LigaStatsGame/logos/afa/afa.svg" alt="AFA" className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h1 className="font-display text-4xl md:text-5xl font-black gradient-text mb-4">Liga Argentina Fans</h1>
          <p className="text-slate-400 mb-6">{mode.icon} {mode.name}</p>
          <div className="card-gradient rounded-2xl p-6 mb-6">
            <h3 className="font-display font-bold text-lg mb-4">Formacion</h3>
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
            <h3 className="font-display font-bold text-lg mb-3">Como Jugar</h3>
            <ol className="text-sm text-slate-400 space-y-2">
              <li>1. Giras la ruleta - te toca un <strong className="text-slate-200">equipo + ano</strong></li>
              <li>2. Tocás una posicion en la cancha y <strong className="text-slate-200">elegis el jugador</strong></li>
              <li>3. Usa comodines para <strong className="text-slate-200">cambiar equipo o ano</strong></li>
              <li>4. Arma tu 11 y <strong className="text-slate-200">simula la temporada</strong></li>
            </ol>
            <p className="text-xs text-slate-500 mt-3">{mode.rerolls} comodines · {mode.ratingsVisible ? "Ratings visibles" : "Ratings ocultos"}</p>
          </div>
          <button onClick={startGame} className="btn-primary text-lg px-10 py-4">Empezar Draft!</button>
          <Link href="/" className="block mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors">Volver</Link>
        </motion.div>
      </div>
    )
  }

  const club = currentSquad ? cMap[currentSquad.clubId] : null

  return (
    <div className="min-h-screen gradient-bg pb-8">
      {confetti && <div className="fixed inset-0 pointer-events-none z-50">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="absolute text-2xl" style={{ left: `${Math.random() * 100}%`, top: `-${Math.random() * 20}%`, animation: `confetti-fall ${2 + Math.random() * 3}s linear ${Math.random() * 2}s forwards` }}>&#9917;</div>
        ))}
      </div>}

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-[#071422]/90 backdrop-blur-md border-b border-[rgba(117,170,219,0.1)] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-400 hover:text-white transition-colors">Liga Argentina Fans</Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#75AADB] font-semibold">{filledCount}/{totalSlots}</span>
            <span className="text-amber-400">{wildcards} comodines</span>
            {(teamScore > 0 || partialScore > 0) && <span className="text-green-400 font-bold">{teamScore || partialScore} pts</span>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 mt-6">
        {/* Spinning Animation */}
        {phase === "spin" && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, ease: "linear", repeat: Infinity }} className="text-7xl mb-6 inline-block">&#127920;</motion.div>
            <p className="text-xl text-slate-300 font-display font-bold">Girando la ruleta...</p>
            {currentSquad && <p className="text-sm text-slate-500 mt-2">{currentSquad.label}</p>}
          </motion.div>
        )}

        {/* Squad Info + Position Picker + Pitch */}
        {(phase === "pick" || phase === "start" || showPicker) && currentSquad && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Current position indicator */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-3"
                style={{ borderColor: (PC[currentPos?.pos] || '#666') + "40", backgroundColor: (PC[currentPos?.pos] || '#666') + "15" }}>
                <span className="font-bold" style={{ color: PC[currentPos?.pos] }}>{POS_LABELS[currentPos?.pos] || currentPos?.pos}</span>
                <span className="text-slate-300 text-sm">{currentPos?.label}</span>
              </div>
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src={`/LigaStatsGame/logos/clubs/${currentSquad.clubId}.svg`} alt="" className="w-10 h-10 rounded-lg" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                <div className="text-left">
                  <div className="font-display font-bold text-lg">{currentSquad.label}</div>
                  <div className="text-xs text-slate-400">{currentSquad.playerIds.length} jugadores en plantel</div>
                </div>
              </div>
            </div>

            {/* Wildcard buttons */}
            <div className="flex gap-2 justify-center mb-4">
              <button onClick={rerollTeam} disabled={wildcards <= 0} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Cambiar Equipo ({wildcards})</button>
              <button onClick={changeYear} disabled={wildcards <= 0} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Cambiar Año ({wildcards})</button>
            </div>

            {/* Pitch - clickable positions */}
            <div className="mb-4">
              <Pitch f={f} draft={drafted} highlight={showPicker ? pickerSlotIdx : currentPosIdx} onSlotClick={handleSlotClick} showRatings={mode.ratingsVisible} slotAvail={slotAvailability} />
            </div>

            {/* Player Picker Panel */}
            <AnimatePresence>
              {showPicker && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                  <div className="card-gradient rounded-xl p-4 mb-4">
                    {/* Position filter buttons */}
                    <div className="flex gap-1.5 mb-3 flex-wrap justify-center">
                      {["all", "GK", "CB", "LB", "RB", "CM", "CDM", "CAM", "LW", "RW", "ST"].map(p => (
                        <button key={p} onClick={() => setFilter(p)}
                          className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${filter === p ? "bg-[#75AADB] text-white" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                          {p === "all" ? "Todos" : POS_LABELS[p] || p}
                        </button>
                      ))}
                    </div>
                    <input type="text" placeholder="Buscar jugador..." value={search} onChange={e => setSearch(e.target.value)}
                      className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-[#75AADB] focus:outline-none w-full mb-3" />

                    {/* Player list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[40vh] overflow-y-auto pr-1">
                      {pickerPlayers.length === 0 && (
                        <p className="text-slate-500 text-sm text-center col-span-2 py-4">
                          {slotAvailability.some((n: number) => n > 0)
                            ? "Sin jugadores para esta posición. Tocá otra posición en la cancha."
                            : "Este plantel no tiene jugadores disponibles. Cambiá de equipo."}
                        </p>
                      )}
                      {pickerPlayers.slice(0, 30).map(player => (
                        <PlayerCard key={player.id} player={player} mode={mode} onSelect={() => pickPlayer(player, pickerSlotIdx)} slotPos={f.positions[pickerSlotIdx]?.pos || 'CM'} />
                      ))}
                    </div>
                    {pickerPlayers.length > 30 && <p className="text-xs text-slate-500 text-center mt-2">Mostrando 30 de {pickerPlayers.length} — usá la lupa para filtrar</p>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* DONE Phase - All 11 filled */}
        {phase === "done" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <div className="card-gradient rounded-2xl p-6 mb-6">
              <h2 className="font-display text-3xl font-black gradient-text mb-2">¡11 Armado!</h2>
              <p className="text-slate-400 text-sm">{currentSquad?.label} · {fm}</p>
              <div className="mt-4">
                <Pitch f={f} draft={drafted} highlight={-1} onSlotClick={handleSlotClick} showRatings={mode.ratingsVisible} slotAvail={slotAvailability} />
              </div>
              <div className="mt-4 flex flex-wrap gap-3 justify-center">
                {drafted.filter(Boolean).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5 border border-slate-700">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white" style={{ backgroundColor: PC[f.positions[i]?.pos] || '#666' }}>
                      {p!.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">{p!.name.split(' ').pop()}</div>
                      <div className="text-[9px] text-slate-500">{POS_LABELS[f.positions[i]?.pos] || f.positions[i]?.pos}</div>
                    </div>
                    {mode.ratingsVisible && <span className="text-xs font-bold text-[#75AADB]">{p!.rating}</span>}
                  </div>
                ))}
              </div>
              <div className="mt-4 text-2xl font-display font-black text-[#75AADB]">
                Score: {teamScore || partialScore} pts
              </div>
            </div>

            <div className="flex gap-3 justify-center flex-wrap mb-6">
              <button onClick={startSim} className="btn-primary text-lg px-8 py-3">🏆 Simular Temporada</button>
              <button onClick={generateShareImage} className="btn-secondary px-6 py-3">📸 Compartir</button>
              <button onClick={resetGame} className="btn-secondary px-6 py-3">🔄 Nuevo Draft</button>
            </div>
          </motion.div>
        )}

        {/* SIM Phase */}
        {phase === "sim" && simResult && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-4">
              <h2 className="font-display text-2xl font-black gradient-text">
                {simResult.type === 'copa' ? '🏅 Copa Argentina' : '🏆 Liga Argentina'}
              </h2>
              {simResult.type === 'liga' && (
                <p className="text-slate-400 text-sm mt-1">Posicion final: <span className="text-[#75AADB] font-bold">#{simResult.playerPos}</span></p>
              )}
              {simResult.type === 'copa' && (
                <p className="text-slate-400 text-sm mt-1">
                  {simResult.eliminated
                    ? `Eliminado en <span className="text-red-400 font-bold">${simResult.eliminatedRound}</span>`
                    : `Campeon: <span className="text-yellow-400 font-bold">${simResult.champion}</span>`}
                </p>
              )}
            </div>

            {/* League table */}
            {simResult.type === 'liga' && (
              <div className="card-gradient rounded-xl p-4 mb-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2 px-1">#</th>
                      <th className="text-left py-2 px-1">Equipo</th>
                      <th className="text-center py-2 px-1">PJ</th>
                      <th className="text-center py-2 px-1">G</th>
                      <th className="text-center py-2 px-1">E</th>
                      <th className="text-center py-2 px-1">P</th>
                      <th className="text-center py-2 px-1">GF</th>
                      <th className="text-center py-2 px-1">GC</th>
                      <th className="text-center py-2 px-1">Pts</th>
                      <th className="text-center py-2 px-1">Forma</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simResult.table?.map((t: any, i: number) => {
                      const isPlayer = t.name === currentSquad?.label
                      return (
                        <tr key={i} className={`border-b border-slate-800 ${isPlayer ? 'bg-[#75AADB]/10 font-bold' : ''}`}>
                          <td className="py-2 px-1">{i + 1}</td>
                          <td className="py-2 px-1 truncate max-w-[140px]">{t.name}</td>
                          <td className="text-center py-2 px-1">{(t.w || 0) + (t.d || 0) + (t.l || 0)}</td>
                          <td className="text-center py-2 px-1 text-green-400">{t.w || 0}</td>
                          <td className="text-center py-2 px-1 text-yellow-400">{t.d || 0}</td>
                          <td className="text-center py-2 px-1 text-red-400">{t.l || 0}</td>
                          <td className="text-center py-2 px-1">{t.gf || 0}</td>
                          <td className="text-center py-2 px-1">{t.ga || 0}</td>
                          <td className="text-center py-2 px-1 font-bold text-[#75AADB]">{t.pts || 0}</td>
                          <td className="text-center py-2 px-1">{(t.form || []).map((r: string) => r === 'V' ? '🟢' : r === 'D' ? '🔴' : '🟡').join('')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Copa rounds */}
            {simResult.type === 'copa' && simResult.rounds && (
              <div className="space-y-3 mb-4">
                {simResult.rounds.map((round: any, ri: number) => (
                  <div key={ri} className="card-gradient rounded-xl p-4">
                    <h3 className="font-display font-bold text-sm text-[#75AADB] mb-2">{round.round}</h3>
                    <div className="space-y-1">
                      {round.matches.map((m: any, mi: number) => {
                        const isPlayerMatch = m.home === currentSquad?.label || m.away === currentSquad?.label
                        return (
                          <div key={mi} className={`text-xs flex items-center gap-2 py-1 px-2 rounded ${isPlayerMatch ? 'bg-[#75AADB]/10' : ''}`}>
                            <span className="truncate max-w-[100px]">{m.home}</span>
                            <span className="text-slate-400 font-mono">{m.hg} - {m.ag}</span>
                            <span className="truncate max-w-[100px]">{m.away}</span>
                            {m.penalties && <span className="text-yellow-400 text-[10px]">({m.penalties} pen.)</span>}
                            {m.winner && <span className="text-[10px]">→ {m.winner}</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={generateShareImage} className="btn-secondary px-6 py-3">📸 Compartir</button>
              <button onClick={resetGame} className="btn-primary px-6 py-3">🔄 Nuevo Draft</button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function DraftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center"><div className="text-[#75AADB] text-xl">Cargando...</div></div>}>
      <DraftInner />
    </Suspense>
  )
}