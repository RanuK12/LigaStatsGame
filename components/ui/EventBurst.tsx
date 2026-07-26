"use client"

import { useEffect, useState } from "react"
import SolDeMayo from "./SolDeMayo"

export type BurstTone = "oro" | "celeste" | "plata"

const TONOS: Record<BurstTone, { rayo: string; anillo: string; texto: string }> = {
  oro: { rayo: "rgba(246,199,80,0.85)", anillo: "rgba(246,199,80,0.7)", texto: "#F6C750" },
  celeste: { rayo: "rgba(116,172,223,0.85)", anillo: "rgba(116,172,223,0.75)", texto: "#9CCBF0" },
  plata: { rayo: "rgba(226,232,240,0.8)", anillo: "rgba(226,232,240,0.7)", texto: "#E2E8F0" },
}

/**
 * Estallido de pantalla para los momentos grandes (campeón, salto a Europa, pick de leyenda):
 * destello + rayos girando + anillo de choque + el Sol de Mayo saliendo del centro.
 *
 * Todo con CSS (no framer-motion) para que no se congele si la pestaña pierde el foco, y
 * `pointer-events: none` para no bloquear nada de la interfaz.
 */
export default function EventBurst({
  show,
  tone = "oro",
  label,
  onDone,
  duration = 1600,
}: {
  show: boolean
  tone?: BurstTone
  label?: string
  onDone?: () => void
  duration?: number
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!show) return
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, duration)
    return () => clearTimeout(t)
  }, [show, duration, onDone])

  if (!visible) return null
  const c = TONOS[tone]

  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden">
      {/* Destello */}
      <div className="absolute inset-0 burst-flash" style={{ background: `radial-gradient(circle at 50% 45%, ${c.rayo} 0%, transparent 60%)` }} />

      {/* Rayos girando */}
      <div
        className="absolute left-1/2 top-[45%] w-[160vmax] h-[160vmax] -translate-x-1/2 -translate-y-1/2 burst-rays"
        style={{
          background: `repeating-conic-gradient(from 0deg at 50% 50%, ${c.rayo} 0deg 3deg, transparent 3deg 12deg)`,
          maskImage: "radial-gradient(circle, black 0%, transparent 62%)",
          WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 62%)",
        }}
      />

      {/* Anillo de choque */}
      <div
        className="absolute left-1/2 top-[45%] w-[46vmin] h-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full burst-ring"
        style={{ border: `3px solid ${c.anillo}` }}
      />

      {/* Sol saliendo del centro */}
      <div className="absolute left-1/2 top-[45%] w-[30vmin] h-[30vmin] -translate-x-1/2 -translate-y-1/2 burst-ring">
        <SolDeMayo className="w-full h-full" opacity={0.9} />
      </div>

      {label && (
        <div className="absolute left-1/2 top-[62%] -translate-x-1/2 text-center px-6">
          <div
            className="font-impact text-3xl sm:text-5xl font-black uppercase tracking-tight cartel-in drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)]"
            style={{ color: c.texto }}
          >
            {label}
          </div>
        </div>
      )}
    </div>
  )
}
