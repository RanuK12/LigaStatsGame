"use client"
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import playersData from '@/data/players.json'
import clubsData from '@/data/clubs.json'
import squadsData from '@/data/squads.json'
import { formations, positionCompatibility, spinSquad, getSquadPlayers, calculateTeamScore, simulateSeason, GAME_MODES, generateShareText } from '@/lib/game-engine'
import { Player, Club, Squad, Formation, FormationConfig, GameMode } from '@/lib/types'
const PC: Record<string,string> = {GK:'#f59e0b',CB:'#3b82f6',LB:'#06b6d4',RB:'#06b6d4',CM:'#10b981',CDM:'#059669',CAM:'#8b5cf6',LW:'#ef4444',RW:'#ef4444',ST:'#dc2626'}
function DraftInner() {
  const sp = useSearchParams()
  const mp = (sp.get('mode') || 'clasico') as GameMode
  const mode = GAME_MODES[mp] || GAME_MODES.clasico
  const allP = playersData as Player[]
  const allC = clubsData as Club[]
  const allS = squadsData as Squad[]
  const cMap = Object.fromEntries(allC.map(c => [c.id, c]))
  const [on, setOn] = useState(false)
  const [sq, setSq] = useState<Squad | null>(null)
  const [fm, setFm] = useState<Formation>('4-3-3')
  const [dr, setDr] = useState<(Player | null)[]>([])
  const [sl, setSl] = useState<number | null>(null)
  const [pf, setPf] = useState('all')
  const [sr, setSr] = useState('')
  const [rr, setRr] = useState(mode.rerolls)
  const [res, setRes] = useState(false)
  const [sn, setSn] = useState<any>(null)
  const [sh, setSh] = useState(false)
  const f = formations[fm]
  const sP = sq ? getSquadPlayers(sq, allP) : []
  const cl = sq ? cMap[sq.clubId] : null
  const fi = dr.filter(Boolean).length
  const tot = f.positions.length
  const sc = on ? calculateTeamScore(dr, f) : 0
  const cc = cl?.colors || ['#1e293b', '#0f172a']
  const fp = sP.filter(p => (pf === 'all' || p.position === pf) && (!sr || p.name.toLowerCase().includes(sr.toLowerCase())) && !dr.some(d => d?.id === p.id))
  const go = () => { const s = spinSquad(allS); setSq(s); setDr(Array(tot).fill(null)); setSl(0); setOn(true); setRes(false); setSn(null); setRr(mode.rerolls) }
  const doRr = () => { if (rr <= 0) return; const s = spinSquad(allS); setSq(s); setDr(Array(tot).fill(null)); setSl(0); setRr(r => r - 1); setRes(false); setSn(null) }
  const dk = (p: Player) => { if (sl === null) return; const d = [...dr]; d[sl] = p; setDr(d); const nx = d.findIndex((x, i) => i > sl && x === null); setSl(nx !== -1 ? nx : d.findIndex(x => x === null)) }
  const rm = (i: number) => { const d = [...dr]; d[i] = null; setDr(d); setSl(i) }
  const rst = () => { setDr(Array(tot).fill(null)); setSl(0); setRes(false); setSn(null) }
  const sim = () => { const tp = dr.filter(Boolean) as Player[]; setSn(simulateSeason(tp, sq!, allS, allP)); setRes(true) }
  const doSh = () => { navigator.clipboard?.writeText(generateShareText(sq!, sc, fm)); setSh(true); setTimeout(() => setSh(false), 2000) }
  if (!on) return (
    <div className="min-h-screen gradient-bg py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 btn-secondary text-sm mb-8">← Volver</Link>
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black font-display gradient-text">{mode.name}</h1>
          <p className="text-slate-400 mt-3 text-lg">{mode.desc}</p>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-slate-500">
            <span>⚽ {allS.length} plantels</span><span>👥 {allP.length} jugadores</span>
          </div>
        </motion.div>
        <div className="card-gradient rounded-2xl p-8 max-w-xl mx-auto">
          <h2 className="text-xl font-bold mb-6 font-display">📐 Elegí formación</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {Object.values(formations).map(fo => (
              <button key={fo.id} onClick={() => setFm(fo.id as Formation)}
                className={`p-3 rounded-xl text-center transition-all ${fm === fo.id ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}>
                <div className="text-xl font-bold font-display">{fo.id}</div>
                <div className="text-xs mt-1 opacity-75">{Object.values(fo.requirements).reduce((a:number,b:number)=>a+b,0)} slots</div>
              </button>
            ))}
          </div>
          {!mode.ratingsVisible && <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6"><p className="text-amber-400 text-sm font-semibold">🧠 Ratings OCULTOS</p></div>}
          <button onClick={go} className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-500/40 transition-all hover:scale-[1.02] active:scale-[0.98]">🎲 ¡Girar Plantel!</button>
        </div>
      </div>
    </div>
  )
  return (
    <div className="min-h-screen gradient-bg py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 btn-secondary text-sm mb-4">← Volver</Link>
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="rounded-xl mb-6 p-5" style={{background:`linear-gradient(135deg,${cc[0]},${cc[1]||cc[0]})`}}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white font-display">{sq?.label}</h1>
              <p className="text-white/80 text-sm mt-1">{sq?.competition} · {sP.length} jugadores</p>
            </div>
            <div className="flex gap-2">
              {rr > 0 && <button onClick={doRr} className="px-4 py-2 bg-white/20 rounded-lg text-white text-sm font-semibold hover:bg-white/30 transition">🔄 Reroll ({rr})</button>}
              <button onClick={() => { setOn(false); setRes(false) }} className="px-4 py-2 bg-red-500/20 rounded-lg text-red-300 text-sm font-semibold hover:bg-red-500/30 transition">Nuevo</button>
            </div>
          </div>
          <div className="flex gap-4 mt-3 text-sm text-white/70">
            <span>📐 {fm}</span><span>⚽ {fi}/{tot}</span><span>🏆 Score: <strong className="text-white">{sc}</strong></span>
          </div>
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="pitch-green rounded-xl p-4 relative" style={{minHeight:360}}>
              {f.positions.map((fp2, i) => {
                const pl = dr[i]; const isAct = sl === i
                return (
                  <motion.button key={i} onClick={() => setSl(i)}
                    className={`absolute w-[68px] h-[68px] md:w-[76px] md:h-[76px] rounded-xl flex flex-col items-center justify-center transition-all ${isAct ? 'ring-2 ring-yellow-400 scale-110 z-20' : 'hover:scale-105 z-10'}`}
                    style={{ left: `${fp2.x}%`, top: `${fp2.y}%`, transform: 'translate(-50%,-50%)' }}>
                    {pl ? (
                      <div className="w-full h-full rounded-xl p-1.5 flex flex-col items-center justify-center relative" style={{background: PC[pl.position] || '#334155'}}>
                        <button onClick={(e) => { e.stopPropagation(); rm(i) }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[8px] flex items-center justify-center">✕</button>
                        <div className="text-[10px] font-bold text-white/90 truncate w-full text-center">{pl.name.split(' ').pop()}</div>
                        {mode.ratingsVisible && <div className="text-lg font-black text-white">{pl.rating}</div>}
                        <div className="text-[9px] text-white/70">{pl.position}</div>
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-xl bg-slate-800/80 border-2 border-dashed border-slate-500 flex flex-col items-center justify-center">
                        <div className="text-[10px] text-slate-400">{fp2.label}</div>
                        <div className="text-xs text-slate-500 font-bold">{fp2.pos}</div>
                      </div>
                    )}
                  </motion.button>
                )
              })}
            </div>
            <div className="mt-4 card-gradient rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Score del equipo</span>
                <span className="font-bold text-lg">{sc}/100</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-3">
                <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500" style={{width:`${sc}%`}} />
              </div>
              <div className="flex flex-wrap gap-3 mt-4">
                {fi >= 7 && <button onClick={sim} className="btn-primary text-sm">🏟️ Simular Temporada</button>}
                {fi > 0 && <button onClick={rst} className="btn-danger text-sm">🗑️ Reset</button>}
                {res && <button onClick={doSh} className="px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-xl text-green-400 text-sm font-medium hover:bg-green-600/30 transition">📤 {sh ? '¡Copiado!' : 'Compartir'}</button>}
              </div>
            </div>
            <AnimatePresence>
              {res && sn && (
                <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mt-4 card-gradient rounded-xl p-5 border border-slate-700">
                  <h3 className="text-xl font-bold font-display mb-4">🏟️ Temporada</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="stat-card"><div className="text-2xl font-black text-green-400">{sn.position}°</div><div className="text-[11px] text-slate-500">Posición</div></div>
                    <div className="stat-card"><div className="text-2xl font-black text-blue-400">{sn.points}</div><div className="text-[11px] text-slate-500">Puntos</div></div>
                    <div className="stat-card"><div className="text-2xl font-black">{sn.wins}V {sn.draws}E {sn.losses}D</div><div className="text-[11px] text-slate-500">Récord</div></div>
                    <div className="stat-card"><div className="text-2xl font-black">{sn.goalsFor}-{sn.goalsAgainst}</div><div className="text-[11px] text-slate-500">Goles</div></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="lg:col-span-1">
            <div className="card-gradient rounded-xl p-4 sticky top-4">
              <h3 className="font-bold text-sm mb-3 font-display">📋 Plantel ({sP.length})</h3>
              <input type="text" placeholder="Buscar..." value={sr} onChange={e => setSr(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-1 flex-wrap mb-3">
                {['all','GK','CB','LB','RB','CM','CDM','CAM','LW','RW','ST'].map(p => (
                  <button key={p} onClick={() => setPf(p)} className={`px-2 py-1 text-[11px] rounded-md font-medium transition ${pf === p ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>{p === 'all' ? 'Todos' : p}</button>
                ))}
              </div>
              <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
                {fp.map(p => (
                  <motion.button key={p.id} onClick={() => dk(p)} whileHover={{scale:1.02}} whileTap={{scale:0.98}}
                    className="w-full flex items-center gap-2 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 transition-all text-left">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0" style={{background: PC[p.position] || '#334155'}}>{p.position}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-500">{p.clubs?.[0]?.name || ''}</div>
                    </div>
                    {mode.ratingsVisible && <div className="text-lg font-black text-slate-300 shrink-0">{p.rating}</div>}
                    {p.legendary && <span className="text-yellow-400 text-xs shrink-0">⭐</span>}
                  </motion.button>
                ))}
                {fp.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Sin jugadores disponibles</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
export default function DraftPage() {
  return <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>}><DraftInner /></Suspense>
}
