"use client"
import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import playersData from '@/data/players.json'
import clubsData from '@/data/clubs.json'
import { Player, Club } from '@/lib/types'

interface Score { id: string; club: string; clubName: string; rating: number; players: number; pts: number; pos: number; date: string }

const MOCK_SCORES: Score[] = [
  { id: '1', club: 'river-plate', clubName: 'River Plate', rating: 82, players: 11, pts: 85, pos: 1, date: '2026-06-01' },
  { id: '2', club: 'boca-juniors', clubName: 'Boca Juniors', rating: 79, players: 11, pts: 80, pos: 2, date: '2026-06-02' },
  { id: '3', club: 'independiente', clubName: 'Independiente', rating: 76, players: 10, pts: 74, pos: 3, date: '2026-06-03' },
  { id: '4', club: 'racing', clubName: 'Racing Club', rating: 74, players: 11, pts: 72, pos: 5, date: '2026-06-04' },
  { id: '5', club: 'san-lorenzo', clubName: 'San Lorenzo', rating: 71, players: 9, pts: 65, pos: 7, date: '2026-06-04' },
  { id: '6', club: 'velez', clubName: 'Vélez Sarsfield', rating: 68, players: 11, pts: 60, pos: 10, date: '2026-06-05' },
  { id: '7', club: 'newells', clubName: "Newell's Old Boys", rating: 65, players: 8, pts: 52, pos: 14, date: '2026-06-05' },
  { id: '8', club: 'estudiantes-lp', clubName: 'Estudiantes', rating: 62, players: 11, pts: 48, pos: 16, date: '2026-06-05' },
]

function LeaderboardRow({ rank, clubName, rating, players, pts, pos, isTopThree }: {
  rank: number
  clubName: string
  rating: number
  players: number
  pts: number
  pos: number
  isTopThree: boolean
}) {
  const medal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}°`
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.05 }}
      className={`card-gradient rounded-xl p-4 flex items-center gap-4 ${isTopThree ? 'border border-yellow-500/20' : ''}`}
    >
      <div className="text-2xl w-10 text-center font-display">{medal(rank)}</div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm truncate">{clubName}</div>
        <div className="text-xs text-slate-400">Rating: {rating} • {players}/11</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xl font-black text-green-400">{pts}</div>
        <div className="text-[10px] text-slate-500">{pos}° pos</div>
      </div>
    </motion.div>
  )
}

export default function LeaderboardPage() {
  const [scores, setScores] = useState<Score[]>([])
  const [tab, setTab] = useState<'global'|'club'>('global')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ligastats_scores')
      const saved: Score[] = raw ? JSON.parse(raw) : []
      if (!Array.isArray(saved)) throw new Error('invalid format')
      if (saved.length > 0) {
        setScores([...saved].sort((a, b) => b.pts - a.pts))
      } else {
        setScores([...MOCK_SCORES].sort((a, b) => b.pts - a.pts))
      }
    } catch {
      setScores([...MOCK_SCORES].sort((a, b) => b.pts - a.pts))
    }
  }, [])

  const clubStats = useMemo(() => {
    return scores.reduce((acc: Record<string, { club: string; count: number; avgRating: number; bestPts: number }>, s) => {
      if (!acc[s.club]) acc[s.club] = { club: s.clubName, count: 0, avgRating: 0, bestPts: 0 }
      acc[s.club].count++
      acc[s.club].avgRating += s.rating
      acc[s.club].bestPts = Math.max(acc[s.club].bestPts, s.pts)
      return acc
    }, {})
  }, [scores])

  const clubList = useMemo(() => {
    return Object.entries(clubStats)
      .map(([k, v]) => ({ id: k, ...v, avgRating: Math.round(v.avgRating / v.count) }))
      .sort((a, b) => b.bestPts - a.bestPts)
  }, [clubStats])

  return (
    <div className="min-h-screen gradient-bg">
      <header className="pt-12 pb-6 px-4 text-center">
        <motion.div initial={{opacity:0,y:-30}} animate={{opacity:1,y:0}} transition={{duration:0.6}}>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight font-display uppercase"><span className="gradient-text">🏆 TABLA DE LÍDERES</span></h1>
          <p className="mt-3 text-sm text-slate-400">Los mejores once ideales de Draft Tres Estrellas</p>
        </motion.div>
      </header>
      <main className="max-w-3xl mx-auto px-4 pb-20">
        <div className="flex gap-2.5 mb-8 justify-center">
          <button onClick={()=>setTab('global')} className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all ${tab==='global'?'bg-gradient-to-r from-[#74ACDF] to-blue-600 text-white shadow-md shadow-[#74ACDF]/20':'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>🌍 GLOBAL</button>
          <button onClick={()=>setTab('club')} className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-widest transition-all ${tab==='club'?'bg-gradient-to-r from-[#74ACDF] to-blue-600 text-white shadow-md shadow-[#74ACDF]/20':'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>⚽ POR CLUB</button>
        </div>

        {tab==='global'?(
          <div className="space-y-2">
            {scores.map((s,i)=>(
              <LeaderboardRow
                key={s.id}
                rank={i}
                clubName={s.clubName}
                rating={s.rating}
                players={s.players}
                pts={s.pts}
                pos={s.pos}
                isTopThree={i < 3}
              />
            ))}
          </div>
        ):(
          <div className="space-y-2">
            {clubList.map((c,i)=>(
              <motion.div key={c.id} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.05}}
                className="card-gradient rounded-xl p-4 flex items-center gap-4">
                <div className="text-2xl w-10 text-center font-display">{i+1}°</div>
                <div className="flex-1"><div className="font-bold text-sm">{c.club}</div><div className="text-xs text-slate-400">{c.count} drafts</div></div>
                <div className="text-right"><div className="text-lg font-black text-blue-400">{c.avgRating}</div><div className="text-[10px] text-slate-500">avg rating</div></div>
                <div className="text-right"><div className="text-lg font-black text-green-400">{c.bestPts}</div><div className="text-[10px] text-slate-500">best pts</div></div>
              </motion.div>
            ))}
          </div>
        )}
        <div className="text-center mt-8 text-sm text-slate-500">
          <p>{scores.length} drafts registrados</p>
          <p className="mt-1">Los scores se guardan localmente cuando simulás una temporada</p>
        </div>
      </main>
      <div className="text-center pb-8"><Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">← Volver al inicio</Link></div>
    </div>
  )
}
