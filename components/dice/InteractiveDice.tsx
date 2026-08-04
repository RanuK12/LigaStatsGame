"use client"

import React from "react"
import { motion } from "framer-motion"
import { tocar } from "@/lib/sonido"

export default function InteractiveDice({
  rolling,
  onRoll,
  disabled,
  remaining,
}: {
  rolling: boolean
  onRoll: () => void
  disabled: boolean
  remaining: number | null
}) {
  const handleRoll = () => {
    if (disabled || rolling) return
    tocar("giro")
    onRoll()
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="perspective-1000 w-32 h-32 relative flex items-center justify-center my-4">
        <motion.button
          onClick={handleRoll}
          disabled={disabled || rolling}
          animate={
            rolling
              ? {
                  rotateX: [0, 360, 720, 1080],
                  rotateY: [0, 180, 540, 900],
                  rotateZ: [0, 90, 270, 360],
                  scale: [1, 1.25, 0.9, 1.1, 1],
                }
              : { rotateX: 15, rotateY: -25, rotateZ: 0 }
          }
          transition={{ duration: 0.85, ease: "easeOut" }}
          style={{ transformStyle: "preserve-3d" }}
          className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border-2 border-amber-200/80 shadow-[0_0_40px_rgba(245,158,11,0.6)] flex items-center justify-center text-slate-950 font-black cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group relative overflow-hidden"
          aria-label="Tirar el dado 3D"
        >
          {/* HOLOGRAPHIC OVERLAY */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.6),transparent)] pointer-events-none" />

          {/* 3D DICE FACE (6 PIPS SVG) */}
          <svg viewBox="0 0 100 100" className="w-16 h-16 drop-shadow-md">
            <circle cx="30" cy="30" r="8" fill="#050A14" />
            <circle cx="70" cy="30" r="8" fill="#050A14" />
            <circle cx="30" cy="50" r="8" fill="#050A14" />
            <circle cx="70" cy="50" r="8" fill="#050A14" />
            <circle cx="30" cy="70" r="8" fill="#050A14" />
            <circle cx="70" cy="70" r="8" fill="#050A14" />
          </svg>
        </motion.button>
      </div>

      <button
        onClick={handleRoll}
        disabled={disabled || rolling}
        className="btn-gold px-8 py-3 rounded-2xl text-xs font-black font-sport uppercase tracking-widest shadow-xl disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {rolling ? "🎲 RODANDO DADO..." : "🎲 TIRAR DADO 3D"}
      </button>
    </div>
  )
}
