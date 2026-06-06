"use client"
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import playersData from '@/data/players.json'
import { Player } from '@/lib/types'

const PC: Record<string, string> = { GK:'#f59e0b', CB:'#3b82f6', LB:'#06b6d4', RB:'#06b6d4', CM:'#10b981', CDM:'#059669', CAM:'#8b5cf6', LW:'#ef4444', RW:'#ef4444', ST:'#dc2626', CF:'#ea580c' }

export default function RuletaPage() {
  const allPlayers = playersData as Player[]
  const [spinning, setSpinning] = useState(false)
  const [selected, setSelected] = useState<Player | null>(null)
  const [rotation, setRotation] = useState(0)
  const [history, setHistory] = useState<Player[]>([])
  const [filter, setFilter] = useState('all')
  const spin = () => {
    if (spinning) return
    setSpinning(true)
    const pool = filter === 'all' ? allPlayers : allPlayers.filter(p => p.position === filter)
    const idx = Math.floor(Math.random() * pool.length)
    const player = pool[idx]
    const seg = 360 / pool.length
    const target = 360 * 6 + (360 - idx * seg - seg / 2)
    setRotation(prev => prev + target)
    setTimeout(() => { setSelected(player); setHistory(h => [player, ...h].slice(0, 20)); setSpinning(false) }, 4000)
  }
  const segCount = Math.min(allPlayers.length, 24)
  const segAngle = 360 / segCount

  return (
    <div className="min-h-screen gradient-bg">
      <header className="pt-12 pb-6 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/3 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl" />
          <div className="absolute top-20 right-1/3 w-56 h-56 bg-orange-500/5 rounded-full blur-3xl" />
        </div>
        <motion.div initial={{opacity:0,y:-30}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="relative">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight font-display"><span className="gradient-text-warm">Ruleta del Fútbol</span></h1>
          <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">Girá la ruleta y descubrí una leyenda aleatoria del fútbol argentino.</p>
        </motion.div>
      </header>
      <main className="max-w-2xl mx-auto px-4 pb-20 text-center">
        <div className="flex gap-2 justify-center mb-8 flex-wrap">
          {['all','GK','CB','CM','CAM','LW','RW','ST'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)} className={`px-4 py-1.5 text-sm rounded-full font-medium transition-all duration-200 ${filter===f?'bg-rose-600 text-white shadow-lg shadow-rose-600/20':'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}>{f==='all'?'Todos':f}</button>
          ))}
        </div>
        <div className="card-gradient rounded-2xl p-8 shadow-xl">
          <div className="w-72 h-72 mx-auto rounded-full border-4 border-slate-600 relative overflow-hidden"
            style={{background:`conic-gradient(from 0deg, ${Array.from({length:segCount},(_,i)=>`hsl(${i*segAngle+20},65%,${25+i%2*8}%)`).join(',')})`}}>
            <motion.div animate={{rotate: rotation}} transition={{duration:4,ease:[0.17,0.67,0.12,0.99]}} className="absolute inset-0" />
            <div className="absolute inset-[35%] bg-slate-900 rounded-full flex items-center justify-center text-3xl shadow-lg border-2 border-slate-700 z-10">⚽</div>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-white z-20" />
          </div>
          <button onClick={spin} disabled={spinning} className="mt-8 px-10 py-4 bg-gradient-to-r from-rose-600 to-orange-600 rounded-xl font-bold text-lg shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed">
            {spinning ? '🔄 Girando...' : '🎲 ¡Girar Ruleta!'}
          </button>
          {selected&&!spinning&&(
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="mt-8 card-gradient rounded-xl p-6 border border-slate-700">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center font-bold text-white text-xl mb-3 shadow-lg" style={{backgroundColor:PC[selected.position]||'#666'}}>
                {selected.name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
              </div>
              <h2 className="text-2xl font-bold font-display">{selected.name}</h2>
              <p className="text-slate-400 mt-1">{selected.position} • {selected.clubs?.[0]?.name}</p>
              <div className="grid grid-cols-3 gap-4 mt-5">
                <div className="stat-card"><div className="text-2xl font-bold text-green-400">{selected.goalsClub}</div><div className="text-[11px] text-slate-500">Goles</div></div>
                <div className="stat-card"><div className="text-2xl font-bold text-blue-400">{selected.capsClub}</div><div className="text-[11px] text-slate-500">Partidos</div></div>
                <div className="stat-card"><div className="text-2xl font-bold text-yellow-400">{selected.rating}</div><div className="text-[11px] text-slate-500">Rating</div></div>
              </div>
              {selected.legendary&&<span className="mt-4 inline-block bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm font-semibold">⭐ Leyenda</span>}
              {selected.trophies&&selected.trophies.length>0&&(
                <div className="mt-4 text-left"><h3 className="font-semibold text-sm text-slate-300 mb-2">🏆 Títulos</h3><div className="space-y-1">{selected.trophies.slice(0,5).map((t,i)=>(<p key={i} className="text-xs text-slate-400">{t.competition} ({t.year}) — {t.club}</p>))}</div></div>
              )}
            </motion.div>
          )}
        </div>
        {history.length>1&&(
          <div className="mt-8 text-left"><h3 className="text-sm font-bold text-slate-400 mb-3">📜 Historial</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">{history.slice(1,10).map((p,i)=>(<div key={`${p.id}-${i}`} className="shrink-0 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700 text-xs"><div className="font-semibold truncate max-w-[100px]">{p.name}</div><div className="text-slate-500">{p.position}</div></div>))}</div>
          </div>
        )}
        <Link href="/" className="inline-block mt-6 text-slate-400 hover:text-white transition-colors text-sm">← Volver al inicio</Link>
      </main>
    </div>
  )
}