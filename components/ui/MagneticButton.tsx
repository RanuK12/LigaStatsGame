"use client"

import { useRef, type ReactNode, type MouseEvent } from "react"
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion"

const MAX_SHIFT = 8

/**
 * Wrapper magnético para CTAs: el botón sigue sutilmente al mouse
 * (clamp ±8px) y vuelve al centro con spring al salir.
 */
export default function MagneticButton({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 220, damping: 18 })
  const sy = useSpring(y, { stiffness: 220, damping: 18 })

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const dx = e.clientX - (rect.left + rect.width / 2)
    const dy = e.clientY - (rect.top + rect.height / 2)
    x.set(Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, dx * 0.25)))
    y.set(Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, dy * 0.25)))
  }

  const onMouseLeave = () => {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ x: sx, y: sy }}
      className={`inline-flex ${className || ""}`}>
      {children}
    </motion.div>
  )
}
