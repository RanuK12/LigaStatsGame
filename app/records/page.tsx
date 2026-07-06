"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import playersData from '@/data/players.json'
import { normalizePlayers } from '@/lib/data-normalizers'

const players = normalizePlayers(playersData)

const topRated = [...players]
  .filter((player) => typeof player.rating === 'number')
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 10)

const topScorers = [...players]
  .filter((player) => typeof player.goalsClub === 'number')
  .sort((a, b) => b.goalsClub - a.goalsClub)
  .slice(0, 10)

export default function RecordsPage() {
  return (
    <div className="min-h-[calc(100vh-6rem)] py-10">
      <section className="mx-auto max-w-4xl text-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-bold uppercase tracking-[0.3em] text-[#75AADB]"
        >
          Archivo histórico
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 font-display text-4xl font-black text-white md:text-6xl"
        >
          Records del fútbol argentino
        </motion.h1>

        <p className="mx-auto mt-4 max-w-2xl text-slate-400">
          Rankings iniciales basados en la base actual. Esta sección va a crecer
          con goleadores, ídolos por club, campeones y planteles históricos.
        </p>
      </section>

      <section className="mx-auto mt-10 grid max-w-5xl gap-5 lg:grid-cols-2">
        <article className="card-gradient rounded-2xl p-5">
          <h2 className="font-display text-xl font-black text-white">⭐ Mejores ratings</h2>

          <div className="mt-4 space-y-2">
            {topRated.length > 0 ? topRated.map((player, index) => (
              <div
                key={`${player.id}-${index}`}
                className="flex items-center justify-between rounded-xl bg-slate-900/40 px-4 py-3"
              >
                <div>
                  <p className="font-bold text-white">{index + 1}. {player.name}</p>
                  <p className="text-xs text-slate-500">
                    {player.position || 'POS'} · {player.decade || 'Década N/D'}
                  </p>
                </div>
                <span className="font-display text-xl font-black text-yellow-400">{player.rating}</span>
              </div>
            )) : (
              <p className="text-sm text-slate-400">Todavía no hay datos suficientes.</p>
            )}
          </div>
        </article>

        <article className="card-gradient rounded-2xl p-5">
          <h2 className="font-display text-xl font-black text-white">⚽ Goleadores</h2>

          <div className="mt-4 space-y-2">
            {topScorers.length > 0 ? topScorers.map((player, index) => (
              <div
                key={`${player.id}-${index}`}
                className="flex items-center justify-between rounded-xl bg-slate-900/40 px-4 py-3"
              >
                <div>
                  <p className="font-bold text-white">{index + 1}. {player.name}</p>
                  <p className="text-xs text-slate-500">
                    {player.position || 'POS'} · {player.decade || 'Década N/D'}
                  </p>
                </div>
                <span className="font-display text-xl font-black text-emerald-400">{player.goalsClub}</span>
              </div>
            )) : (
              <p className="text-sm text-slate-400">Todavía no hay datos suficientes.</p>
            )}
          </div>
        </article>
      </section>

      <div className="mt-10 text-center">
        <Link href="/draft?mode=clasico" className="btn-primary">
          Armar mi once ⚽
        </Link>
      </div>
    </div>
  )
}