"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { loadLifetimeStats, type LifetimeStats } from '@/lib/storage'

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-slate-900/40 px-4 py-3 text-center">
      <p className="font-display text-2xl font-black text-yellow-400">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-slate-400">{label}</p>
    </div>
  )
}

export default function LifetimeStatsPanel() {
  const [stats, setStats] = useState<LifetimeStats | null>(null)

  useEffect(() => {
    setStats(loadLifetimeStats())
  }, [])

  if (!stats || stats.simsPlayed === 0) return null

  const topPlayers = Object.values(stats.playerTotals)
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists)
    .slice(0, 5)

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mt-10 max-w-5xl"
    >
      <article className="card-gradient rounded-2xl p-5">
        <h2 className="font-display text-xl font-black text-white">🏅 Tus récords</h2>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatBox label="Drafts jugados" value={stats.draftsCompleted} />
          <StatBox label="Torneos" value={stats.simsPlayed} />
          <StatBox label="Títulos" value={stats.titles} />
          <StatBox label="Mejor score" value={stats.bestTeamScore || '—'} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {stats.biggestWin && (
            <div className="rounded-xl bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-400">Mayor goleada</p>
              <p className="mt-1 font-bold text-white">
                {stats.biggestWin.score} vs {stats.biggestWin.rival}
                <span className="ml-2 text-xs text-slate-500">({stats.biggestWin.type} · {stats.biggestWin.date})</span>
              </p>
            </div>
          )}
          {stats.bestPlayer && (
            <div className="rounded-xl bg-slate-900/40 px-4 py-3">
              <p className="text-xs uppercase tracking-wider text-slate-400">Mejor jugador de tu historia</p>
              <p className="mt-1 font-bold text-white">
                {stats.bestPlayer.playerName}
                <span className="ml-2 font-display font-black text-yellow-400">{stats.bestPlayer.rating}</span>
              </p>
            </div>
          )}
        </div>

        {topPlayers.length > 0 && (
          <div className="mt-4">
            <p className="text-xs uppercase tracking-wider text-slate-400">Goleadores históricos de tus drafts</p>
            <div className="mt-2 space-y-2">
              {topPlayers.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between rounded-xl bg-slate-900/40 px-4 py-2">
                  <p className="font-bold text-white">{i + 1}. {p.name} <span className="text-xs text-slate-500">({p.sims} torneos)</span></p>
                  <span className="font-display font-black text-emerald-400">{p.goals}⚽ {p.assists}🅰️</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </motion.section>
  )
}
