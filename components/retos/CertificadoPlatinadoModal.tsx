"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUserStore } from "@/lib/user-store"
import { trackEvent } from "@/components/Analytics"
import { tocar } from "@/lib/sonido"

export default function CertificadoPlatinadoModal({
  isOpen,
  onClose,
  pct,
  completados,
}: {
  isOpen: boolean
  onClose: () => void
  pct: number
  completados: number
}) {
  const user = useUserStore((s) => s.user)

  if (!isOpen) return null

  const handleShare = async () => {
    tocar("legendario")
    trackEvent("compartido", { red: "certificado_platinado" })
    const text = `🏆 ¡Platiné Gambeta al ${pct}% (${completados}/52 retos completos)! Mi ELO es ${user?.elo || 1000}. ¿Te animás a pasarte el juego? https://gambetafutbol.games/retos`
    try {
      if (navigator.share) await navigator.share({ text })
      else await navigator.clipboard.writeText(text)
    } catch {
      /* user canceled */
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border-2 border-amber-300/80 bg-gradient-to-b from-[#161204] via-[#080d1a] to-[#03060f] p-6 text-center shadow-[0_0_80px_rgba(245,158,11,0.4)]"
        >
          {/* Holographic light effect */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-[#74ACDF]/20 blur-3xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-400 hover:text-white"
          >
            ✕
          </button>

          {/* Header Badge */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-300 to-amber-600 text-4xl shadow-xl">
            👑
          </div>

          <span className="mt-4 inline-block font-sport text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">
            CERTIFICADO DE LEYENDA ABSOLUTA
          </span>

          <h2 className="mt-1 font-display text-2xl font-black uppercase text-white sm:text-3xl">
            ¡PLATINASTE <span className="gradient-text">GAMBETA!</span>
          </h2>

          <p className="mt-2 font-sans text-xs leading-relaxed text-slate-300">
            Otorgado a <strong className="text-amber-300">{user?.username || "Crack de Gambeta"}</strong> por completar exitosamente los{" "}
            <strong className="text-white">{completados} de 52 retos</strong> del juego del fútbol argentino.
          </p>

          {/* Stats Bar */}
          <div className="mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-950/80 p-3 font-sport">
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase">RETOS</span>
              <span className="font-display text-lg font-black text-amber-400">{completados}/52</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase">PROGRESO</span>
              <span className="font-display text-lg font-black text-emerald-400">{pct}%</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-500 uppercase">ELO</span>
              <span className="font-display text-lg font-black text-[#74ACDF]">⚡{user?.elo || 1000}</span>
            </div>
          </div>

          {/* Signature section */}
          <div className="mt-6 border-t border-white/10 pt-4 text-center">
            <div className="font-serif italic text-xs text-amber-200">
              "Firmado por el Equipo de Gambeta — El Draft del Fútbol Argentino"
            </div>
            <div className="mt-1 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              CÓDIGO DE VERIFICACIÓN: GAMB-{Math.random().toString(36).substring(2, 8).toUpperCase()}
            </div>
          </div>

          {/* CTAs */}
          <div className="mt-6 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleShare}
              className="btn-gold flex-1 py-3 font-sport text-xs font-black uppercase tracking-wider"
            >
              📲 COMPARTIR EN REDES
            </button>
            <button
              onClick={onClose}
              className="btn-secondary py-3 px-6 font-sport text-xs font-bold uppercase tracking-wider"
            >
              CERRAR
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
