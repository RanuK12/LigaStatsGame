"use client"
import { useState, Suspense, useCallback, useMemo } from 'react'
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

function Pitch({ f, draft, highlight, onSlotClick, showRatings }: {
  f: any; draft: (Player | null)[]; highlight: number;
  onSlotClick: (idx: number) => void; showRatings: boolean
}) {
  return (
    <div className="pitch w-full max-w-[360px] aspect-[68/105] mx-auto relative">
      <div className="pitch-lines" /><div className="pitch-center" /><div className="pitch-center-dot" />
      <div className="pitch-area-top" /><div className="pitch-area-bottom" />
      {f.positions.map((pos: any, i: number) => {
        const pl = draft[i]; const active = i === highlight
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
                <div className="text-[7px] text-white/40 mt-0.5 whitespace-nowrap">{pos.label}</div>
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
    setTimeout(() => { setCurrentSquad(result); setSpinning(false); setPhase("pick") }, 2200)
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
    if (nextIdx < totalSlots) { setCurrentPosIdx(nextIdx); setPhase("start") }
    else { setConfetti(true); setTimeout(() => setConfetti(false), 4000); setPhase("done") }
  }, [totalSlots])

  const pickPlayer = useCallback((player: Player, slotIdx?: number) => {
    const idx = slotIdx !== undefined ? slotIdx : currentPosIdx
    const nd = [...drafted]; nd[idx] = player; setDrafted(nd); setShowPicker(false)
    advanceAfterPick(nd, idx)
  }, [drafted, currentPosIdx, advanceAfterPick])

  const handleSlotClick = useCallback((idx: number) => {
    setPickerSlotIdx(idx); setCurrentPosIdx(idx); setShowPicker(true)
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
    // Fallback: if current slot has 0 players, show ALL squad players
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
    setStarted(true); setDrafted(new Array(totalSlots).fill(null)); spinWheel()
  }, [totalSlots, spinWheel])

  const startSim = useCallback(() => {
    const tp = drafted.filter(Boolean) as Player[]
    if (tp.length === 0 || !currentSquad) return
    if (modeId === "copa") setSimResult({ type: "copa", ...simulateCopaArgentinaMatchByMatch(tp, currentSquad, allS, allP, f) })
    else setSimResult({ type: "liga", ...simulateSeasonMatchByMatch(tp, currentSquad, allS, allP, f) })
    setSimIdx(0); setPhase("sim")
  }, [drafted, currentSquad, allS, allP, f, modeId])

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
          <img src="/logos/afa/afa.svg" alt="AFA" className="w-16 h-16 mx-auto mb-6 opacity-80" />
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
              <li>2. Elegis un jugador <strong className="text-slate-200">de ese plantel</strong> para la posicion</li>
              <li>3. Usa comodines para <strong className="text-slate-200">cambiar equipo o ano</strong></li>
              <li>4. Arma tu 11 y <strong className="text-slate-200">simula la temporada</strong></li>
            </ol>
            <p className="text-xs text-slate-500 mt-3">{mode.rerolls} comodines - {mode.ratingsVisible ? "Ratings visibles" : "Ratings ocultos"}</p>
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
        {phase === "spin" && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, ease: "linear", repeat: Infinity }} className="text-7xl mb-6 inline-block">&#127920;</motion.div>
            <p className="text-xl text-slate-300 font-display font-bold">Girando la ruleta...</p>
            {currentSquad && <p className="text-sm text-slate-500 mt-2">{currentSquad.label}</p>}
          </motion.div>
        )}

        {(phase === "pick" || phase === "start") && currentSquad && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-3"
                style={{ borderColor: (PC[currentPos?.pos] || '#666') + "40", backgroundColor: (PC[currentPos?.pos] || '#666') + "15" }}>
                <span className="font-bold" style={{ color: PC[currentPos?.pos] }}>{POS_LABELS[currentPos?.pos] || currentPos?.pos}</span>
                <span className="text-slate-300 text-sm">{currentPos?.label}</span>
              </div>
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src={`/logos/clubs/${currentSquad.clubId}.svg`} alt="" className="w-10 h-10" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                <div className="text-left">
                  <div className="font-display font-bold text-lg">{currentSquad.label}</div>
                  <div className="text-xs text-slate-400">{currentSquad.playerIds.length} jugadores en plantel</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-center mb-4">
              <button onClick={rerollTeam} disabled={wildcards <= 0} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Cambiar Equipo ({wildcards})</button>
              <button onClick={changeYear} disabled={wildcards <= 0} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">Cambiar Ano ({wildcards})</button>
            </div>

            <div className="mb-4">
              <div className="flex gap-1.5 mb-2 flex-wrap justify-center">
                {["all", "GK", "CB", "LB", "RB", "CM", "CDM", "CAM", "LW", "RW", "ST"].map(p => (
                  <button key={p} onClick={() => setFilter(p)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${filter === p ? "bg-[#75AADB] text-white" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                    {p === "all" ? "Todos" : POS_LABELS[p] || p}
                  </button>
                ))}
              </div>
              <input type="text" placeholder="Buscar jugador..." value={search} onChange={e => setSearch(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-[#75AADB] focus:outline-none w-full mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[30vh] overflow-y-auto pr-1">
                {pickerPlayers.length === 0 && slotAvailability.every((n: number) => n === 0) && (
                  <p className="text-slate-500 text-sm text-center col-span-2 py-4">Este plantel no tiene jugadores para ninguna posicion. Cambia de equipo.</p>
                )}
                {pickerPlayers.length === 0 && !slotAvailability.every((n: number) => n === 0) && (
                  <p className="text-amber-400/80 text-xs text-center col-span-2 py-3">
                    Sin jugadores para {POS_LABELS[currentPos?.pos] || currentPos?.pos}. Toca otra posicion en la cancha o cambia de equipo.
                  </p>
                )}
                {pickerPlayers.slice(0, 20).map(player => (
                  <PlayerCard key={player.id} player={player} mode={mode} onSelect={() => pickPlayer(player)} slotPos={currentPos?.pos || 'CM'} />
                ))}
              </div>
              {pickerPlayers.length > 20 && <p className="text-xs text-slate-500 text-center mt-2">Mostrando 20 de {pickerPlayers.length} - usa la lupa para filtrar</p>}
            </div>

            <div className="mb-6">
              <Pitch f={f} draft={drafted} highlight={currentPosIdx} onSlotClick={handleSlotClick} showRatings={mode.ratingsVisible} />
              <p className="text-[10px] text-slate-600 text-center mt-1">Toca una posicion para elegir jugador</p>
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              {filledCount >= 11 && <button onClick={startSim} className="btn-primary px-8 py-3 text-base">{modeId === "copa" ? "Simular Copa" : "Simular Liga"}</button>}
              {filledCount > 0 && <button onClick={generateShareImage} className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all">Compartir</button>}
              <button onClick={() => { setStarted(false); setDrafted([]); setPhase("start"); setCurrentSquad(null); setCurrentPosIdx(0) }} className="btn-secondary">Reiniciar</button>
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {showPicker && currentSquad && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center"
              onClick={() => setShowPicker(false)}>
              <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                className="bg-[#0d2137] border border-[rgba(117,170,219,0.2)] rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden"
                onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display font-bold text-lg">
                      <span style={{ color: PC[f.positions[pickerSlotIdx]?.pos] }}>{POS_LABELS[f.positions[pickerSlotIdx]?.pos]}</span>
                      {' '}{f.positions[pickerSlotIdx]?.label}
                    </h3>
                    <button onClick={() => setShowPicker(false)} className="text-slate-400 hover:text-white text-xl">X</button>
                  </div>
                  <input type="text" placeholder="Buscar jugador..." value={search} onChange={e => setSearch(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-[#75AADB] focus:outline-none w-full" />
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {["all", "GK", "CB", "LB", "RB", "CM", "CDM", "CAM", "LW", "RW", "ST"].map(p => (
                      <button key={p} onClick={() => setFilter(p)}
                        className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition-all ${filter === p ? "bg-[#75AADB] text-white" : "bg-slate-800 text-slate-400 border border-slate-700"}`}>
                        {p === "all" ? "Todos" : POS_LABELS[p] || p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[50vh] p-3 space-y-1.5">
                  {pickerPlayers.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No hay jugadores para esta posicion</p>}
                  {pickerPlayers.map(player => (
                    <PlayerCard key={player.id} player={player} mode={mode} onSelect={() => pickPlayer(player, pickerSlotIdx)} slotPos={f.positions[pickerSlotIdx]?.pos || 'CM'} />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {phase === "sim" && simResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <h2 className="font-display text-2xl font-bold text-center gradient-text">
              {simResult.type === "copa" ? "Copa Argentina" : "Liga Argentina"}
            </h2>

            {simResult.type === "liga" && (
              <div className="space-y-4">
                <div className="card-gradient rounded-2xl p-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-slate-500 text-xs border-b border-slate-800">
                      <th className="text-left py-1">#</th><th className="text-left py-1">Equipo</th>
                      <th className="text-center py-1 px-1">Pts</th><th className="text-center py-1 px-1">PJ</th>
                      <th className="text-center py-1 px-1">G</th><th className="text-center py-1 px-1">E</th><th className="text-center py-1 px-1">P</th>
                      <th className="text-center py-1 px-1">GF</th><th className="text-center py-1 px-1">GC</th><th className="text-center py-1 px-1">DG</th>
                    </tr></thead>
                    <tbody>{simResult.table.map((t: any, i: number) => {
                      const isPlayer = t.name === currentSquad?.label
                      return (
                        <tr key={i} className={`border-b border-slate-800 ${isPlayer ? "bg-[#75AADB]/10 font-bold" : ""}`}>
                          <td className="py-1.5 pr-2 text-slate-400">{i + 1}</td>
                          <td className="py-1.5"><span className={isPlayer ? "text-[#75AADB]" : "text-slate-300"}>{t.name}</span></td>
                          <td className="text-center py-1.5 px-1 font-bold">{t.pts}</td>
                          <td className="text-center py-1.5 px-1 text-slate-400">{t.w + t.d + t.l}</td>
                          <td className="text-center py-1.5 px-1 text-green-400">{t.w}</td>
                          <td className="text-center py-1.5 px-1 text-yellow-400">{t.d}</td>
                          <td className="text-center py-1.5 px-1 text-red-400">{t.l}</td>
                          <td className="text-center py-1.5 px-1">{t.gf}</td>
                          <td className="text-center py-1.5 px-1">{t.ga}</td>
                          <td className="text-center py-1.5 px-1 font-bold">{t.gf - t.ga}</td>
                        </tr>
                      )
                    })}</tbody>
                  </table>
                </div>

                {simResult.schedule[simIdx] && (
                  <div className="card-gradient rounded-2xl p-6 text-center">
                    <div className="text-xs text-slate-500 mb-2">Fecha {simIdx + 1} / {simResult.schedule.length}</div>
                    <div className="flex items-center justify-center gap-6">
                      <div className="text-right"><div className="font-bold text-base">{simResult.schedule[simIdx].home}</div></div>
                      <div className="text-3xl font-black px-4 py-2 rounded-xl bg-slate-800">
                        <span className="text-[#75AADB]">{simResult.schedule[simIdx].hg}</span>
                        <span className="text-slate-600 mx-1">-</span>
                        <span className="text-[#75AADB]">{simResult.schedule[simIdx].ag}</span>
                      </div>
                      <div className="text-left"><div className="font-bold text-base">{simResult.schedule[simIdx].away}</div></div>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  {simIdx < simResult.schedule.length - 1 ? (
                    <button onClick={() => setSimIdx(simIdx + 1)} className="btn-primary px-8 py-3 text-base">Siguiente Partido</button>
                  ) : (
                    <div className="space-y-3">
                      <div className="card-gradient rounded-2xl p-6">
                        <div className="text-4xl mb-2">&#127942;</div>
                        <div className="font-display text-xl font-bold text-[#75AADB]">Campeon: {simResult.champion}</div>
                        <div className="text-sm text-slate-400 mt-1">Tu posicion: {simResult.playerPos}</div>
                      </div>
                      <button onClick={() => { setPhase("done"); setSimResult(null) }} className="btn-secondary">Volver al 11</button>
                      <button onClick={generateShareImage} className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all">Compartir</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {simResult.type === "copa" && (
              <div className="space-y-4">
                {simResult.rounds.map((round: any, ri: number) => (
                  <div key={ri} className="card-gradient rounded-2xl p-4">
                    <h3 className="font-display font-bold text-sm mb-3 text-[#75AADB]">{round.round}</h3>
                    <div className="space-y-2">
                      {round.matches.map((m: any, mi: number) => {
                        const isPlayer = m.home === currentSquad?.label || m.away === currentSquad?.label
                        return (
                          <div key={mi} className={`flex items-center justify-between text-sm py-1.5 px-3 rounded-lg ${isPlayer ? "bg-[#75AADB]/10 border border-[#75AADB]/20" : ""}`}>
                            <span className={`flex-1 text-right ${m.winner === m.home ? "font-bold" : "text-slate-400"}`}>{m.home}</span>
                            <span className="px-3 font-black text-[#75AADB]">{m.hg} - {m.ag}</span>
                            <span className={`flex-1 ${m.winner === m.away ? "font-bold" : "text-slate-400"}`}>{m.away}</span>
                            {m.penalties && <span className="text-xs text-yellow-400 ml-2">{m.penalties} p</span>}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
                <div className="card-gradient rounded-2xl p-6 text-center">
                  {simResult.eliminated ? (
                    <><div className="text-4xl mb-2">&#128148;</div><div className="font-display text-xl font-bold text-red-400">Eliminado en {simResult.eliminatedRound}</div></>
                  ) : (
                    <><div className="text-4xl mb-2">&#127942;</div><div className="font-display text-xl font-bold text-[#75AADB]">CAMPEON DE COPA!</div></>
                  )}
                  <button onClick={() => { setPhase("done"); setSimResult(null) }} className="btn-secondary mt-4">Volver al 11</button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function DraftPage() {
  return <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center text-slate-400">Cargando...</div>}><DraftInner /></Suspense>
}
