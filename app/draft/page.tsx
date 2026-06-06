"use client"
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import playersData from '@/data/players.json'
import clubsData from '@/data/clubs.json'
import { Player, Club } from '@/lib/types'

const PC: Record<string, string> = { GK:'#f59e0b', CB:'#3b82f6', LB:'#06b6d4', RB:'#06b6d4', CM:'#10b981', CDM:'#059669', CAM:'#8b5cf6', LW:'#ef4444', RW:'#ef4444', ST:'#dc2626', CF:'#ea580c' }
const POS = ['GK','LB','CB','CB','RB','CM','CM','CAM','LW','ST','RW']

function DraftContent() {
  const sp = useSearchParams()
  const clubId = sp.get('club') || 'river-plate'
  const allPlayers = playersData as Player[]
  const allClubs = clubsData as Club[]
  const club = allClubs.find(c => c.id === clubId) || allClubs[0]
  const [drafted, setDrafted] = useState<(Player | null)[]>(Array(11).fill(null))
  const [activeSlot, setActiveSlot] = useState<number | null>(null)
  const [posFilter, setPosFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sim, setSim] = useState<null | { pos:number; pts:number; w:number; d:number; l:number; gf:number; ga:number }>(null)

  const filled = drafted.filter(Boolean).length
  const teamRating = () => { const f = drafted.filter(Boolean) as Player[]; return f.length ? Math.round(f.reduce((s,p)=>s+p.rating,0)/f.length) : 0 }
  const draftPlayer = (p: Player) => { if (activeSlot===null) return; const d=[...drafted]; d[activeSlot]=p; setDrafted(d); setActiveSlot(null) }
  const removePlayer = (i: number) => { const d=[...drafted]; d[i]=null; setDrafted(d) }
  const reset = () => { setDrafted(Array(11).fill(null)); setSim(null); setActiveSlot(null) }
  const simulate = () => {
    const tr=teamRating(), wk=(filled/11)*0.3+(tr/100)*0.7
    const w=Math.round(wk*38*0.7+(Math.random()*6-3)), dr=Math.round(Math.random()*8+4), l=Math.max(0,38-w-dr)
    const gf=Math.round(wk*80+Math.random()*20), ga=Math.round((1-wk)*50+Math.random()*15)
    setSim({ pos:Math.max(1,Math.round(28-wk*26+(Math.random()*4-2))), pts:w*3+dr, w, d:dr, l, gf, ga })
  }
  const filtered = allPlayers.filter(p => (posFilter==='all'||p.position===posFilter) && (!search||p.name.toLowerCase().includes(search.toLowerCase())))

  return (
    <div className="min-h-screen gradient-bg py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 btn-secondary text-sm mb-6">← Volver al inicio</Link>
        <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="w-full rounded-xl mb-8 p-6 overflow-hidden"
          style={{background:`linear-gradient(135deg,${club?.colors?.[0]||'#1e293b'},${club?.colors?.[1]||club?.colors?.[0]||'#0f172a'})`}}>
          <h1 className="text-3xl font-black text-white font-display drop-shadow-lg">{club?.name}</h1>
          <p className="text-white/80 mt-1">{club?.nickname} • {club?.stadium}</p>
        </motion.div>

        <div className="pitch-green rounded-xl p-6 mb-8 relative" style={{minHeight:320}}>
          <div className="absolute inset-0 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 items-center p-4">
            {drafted.map((p,i)=>{
              const pos=POS[i]
              return (
                <motion.div key={i} whileHover={{scale:1.08}} whileTap={{scale:0.95}}
                  onClick={()=>p?removePlayer(i):setActiveSlot(i)}
                  className={`aspect-square rounded-full flex flex-col items-center justify-center cursor-pointer border-2 transition-all duration-200 ${activeSlot===i?'border-cyan-400 shadow-lg shadow-cyan-400/30 ring-2 ring-cyan-400/50':'border-white/20 hover:border-white/40'}`}
                  style={{backgroundColor:PC[pos]||'#666'}}>
                  <span className="text-white font-bold text-xs sm:text-sm leading-none">{p?p.name.split(' ').pop()?.slice(0,4):pos}</span>
                  {p&&<span className="text-white/70 text-[10px] mt-0.5">{p.rating}⭐</span>}
                  {!p&&<span className="text-white/50 text-[10px] mt-0.5">{pos}</span>}
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="stat-card"><div className="text-2xl font-black text-white font-display">{teamRating()}</div><div className="text-xs text-slate-400">Rating</div></div>
            <div className="stat-card"><div className="text-2xl font-black text-blue-400 font-display">{filled}/11</div><div className="text-xs text-slate-400">Jugadores</div></div>
          </div>
          <div className="flex gap-3">
            <button onClick={reset} className="btn-secondary text-sm">↺ Reiniciar</button>
            <button onClick={simulate} disabled={filled===0} className="btn-primary text-sm">🏆 Simular temporada</button>
          </div>
        </div>

        <AnimatePresence>
          {sim&&(
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mb-8 p-6 rounded-xl bg-gradient-to-r from-green-900/50 to-blue-900/50 border border-green-500/30">
              <h2 className="text-2xl font-black mb-4 font-display">🏆 Resultado de temporada</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div><div className="text-3xl font-black text-yellow-400">{sim.pos}°</div><div className="text-xs text-slate-400">Posición</div></div>
                <div><div className="text-3xl font-black text-green-400">{sim.pts}</div><div className="text-xs text-slate-400">Puntos</div></div>
                <div><div className="text-xl font-black text-blue-400">{sim.w}G {sim.d}E {sim.l}P</div><div className="text-xs text-slate-400">Resultado</div></div>
                <div><div className="text-2xl font-black">{sim.gf} - {sim.ga}</div><div className="text-xs text-slate-400">Goles</div></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeSlot!==null&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center" onClick={()=>setActiveSlot(null)}>
            <motion.div initial={{y:100}} animate={{y:0}} className="bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col border border-slate-700" onClick={e=>e.stopPropagation()}>
              <div className="p-4 border-b border-slate-700">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-lg">Slot {activeSlot+1} — {POS[activeSlot]}</h3>
                  <button onClick={()=>setActiveSlot(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
                </div>
                <input type="text" placeholder="Buscar jugador..." value={search} onChange={e=>setSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 rounded-lg text-sm text-white placeholder-slate-500 mb-3 border border-slate-700 focus:border-blue-500 focus:outline-none" />
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {['all','GK','CB','LB','RB','CM','CAM','LW','RW','ST'].map(f=>(
                    <button key={f} onClick={()=>setPosFilter(f)}
                      className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-all ${posFilter===f?'bg-blue-600 text-white':'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{f==='all'?'Todos':f}</button>
                  ))}
                </div>
              </div>
              <div className="p-3 space-y-2 overflow-y-auto flex-1">
                {filtered.map(p=>{
                  const init=p.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()
                  return(
                    <motion.div key={p.id} whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={()=>draftPlayer(p)}
                      className="p-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-600 cursor-pointer transition-all duration-150">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm shrink-0" style={{backgroundColor:PC[p.position]||'#666'}}>{init}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{p.name} {p.legendary&&<span className="text-yellow-400">⭐</span>}</div>
                          <div className="text-xs text-slate-400">{p.clubs?.[0]?.name} • {p.position} • {p.goalsClub}G {p.capsClub}P</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-bold text-lg">{p.rating}</div>
                          <div className="text-[10px] text-slate-500">Rating</div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
                {filtered.length===0&&<div className="text-center py-8 text-slate-500">No se encontraron jugadores</div>}
              </div>
            </motion.div>
          </motion.div>
        )}

        <footer className="text-center py-6 text-xs text-slate-600 mt-12">
          LigaStatsGame © 2026 — Hecho con ⚽ por Ranuk
        </footer>
      </div>
    </div>
  )
}

export default function DraftPage() {
  return (
    <Suspense fallback={<div className="min-h-screen gradient-bg flex items-center justify-center text-white">Cargando...</div>}>
      <DraftContent />
    </Suspense>
  )
}