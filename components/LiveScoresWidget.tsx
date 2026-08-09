"use client"

import { useState, useEffect, useMemo } from "react"
import { motion } from "framer-motion"
import { fetchDayAll, type AgendaMatch } from "@/lib/live-scores"

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
  // La agenda se arma con el día del USUARIO, y el sitio se genera estático desde un servidor que
  // está en otra zona horaria. Calcularla en el render hacía que el HTML del servidor y el del
  // navegador no coincidieran: React tiraba los errores 418/423/425 y volvía a dibujar la página
  // entera del lado del cliente. Por eso la agenda se arma DESPUÉS de montar.
  const [montado, setMontado] = useState(false)
  useEffect(() => setMontado(true), [])

  const dates = useMemo(() => (montado ? buildDates() : []), [montado])
  const today = dates.find((d) => d.isToday)?.dateStr ?? ''
  const [selectedDate, setSelectedDate] = useState('')
  const [matches, setMatches] = useState<AgendaMatch[] | null>(null) // null = cargando

  useEffect(() => {
    if (today && !selectedDate) setSelectedDate(today)
  }, [today, selectedDate])

  // Reactivo: cada cambio de fecha trae TODOS los partidos de ESE día (cualquier liga).
  // + auto-refresh en vivo cada 45s para que los resultados se ajusten solos.
  useEffect(() => {
    if (!selectedDate) return
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
    // La liga ya viene resuelta desde lib/live-scores (nombre en español, ícono y prioridad).
    const byLeague = new Map<string, { es: string; icon: string; rank: number; matches: AgendaMatch[] }>()
    for (const m of matches) {
      const g = byLeague.get(m.leagueName) || { es: m.leagueName, icon: m.leagueIcon, rank: m.leagueRank, matches: [] }
      g.matches.push(m)
      byLeague.set(m.leagueName, g)
    }
    return [...byLeague.values()].sort((a, b) => a.rank - b.rank || b.matches.length - a.matches.length)
  }, [matches])

  // Hasta que monte, un hueco del mismo tamaño: nada que el servidor pueda escribir distinto.
  if (!montado) {
    return (
      <div className="w-full my-10 font-sans">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📅</span>
          <h3 className="font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            AGENDA DE RESULTADOS
          </h3>
        </div>
        <div className="h-40 animate-pulse rounded-2xl border border-white/5 bg-slate-950/40" />
      </div>
    )
  }

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
              className={`px-4 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-bold font-sport uppercase tracking-wider whitespace-nowrap transition-all ${
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
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider min-w-[40px] text-right">
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
