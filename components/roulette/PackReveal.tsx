"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { Squad } from "@/lib/types"
import type { SquadTier } from "@/lib/game-engine"

const TIER_STYLE: Record<SquadTier, { border: string; glow: string; label: string | null }> = {
  comun: { border: "border-slate-600", glow: "", label: null },
  elite: { border: "border-[#75AADB]", glow: "shadow-[0_0_50px_rgba(117,170,219,0.45)]", label: "PLANTEL DE ÉLITE" },
  legendario: { border: "border-[#D4AF37]", glow: "shadow-[0_0_70px_rgba(212,175,55,0.55)]", label: "¡PLANTEL LEGENDARIO!" },
}

// Época del plantel: el hincha quiere saber si le tocó un equipo de antes.
function epoca(season: string): { label: string; clase: string } | null {
  const anio = Number(season)
  if (!anio) return null
  if (anio <= 2018) return { label: "PLANTEL HISTÓRICO", clase: "text-[#E7C27D] border-[#E7C27D]/40 bg-[#E7C27D]/10" }
  if (anio <= 2023) return { label: "PLANTEL CLÁSICO", clase: "text-[#9CCBF0] border-[#9CCBF0]/40 bg-[#9CCBF0]/10" }
  return { label: "PLANTEL ACTUAL", clase: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10" }
}

/** Reveal estilo pack-opening tras el giro: flip + rayos dorados si el plantel es histórico */
export default function PackReveal({ squad, tier, avg, onContinue }: {
  squad: Squad; tier: SquadTier; avg: number; onContinue: () => void
}) {
  const reducedMotion = useReducedMotion()
  const style = TIER_STYLE[tier]
  const isGold = tier === "legendario"
  const isSpecial = tier !== "comun"
  // Un plantel histórico se anuncia por lo que hizo, no por el año en que jugó.
  const era = squad.historico
    ? { label: "PLANTEL HISTÓRICO", clase: "text-[#E7C27D] border-[#E7C27D]/40 bg-[#E7C27D]/10" }
    : epoca(squad.season)

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
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full border border-yellow-500/30 bg-yellow-500/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-[#D4AF37] fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
          </div>
        </div>
        <h2 className="font-display text-3xl font-black text-white mb-1">{squad.label}</h2>
        <p className="text-sm text-slate-400 mb-3">
          {squad.historico ? `Temporada ${squad.season}` : `${squad.competition} · Temporada ${squad.season}`}
        </p>
        {era && (
          <div className={`mb-5 inline-block rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] font-sport ${era.clase}`}>
            {era.label}
          </div>
        )}
        {squad.hito && (
          <p className="mb-5 px-2 text-sm italic text-[#E7C27D]">{squad.hito}</p>
        )}
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
