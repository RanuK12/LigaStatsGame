"use client"

import { useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useT } from "@/lib/i18n"

interface Props {
  data: { year: number; playerName: string; flag: string; ovr: number } | null
  onClose: () => void
}

// Carta impactante del Balón de Oro: rayos dorados girando, balón dorado, confeti.
export default function BallonDorReveal({ data, onClose }: Props) {
  const t = useT()
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const gold = "#FFD700"

  return (
    <AnimatePresence>
      {data && (
        <motion.div
          className="fixed inset-0 z-[140] flex items-center justify-center p-4"
          initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ background: "radial-gradient(circle at center, rgba(30,22,2,0.92), rgba(2,2,6,0.98))", backdropFilter: "blur(7px)" }}
        >
          {/* Rayos dorados girando */}
          <motion.div
            className="pointer-events-none absolute"
            style={{
              width: 1000, height: 1000,
              background: `conic-gradient(from 0deg, transparent 0deg, ${gold}30 7deg, transparent 15deg, transparent 30deg, ${gold}22 38deg, transparent 46deg)`,
              maskImage: "radial-gradient(circle, black 25%, transparent 68%)",
              WebkitMaskImage: "radial-gradient(circle, black 25%, transparent 68%)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          {/* Confeti dorado */}
          {Array.from({ length: 34 }).map((_, i) => (
            <motion.span
              key={i}
              className="pointer-events-none absolute text-lg"
              style={{ left: `${(i * 29) % 100}%`, color: ["#FFD700", "#FFF0A0", "#ffffff", "#E0A82E"][i % 4] }}
              initial={{ top: "-8%", opacity: 1, rotate: 0 }}
              animate={{ top: "110%", opacity: [1, 1, 0], rotate: 360 }}
              transition={{ duration: 2.6 + (i % 5) * 0.35, repeat: Infinity, delay: (i % 8) * 0.22, ease: "linear" }}
            >
              {["✦", "🏅", "⭐", "🥇"][i % 4]}
            </motion.span>
          ))}

          <motion.div
            className="relative w-[340px] max-w-[88vw] text-center"
            initial={{ scale: 0.4, rotateY: 90, opacity: 0 }}
            animate={{ scale: 1, rotateY: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            onClick={(e) => e.stopPropagation()}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Balón dorado */}
            <motion.div
              className="mx-auto mb-3 flex h-32 w-32 items-center justify-center rounded-full"
              style={{ background: `radial-gradient(circle at 35% 30%, #fff6c8, ${gold} 45%, #9a7a12 100%)`, boxShadow: `0 0 60px ${gold}88, inset 0 4px 12px rgba(255,255,255,0.6)` }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <span className="text-6xl drop-shadow">⚽</span>
            </motion.div>

            <div className="text-[11px] font-black uppercase tracking-[0.4em]" style={{ color: gold }}>{t('BallonDorReveal.balonDeOro', 'Balón de Oro')}</div>
            <div className="font-impact text-5xl font-black text-white leading-none mt-1" style={{ textShadow: `0 2px 24px ${gold}66` }}>{data.year}</div>

            <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: `${gold}55`, background: `${gold}12` }}>
              <div className="font-display text-2xl font-black text-white">{data.flag} {data.playerName}</div>
              <div className="mt-1 text-sm font-bold" style={{ color: gold }}>El mejor jugador del mundo · OVR {data.ovr}</div>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-2xl py-3 text-xs font-black uppercase tracking-[0.3em] text-slate-950"
              style={{ background: `linear-gradient(90deg, ${gold}, #fff0a0, ${gold})` }}
            >
              {t('BallonDorReveal.continuar', 'Continuar')}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
