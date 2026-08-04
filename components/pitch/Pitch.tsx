"use client"

import { motion, useReducedMotion } from "framer-motion"
import type { Player, FormationConfig } from "@/lib/types"
import type { ChemistryBreakdown } from "@/lib/chemistry"
import { POS_LABELS } from "@/lib/game-engine"
import { getPC, getNationalityFlag } from "@/lib/ui-constants"

/**
 * Campo táctico interactivo: líneas de pase entre jugadores conectados por
 * química (celeste=club, dorado=nacionalidad), breathing/glow en el slot
 * activo y float sutil en los tokens ocupados.
 */
export default function Pitch({ f, draft, activeSlot, onSlotClick, phase, chemistry }: {
  f: FormationConfig; draft: (Player | null)[]; activeSlot: number
  onSlotClick: (idx: number) => void; phase: string; chemistry?: ChemistryBreakdown
}) {
  const reducedMotion = useReducedMotion()
  const links = (chemistry?.links || []).filter(l => draft[l.aIndex] && draft[l.bIndex])

  return (
    <div className="pitch w-full max-w-[360px] aspect-[68/105] mx-auto relative shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
      <div className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_top,rgba(116,172,223,0.10),transparent_46%)]" />
      <div className="pitch-lines" />
      <div className="pitch-center" />
      <div className="pitch-center-dot" />
      <div className="pitch-area-top" />
      <div className="pitch-area-bottom" />

      {/* Líneas de química entre jugadores adyacentes */}
      {links.length > 0 && (
        <svg viewBox="0 0 100 100" preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 z-[5] h-full w-full">
          {links.map((l, i) => {
            const a = f.positions[l.aIndex], b = f.positions[l.bIndex]
            const isClub = l.type === "club"
            return (
              <motion.line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={isClub ? "#74ACDF" : "#D4AF37"}
                strokeWidth={isClub ? 0.7 : 0.45}
                strokeOpacity={isClub ? 0.65 : 0.45}
                strokeDasharray={isClub ? "2 1.4" : "1 1.6"}
                strokeLinecap="round"
                animate={reducedMotion ? undefined : { strokeDashoffset: [0, -6.8] }}
                transition={{ repeat: Infinity, duration: isClub ? 2.2 : 3.2, ease: "linear" }}
              />
            )
          })}
        </svg>
      )}

      {f.positions.map((pos, i) => {
        const pl = draft[i]
        const isActive = i === activeSlot
        const strongChem = (chemistry?.perSlot[i] ?? 0) >= 70
        return (
          <div key={i}
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: "translate(-50%,-50%)" }}
            className="absolute cursor-pointer transition-all duration-200 hover:scale-110 z-10"
            onClick={() => onSlotClick(i)}>
            {pl ? (
              <motion.div
                className={`flex flex-col items-center ${isActive ? "scale-110" : ""}`}
                animate={reducedMotion ? undefined : { y: [0, -1.5, 0] }}
                transition={{ repeat: Infinity, duration: 3, delay: i * 0.18, ease: "easeInOut" }}>
                <motion.div
                  className={`relative w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 shadow-lg ${strongChem ? "ring-2 ring-[#74ACDF]/50" : ""}`}
                    style={{ backgroundColor: getPC(pos.pos), borderColor: isActive ? "#D4AF37" : "rgba(255,255,255,0.28)" }}
                  animate={isActive && !reducedMotion
                      ? { scale: [1, 1.07, 1], boxShadow: ["0 0 0px rgba(212,175,55,0)", "0 0 18px rgba(212,175,55,0.72)", "0 0 0px rgba(212,175,55,0)"] }
                    : { scale: 1 }}
                  transition={{ repeat: isActive ? Infinity : 0, duration: 1.6 }}>
                  {pl.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  <span className="absolute -bottom-1 -right-1 text-[11px] leading-none drop-shadow-md font-normal">
                    {getNationalityFlag(pl.nationality)}
                  </span>
                </motion.div>
                <div className="text-[11px] text-white font-semibold mt-0.5 bg-black/40 px-1 rounded max-w-[70px] truncate text-center">
                  {pl.name.split(" ").pop()}
                </div>
                <div className="text-[10px] font-semibold text-slate-100 [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">{POS_LABELS[pos.pos] || pos.pos}</div>
              </motion.div>
            ) : (
              <div className={`flex flex-col items-center ${isActive ? "scale-110" : ""}`}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold border-2 border-dashed transition-all ${
                  isActive ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37] animate-pulse" : "border-[#74ACDF]/50 bg-[#020813]/60 text-[#9CCBF0]"
                }`}>
                  {POS_LABELS[pos.pos] || pos.pos}
                </div>
                <div className="text-[11px] font-medium text-slate-200 mt-0.5 [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">{pos.label}</div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
