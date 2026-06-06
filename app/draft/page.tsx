"use client"
import { useState, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import playersData from '@/data/players.json'
import clubsData from '@/data/clubs.json'
import squadsData from '@/data/squads.json'
import { formations, canPlayHere, getSquadPlayers, spinSquad, calculateTeamScore, GAME_MODES, generateShareText, simulateSeasonMatchByMatch, simulateCopaArgentinaMatchByMatch } from '@/lib/game-engine'
import { Player, Club, Squad, Formation } from '@/lib/types'

const PC: Record<string,string> = {GK:"#f59e0b",CB:"#3b82f6",LB:"#06b6d4",RB:"#06b6d4",CDM:"#059669",CM:"#10b981",CAM:"#8b5cf6",LW:"#ef4444",RW:"#ef4444",ST:"#dc2626"}

function Pitch({f,draft,highlight,cMap}: {f:any;draft:(Player|null)[];highlight:number;cMap:any}) {
  return (
    <div className="pitch w-full max-w-[340px] aspect-[68/105] mx-auto relative">
      <div className="pitch-lines" /><div className="pitch-center" /><div className="pitch-center-dot" />
      <div className="pitch-area-top" /><div className="pitch-area-bottom" />
      {f.positions.map((pos:any,i:number) => {
        const pl = draft[i]; const active = i===highlight
        return (
          <div key={i} style={{left:`${pos.x}%`,top:`${pos.y}%`,transform:"translate(-50%,-50%)"}} className="absolute cursor-pointer transition-all duration-200">
            {pl ? (
              <div className={`flex flex-col items-center ${active?"scale-110":""}`}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 shadow-lg" style={{backgroundColor:PC[pos.pos]||"#666",borderColor:active?"#fff":"transparent"}}>{pl.name.split(" ").pop()?.[0]}{pl.name.split(" ")[0]?.[0]}</div>
                <div className="bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap font-semibold">{pl.name.split(" ").pop()}</div>
              </div>
            ) : (
              <div className={`flex flex-col items-center ${active?"animate-pulse":""}`}>
                <div className={`w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center text-[10px] font-bold ${active?"border-white bg-white/10":"border-white/30 bg-black/40"}`} style={{color:PC[pos.pos]}}>{pos.pos}</div>
                <div className="text-[7px] text-white/50 mt-0.5 whitespace-nowrap">{pos.label}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function DraftInner() {
  const sp = useSearchParams()
  const modeId = (sp.get("mode") || "clasico") as string
  const mode = GAME_MODES[modeId] || GAME_MODES.clasico
  const allP = playersData as Player[]
  const allC = clubsData as Club[]
  const allS = squadsData as Squad[]
  const cMap = Object.fromEntries(allC.map(c => [c.id, c]))
  const [started, setStarted] = useState(false)
  const [fm, setFm] = useState<Formation>("4-3-3")
  const [drafted, setDrafted] = useState<(Player|null)[]>([])
  const [currentPosIdx, setCurrentPosIdx] = useState(0)
  const [currentSquad, setCurrentSquad] = useState<Squad|null>(null)
  const [spinning, setSpinning] = useState(false)
  const [wildcards, setWildcards] = useState(3)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [phase, setPhase] = useState<"start"|"spin"|"pick"|"done"|"sim">("start")
  const [simResult, setSimResult] = useState<any>(null)
  const [simIdx, setSimIdx] = useState(0)
  const [confetti, setConfetti] = useState(false)
  const [showImage, setShowImage] = useState(false)
  const [lastResult, setLastResult] = useState<any>(null)

  const f = formations[fm]
  const totalSlots = f.positions.length
  const currentPos = f.positions[currentPosIdx] || f.positions[0]
  const teamScore = calculateTeamScore(drafted, f)
  const filledCount = drafted.filter(Boolean).length

  const spinWheel = () => {
    setSpinning(true); setPhase("spin")
    const valid = allS.filter(s => s.playerIds.length >= 11)
    const result = valid[Math.floor(Math.random() * valid.length)]
    setTimeout(() => { setCurrentSquad(result); setSpinning(false); setPhase("pick") }, 2200)
  }

  const rerollTeam = () => { if (wildcards > 0) { setWildcards(w => w - 1); spinWheel() } }

  const changeYear = () => {
    if (wildcards <= 0 || !currentSquad) return
    setWildcards(w => w - 1)
    const same = allS.filter(s => s.clubId === currentSquad.clubId && s.season !== currentSquad.season && s.playerIds.length >= 11)
    if (same.length > 0) setCurrentSquad(same[Math.floor(Math.random() * same.length)])
  }

  const pickPlayer = (player: Player) => {
    const nd = [...drafted]; nd[currentPosIdx] = player; setDrafted(nd)
    if (currentPosIdx + 1 < totalSlots) { setCurrentPosIdx(currentPosIdx + 1); setPhase("start") }
    else { setConfetti(true); setTimeout(() => setConfetti(false), 4000); setPhase("done") }
  }

  const startSim = () => {
    const tp = drafted.filter(Boolean) as Player[]
    if (modeId === "copa") setSimResult({ type: "copa", ...simulateCopaArgentinaMatchByMatch(tp, currentSquad!, allS, allP, f) })
    else setSimResult({ type: "liga", ...simulateSeasonMatchByMatch(tp, currentSquad!, allS, allP, f) })
    setSimIdx(0); setPhase("sim")
  }

  const sqPlayers = currentSquad ? getSquadPlayers(currentSquad, allP).filter(p => canPlayHere(p, currentPos.pos)) : []
  const filteredPlayers = sqPlayers.filter(p => (filter === "all" || p.position === filter) && (!search || p.name.toLowerCase().includes(search.toLowerCase())))

  const generateShareImage = async () => {
    const canvas = document.createElement('canvas')
    canvas.width = 1080; canvas.height = 1920
    const ctx = canvas.getContext('2d')!
    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, 1920)
    bg.addColorStop(0, '#071422'); bg.addColorStop(0.5, '#0a1929'); bg.addColorStop(1, '#071422')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 1080, 1920)
    // Header
    ctx.fillStyle = '#75AADB'; ctx.font = 'bold 52px Space Grotesk, sans-serif'; ctx.textAlign = 'center'
    ctx.fillText('LIGA ARGENTINA FANS', 540, 100)
    ctx.font = '28px Inter, sans-serif'; ctx.fillStyle = '#94a3b8'
    ctx.fillText(`${currentSquad?.label} · ${fm} · Score: ${teamScore}`, 540, 150)
    // Pitch background
    ctx.fillStyle = '#1a6b2a'; ctx.fillRect(80, 200, 920, 800)
    // Pitch lines
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 2
    ctx.strokeRect(80, 200, 920, 800)
    ctx.strokeRect(360, 200, 360, 800) // center area
    ctx.beginPath(); ctx.arc(540, 600, 50, 0, Math.PI * 2); ctx.stroke()
    // Players on pitch
    f.positions.forEach((pos: any, i: number) => {
      const pl = drafted[i]; if (!pl) return
      const x = 80 + (pos.x / 100) * 920; const y = 200 + (pos.y / 100) * 800
      // Circle
      ctx.beginPath(); ctx.arc(x, y, 28, 0, Math.PI * 2)
      ctx.fillStyle = PC[pos.pos] || '#666'; ctx.fill()
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
      // Initials
      ctx.fillStyle = '#fff'; ctx.font = 'bold 18px Inter'; ctx.textAlign = 'center'
      const initials = pl.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
      ctx.fillText(initials, x, y + 6)
      // Name below
      ctx.font = '14px Inter'; ctx.fillStyle = '#fff'
      ctx.fillText(pl.name.split(' ').pop() || pl.name, x, y + 48)
      if (mode.ratingsVisible) { ctx.font = 'bold 14px Inter'; ctx.fillStyle = '#75AADB'; ctx.fillText(`${pl.rating}`, x, y + 66) }
    })
    // Stats section
    let yPos = 1040
    const bestPlayer = drafted.filter(Boolean).sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))[0]
    const topScorer = drafted.filter(Boolean).sort((a: any, b: any) => (b.goalsClub || 0) - (a.goalsClub || 0))[0]
    ctx.textAlign = 'center'
    ctx.font = 'bold 32px Space Grotesk'; ctx.fillStyle = '#D4AF37'
    ctx.fillText('🏆 MEJOR JUGADOR', 540, yPos); yPos += 45
    if (bestPlayer) { ctx.font = 'bold 28px Inter'; ctx.fillStyle = '#fff'; ctx.fillText(`${bestPlayer.name} (${bestPlayer.rating})`, 540, yPos); yPos += 55 }
    ctx.font = 'bold 32px Space Grotesk'; ctx.fillStyle = '#D4AF37'
    ctx.fillText('⚽ GOLEADOR', 540, yPos); yPos += 45
    if (topScorer) { ctx.font = 'bold 28px Inter'; ctx.fillStyle = '#fff'; ctx.fillText(`${topScorer.name} — ${topScorer.goalsClub} goles`, 540, yPos); yPos += 55 }
    // Team score
    ctx.font = 'bold 60px Space Grotesk'; ctx.fillStyle = '#75AADB'
    ctx.fillText(`${teamScore}`, 540, yPos + 60); yPos += 90
    ctx.font = '24px Inter'; ctx.fillStyle = '#94a3b8'
    ctx.fillText('RATING DEL EQUIPO', 540, yPos + 20)
    // Footer
    ctx.font = '20px Inter'; ctx.fillStyle = '#475569'
    ctx.fillText('Liga Argentina Fans · ranuk12.github.io/LigaStatsGame', 540, 1880)
    // Download
    const link = document.createElement('a')
    link.download = `liga-argentina-fans-${currentSquad?.clubId}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  if (!started) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} className="max-w-lg w-full text-center">
          <img src="/logos/afa/afa.svg" alt="AFA" className="w-16 h-16 mx-auto mb-6 opacity-80" />
          <h1 className="font-display text-4xl md:text-5xl font-black gradient-text mb-4">Liga Argentina Fans</h1>
          <p className="text-slate-400 mb-6">{mode.icon} {mode.name}</p>
          <div className="card-gradient rounded-2xl p-6 mb-6">
            <h3 className="font-display font-bold text-lg mb-4">Formación</h3>
            <div className="flex gap-2 justify-center flex-wrap">
              {Object.values(formations).map((fmt:any) => (
                <button key={fmt.id} onClick={() => setFm(fmt.id)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${fm===fmt.id?"bg-[#75AADB] text-white":"bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"}`}>{fmt.name}</button>
              ))}
            </div>
            <div className="mt-4"><Pitch f={f} draft={[]} highlight={-1} cMap={cMap} /></div>
          </div>
          <div className="card-gradient rounded-2xl p-6 mb-6 text-left">
            <h3 className="font-display font-bold text-lg mb-3">Cómo Jugar</h3>
            <ol className="text-sm text-slate-400 space-y-2">
              <li>1. 🎰 Girá la ruleta → te toca un <strong className="text-slate-200">equipo + año</strong></li>
              <li>2. ⚽ Elegí un jugador <strong className="text-slate-200">de ese plantel</strong> para la posición</li>
              <li>3. 🃏 Usá comodines para <strong className="text-slate-200">cambiar equipo o año</strong></li>
              <li>4. 🏆 Armá tu 11 y <strong className="text-slate-200">simulá la temporada</strong></li>
            </ol>
            <p className="text-xs text-slate-600 mt-3">🃏 {mode.rerolls} comodines · {mode.ratingsVisible ? "Ratings visibles" : "Ratings ocultos"}</p>
          </div>
          <button onClick={() => { setStarted(true); spinWheel() }} className="btn-primary text-lg px-10 py-4">🎰 ¡Empezar Draft!</button>
          <Link href="/" className="block mt-4 text-sm text-slate-500 hover:text-slate-300 transition-colors">← Volver</Link>
        </motion.div>
      </div>
    )
  }
  const club = currentSquad ? cMap[currentSquad.clubId] : null
  const clubColors = club?.colors || ["#334155", "#1e293b"]

  return (
    <div className="min-h-screen gradient-bg pb-8">
      {confetti && <div className="fixed inset-0 pointer-events-none z-50">{Array.from({length:40}).map((_,i) => (<div key={i} className="absolute text-2xl" style={{left:`${Math.random()*100}%`,top:`-${Math.random()*20}%`,animation:`confetti-fall ${2+Math.random()*3}s linear ${Math.random()*2}s forwards`}}>⚽</div>))}</div>}

      {/* HEADER */}
      <div className="sticky top-0 z-40 bg-[#071422]/90 backdrop-blur-md border-b border-[rgba(117,170,219,0.1)] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-400 hover:text-white">← Liga Argentina Fans</Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#75AADB] font-semibold">{filledCount}/{totalSlots}</span>
            <span className="text-amber-400">🃏 {wildcards}</span>
            {teamScore > 0 && <span className="text-green-400 font-bold">{teamScore}</span>}
          </div>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 mt-6">

        {/* SPIN PHASE */}
        {phase === "spin" && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-12">
            <p className="text-sm text-slate-500 mb-2">Posición: <span style={{color:PC[currentPos?.pos]}}>{currentPos?.label}</span></p>
            <div className="relative w-64 h-64 mx-auto mb-6">
              {/* Roulette wheel with club badges */}
              <div className={`w-full h-full rounded-full border-4 border-[#75AADB] bg-gradient-to-br from-[#0d2137] to-[#132d46] overflow-hidden ${spinning ? "animate-spin" : ""}`} style={{animationDuration: spinning ? "0.6s" : "0s"}}>
                <div className="w-full h-full grid grid-cols-4 grid-rows-4 gap-0">
                  {Array.from({length:16}).map((_,i) => {
                    const clubs = allC.filter(c => allS.some(s => s.clubId === c.id))
                    const club = clubs[i % clubs.length]
                    return (
                      <div key={i} className="flex items-center justify-center p-0.5" style={{background: `linear-gradient(135deg, ${club?.colors?.[0] || '#333'}22, ${club?.colors?.[1] || club?.colors?.[0] || '#333'}33)`}}>
                        <img src={`/logos/clubs/${club?.id}.svg`} alt="" className="w-8 h-8 object-contain drop-shadow-sm" onError={(e)=>{(e.target as HTMLImageElement).style.display="none"}} />
                      </div>
                    )
                  })}
                </div>
              </div>
              {/* Pointer */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-[#D4AF37] z-10 drop-shadow-lg" />
              {/* Center badge */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-[#0d2137] border-2 border-[#75AADB] flex items-center justify-center shadow-xl">
                  <span className="text-2xl">⚽</span>
                </div>
              </div>
            </div>
            <p className="text-[#75AADB] text-lg font-semibold">{spinning ? "🎰 Girando la ruleta..." : "Preparando..."}</p>
            {spinning && <p className="text-xs text-slate-600 mt-1">Buscando equipo y año...</p>}
          </motion.div>
        )}
        {/* PICK PHASE */}
        {phase === "pick" && currentSquad && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}}>
            {/* Current Position + Squad Info */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-4" style={{borderColor:PC[currentPos.pos]+"40",backgroundColor:PC[currentPos.pos]+"15"}}>
                <span className="font-bold" style={{color:PC[currentPos.pos]}}>{currentPos.pos}</span>
                <span className="text-slate-300 text-sm">{currentPos.label}</span>
              </div>
              <div className="flex items-center justify-center gap-3 mb-2">
                <img src={`/logos/clubs/${currentSquad.clubId}.svg`} alt="" className="w-10 h-10" onError={(e)=>{(e.target as HTMLImageElement).style.display="none"}} />
                <div className="text-left">
                  <div className="font-display font-bold text-lg">{currentSquad.label}</div>
                  <div className="text-xs text-slate-400">{currentSquad.playerIds.length} jugadores</div>
                </div>
              </div>
            </div>

            {/* Wildcard Buttons */}
            <div className="flex gap-2 justify-center mb-6">
              <button onClick={rerollTeam} disabled={wildcards<=0} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">🔄 Cambiar Equipo ({wildcards})</button>
              <button onClick={changeYear} disabled={wildcards<=0} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all">📅 Cambiar Año ({wildcards})</button>
            </div>
            {/* Player Filter + Search */}
            <div className="flex gap-2 mb-4 flex-wrap justify-center">
              <input type="text" placeholder="Buscar jugador..." value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:border-[#75AADB] focus:outline-none w-48" />
              {["all","GK","CB","LB","RB","CM","CDM","CAM","LW","RW","ST"].slice(0,6).map(p => (
                <button key={p} onClick={() => setFilter(p)} className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${filter===p?"bg-[#75AADB] text-white":"bg-slate-800 text-slate-400 border border-slate-700"}`}>{p==="all"?"Todos":p}</button>
              ))}
            </div>

            {/* Player List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-8 max-h-[40vh] overflow-y-auto pr-1">
              {filteredPlayers.length === 0 && <p className="text-slate-500 text-sm text-center col-span-2 py-8">No hay jugadores para esta posición en este plantel</p>}
              {filteredPlayers.map(player => (
                <motion.button key={player.id} whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={() => pickPlayer(player)} className="card-gradient rounded-xl p-3 flex items-center gap-3 text-left hover:border-[#75AADB]/30 transition-all">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{backgroundColor:PC[player.position]||"#666"}}>
                    {player.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate text-white">{player.name}</div>
                    <div className="text-xs text-slate-400">{player.position} · {player.clubs?.[0]?.name || ""}</div>
                  </div>
                  {mode.ratingsVisible && <div className="text-right shrink-0"><div className="text-lg font-black text-[#75AADB]">{player.rating}</div></div>}
                </motion.button>
              ))}
            </div>

            {/* Pitch Visualization */}
            <div className="mb-6">
              <h3 className="font-display font-bold text-center mb-3 text-slate-300">Tu Once</h3>
              <Pitch f={f} draft={drafted} highlight={currentPosIdx} cMap={cMap} />
            </div>
          </motion.div>
        )}
        {/* DONE PHASE - Team Complete */}
        {phase === "done" && (
          <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} className="text-center py-8">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="font-display text-3xl font-black gradient-text mb-2">¡11 Completo!</h2>
            <p className="text-slate-400 mb-2">{currentSquad?.label} · Score: <span className="text-[#75AADB] font-bold">{teamScore}</span></p>
            <p className="text-sm text-slate-500 mb-8">{fm} · {wildcards} comodines sin usar</p>
            <div className="mb-8"><Pitch f={f} draft={drafted} highlight={-1} cMap={cMap} /></div>
            <div className="flex gap-3 justify-center flex-wrap mb-6">
              <button onClick={startSim} className="btn-primary text-base px-8 py-3">🏆 Simular Torneo</button>
              <button onClick={generateShareImage} className="px-6 py-3 rounded-xl font-bold text-base bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">📸 Generar Imagen</button>
              <button onClick={() => { setDrafted(Array(totalSlots).fill(null)); setCurrentPosIdx(0); setWildcards(3); setPhase("start") }} className="btn-secondary text-sm">🔄 Empezar de Nuevo</button>
            </div>
            <Link href="/" className="text-sm text-slate-500 hover:text-slate-300">← Volver al inicio</Link>
          </motion.div>
        )}
        {/* SIM PHASE */}
        {phase === "sim" && simResult && (
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="py-6">
            <h2 className="font-display text-2xl font-bold text-center mb-6 gradient-text">
              {simResult.type === "liga" ? "🏟️ Liga Argentina" : "🏅 Copa Argentina"}
            </h2>

            {/* LIGA MODE */}
            {simResult.type === "liga" && (
              <div className="space-y-4">
                {/* Table so far */}
                <div className="card-gradient rounded-2xl p-4 overflow-x-auto">
                  <h3 className="font-display font-bold text-sm mb-3 text-slate-300">Tabla de Posiciones</h3>
                  <table className="w-full text-xs">
                    <thead><tr className="text-slate-500 border-b border-slate-700">
                      <th className="text-left py-2 pr-2">#</th><th className="text-left py-2">Equipo</th><th className="text-center py-2 px-1">Pts</th><th className="text-center py-2 px-1">PJ</th><th className="text-center py-2 px-1">G</th><th className="text-center py-2 px-1">E</th><th className="text-center py-2 px-1">P</th><th className="text-center py-2 px-1">GF</th><th className="text-center py-2 px-1">GC</th><th className="text-center py-2 px-1">DG</th>
                    </tr></thead>
                    <tbody>
                      {simResult.table.map((t:any, i:number) => {
                        const isPlayer = t.name === currentSquad?.label
                        const isPlayed = simResult.schedule.slice(0, simIdx + 1).some((m:any) => (m.home === t.name || m.away === t.name))
                        return (
                          <tr key={i} className={`border-b border-slate-800 ${isPlayer ? "bg-[#75AADB]/10 font-bold" : ""} ${!isPlayed ? "opacity-30" : ""}`}>
                            <td className="py-1.5 pr-2 text-slate-400">{i + 1}</td>
                            <td className="py-1.5 flex items-center gap-1.5">
                              <img src={`/logos/clubs/${t.name.split(" ").slice(0,-1).join("-").toLowerCase().replace(/[^a-z0-9-]/g,"")}.svg`} className="w-4 h-4 hidden" onError={(e)=>{(e.target as HTMLImageElement).style.display="none"}} />
                              <span className={isPlayer ? "text-[#75AADB]" : "text-slate-300"}>{t.name}</span>
                            </td>
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
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Match Result */}
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
                {/* Advance Button */}
                <div className="text-center">
                  {simIdx < simResult.schedule.length - 1 ? (
                    <button onClick={() => setSimIdx(simIdx + 1)} className="btn-primary px-8 py-3 text-base">⚽ Siguiente Partido</button>
                  ) : (
                    <div className="space-y-3">
                      <div className="card-gradient rounded-2xl p-6">
                        <div className="text-4xl mb-2">🏆</div>
                        <div className="font-display text-xl font-bold text-[#75AADB]">Campeón: {simResult.champion}</div>
                        <div className="text-sm text-slate-400 mt-1">Tu posición: {simResult.playerPos}°</div>
                      </div>
                      <button onClick={() => { setPhase("done"); setSimResult(null) }} className="btn-secondary">← Volver al 11</button>
                      <button onClick={generateShareImage} className="px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-[#D4AF37] to-[#B8960C] text-white shadow-lg shadow-amber-500/20 hover:shadow-amber-500/40 transition-all duration-200">📸 Generar Imagen</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COPA MODE */}
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

                {/* Copa Result */}
                <div className="card-gradient rounded-2xl p-6 text-center">
                  {simResult.eliminated ? (
                    <><div className="text-4xl mb-2">💔</div><div className="font-display text-xl font-bold text-red-400">Eliminado en {simResult.eliminatedRound}</div></>
                  ) : (
                    <><div className="text-4xl mb-2">🏆</div><div className="font-display text-xl font-bold text-[#75AADB]">¡CAMPEÓN DE COPA!</div></>
                  )}
                  <button onClick={() => { setPhase("done"); setSimResult(null) }} className="btn-secondary mt-4">← Volver al 11</button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default function DraftPage() { return <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center text-slate-400">Cargando...</div>}><DraftInner /></Suspense> }
