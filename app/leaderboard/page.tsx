"use client"
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { loadLocalScores, type GameScore } from '@/lib/scores'
import { fetchOnlineScores } from '@/lib/supabase'
import TierBadge from '@/components/TierBadge'

function LeaderboardRow({ rank, s }: { rank: number; s: GameScore }) {
  const top3 = rank < 3
  const medal = ['🥇', '🥈', '🥉'][rank] || `${rank + 1}°`
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(rank, 12) * 0.04 }}
      className={`card-gradient rounded-xl p-3.5 flex items-center gap-3 ${top3 ? 'border border-amber-400/30' : 'border border-white/5'}`}
    >
      <div className="text-xl w-9 text-center font-display shrink-0">{medal}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm truncate max-w-[140px]">{s.username}</span>
          <TierBadge elo={s.elo} />
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">Rating {s.rating} • {s.players}/11 • {s.pos}° pos</div>
      </div>
      <div className="text-right shrink-0">
        <div className={`text-lg font-black font-display leading-none ${s.pts < 0 ? "text-red-400" : "text-green-400"}`}>
          {s.pts > 0 ? "+" : ""}{s.pts}
        </div>
        <div className="text-[10px] text-[#74ACDF] font-bold">⚡{s.elo}</div>
      </div>
    </motion.div>
  )
}

export default function LeaderboardPage() {
  const [scores, setScores] = useState<GameScore[]>([])
  const [tab, setTab] = useState<'global' | 'online'>('global')
  const [loadingOnline, setLoadingOnline] = useState(false)

  useEffect(() => {
    setScores(loadLocalScores())
  }, [])

  useEffect(() => {
    if (tab !== 'online') return
    setLoadingOnline(true)
    fetchOnlineScores(50)
      .then((online) => {
        setScores(
          online.map((o, i) => ({
            id: o.id || `online-${i}`,
            username: o.username,
            club: o.club,
            clubName: o.clubName,
            rating: o.rating,
            players: o.players,
            pts: o.pts,
            pos: o.pos,
            elo: o.elo,
            date: o.date,
          })),
        )
      })
      .finally(() => setLoadingOnline(false))
  }, [tab])

  const ranked = useMemo(() => [...scores].sort((a, b) => b.elo - a.elo || b.pts - a.pts), [scores])

  return (
    <div className="min-h-screen gradient-bg">
      <header className="pt-12 pb-6 px-4 text-center">
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl md:text-5xl font-black tracking-wider font-display uppercase"><span className="gradient-text">TABLA DE LÍDERES</span></h1>
          <p className="mt-3 text-sm text-slate-400">Rankeá tu ELO y peleá por llegar a Leyenda</p>
        </motion.div>
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-20">
        <div className="flex gap-2.5 mb-8 justify-center font-sport">
          <button onClick={() => setTab('global')} className={`px-5 py-3 rounded-xl text-xs font-black tracking-widest transition-all ${tab === 'global' ? 'bg-gradient-to-r from-[#74ACDF] to-blue-600 text-white shadow-md shadow-[#74ACDF]/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>MIS PARTIDAS</button>
          <button onClick={() => setTab('online')} className={`px-5 py-3 rounded-xl text-xs font-black tracking-widest transition-all ${tab === 'online' ? 'bg-gradient-to-r from-[#74ACDF] to-blue-600 text-white shadow-md shadow-[#74ACDF]/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>GLOBAL ONLINE</button>
        </div>

        {loadingOnline ? (
          <p className="text-center text-sm text-slate-400 py-10">Cargando ranking global...</p>
        ) : ranked.length === 0 ? (
          <div className="text-center py-14">
            <p className="text-slate-300 font-bold">{tab === 'online' ? 'Todavía no hay ranking global.' : 'Jugá tu primera temporada para entrar al ranking.'}</p>
            <Link href="/draft?mode=liga" className="btn-primary inline-block mt-5 px-7 py-3 text-xs">JUGAR AHORA</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {ranked.map((s, i) => <LeaderboardRow key={s.id} rank={i} s={s} />)}
          </div>
        )}

        <div className="text-center mt-8 text-xs text-slate-500">
          <p>{tab === 'online' ? 'Ranking global (requiere iniciar sesión para sumar ELO)' : `${ranked.length} partidas registradas en este dispositivo`}</p>
        </div>
      </main>
      <div className="text-center pb-8"><Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm py-2.5 px-4 inline-block">← Volver al inicio</Link></div>
    </div>
  )
}
