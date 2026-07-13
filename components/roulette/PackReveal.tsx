"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { Squad } from "@/lib/types"
import type { SquadTier } from "@/lib/game-engine"

const TIER_STYLE: Record<SquadTier, { border: string; glow: string; label: string | null }> = {
  comun: { border: "border-slate-600", glow: "", label: null },
  elite: { border: "border-[#75AADB]", glow: "shadow-[0_0_50px_rgba(117,170,219,0.45)]", label: "PLANTEL DE ÉLITE" },
  legendario: { border: "border-[#D4AF37]", glow: "shadow-[0_0_70px_rgba(212,175,55,0.55)]", label: "¡PLANTEL LEGENDARIO!" },
}

/** Reveal estilo pack-opening tras el giro: flip + rayos dorados si el plantel es histórico */
export default function PackReveal({ squad, tier, avg, onContinue }: {
  squad: Squad; tier: SquadTier; avg: number; onContinue: () => void
}) {
  const reducedMotion = useReducedMotion()
  const style = TIER_STYLE[tier]
  const isGold = tier === "legendario"
  const isSpecial = tier !== "comun"

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      {/* Rayos dorados rotando (solo élite/legendario) */}
      {isSpecial && !reducedMotion && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 14, ease: "linear" }}
          className="pointer-events-none absolute h-[150vmax] w-[150vmax]"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, ${isGold ? "rgba(212,175,55,0.16)" : "rgba(117,170,219,0.13)"} 12deg, transparent 24deg, transparent 40deg, ${isGold ? "rgba(212,175,55,0.16)" : "rgba(117,170,219,0.13)"} 52deg, transparent 64deg, transparent 90deg, ${isGold ? "rgba(212,175,55,0.16)" : "rgba(117,170,219,0.13)"} 102deg, transparent 114deg, transparent 180deg, ${isGold ? "rgba(212,175,55,0.16)" : "rgba(117,170,219,0.13)"} 192deg, transparent 204deg, transparent 270deg, ${isGold ? "rgba(212,175,55,0.16)" : "rgba(117,170,219,0.13)"} 282deg, transparent 294deg)`,
            mixBlendMode: "screen",
          }} />
      )}
      {/* Destello inicial */}
      {isSpecial && !reducedMotion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0] }}
          transition={{ duration: 0.7, times: [0, 0.3, 1] }}
          className="pointer-events-none absolute inset-0 bg-white" />
      )}
      {/* Partículas */}
      {isSpecial && !reducedMotion && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.4 }}
              animate={{
                opacity: [0, 1, 0],
                x: Math.cos((i / 18) * Math.PI * 2) * (120 + (i % 5) * 40),
                y: Math.sin((i / 18) * Math.PI * 2) * (120 + (i % 5) * 40),
                scale: [0.4, 1, 0.3],
              }}
              transition={{ duration: 1.3, delay: 0.25 + (i % 6) * 0.08 }}
              className="absolute left-1/2 top-1/2 text-lg"
              style={{ color: isGold ? "#FFD700" : "#75AADB" }}>
              ✦
            </motion.span>
          ))}
        </div>
      )}

      {/* Card del plantel con flip */}
      <motion.div
        initial={reducedMotion ? { opacity: 0 } : { rotateY: 90, y: 60, opacity: 0 }}
        animate={reducedMotion ? { opacity: 1 } : { rotateY: 0, y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 170, damping: 18, delay: 0.15 }}
        style={{ transformPerspective: 1000 }}
        className={`relative w-full max-w-sm rounded-3xl border-2 ${style.border} ${style.glow} bg-gradient-to-b from-slate-900 to-[#050f21] p-8 text-center`}>
        {style.label && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className={`font-sport text-xs font-black uppercase tracking-[0.3em] mb-4 ${isGold ? "text-[#FFD700]" : "text-[#75AADB]"}`}>
            {style.label}
          </motion.p>
        )}
        <div className="text-6xl mb-3">{isGold ? "🏆" : "⚽"}</div>
        <h2 className="font-display text-3xl font-black text-white mb-1">{squad.label}</h2>
        <p className="text-sm text-slate-400 mb-5">{squad.competition} · Temporada {squad.season}</p>
        <div className="flex justify-center gap-6 mb-6 text-sm">
          <div>
            <div className={`font-display text-2xl font-black ${isGold ? "text-[#FFD700]" : "text-[#75AADB]"}`}>{avg}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Rating prom.</div>
          </div>
          <div>
            <div className="font-display text-2xl font-black text-white">{squad.playerIds.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">Jugadores</div>
          </div>
        </div>
        <button onClick={onContinue} className="btn-primary w-full py-3 font-sport">
          Elegir jugador
        </button>
      </motion.div>
    </motion.div>
  )
}
