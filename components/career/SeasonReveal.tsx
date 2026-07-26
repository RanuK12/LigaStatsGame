"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { positionCategory, type SeasonResult } from "@/lib/career-engine"

// Cuenta un número desde `from` hasta `to` en `ms`.
function useCountUp(to: number, ms: number, start: boolean, from = 0) {
  const [v, setV] = useState(from)
  const raf = useRef<number>()
  useEffect(() => {
    if (!start) return
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current!)
  }, [to, ms, start, from])
  return v
}

interface Props {
  season: (SeasonResult & { clubId?: string }) | null
  position?: string
  onClose: () => void
}

export default function SeasonReveal({ season, position, onClose }: Props) {
  // El resumen de la temporada muestra lo que corresponde al puesto: un arquero no
  // se luce con goles sino con vallas invictas y penales atajados.
  const cat = positionCategory(position || "CM")
  const esArquero = cat === "GK"
  const esDefensor = cat === "DEF"
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    if (!season) { setPhase(0); return }
    const t1 = setTimeout(() => setPhase(1), 500) // stats
    const t2 = setTimeout(() => setPhase(2), 1400) // trofeos
    const t3 = setTimeout(() => setPhase(3), 2200) // OVR
    return () => [t1, t2, t3].forEach(clearTimeout)
  }, [season])

  const prev = season?.ovr ?? 0
  const next = season?.nextOvr ?? prev
  const delta = next - prev
  const goals = useCountUp(season?.goals ?? 0, 700, phase >= 1)
  const assists = useCountUp(season?.assists ?? 0, 700, phase >= 1)
  const matches = useCountUp(season?.matchesPlayed ?? 0, 700, phase >= 1)
  const cleanSheets = useCountUp(season?.cleanSheets ?? 0, 700, phase >= 1)
  const penaltiesSaved = useCountUp(season?.penaltiesSaved ?? 0, 700, phase >= 1)
  const ovrShown = useCountUp(next, 900, phase >= 3, prev)

  const trophies: { icon: string; label: string }[] = []
  if (season?.liga) trophies.push({ icon: "🏆", label: "Liga" })
  if (season?.copaArgentina) trophies.push({ icon: "🥇", label: "Copa Argentina" })
  if (season?.continentalWon) {
    const m: Record<string, string> = { libertadores: "Libertadores", sudamericana: "Sudamericana", champions: "Champions", europa: "Europa League" }
    trophies.push({ icon: "🌎", label: m[season.continental || ""] || "Continental" })
  }

  return (
    <AnimatePresence>
      {season && (
        <motion.div
          className="fixed inset-0 z-[120] flex items-center justify-center p-4"
          initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ background: "radial-gradient(circle at center, rgba(6,12,24,0.9), rgba(2,4,10,0.98))", backdropFilter: "blur(6px)" }}
        >
          {/* Confeti si hubo título */}
          {phase >= 2 && trophies.length > 0 &&
            Array.from({ length: 26 }).map((_, i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute text-lg"
                style={{ left: `${(i * 37) % 100}%`, color: ["#D4AF37", "#74ACDF", "#ffffff", "#34d399"][i % 4] }}
                initial={{ top: "-8%", opacity: 1, rotate: 0 }}
                animate={{ top: "110%", opacity: [1, 1, 0], rotate: 360 }}
                transition={{ duration: 2.4 + (i % 5) * 0.3, repeat: Infinity, delay: (i % 7) * 0.2, ease: "linear" }}
              >
                {["🎉", "✦", "🎊", "⭐"][i % 4]}
              </motion.span>
            ))}

          <motion.div
            className="relative w-[400px] max-w-[92vw] rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/95 p-6 shadow-2xl"
            initial={{ scale: 0.85, y: 24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              {season.clubId && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`/logos/clubs/${season.clubId}.png`} alt="" className="h-12 w-12 object-contain" onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")} />
              )}
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400 font-sport">Temporada {season.year}</div>
                <div className="font-display text-xl font-black text-white">{season.clubName}</div>
                <div className="text-[11px] text-slate-400 font-sport">{season.age} años · Nota {season.rating.toFixed(1)}</div>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-2 text-center font-sport">
              {(esArquero
                ? [{ v: matches, l: "PJ", c: "#60a5fa" }, { v: cleanSheets, l: "V. invictas", c: "#34d399" }, { v: penaltiesSaved, l: "Pen. atajados", c: "#fb923c" }]
                : esDefensor
                ? [{ v: matches, l: "PJ", c: "#60a5fa" }, { v: cleanSheets, l: "V. invictas", c: "#34d399" }, { v: goals + assists, l: "G+A", c: "#fb923c" }]
                : [{ v: matches, l: "PJ", c: "#60a5fa" }, { v: goals, l: "Goles", c: "#34d399" }, { v: assists, l: "Asist.", c: "#fb923c" }]
              ).map((s, i) => (
                <div key={i} className="rounded-xl border border-white/5 bg-white/5 py-2.5">
                  <div className="font-display text-2xl font-black" style={{ color: s.c }}>{s.v}</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Trofeos */}
            {trophies.length > 0 && (
              <motion.div
                className="mt-4 flex flex-wrap justify-center gap-2"
                initial={{ opacity: 0, scale: 0.8 }} animate={phase >= 2 ? { opacity: 1, scale: 1 } : {}}
                transition={{ type: "spring", stiffness: 200, damping: 12 }}
              >
                {trophies.map((t, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-black text-[#D4AF37] font-sport">
                    <span className="text-base">{t.icon}</span> {t.label}
                  </div>
                ))}
              </motion.div>
            )}

            {/* OVR */}
            <motion.div
              className="mt-4 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-3"
              initial={{ opacity: 0 }} animate={phase >= 3 ? { opacity: 1 } : {}}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-sport">OVR</span>
              <span className="font-display text-4xl font-black text-white tabular-nums">{ovrShown}</span>
              {delta !== 0 && (
                <span className={`rounded-lg px-2 py-1 text-sm font-black ${delta > 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                  {delta > 0 ? "+" : ""}{delta}
                </span>
              )}
            </motion.div>

            {/* Highlights (sustancia, Europa, etc.) */}
            {phase >= 3 && season.highlights.length > 0 && (
              <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-1">
                {season.highlights.slice(0, 4).map((h, i) => (
                  <li key={i} className="text-[11px] text-slate-300 font-sans">{h}</li>
                ))}
              </motion.ul>
            )}

            {/* Crónica */}
            {phase >= 3 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-3 border-l-2 border-[#74ACDF]/50 pl-2 text-[11px] italic leading-snug text-slate-300 font-sans">
                {season.cronica}
              </motion.p>
            )}

            <button onClick={onClose} className="btn-primary mt-5 w-full py-3 text-xs font-black uppercase tracking-widest rounded-2xl">
              Continuar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
