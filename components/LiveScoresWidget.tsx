"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { fetchLiveScores, type Match, type LeagueTab } from "@/lib/live-scores"
import { BASE_PATH } from "@/lib/data-loader"

// Last-resort fallback so the widget is never empty (API down + no cache file).
const SEED_MATCHES: Match[] = [
  { id: "s1", homeTeam: "River Plate", awayTeam: "Boca Juniors", homeScore: 2, awayScore: 1, status: "FINAL", league: "lpf" },
  { id: "s2", homeTeam: "Racing Club", awayTeam: "Independiente", homeScore: 1, awayScore: 1, status: "FINAL", league: "lpf" },
  { id: "s3", homeTeam: "Flamengo", awayTeam: "Palmeiras", homeScore: 2, awayScore: 0, status: "FINAL", league: "libertadores" },
  { id: "s4", homeTeam: "Real Madrid", awayTeam: "FC Barcelona", homeScore: 2, awayScore: 2, status: "FINAL", league: "europe" },
]

const TABS: { key: LeagueTab; label: string }[] = [
  { key: "lpf", label: "🇦🇷 LPF Argentina" },
  { key: "libertadores", label: "🏆 Libertadores" },
  { key: "europe", label: "🇪🇺 Ligas Top" },
]

export default function LiveScoresWidget() {
  const [activeTab, setActiveTab] = useState<LeagueTab>("lpf")
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    ;(async () => {
      // 1) live API
      // 1) cached JSON (real data from Copero, refreshed server-side by
      //    scripts/data/fetch-live-scores.mjs on each deploy + cron)
      let data: Match[] = []
      try {
        const res = await fetch(`${BASE_PATH}/data/live-scores.json`, { cache: "no-store" })
        if (res.ok) data = (await res.json()) as Match[]
      } catch {
        /* ignore */
      }
      // 2) optional live top-up via TheSportsDB (only meaningful with a key set)
      if (data.length === 0) data = await fetchLiveScores()
      // 3) seed
      if (data.length === 0) data = SEED_MATCHES
      if (alive) {
        setMatches(data)
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  const filtered = matches.filter((m) => m.league === activeTab)

  return (
    <div className="card-gradient rounded-3xl p-6 sm:p-8 border border-[#74ACDF]/20 shadow-[0_0_40px_rgba(0,0,0,0.4)] my-12 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <span className="text-[10px] font-bold text-[#74ACDF] tracking-widest uppercase font-sport block mb-1">
            ⚽ FÚTBOL EN VIVO
          </span>
          <h3 className="font-display text-2xl font-black text-white uppercase tracking-tight">
            RESULTADOS Y FIXTURE AL DÍA
          </h3>
        </div>

        <div className="flex gap-2 font-sport overflow-x-auto max-w-full pb-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
                activeTab === t.key ? "tab-active" : "tab-inactive"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-glass rounded-2xl p-4 border border-white/5 h-[120px] animate-pulse bg-slate-900/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-xs text-slate-500 font-sport uppercase tracking-wider py-8">
          Sin partidos para mostrar hoy en esta competición.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-glass rounded-2xl p-4 border border-white/5 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center text-[10px] font-bold font-sport mb-3">
                <span className="text-slate-400 uppercase tracking-wider truncate max-w-[120px]">{m.competition || "HOY"}</span>
                {m.status === "FINAL" && <span className="text-slate-500">FINALIZADO</span>}
                {m.status === "LIVE" && <span className="text-red-400 animate-pulse">● EN VIVO {m.minute}</span>}
                {m.status === "UPCOMING" && <span className="text-[#74ACDF]">{m.time ? `${m.time} HS` : "POR JUGARSE"}</span>}
              </div>

              <div className="space-y-2.5">
                <TeamRow name={m.homeTeam} logo={m.homeLogo} score={m.homeScore} />
                <TeamRow name={m.awayTeam} logo={m.awayLogo} score={m.awayScore} />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function TeamRow({ name, logo, score }: { name: string; logo?: string; score?: number }) {
  return (
    <div className="flex justify-between items-center gap-2">
      <div className="flex items-center gap-2 min-w-0">
        {logo && (
          <img src={logo} alt="" className="w-5 h-5 object-contain shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
        )}
        <span className="font-bold text-sm text-white truncate max-w-[150px]">{name}</span>
      </div>
      <span className="font-display font-black text-lg text-white shrink-0">{score !== undefined ? score : "-"}</span>
    </div>
  )
}
