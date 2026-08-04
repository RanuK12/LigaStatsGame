"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { tocar } from "@/lib/sonido"

// Rotaciones exactas para mostrar cada cara (1 a 6) al frente
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 },
}

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
  const [face, setFace] = useState(1)
  const [extraTurns, setExtraTurns] = useState({ x: 0, y: 0 })

  const handleRoll = () => {
    if (disabled || rolling) return
    tocar("giro")
    
    // Pick random face 1 to 6
    const targetFace = Math.floor(Math.random() * 6) + 1
    setFace(targetFace)
    // Add extra 360-degree spins for realistic tumble physics
    setExtraTurns((prev) => ({
      x: prev.x + 720 + Math.floor(Math.random() * 2) * 360,
      y: prev.y + 1080 + Math.floor(Math.random() * 2) * 360,
    }))

    onRoll()
    setTimeout(() => {
      tocar("ficha")
    }, 800)
  }

  const rot = FACE_ROTATIONS[face] || { x: 0, y: 0 }
  const currentRotateX = rot.x + extraTurns.x
  const currentRotateY = rot.y + extraTurns.y

  return (
    <div className="flex flex-col items-center justify-center space-y-6 my-4">
      {/* 3D SCENE CONTAINER */}
      <div className="perspective-1000 w-36 h-36 relative flex items-center justify-center">
        {/* SHADOW PROJECTION */}
        <motion.div
          animate={rolling ? { scale: [1, 0.6, 1.2, 0.8, 1], opacity: [0.4, 0.1, 0.6, 0.3, 0.4] } : { scale: 1, opacity: 0.4 }}
          transition={{ duration: 0.85, ease: "easeInOut" }}
          className="absolute bottom-[-15px] w-24 h-6 rounded-full bg-amber-500/30 blur-md pointer-events-none"
        />

        {/* 3D CUBE WRAPPER */}
        <motion.div
          animate={{
            rotateX: currentRotateX,
            rotateY: currentRotateY,
          }}
          transition={{ duration: 0.85, ease: [0.25, 1, 0.5, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="w-24 h-24 relative cursor-pointer select-none"
          onClick={handleRoll}
        >
          {/* FACE 1 (FRONT) */}
          <div
            style={{ transform: "rotateY(0deg) translateZ(48px)" }}
            className="absolute inset-0 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-[#F6C750] via-[#D4AF37] to-[#8B6508] p-3 shadow-[inset_0_0_15px_rgba(255,255,255,0.4),0_0_25px_rgba(246,199,80,0.5)] flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-12 h-12">
              <circle cx="50" cy="50" r="11" fill="#050A14" />
            </svg>
          </div>

          {/* FACE 2 (RIGHT) */}
          <div
            style={{ transform: "rotateY(90deg) translateZ(48px)" }}
            className="absolute inset-0 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-[#F6C750] via-[#D4AF37] to-[#8B6508] p-3 shadow-[inset_0_0_15px_rgba(255,255,255,0.4),0_0_25px_rgba(246,199,80,0.5)] flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-12 h-12">
              <circle cx="28" cy="28" r="10" fill="#050A14" />
              <circle cx="72" cy="72" r="10" fill="#050A14" />
            </svg>
          </div>

          {/* FACE 3 (TOP) */}
          <div
            style={{ transform: "rotateX(90deg) translateZ(48px)" }}
            className="absolute inset-0 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-[#F6C750] via-[#D4AF37] to-[#8B6508] p-3 shadow-[inset_0_0_15px_rgba(255,255,255,0.4),0_0_25px_rgba(246,199,80,0.5)] flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-12 h-12">
              <circle cx="25" cy="25" r="9" fill="#050A14" />
              <circle cx="50" cy="50" r="9" fill="#050A14" />
              <circle cx="75" cy="75" r="9" fill="#050A14" />
            </svg>
          </div>

          {/* FACE 4 (BOTTOM) */}
          <div
            style={{ transform: "rotateX(-90deg) translateZ(48px)" }}
            className="absolute inset-0 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-[#F6C750] via-[#D4AF37] to-[#8B6508] p-3 shadow-[inset_0_0_15px_rgba(255,255,255,0.4),0_0_25px_rgba(246,199,80,0.5)] flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-12 h-12">
              <circle cx="28" cy="28" r="9" fill="#050A14" />
              <circle cx="72" cy="28" r="9" fill="#050A14" />
              <circle cx="28" cy="72" r="9" fill="#050A14" />
              <circle cx="72" cy="72" r="9" fill="#050A14" />
            </svg>
          </div>

          {/* FACE 5 (LEFT) */}
          <div
            style={{ transform: "rotateY(-90deg) translateZ(48px)" }}
            className="absolute inset-0 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-[#F6C750] via-[#D4AF37] to-[#8B6508] p-3 shadow-[inset_0_0_15px_rgba(255,255,255,0.4),0_0_25px_rgba(246,199,80,0.5)] flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-12 h-12">
              <circle cx="26" cy="26" r="8" fill="#050A14" />
              <circle cx="74" cy="26" r="8" fill="#050A14" />
              <circle cx="50" cy="50" r="8" fill="#050A14" />
              <circle cx="26" cy="74" r="8" fill="#050A14" />
              <circle cx="74" cy="74" r="8" fill="#050A14" />
            </svg>
          </div>

          {/* FACE 6 (BACK) */}
          <div
            style={{ transform: "rotateY(180deg) translateZ(48px)" }}
            className="absolute inset-0 rounded-2xl border-2 border-amber-200/90 bg-gradient-to-br from-[#F6C750] via-[#D4AF37] to-[#8B6508] p-3 shadow-[inset_0_0_15px_rgba(255,255,255,0.4),0_0_25px_rgba(246,199,80,0.5)] flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-12 h-12">
              <circle cx="28" cy="22" r="8" fill="#050A14" />
              <circle cx="72" cy="22" r="8" fill="#050A14" />
              <circle cx="28" cy="50" r="8" fill="#050A14" />
              <circle cx="72" cy="50" r="8" fill="#050A14" />
              <circle cx="28" cy="78" r="8" fill="#050A14" />
              <circle cx="72" cy="78" r="8" fill="#050A14" />
            </svg>
          </div>
        </motion.div>
      </div>

      {/* CTA BUTTON */}
      <button
        onClick={handleRoll}
        disabled={disabled || rolling}
        className="btn-gold px-8 py-3 rounded-2xl text-xs font-black font-sport uppercase tracking-widest shadow-xl disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
      >
        {rolling ? "🎲 RODANDO DADO 3D..." : "🎲 TIRAR DADO 3D"}
      </button>
    </div>
  )
}
