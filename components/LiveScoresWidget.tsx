"use client"

import { useState } from "react"
import { motion } from "framer-motion"

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeLogo?: string
  awayLogo?: string
  homeScore?: number
  awayScore?: number
  status: "FINAL" | "LIVE" | "UPCOMING"
  minute?: string
  time?: string
  league: string
}

const MOCK_MATCHES: Match[] = [
  {
    id: "1",
    homeTeam: "River Plate",
    awayTeam: "Boca Juniors",
    homeLogo: "/LigaStatsGame/logos/river-plate.png",
    awayLogo: "/LigaStatsGame/logos/boca-juniors.png",
    homeScore: 2,
    awayScore: 1,
    status: "FINAL",
    league: "lpf",
  },
  {
    id: "2",
    homeTeam: "Racing Club",
    awayTeam: "Independiente",
    homeLogo: "/LigaStatsGame/logos/racing.png",
    awayLogo: "/LigaStatsGame/logos/independiente.png",
    homeScore: 1,
    awayScore: 1,
    status: "LIVE",
    minute: "78'",
    league: "lpf",
  },
  {
    id: "3",
    homeTeam: "San Lorenzo",
    awayTeam: "Vélez Sarsfield",
    homeLogo: "/LigaStatsGame/logos/san-lorenzo.png",
    awayLogo: "/LigaStatsGame/logos/velez.png",
    status: "UPCOMING",
    time: "21:30",
    league: "lpf",
  },
  {
    id: "4",
    homeTeam: "Flamengo",
    awayTeam: "Palmeiras",
    homeScore: 3,
    awayScore: 2,
    status: "FINAL",
    league: "libertadores",
  },
  {
    id: "5",
    homeTeam: "Real Madrid",
    awayTeam: "FC Barcelona",
    homeScore: 2,
    awayScore: 2,
    status: "LIVE",
    minute: "85'",
    league: "europe",
  },
  {
    id: "6",
    homeTeam: "Manchester City",
    awayTeam: "Liverpool",
    status: "UPCOMING",
    time: "16:45",
    league: "europe",
  },
]

export default function LiveScoresWidget() {
  const [activeTab, setActiveTab] = useState<"lpf" | "libertadores" | "europe">("lpf")

  const filtered = MOCK_MATCHES.filter((m) => m.league === activeTab)

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

        {/* League Selector Tabs */}
        <div className="flex gap-2 font-sport overflow-x-auto max-w-full pb-1">
          <button
            onClick={() => setActiveTab("lpf")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === "lpf" ? "tab-active" : "tab-inactive"
            }`}
          >
            🇦🇷 LPF Argentina
          </button>
          <button
            onClick={() => setActiveTab("libertadores")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === "libertadores" ? "tab-active" : "tab-inactive"
            }`}
          >
            🏆 Libertadores
          </button>
          <button
            onClick={() => setActiveTab("europe")}
            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all ${
              activeTab === "europe" ? "tab-active" : "tab-inactive"
            }`}
          >
            🇪🇺 Ligas Top
          </button>
        </div>
      </div>

      {/* Matches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filtered.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-glass rounded-2xl p-4 border border-white/5 flex flex-col justify-between"
          >
            <div className="flex justify-between items-center text-[10px] font-bold font-sport mb-3">
              <span className="text-slate-400 uppercase tracking-wider">HOY</span>
              {m.status === "FINAL" && <span className="text-slate-500">FINALIZADO</span>}
              {m.status === "LIVE" && <span className="text-red-400 animate-pulse">● EN VIVO {m.minute}</span>}
              {m.status === "UPCOMING" && <span className="text-[#74ACDF]">{m.time} HS</span>}
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-white truncate max-w-[150px]">{m.homeTeam}</span>
                <span className="font-display font-black text-lg text-white">
                  {m.homeScore !== undefined ? m.homeScore : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-white truncate max-w-[150px]">{m.awayTeam}</span>
                <span className="font-display font-black text-lg text-white">
                  {m.awayScore !== undefined ? m.awayScore : "-"}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
