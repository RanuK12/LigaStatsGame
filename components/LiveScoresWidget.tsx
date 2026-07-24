"use client"

import { useState } from "react"
import { motion } from "framer-motion"

interface AgendaMatch {
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

interface LeagueGroup {
  id: string
  name: string
  category: string
  logo?: string
  icon?: string
  matches: AgendaMatch[]
}

const AGENDA_DATES = [
  { label: "HOY", dateStr: "2026-07-24", isToday: true },
  { label: "JUE 16/7", dateStr: "2026-07-16" },
  { label: "VIE 17/7", dateStr: "2026-07-17" },
  { label: "SÁB 18/7", dateStr: "2026-07-18" },
  { label: "DOM 19/7", dateStr: "2026-07-19" },
  { label: "LUN 20/7", dateStr: "2026-07-20" },
  { label: "MAR 21/7", dateStr: "2026-07-21" },
  { label: "MIÉ 22/7", dateStr: "2026-07-22" },
  { label: "JUE 23/7", dateStr: "2026-07-23" },
  { label: "VIE 24/7", dateStr: "2026-07-24", active: true },
  { label: "SÁB 25/7", dateStr: "2026-07-25" },
  { label: "DOM 26/7", dateStr: "2026-07-26" },
  { label: "LUN 27/7", dateStr: "2026-07-27" },
  { label: "MAR 28/7", dateStr: "2026-07-28" },
  { label: "MIÉ 29/7", dateStr: "2026-07-29" },
  { label: "JUE 30/7", dateStr: "2026-07-30" },
]

const LEAGUE_GROUPS: LeagueGroup[] = [
  {
    id: "lpf",
    name: "LIGA PROFESIONAL",
    category: "FÚTBOL ARGENTINO",
    logo: "/logos/lpf.png",
    matches: [
      { id: "l1", homeTeam: "Belgrano", awayTeam: "Rosario Central", homeLogo: "/logos/clubs/belgrano.png", awayLogo: "/logos/clubs/rosario-central.png", homeScore: 2, awayScore: 1, status: "FINAL", league: "lpf" },
      { id: "l2", homeTeam: "Sarmiento (J)", awayTeam: "Argentinos Jrs.", homeLogo: "/logos/clubs/sarmiento-j.png", awayLogo: "/logos/clubs/argentinos-jrs.png", homeScore: 2, awayScore: 3, status: "FINAL", league: "lpf" },
      { id: "l3", homeTeam: "Defensa y Justicia", awayTeam: "Aldosivi", homeLogo: "/logos/clubs/defensa-y-justicia.png", awayLogo: "/logos/clubs/aldosivi.png", homeScore: 1, awayScore: 1, status: "FINAL", league: "lpf" },
      { id: "l4", homeTeam: "Gimnasia (LP)", awayTeam: "Central Córdoba (SdE)", homeLogo: "/logos/clubs/gimnasia-lp.png", awayLogo: "/logos/clubs/central-cordoba.png", status: "UPCOMING", time: "21:45", league: "lpf" },
    ],
  },
  {
    id: "sudamericana",
    name: "COPA SUDAMERICANA",
    category: "FÚTBOL CONMEBOL",
    icon: "🏆",
    matches: [
      { id: "s1", homeTeam: "Bolívar", awayTeam: "Grêmio", homeScore: 3, awayScore: 2, status: "FINAL", league: "sudamericana" },
      { id: "s2", homeTeam: "Boca Juniors", awayTeam: "O'Higgins", homeLogo: "/logos/clubs/boca-juniors.png", homeScore: 1, awayScore: 0, status: "FINAL", league: "sudamericana" },
      { id: "s3", homeTeam: "Santa Fe", awayTeam: "Caracas", homeScore: 2, awayScore: 0, status: "FINAL", league: "sudamericana" },
    ],
  },
  {
    id: "brasileirao",
    name: "BRASILEIRAO",
    category: "FÚTBOL BRASIL",
    icon: "🇧🇷",
    matches: [
      { id: "b1", homeTeam: "Botafogo", awayTeam: "Vitoria", homeScore: 0, awayScore: 0, status: "FINAL", league: "brasileirao" },
      { id: "b2", homeTeam: "Corinthians", awayTeam: "Remo", homeScore: 3, awayScore: 0, status: "FINAL", league: "brasileirao" },
    ],
  },
]

export default function LiveScoresWidget() {
  const [selectedDate, setSelectedDate] = useState("2026-07-24")

  return (
    <div className="w-full my-10 font-sans">
      {/* TITLE & HEADER */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📅</span>
        <h3 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
          AGENDA DE RESULTADOS
        </h3>
      </div>

      {/* HORIZONTAL DATE PICKER BAR */}
      <div className="card-gradient rounded-2xl p-2.5 border border-white/10 mb-6 overflow-x-auto scrollbar-none flex items-center gap-1.5 shadow-lg">
        {AGENDA_DATES.map((d) => {
          const isSelected = selectedDate === d.dateStr
          return (
            <button
              key={d.dateStr}
              onClick={() => setSelectedDate(d.dateStr)}
              className={`px-4 py-2 rounded-xl text-[10px] sm:text-[11px] font-bold font-sport uppercase tracking-wider whitespace-nowrap transition-all ${
                isSelected
                  ? "bg-slate-900 text-white border border-[#74ACDF]/50 shadow-[0_0_12px_rgba(116,172,223,0.25)] font-black"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {d.label}
            </button>
          )
        })}
      </div>

      {/* MATCH CARDS GROUPED BY LEAGUE (COPERO AGENDA STYLE) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {LEAGUE_GROUPS.map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-gradient rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg flex flex-col justify-between"
          >
            {/* LEAGUE HEADER */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                {group.logo ? (
                  <img src={group.logo} alt="" className="w-6 h-6 object-contain" />
                ) : (
                  <span className="text-xl">{group.icon || "⚽"}</span>
                )}
                <div>
                  <h4 className="font-sport font-black text-xs text-white uppercase tracking-wider">
                    {group.name}
                  </h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sport">
                    {group.category}
                  </span>
                </div>
              </div>
              <span className="text-slate-500 text-xs font-bold">⌄</span>
            </div>

            {/* MATCHES LIST */}
            <div className="space-y-3.5 flex-1">
              {group.matches.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-1 text-xs">
                  {/* TEAMS */}
                  <div className="space-y-1.5 flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      {m.homeLogo && (
                        <img src={m.homeLogo} alt="" className="w-4 h-4 object-contain shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
                      )}
                      <span className="font-bold text-slate-200 truncate">{m.homeTeam}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {m.awayLogo && (
                        <img src={m.awayLogo} alt="" className="w-4 h-4 object-contain shrink-0" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
                      )}
                      <span className="font-bold text-slate-200 truncate">{m.awayTeam}</span>
                    </div>
                  </div>

                  {/* SCORES AND STATUS */}
                  <div className="flex items-center gap-3 shrink-0 text-right font-sport">
                    {m.status !== "UPCOMING" ? (
                      <div className="space-y-1 font-display font-black text-sm text-white">
                        <div>{m.homeScore}</div>
                        <div>{m.awayScore}</div>
                      </div>
                    ) : (
                      <div className="text-xs font-black text-[#74ACDF]">{m.time}</div>
                    )}

                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider min-w-[40px] text-right">
                      {m.status === "FINAL" && "FINAL"}
                      {m.status === "LIVE" && <span className="text-red-400 animate-pulse">LIVE</span>}
                      {m.status === "UPCOMING" && "PRÓX"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
