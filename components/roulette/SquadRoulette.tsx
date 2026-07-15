"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import type { Squad } from "@/lib/types"

export const SPIN_DURATION_MS = 4200

/**
 * Ruleta de planteles con giro 3D y desaceleración realista.
 * El resultado viene pre-decidido (spinSquadWithPity); la rueda cae en su segmento.
 * onSpinComplete se dispara al frenar (onAnimationComplete + fallback de seguridad).
 */
export default function SquadRoulette({ squads, spinning, result, onSpinComplete }: {
  squads: Squad[]; spinning: boolean; result: Squad | null; onSpinComplete: () => void
}) {
  const [rotation, setRotation] = useState(0)
  const completedRef = useRef(false)
  const reducedMotion = useReducedMotion()

  const visible = useMemo(() => {
    if (!result) return squads.slice(0, 18)
    const sliced = squads.slice(0, 17)
    // Guarantee that result is always in the visible list for the wheel animation to spin correctly
    if (!sliced.some(s => s.id === result.id)) {
      sliced.push(result)
    } else {
      if (squads.length > 17) {
        const extra = squads.find(s => s.id !== result.id && !sliced.some(x => x.id === s.id))
        if (extra) sliced.push(extra)
      }
    }
    return sliced
  }, [squads, result])

  const segAngle = visible.length > 0 ? 360 / visible.length : 360
  const abbrev = (label: string) => label.replace(/['']/g, "").split(/\s+/).filter(Boolean).map(w => w[0]).join("").slice(0, 4).toUpperCase()
  const colors = ['#dc2626','#ea580c','#d97706','#65a30d','#16a34a','#0d9488','#0891b2','#0284c7','#2563eb','#4f46e5','#7c3aed','#9333ea','#c026d3','#db2777','#e11d48','#dc2626','#ea580c','#d97706']

  useEffect(() => {
    if (spinning && result && visible.length > 0) {
      const idx = visible.findIndex(s => s.id === result.id)
      if (idx >= 0) {
        const targetRotation = 360 * 6 + (360 - idx * segAngle - segAngle / 2)
        setRotation(prev => prev + targetRotation)
      }
    }
  }, [spinning, result, visible, segAngle])

  const fireComplete = () => {
    if (!completedRef.current) {
      completedRef.current = true
      onSpinComplete()
    }
  }

  // Fallback de seguridad (reduced-motion o animación interrumpida)
  useEffect(() => {
    if (!spinning) { completedRef.current = false; return }
    const t = setTimeout(fireComplete, SPIN_DURATION_MS + 600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinning])

  if (visible.length === 0) return (
    <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-full border border-slate-700 bg-slate-900/70 text-center text-sm text-slate-400">
      No hay planteles disponibles para esta posición.
    </div>
  )

  return (
    <div className="relative mx-auto w-64" style={{ perspective: 900 }}>
      <div className="relative h-64 w-64 overflow-hidden rounded-full border border-white/5 wheel-shell shadow-[0_0_0_8px_rgba(116,172,223,0.08)]"
        style={{ transform: reducedMotion ? undefined : "rotateX(12deg)" }}>
        <div className="absolute -inset-10 rounded-full bg-gradient-to-br from-[#74ACDF]/16 via-transparent to-[#D4AF37]/12 blur-3xl" />
        {/* Puntero con nudge mientras gira */}
        <motion.div
          animate={{ rotate: spinning && !reducedMotion ? [0, -12, 0] : 0 }}
          transition={{ repeat: spinning ? Infinity : 0, duration: 0.22 }}
          className="absolute -top-1 left-1/2 z-30 h-0 w-0 -translate-x-1/2 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-[#D4AF37] drop-shadow-[0_0_16px_rgba(212,175,55,0.75)]"
          style={{ originY: 0 }} />
        <motion.div
          animate={{
            rotate: spinning && !reducedMotion ? [null, rotation + 5, rotation] : rotation,
            scale: spinning ? [1, 1.02, 1] : 1,
          }}
          transition={{
            rotate: spinning
              ? { duration: SPIN_DURATION_MS / 1000, times: [0, 0.93, 1], ease: [[0.12, 0.65, 0.15, 1], "easeOut"] }
              : { duration: 0 },
            scale: { duration: 0.35, repeat: spinning ? Infinity : 0 },
          }}
          onAnimationComplete={() => { if (spinning) fireComplete() }}
          className="absolute inset-0 z-10 rounded-full overflow-hidden">
          <svg viewBox="0 0 100 100" className="h-full w-full">
            {visible.map((sq, idx) => {
              const s = idx * segAngle, e = (idx + 1) * segAngle
              const sr = (s - 90) * Math.PI / 180, er = (e - 90) * Math.PI / 180
              const x1 = 50 + 50 * Math.cos(sr), y1 = 50 + 50 * Math.sin(sr)
              const x2 = 50 + 50 * Math.cos(er), y2 = 50 + 50 * Math.sin(er)
              const mr = ((s + e) / 2 - 90) * Math.PI / 180
              const tx = 50 + 31 * Math.cos(mr), ty = 50 + 31 * Math.sin(mr)
              return (
                <g key={sq.id}>
                  <path d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                    fill={spinning && result?.id === sq.id ? "#f97316" : colors[idx % colors.length]}
                    stroke="#94a3b8" strokeWidth="0.25" />
                  <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="3.1" fontWeight="900"
                    transform={`rotate(${(s + e) / 2}, ${tx}, ${ty})`}>
                    {abbrev(sq.label)}
                  </text>
                </g>
              )
            })}
            <circle cx="50" cy="50" r="10" fill="#020617" stroke="#D4AF37" strokeWidth="0.8" />
            <text x="50" y="51.5" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="6">⚽</text>
          </svg>
          {/* Brillo radial para dar volumen al disco */}
          <div className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.18), transparent 55%)" }} />
        </motion.div>
      </div>
      {/* Sombra elíptica bajo el disco */}
      <div className="mx-auto mt-2 h-4 w-44 rounded-[50%] bg-black/50 blur-md" />
    </div>
  )
}
