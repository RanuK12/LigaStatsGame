"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { TROPHY_META, retirementStory, positionCategory, type CareerState } from "@/lib/career-engine"
import ShareBar from "@/components/ShareBar"
import { storyBlob } from "@/lib/story-card"

function useCountUp(to: number, ms: number, start: boolean) {
  const [v, setV] = useState(0)
  const raf = useRef<number>()
  useEffect(() => {
    if (!start) return
    const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms)
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    // Si la pestaña pierde el foco, el navegador frena el requestAnimationFrame y el número
    // se queda en 0. El timeout garantiza que llegue a su valor igual.
    const fin = setTimeout(() => setV(to), ms + 60)
    return () => {
      cancelAnimationFrame(raf.current!)
      clearTimeout(fin)
    }
  }, [to, ms, start])
  return v
}

// Veredicto de carrera según OVR pico, títulos y hitos.
function verdict(peak: number, titles: number, wc: boolean, bdo: number) {
  if (peak >= 95 || (wc && bdo >= 1)) return { t: "LEYENDA ETERNA", icon: "🐐", c: "#FFD700" }
  if (peak >= 90 || titles >= 8) return { t: "CRACK MUNDIAL", icon: "⭐", c: "#D4AF37" }
  if (peak >= 85 || titles >= 4) return { t: "GRAN FIGURA", icon: "🌟", c: "#74ACDF" }
  if (peak >= 80) return { t: "JUGADOR PROFESIONAL", icon: "⚽", c: "#34d399" }
  return { t: "CARRERA DIGNA", icon: "👏", c: "#94a3b8" }
}

interface Props {
  career: CareerState | null
  onClose: () => void
  onNewCareer: () => void
}

