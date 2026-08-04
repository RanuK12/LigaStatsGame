"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, useAnimationControls } from "framer-motion"

/**
 * La ruleta de clubes.
 *
 * La anterior era un círculo gris con una estrella adentro que giraba tres vueltas y paraba: no
 * se veía qué se estaba sorteando ni por qué frenaba ahí. Emilio la reportó como bug, y tenía
 * razón — parecía un elemento a medio hacer.
 *
 * Esta tiene gajos de verdad, uno por club candidato, con sus colores. Gira con desaceleración
 * y frena en el gajo del club que salió, que es lo que hace que se sienta un sorteo y no una
 * animación decorativa.
 *
 * El resultado NO lo decide la ruleta: lo decide el motor del juego (spinSquadWithPity, que
 * respeta el pity y no repite clubes). La rueda solo lo muestra. Si fuera al revés, el sorteo
 * dependería de dónde frena una animación, que es lo último que uno quiere en un juego con
 * ranking.
 */

export interface GajoRueda {
  id: string
  label: string
  colores?: string[]
}

const VUELTAS = 4
const DURACION = 2.4

export default function RuedaDeClubes({
  gajos,
  ganadorId,
  girando,
  size = 132,
  onFin,
}: {
  /** Los candidatos que se ven en la rueda. Con más de 14 no se distingue nada. */
  gajos: GajoRueda[]
  /** El que salió. `null` mientras no hay resultado. */
  ganadorId: string | null
  girando: boolean
  size?: number
  onFin?: () => void
}) {
  const controles = useAnimationControls()
  const [quieta, setQuieta] = useState(true)
  // El ángulo se acumula: si se resetea a 0 entre giros, la rueda pega un salto hacia atrás.
  const anguloAcumulado = useRef(0)

  // El ganador SIEMPRE entra en la rueda. Con `slice(0, 14)` a secas, cuando había más de
  // catorce candidatos el que salía podía quedar afuera: `findIndex` daba -1, la rueda frenaba
  // en un gajo cualquiera y el escudo del centro no aparecía porque no encontraba el club.
  const visibles = useMemo(() => {
    const primeros = gajos.slice(0, 14)
    if (!ganadorId || primeros.some((g) => g.id === ganadorId)) return primeros
    const suyo = gajos.find((g) => g.id === ganadorId)
    return suyo ? [...primeros.slice(0, 13), suyo] : primeros
  }, [gajos, ganadorId])
  const paso = 360 / Math.max(visibles.length, 1)

  useEffect(() => {
    if (!girando || visibles.length === 0) return
    setQuieta(false)
    const idx = Math.max(0, visibles.findIndex((g) => g.id === ganadorId))
    // El puntero está arriba (12 en punto): para dejar el gajo `idx` ahí hay que girar hasta que
    // su centro quede en 0°, o sea el complemento de su posición.
    const destino = 360 - (idx * paso + paso / 2)
    const total = anguloAcumulado.current + VUELTAS * 360 + ((destino - (anguloAcumulado.current % 360)) + 360) % 360
    anguloAcumulado.current = total
    controles
      .start({
        rotate: total,
        transition: { duration: DURACION, ease: [0.16, 1, 0.3, 1] },
      })
      .then(() => {
        setQuieta(true)
        onFin?.()
      })
    // `onFin` cambia de identidad en cada render del padre: incluirlo re-dispara el giro.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [girando, ganadorId, visibles, paso, controles])

  const r = size / 2
  const ganador = visibles.find((g) => g.id === ganadorId)

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      {/* El puntero. Va afuera de la rueda para que no gire con ella. */}
      <div
        className="absolute left-1/2 z-20 -translate-x-1/2"
        style={{ top: -9 }}
        aria-hidden
      >
        <div className="h-0 w-0 border-x-[8px] border-t-[13px] border-x-transparent border-t-[#F6C750] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]" />
      </div>

      <motion.div animate={controles} className="h-full w-full" style={{ originX: 0.5, originY: 0.5 }}>
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full">
          <defs>
            <radialGradient id="rueda-luz" cx="0.5" cy="0.35" r="0.75">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="1" stopColor="#000000" stopOpacity="0.35" />
            </radialGradient>
          </defs>

          {visibles.map((g, i) => {
            const a0 = (i * paso - 90) * (Math.PI / 180)
            const a1 = ((i + 1) * paso - 90) * (Math.PI / 180)
            const x0 = r + r * Math.cos(a0)
            const y0 = r + r * Math.sin(a0)
            const x1 = r + r * Math.cos(a1)
            const y1 = r + r * Math.sin(a1)
            const color = g.colores?.[0] || (i % 2 ? "#1b3350" : "#122842")
            return (
              <path
                key={g.id}
                d={`M ${r} ${r} L ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1} Z`}
                fill={color}
                stroke="#050a14"
                strokeWidth="1.5"
              />
            )
          })}

          <circle cx={r} cy={r} r={r} fill="url(#rueda-luz)" />
          <circle cx={r} cy={r} r={r - 1} fill="none" stroke="#0b1220" strokeWidth="3" />
          <circle cx={r} cy={r} r={r * 0.3} fill="#050a14" stroke="#F6C750" strokeWidth="2" />
        </svg>
      </motion.div>

      {/* El escudo del que salió, en el centro y sin girar. */}
      {quieta && ganador && (
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16 }}
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/logos/clubs/${ganador.id}.png`}
            alt=""
            className="object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
            style={{ width: size * 0.34, height: size * 0.34 }}
            onError={(e) => ((e.target as HTMLImageElement).style.visibility = "hidden")}
          />
        </motion.div>
      )}
    </div>
  )
}
