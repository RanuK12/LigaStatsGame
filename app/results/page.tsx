"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface ResPlayer { name?: string; rating?: number; position?: string; club?: string }
interface ResTeam { label?: string; score?: number; formation?: string; players?: ResPlayer[] }

export default function ResultsPage() {
  const [team, setTeam] = useState<ResTeam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      // Datos via querystring (?team=) o localStorage (el draft guarda 'ligastats_result')
      const sp = new URLSearchParams(window.location.search)
      const raw = sp.get('team') || (typeof window !== 'undefined' ? window.localStorage.getItem('ligastats_result') : null)
      if (!raw) throw new Error("No hay datos del equipo")
      setTeam(JSON.parse(raw))
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error cargando resultados")
      setLoading(false)
    }
  }, [])

  const wrap = (inner: React.ReactNode) => (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center w-full max-w-2xl">
        {inner}
      </motion.div>
    </div>
  )

  if (loading) return wrap(
    <>
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
      <p className="mt-4 text-slate-400">Cargando resultados...</p>
    </>
  )

  if (error || !team) return wrap(
    <>
      <h2 className="text-3xl font-bold text-yellow-500">🤔 Sin datos</h2>
      <p className="mt-2 text-slate-400">{error || "No encontramos tu equipo. Armá tu 11 primero."}</p>
      <Link href="/draft" className="mt-6 inline-block px-6 py-3 bg-cyan-600 rounded-xl hover:bg-cyan-500 transition-colors font-bold">
        Armar mi 11
      </Link>
    </>
  )

  const players = (team.players || []).filter(Boolean)
  const score = team.score ?? (players.length ? Math.round(players.reduce((s, p) => s + (p.rating || 50), 0) / players.length) : 0)
  const best = [...players].sort((a, b) => (b.rating || 0) - (a.rating || 0))[0]
  const shareText = `⚽ Mi 11 ${team.label ? 'de ' + team.label : ''} | ${team.formation || ''} | Score: ${score}/99 — Liga Argentina Fans`
  const shareUrl = "https://ranuk12.github.io/LigaStatsGame/"

  const share = () => {
    if (navigator.share) navigator.share({ title: "Liga Argentina Fans", text: shareText, url: shareUrl }).catch(() => {})
    else window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, "_blank")
  }

  return (
    <div className="min-h-screen gradient-bg py-10 px-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm uppercase tracking-widest">Tu resultado</p>
          <h1 className="text-6xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">{score}<span className="text-2xl text-slate-500">/99</span></h1>
          {team.label && <p className="mt-1 text-lg text-slate-300">{team.label} · {team.formation}</p>}
          {best?.name && <p className="mt-2 text-sm text-amber-400">⭐ Figura: {best.name} ({best.rating})</p>}
        </div>

        <div className="grid grid-cols-1 gap-2 mb-8">
          {players.map((p, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-lg px-4 py-2">
              <span className="text-slate-200">{p.position && <b className="text-cyan-400 mr-2 text-xs">{p.position}</b>}{p.name || '—'}{p.club && <span className="text-slate-500 text-xs ml-2">{p.club}</span>}</span>
              <span className="font-bold text-emerald-400">{p.rating ?? '—'}</span>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={share} className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-xl font-bold hover:scale-[1.03] transition-transform">
            📲 Compartir
          </button>
          <Link href="/draft" className="px-6 py-3 bg-slate-700 rounded-xl font-bold hover:bg-slate-600 transition-colors">
            🔄 Jugar de nuevo
          </Link>
          <Link href="/" className="px-6 py-3 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors">
            🏠 Inicio
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
