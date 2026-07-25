"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { fetchScoresForDate, type Match, type LeagueTab } from "@/lib/live-scores"

// Metadata de cada liga para el encabezado de su grupo.
const LEAGUE_META: Record<LeagueTab, { name: string; category: string; logo?: string; icon?: string }> = {
  lpf: { name: "LIGA PROFESIONAL", category: "FÚTBOL ARGENTINO", logo: "/logos/lpf.png" },
  libertadores: { name: "COPA CONMEBOL", category: "LIBERTADORES · SUDAMERICANA", icon: "🏆" },
  europe: { name: "EUROPA", category: "LALIGA · PREMIER · CHAMPIONS", icon: "🌍" },
}
const LEAGUE_ORDER: LeagueTab[] = ["lpf", "libertadores", "europe"]

// Fecha local en YYYY-MM-DD (evita el corrimiento de día de toISOString/UTC).
function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Agenda dinámica anclada al día real: ayer-2 ... hoy ... +7. Rota sola cada día.
function buildDates() {
  const out: { dateStr: string; label: string; isToday: boolean }[] = []
  for (let i = -2; i <= 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const label =
      i === 0
        ? "HOY"
        : d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "numeric" }).replace(".", "").toUpperCase()
    out.push({ dateStr: ymdLocal(d), label, isToday: i === 0 })
  }
  return out
}

export default function LiveScoresWidget() {
  const dates = useMemo(buildDates, [])
  const today = dates.find((d) => d.isToday)!.dateStr
  const [selectedDate, setSelectedDate] = useState(today)
  const [matches, setMatches] = useState<Match[] | null>(null) // null = cargando
  const [fallback, setFallback] = useState(false)

  // Reactivo: cada cambio de fecha trae los partidos de ESE día.
  useEffect(() => {
    let cancelled = false
    setMatches(null)
    setFallback(false)
    fetchScoresForDate(selectedDate).then(async (res) => {
      if (cancelled) return
      if (res.length > 0) {
        setMatches(res)
        return
      }
      // Sin datos de la API: solo HOY cae al snapshot cacheado; otros días, vacío honesto.
      if (selectedDate === today) {
        try {
          const r = await fetch("/data/live-scores.json")
          const fb: Match[] = r.ok ? await r.json() : []
          if (!cancelled) {
            setMatches(fb)
            setFallback(fb.length > 0)
          }
        } catch {
          if (!cancelled) setMatches([])
        }
      } else {
        setMatches([])
      }
    })
    return () => {
      cancelled = true
    }
  }, [selectedDate, today])

  const groups = useMemo(() => {
    if (!matches) return []
    return LEAGUE_ORDER.map((tab) => ({ tab, matches: matches.filter((m) => m.league === tab) })).filter(
      (g) => g.matches.length > 0,
    )
  }, [matches])

  return (
    <div className="w-full my-10 font-sans">
      {/* TITLE */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📅</span>
        <h3 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
          AGENDA DE RESULTADOS
        </h3>
        {fallback && (
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider ml-1">· última fecha</span>
        )}
      </div>

      {/* DATE PICKER */}
      <div className="card-gradient rounded-2xl p-2.5 border border-white/10 mb-6 overflow-x-auto scrollbar-none flex items-center gap-1.5 shadow-lg">
        {dates.map((d) => {
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

      {/* LOADING */}
      {matches === null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-gradient rounded-2xl p-5 border border-white/10 animate-pulse h-48" />
          ))}
        </div>
      )}

      {/* EMPTY */}
      {matches !== null && groups.length === 0 && (
        <div className="card-gradient rounded-2xl p-10 border border-white/10 text-center">
          <div className="text-3xl mb-2 opacity-60">⚽</div>
          <p className="text-slate-400 text-sm font-sport uppercase tracking-wider">Sin partidos para esta fecha</p>
        </div>
      )}

      {/* MATCH CARDS GROUPED BY LEAGUE */}
      {groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {groups.map((group) => {
            const meta = LEAGUE_META[group.tab]
            return (
              <motion.div
                key={group.tab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-gradient rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg flex flex-col justify-between"
              >
                {/* LEAGUE HEADER */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    {meta.logo ? (
                      <img src={meta.logo} alt="" className="w-6 h-6 object-contain" />
                    ) : (
                      <span className="text-xl">{meta.icon || "⚽"}</span>
                    )}
                    <div>
                      <h4 className="font-sport font-black text-xs text-white uppercase tracking-wider">{meta.name}</h4>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-sport">
                        {meta.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* MATCHES */}
                <div className="space-y-3.5 flex-1">
                  {group.matches.map((m) => (
                    <div key={m.id} className="flex items-center justify-between py-1 text-xs">
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

                      <div className="flex items-center gap-3 shrink-0 text-right font-sport">
                        {m.status !== "UPCOMING" ? (
                          <div className="space-y-1 font-display font-black text-sm text-white">
                            <div>{m.homeScore ?? "-"}</div>
                            <div>{m.awayScore ?? "-"}</div>
                          </div>
                        ) : (
                          <div className="text-xs font-black text-[#74ACDF]">{m.time || "-"}</div>
                        )}

                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider min-w-[40px] text-right">
                          {m.status === "FINAL" && "FINAL"}
                          {m.status === "LIVE" && <span className="text-red-400 animate-pulse">{m.minute || "LIVE"}</span>}
                          {m.status === "UPCOMING" && "PRÓX"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
