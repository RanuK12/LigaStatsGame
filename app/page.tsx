"use client"
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import clubsData from '@/data/clubs.json'
import squadsData from '@/data/squads.json'
import { Club, Squad } from '@/lib/types'
const MODES = [
  { id:'clasico', name:'Clásico', desc:'Ratings visibles, armá el 11 ideal', icon:'⚽', href:'/draft?mode=clasico', color:'from-blue-600 to-cyan-500' },
  { id:'almanaque', name:'El Almanaque', desc:'Ratings ocultos, gana la memoria', icon:'🧠', href:'/draft?mode=almanaque', color:'from-amber-600 to-orange-500' },
  { id:'liga', name:'Liga', desc:'Tu 11 juega 38 fechas', icon:'🏆', href:'/draft?mode=liga', color:'from-green-600 to-emerald-500' },
  { id:'reto-dia', name:'Reto del Día', desc:'Combinación fija, compartí tu score', icon:'🎯', href:'/draft?mode=reto-dia', color:'from-rose-600 to-pink-500' },
  { id:'ruleta', name:'Ruleta', desc:'Girá y descubrí una leyenda', icon:'🎰', href:'/ruleta', color:'from-purple-600 to-violet-500' },
]
export default function HomePage() {
  const clubs = clubsData as Club[]
  const squads = squadsData as Squad[]
  const sByClub = new Map<string, number>()
  squads.forEach(s => sByClub.set(s.clubId, (sByClub.get(s.clubId) || 0) + 1))
  return (
    <div className="gradient-bg">
      <header className="pt-16 pb-10 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />
          <div className="absolute top-10 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
        </div>
        <motion.div initial={{opacity:0,y:-30}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="relative">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight font-display"><span className="gradient-text">LigaStatsGame</span></h1>
          <p className="mt-4 text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">Armá tu 11 de la historia. Elegí un plantel por año, elegí jugadores reales, simulá la temporada.</p>
          <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span><strong className="text-slate-300">{squads.length}</strong> plantels</span></div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /><span><strong className="text-slate-300">{clubs.length}</strong> clubes + selección</span></div>
          </div>
        </motion.div>
      </header>
      <main className="max-w-5xl mx-auto px-4 pb-20 space-y-12">
        <motion.section initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}>
          <h2 className="text-xl font-bold mb-5 font-display">🎮 Modos de Juego</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {MODES.map(mode => (
              <Link key={mode.id} href={mode.href}>
                <motion.div whileHover={{scale:1.02,y:-3}} whileTap={{scale:0.98}} className="card-gradient rounded-xl p-5 cursor-pointer transition-all duration-200 card-hover h-full">
                  <div className="text-3xl mb-2">{mode.icon}</div>
                  <h3 className="font-bold text-base font-display">{mode.name}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{mode.desc}</p>
                  <div className={`mt-3 h-1 w-10 rounded-full bg-gradient-to-r ${mode.color}`} />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.section>
        <motion.section initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
          <h2 className="text-xl font-bold mb-5 font-display">⚽ Clubes y Selecciones</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {clubs.map(club => (
              <Link key={club.id} href={`/draft?mode=clasico&club=${club.id}`}>
                <motion.div whileHover={{scale:1.03,y:-2}} whileTap={{scale:0.97}} className="card-gradient rounded-xl p-4 cursor-pointer card-hover">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-md"
                      style={{background:club.colors?.[0]||'#334155',color:club.colors?.[1]||'#fff'}}>
                      {club.shortName?.slice(0,2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate">{club.name}</div>
                      <div className="text-xs text-slate-400">{sByClub.get(club.id)||0} plantels</div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.section>
      </main>
      <footer className="text-center py-8 text-xs text-slate-600 border-t border-slate-800/50">
        LigaStatsGame © 2026 — Hecho con ⚽ por Ranuk · {squads.length} plantels · {clubs.length} clubes
      </footer>
    </div>
  )
}
