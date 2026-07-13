"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import type { MatchChronicle, MatchEvent } from "@/lib/chronicle"

const EVENT_ICON: Record<MatchEvent["type"], string> = {
  inicio: "🟢", gol: "⚽", atajada: "🧤", amarilla: "🟨", roja: "🟥",
  entretiempo: "⏸️", penales: "🎯", final: "🏁",
}

// Delay antes de mostrar cada evento (pausa dramática en goles)
function delayFor(ev: MatchEvent): number {
  if (ev.type === "gol" || ev.type === "penales") return 1500
  if (ev.type === "roja") return 1100
  return 650
}

function eventStyle(ev: MatchEvent): string {
  if (ev.type === "gol" && ev.team === "propio") return "border-[#75AADB]/50 bg-[#75AADB]/10"
  if (ev.type === "gol") return "border-red-500/30 bg-red-500/5"
  if (ev.type === "roja") return "border-red-500/50 bg-red-500/10"
  if (ev.type === "penales") return "border-yellow-400/40 bg-yellow-500/10"
  if (ev.type === "final" || ev.type === "inicio" || ev.type === "entretiempo") return "border-slate-700 bg-slate-800/40"
  return "border-slate-800 bg-slate-900/40"
}

/** Feed de relato en vivo: revela los eventos uno a uno con retardos dinámicos */
export default function MatchChronicleFeed({ chronicle }: { chronicle: MatchChronicle }) {
  const reducedMotion = useReducedMotion()
  const [visibleCount, setVisibleCount] = useState(reducedMotion ? chronicle.events.length : 1)
  const done = visibleCount >= chronicle.events.length

  // Reiniciar el relato al cambiar de partido
  useEffect(() => {
    setVisibleCount(reducedMotion ? chronicle.events.length : 1)
  }, [chronicle, reducedMotion])

  useEffect(() => {
    if (done) return
    const next = chronicle.events[visibleCount]
    const t = setTimeout(() => setVisibleCount(c => c + 1), delayFor(next))
    return () => clearTimeout(t)
  }, [visibleCount, done, chronicle])

  const visible = useMemo(() => chronicle.events.slice(0, visibleCount), [chronicle, visibleCount])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold">
          📻 {chronicle.roundLabel ? `${chronicle.roundLabel} · ` : ""}vs {chronicle.opponent}
        </h3>
        {!done && (
          <button onClick={() => setVisibleCount(chronicle.events.length)}
            className="text-xs px-3 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all">
            Ver todo ⏩
          </button>
        )}
      </div>
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {visible.map((ev, i) => (
            <motion.div
              key={i}
              initial={reducedMotion ? false : { opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex items-start gap-2.5 rounded-xl border px-3 py-2 text-sm ${eventStyle(ev)}`}>
              <span className="shrink-0 font-display text-xs font-black text-slate-500 w-7 text-right pt-0.5">
                {ev.type === "inicio" ? "0'" : `${ev.minute}'`}
              </span>
              <span className="shrink-0">{EVENT_ICON[ev.type]}</span>
              <span className={ev.type === "gol" && ev.team === "propio" ? "text-white font-semibold" : "text-slate-300"}>
                {ev.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {!done && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="text-center text-xs text-slate-500 py-1">
            ● en vivo
          </motion.div>
        )}
      </div>
    </div>
  )
}
