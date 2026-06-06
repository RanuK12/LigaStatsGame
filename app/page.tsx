"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import clubsData from '@/data/clubs.json'
import playersData from '@/data/players.json'
import { Club, GameMode } from '@/lib/types'

const MODES: { id: GameMode; name: string; desc: string; icon: string; href: string; color: string }[] = [
  { id: 'legend-draft', name: 'Leyendas Draft', desc: 'Armá tu 11 ideal con jugadores históricos', icon: '⚽', href: '/draft', color: 'from-blue-600 to-cyan-500' },
  { id: 'memory', name: 'Ruleta del Fútbol', desc: 'Girá la ruleta y descubrí una leyenda', icon: '🎰', href: '/ruleta', color: 'from-rose-600 to-orange-500' },
  { id: 'records', name: 'Leaderboard', desc: 'Compará tu puntaje con otros jugadores', icon: '🏆', href: '/leaderboard', color: 'from-yellow-600 to-amber-500' },
]

function ClubCard({ club, selected, onClick }: { club: Club; selected: boolean; onClick: () => void }) {
  const count = playersData.filter((p: any) => p.clubs?.some((c: any) => c.id === club.id)).length
  return (
    <motion.button onClick={onClick} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
      className={`relative overflow-hidden rounded-xl p-4 text-left transition-all duration-200 ${selected ? 'ring-2 ring-blue-500 bg-blue-500/15' : 'card-gradient card-hover'}`}>
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-md"
          style={{ background: club.colors?.[0] || '#334155', color: club.colors?.[1] || '#fff' }}>
          {club.shortName?.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{club.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">{count} leyendas</div>
        </div>
      </div>
      {selected && <motion.div layoutId="club-check" className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><span className="text-white text-xs">✓</span></motion.div>}
    </motion.button>
  )
}

export default function HomePage() {
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const clubs = clubsData as Club[]

  return (
    <div className="gradient-bg">
      <header className="pt-16 pb-10 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>
        <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="relative">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight font-display">
            <span className="gradient-text">LigaStatsGame</span>
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            El draft del fútbol argentino. Arma tu 11 de leyendas y convertite en campeón.
          </p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span><strong className="text-slate-300">{clubs.length}</strong> clubes</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /><span><strong className="text-slate-300">{playersData.length}</strong> jugadores</span></div>
          </div>
        </motion.div>
      </header>

      <main className="max-w-5xl mx-auto px-4 pb-20 space-y-12">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-bold mb-5 font-display flex items-center gap-2">🎮 Modo de juego</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {MODES.map(mode => (
              <motion.div key={mode.id} whileHover={{ scale: 1.02, y: -3 }} whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMode(mode.href)}
                className={`card-gradient rounded-xl p-6 cursor-pointer transition-all duration-200 ${selectedMode === mode.href ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}`}>
                <div className="text-4xl mb-3">{mode.icon}</div>
                <h3 className="font-bold text-lg font-display">{mode.name}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{mode.desc}</p>
                <div className={`mt-4 h-1 w-12 rounded-full bg-gradient-to-r ${mode.color}`} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="text-xl font-bold mb-5 font-display flex items-center gap-2">⚽ Elegí tu club</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {clubs.map(club => <ClubCard key={club.id} club={club} selected={selectedClub?.id === club.id} onClick={() => setSelectedClub(club)} />)}
          </div>
        </motion.section>

        <AnimatePresence>
          {selectedClub && selectedMode && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-center pt-4">
              <Link href={`${selectedMode}?club=${selectedClub.id}`}>
                <button className="btn-primary text-xl px-12 py-4">🚀 ¡Empezar a jugar!</button>
              </Link>
              <p className="mt-4 text-sm text-slate-500">{selectedClub.name} • {selectedMode === '/draft' ? 'Leyendas Draft' : selectedMode === '/ruleta' ? 'Ruleta' : 'Leaderboard'}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="text-center py-8 text-xs text-slate-600 border-t border-slate-800/50">
        LigaStatsGame © 2026 — Hecho con ⚽ por Ranuk
      </footer>
    </div>
  )
}
