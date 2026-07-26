"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { fetchDayAll, type AgendaMatch } from "@/lib/live-scores"

// Solo ligas que le importan al mundo del fútbol: nombre en español, ícono y prioridad.
// Las que no están acá (ej: USL 2da de EEUU, ligas menores) se ESCONDEN.
interface LeagueMeta { rank: number; es: string; icon: string }
const LEAGUE_TABLE: { re: RegExp; meta: LeagueMeta }[] = [
  { re: /argentin.*(primera|liga profesional)|liga profesional argentina/i, meta: { rank: 0, es: "Primera División Argentina", icon: "🇦🇷" } },
  { re: /copa libertadores|conmebol libertadores/i, meta: { rank: 1, es: "Copa Libertadores", icon: "🏆" } },
  { re: /copa sudamericana|conmebol sudamericana/i, meta: { rank: 1, es: "Copa Sudamericana", icon: "🥇" } },
  { re: /uefa champions/i, meta: { rank: 2, es: "Champions League", icon: "⭐" } },
  { re: /uefa europa conference/i, meta: { rank: 3, es: "Conference League", icon: "🎖️" } },
  { re: /uefa europa/i, meta: { rank: 3, es: "Europa League", icon: "🎖️" } },
  { re: /english premier league/i, meta: { rank: 4, es: "Premier League", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" } },
  { re: /spanish la liga$|spanish la liga\b(?!.*2)/i, meta: { rank: 4, es: "LaLiga", icon: "🇪🇸" } },
  { re: /italian serie a/i, meta: { rank: 4, es: "Serie A", icon: "🇮🇹" } },
  { re: /german bundesliga/i, meta: { rank: 4, es: "Bundesliga", icon: "🇩🇪" } },
  { re: /french ligue 1/i, meta: { rank: 4, es: "Ligue 1", icon: "🇫🇷" } },
  { re: /brazilian.*(serie a|campeonato)/i, meta: { rank: 5, es: "Brasileirão", icon: "🇧🇷" } },
  { re: /portuguese primeira/i, meta: { rank: 6, es: "Primeira Liga", icon: "🇵🇹" } },
  { re: /dutch eredivisie/i, meta: { rank: 6, es: "Eredivisie", icon: "🇳🇱" } },
  { re: /mexican.*(primera|liga mx)|liga mx/i, meta: { rank: 6, es: "Liga MX", icon: "🇲🇽" } },
  { re: /saudi/i, meta: { rank: 7, es: "Liga de Arabia Saudita", icon: "🇸🇦" } },
  { re: /english league championship/i, meta: { rank: 7, es: "Championship (Inglaterra)", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" } },
  { re: /american major league soccer|(^|\b)mls\b/i, meta: { rank: 8, es: "MLS", icon: "🇺🇸" } },
  { re: /copa del rey/i, meta: { rank: 5, es: "Copa del Rey", icon: "🇪🇸" } },
  { re: /coppa italia/i, meta: { rank: 5, es: "Copa Italia", icon: "🇮🇹" } },
  { re: /fa cup/i, meta: { rank: 5, es: "FA Cup", icon: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" } },
  { re: /copa argentina/i, meta: { rank: 1, es: "Copa Argentina", icon: "🇦🇷" } },
  { re: /fifa world cup|copa mundial/i, meta: { rank: 0, es: "Copa del Mundo", icon: "🌍" } },
]
function leagueMeta(name: string): LeagueMeta | null {
  return LEAGUE_TABLE.find((l) => l.re.test(name))?.meta ?? null
}

function ymdLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Agenda dinámica anclada al día real: ayer-3 ... hoy ... +30 (un mes). Rota sola cada día.
function buildDates() {
  const out: { dateStr: string; label: string; isToday: boolean }[] = []
  for (let i = -3; i <= 30; i++) {
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
  const [matches, setMatches] = useState<AgendaMatch[] | null>(null) // null = cargando

  // Reactivo: cada cambio de fecha trae TODOS los partidos de ESE día (cualquier liga).
  // + auto-refresh en vivo cada 45s para que los resultados se ajusten solos.
  useEffect(() => {
    let cancelled = false
    setMatches(null)
    const load = (showLoading: boolean) => {
      if (showLoading) setMatches(null)
      fetchDayAll(selectedDate).then((res) => {
        if (!cancelled) setMatches(res)
      })
    }
    load(true)
    const id = setInterval(() => load(false), 45000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [selectedDate])

  const groups = useMemo(() => {
    if (!matches) return []
    // Solo ligas relevantes (traducidas al español); las menores se descartan.
    const byLeague = new Map<string, { es: string; icon: string; rank: number; matches: AgendaMatch[] }>()
    for (const m of matches) {
      const meta = leagueMeta(m.leagueName)
      if (!meta) continue
      const g = byLeague.get(meta.es) || { es: meta.es, icon: meta.icon, rank: meta.rank, matches: [] }
      g.matches.push(m)
      byLeague.set(meta.es, g)
    }
    return [...byLeague.values()]
      .sort((a, b) => a.rank - b.rank || b.matches.length - a.matches.length)
      .slice(0, 6)
  }, [matches])

  return (
    <div className="w-full my-10 font-sans">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">📅</span>
        <h3 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
          AGENDA DE RESULTADOS
        </h3>
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

      {matches === null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card-gradient rounded-2xl p-5 border border-white/10 animate-pulse h-48" />
          ))}
        </div>
      )}

      {matches !== null && groups.length === 0 && (
        <div className="card-gradient rounded-2xl p-10 border border-white/10 text-center">
          <div className="text-3xl mb-2 opacity-60">⚽</div>
          <p className="text-slate-400 text-sm font-sport uppercase tracking-wider">Sin partidos para esta fecha</p>
          <p className="text-slate-600 text-[11px] mt-1">Probá otro día de la agenda</p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {groups.map((group) => (
            <motion.div
              key={group.es}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-gradient rounded-2xl p-4 sm:p-5 border border-white/10 shadow-lg flex flex-col"
            >
              <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-white/10">
                <span className="text-xl">{group.icon}</span>
                <h4 className="font-sport font-black text-xs text-white uppercase tracking-wider truncate">{group.es}</h4>
              </div>

              <div className="space-y-3.5 flex-1">
                {group.matches.slice(0, 6).map((m) => (
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
          ))}
        </div>
      )}
    </div>
  )
}