export default function CareerFinale({ career, onClose, onNewCareer }: Props) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    if (!career) { setPhase(0); return }
    const t1 = setTimeout(() => setPhase(1), 700)
    const t2 = setTimeout(() => setPhase(2), 1500)
    return () => [t1, t2].forEach(clearTimeout)
  }, [career])

  const peak = career ? Math.max(career.player.ovr, ...career.history.map((s) => s.nextOvr ?? s.ovr)) : 0
  const titlesTotal = career ? Object.values(career.trophies).reduce((a, b) => a + b, 0) : 0
  const v = verdict(peak, titlesTotal, career?.milestones.worldCup ?? false, career?.milestones.balonDeOro ?? 0)
  const peakShown = useCountUp(peak, 1100, phase >= 1)

  const trophyEntries = career
    ? Object.entries(career.trophies).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])
    : []
  const clubCount = career ? new Set(career.history.map((s) => s.clubId)).size : 0
  const esArquero = positionCategory(career?.player.position || "CM") === "GK"
  // Mensaje ya armado con lo mejor de la carrera
  const textoCarrera = career
    ? `Terminé mi carrera en Gambeta: ${career.seasonsPlayed} temporadas, OVR pico ${peak}, ${titlesTotal} ${titlesTotal === 1 ? "título" : "títulos"}${career.milestones.worldCup ? " y CAMPEÓN DEL MUNDO 🌍" : ""}${career.milestones.balonDeOro ? ` · ${career.milestones.balonDeOro} Balón de Oro` : ""}. Creá tu crack y contame hasta dónde llegás`
    : ""

  const milestones: { icon: string; label: string }[] = []
  if (career?.milestones.worldCup) milestones.push({ icon: "🌍", label: "Campeón del Mundo" })
  if (career?.milestones.balonDeOro) milestones.push({ icon: "🏅", label: `Balón de Oro ×${career.milestones.balonDeOro}` })
  if (career?.milestones.goldenBoots) milestones.push({ icon: "👟", label: `Bota de Oro ×${career.milestones.goldenBoots}` })
  if (career?.milestones.nationalTeam) {
    const caps = career.milestones.ntCaps || 0
    const g = career.milestones.ntGoals || 0
    milestones.push({ icon: career.player.flag, label: `Selección · ${caps} PJ${g ? ` · ${g} goles` : ""}` })
  }

  return (
    <AnimatePresence>
      {career && (
        <motion.div
          className="fixed inset-0 z-[130] flex items-center justify-center overflow-y-auto p-4"
          initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{ background: "radial-gradient(circle at 50% 20%, rgba(20,16,4,0.96), rgba(2,4,10,0.99))", backdropFilter: "blur(8px)" }}
        >
          {/* Confeti dorado */}
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute text-lg"
              style={{ left: `${(i * 33) % 100}%`, color: ["#FFD700", "#D4AF37", "#ffffff", "#74ACDF"][i % 4] }}
              initial={{ top: "-8%", opacity: 1, rotate: 0 }}
              animate={{ top: "110%", opacity: [1, 1, 0], rotate: 360 }}
              transition={{ duration: 3 + (i % 5) * 0.4, repeat: Infinity, delay: (i % 8) * 0.25, ease: "linear" }}
            >
              {["🎉", "✦", "🏆", "⭐"][i % 4]}
            </motion.span>
          ))}

          <motion.div
            className="relative my-8 w-[440px] max-w-[94vw] rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-b from-[#161206]/95 to-slate-950/97 p-7 text-center shadow-[0_0_80px_rgba(212,175,55,0.25)]"
            initial={{ scale: 0.85, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 140, damping: 16 }}
          >
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 font-sport">Fin de la carrera</div>
            <h2 className="mt-1 font-display text-3xl font-black uppercase text-white">
              {career.player.flag} {career.player.name}
            </h2>

            {/* Veredicto */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.15 }}
              className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border px-5 py-2"
              style={{ borderColor: `${v.c}66`, background: `${v.c}14` }}
            >
              <span className="text-2xl">{v.icon}</span>
              <span className="font-display text-lg font-black tracking-wide" style={{ color: v.c }}>{v.t}</span>
            </motion.div>

            {/* OVR pico */}
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-sport">OVR pico</span>
              <span className="font-display text-5xl font-black tabular-nums" style={{ color: v.c }}>{peakShown}</span>
            </div>

            {/* Totales */}
            <div className="mt-5 grid grid-cols-4 gap-2 font-sport">
              {[
                { v: career.seasonsPlayed, l: "Temporadas" },
                { v: career.totals.matchesPlayed, l: "PJ" },
                esArquero
                  ? { v: career!.history.reduce((a, h) => a + (h.cleanSheets || 0), 0), l: "V. invictas" }
                  : { v: career.totals.goals, l: "Goles" },
                { v: clubCount, l: "Clubes" },
              ].map((s, i) => (
                <div key={i} className="rounded-xl border border-white/5 bg-white/5 py-2">
                  <div className="font-display text-xl font-black text-white">{s.v}</div>
                  <div className="text-[8px] uppercase tracking-wider text-slate-400">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Vitrina de títulos */}
            {phase >= 1 && trophyEntries.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] font-sport mb-2">Vitrina · {titlesTotal} títulos</div>
                <div className="flex flex-wrap justify-center gap-2">
                  {trophyEntries.map(([id, n]) => (
                    <div key={id} className="flex items-center gap-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-black text-[#D4AF37] font-sport">
                      <span className="text-base">{TROPHY_META[id]?.icon || "🏆"}</span>
                      {TROPHY_META[id]?.name || id} ×{n}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Hitos */}
            {phase >= 2 && milestones.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex flex-wrap justify-center gap-2">
                {milestones.map((m, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 font-sport">
                    <span>{m.icon}</span> {m.label}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Mini-historia de retiro (distinta según la carrera) */}
            {phase >= 2 && (
              <motion.p
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="mx-auto mt-5 max-w-sm rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-[12px] italic leading-relaxed text-slate-300 font-sans"
              >
                📖 {retirementStory(career)}
              </motion.p>
            )}

            {/* Compartir la carrera terminada */}
            {career && (
              <ShareBar
                titulo="Contá tu carrera"
                texto={textoCarrera}
                imagen={() =>
                  storyBlob({
                    volanta: "Modo Carrera",
                    titulo: `${career.player.name} colgó los botines`,
                    subtitulo: `${career.seasonsPlayed} temporadas · OVR pico ${peak}`,
                    stats: [
                      { valor: `${titlesTotal}`, label: "Títulos" },
                      { valor: `${career.totals.matchesPlayed}`, label: "Partidos" },
                      esArquero
                        ? { valor: `${career.history.reduce((a, h) => a + (h.cleanSheets || 0), 0)}`, label: "V. invictas" }
                        : { valor: `${career.totals.goals}`, label: "Goles" },
                      { valor: `${clubCount}`, label: "Clubes" },
                    ],
                    pie: retirementStory(career),
                    acento: titlesTotal > 0 ? "#F6C750" : "#74ACDF",
                  })
                }
                className="mt-5"
              />
            )}

            <div className="mt-4 flex gap-2 font-sport">
              <button onClick={onClose} className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-xs font-black uppercase tracking-widest text-slate-300 hover:text-white transition-colors">
                Ver ficha
              </button>
              <button onClick={onNewCareer} className="btn-primary flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-2xl">
                Nueva carrera
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
