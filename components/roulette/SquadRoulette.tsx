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
function shuffle<T>(arr: T[]): T[] {
  const out = [...arr]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export default function SquadRoulette({ squads, spinning, result, onSpinComplete }: {
  squads: Squad[]; spinning: boolean; result: Squad | null; onSpinComplete: () => void
}) {
  const [rotation, setRotation] = useState(0)
  const completedRef = useRef(false)
  const reducedMotion = useReducedMotion()

  // La rueda: un plantel POR CLUB (antes se repetía el mismo escudo con Boca 2019/2021/2022) y
  // con épocas balanceadas — ~40% de planteles actuales (2025/26) y el resto históricos, porque
  // si no salían casi siempre los últimos dos años.
  const visible = useMemo(() => {
    const CUPO = 18
    const RECIENTE = 2025
    const esReciente = (s: Squad) => Number(s.season) >= RECIENTE

    const porClub = new Map<string, Squad[]>()
    for (const s of squads) {
      const arr = porClub.get(s.clubId)
      if (arr) arr.push(s)
      else porClub.set(s.clubId, [s])
    }

    const elegidos: Squad[] = []
    const clubesUsados = new Set<string>()
    if (result) {
      elegidos.push(result)
      clubesUsados.add(result.clubId)
    }

    const alAzar = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
    const tomar = (quiero: number, filtro: (s: Squad) => boolean) => {
      const clubes = shuffle([...porClub.keys()].filter((c) => !clubesUsados.has(c)))
      for (const club of clubes) {
        if (quiero <= 0) break
        const opciones = porClub.get(club)!.filter(filtro)
        if (opciones.length === 0) continue
        elegidos.push(alAzar(opciones))
        clubesUsados.add(club)
        quiero--
      }
      return quiero // cuántos quedaron sin cubrir
    }

    const cupoReciente = Math.round(CUPO * 0.4)
    const faltanRecientes = tomar(cupoReciente - (result && esReciente(result) ? 1 : 0), esReciente)
    // Los históricos cubren su cuota + lo que no se pudo llenar con planteles actuales
    const faltanViejos = tomar(CUPO - elegidos.length + faltanRecientes, (s) => !esReciente(s))
    // Último relleno: cualquier club que quede (si a la posición la cubren pocos planteles)
    if (faltanViejos > 0 || elegidos.length < 8) tomar(CUPO - elegidos.length, () => true)

    return shuffle(elegidos)
  }, [squads, result])

  const segAngle = visible.length > 0 ? 360 / visible.length : 360
  const colors = ['#0f172a','#1e293b','#0f172a','#1e293b','#0f172a','#1e293b','#0f172a','#1e293b','#0f172a','#1e293b','#0f172a','#1e293b','#0f172a','#1e293b','#0f172a','#1e293b','#0f172a','#1e293b']

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
                    fill={spinning && result?.id === sq.id ? "#74ACDF" : colors[idx % colors.length]}
                    stroke="#94a3b8" strokeWidth="0.25" />
                  {/* Escudo del club + año: se reconoce de una, mucho mejor que la sigla */}
                  <image
                    href={`/logos/clubs/${sq.clubId}.png`}
                    x={tx - 5.4}
                    y={ty - 6.6}
                    width="10.8"
                    height="10.8"
                    preserveAspectRatio="xMidYMid meet"
                    transform={`rotate(${(s + e) / 2}, ${tx}, ${ty})`}
                  />
                  <text x={tx} y={ty + 6.6} textAnchor="middle" dominantBaseline="middle" fill="#cbd5e1" fontSize="2.6" fontWeight="900"
                    transform={`rotate(${(s + e) / 2}, ${tx}, ${ty})`}>
                    {sq.season}
                  </text>
                </g>
              )
            })}
            <circle cx="50" cy="50" r="10" fill="#020617" stroke="#D4AF37" strokeWidth="0.8" />
            <path d="M50,46.5 L51.2,49.5 L54.5,49.5 L51.8,51.5 L52.8,54.5 L50,52.5 L47.2,54.5 L48.2,51.5 L45.5,49.5 L48.8,49.5 Z" fill="#D4AF37" />
          </svg>
          {/* Brillo radial para dar volumen al disco */}
          <div className="pointer-events-none absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle at 35% 28%, rgba(255,255,255,0.18), transparent 55%)" }} />
        </motion.div>
      </div>
      {/* Sombra elíptica bajo el disco */}
      <div className="mx-auto mt-2 h-4 w-44 rounded-[50%] bg-black/50 blur-md" />

      {/* En el bombo: los planteles que se están sorteando, con escudo */}
      <div className="mx-auto mt-4 w-[min(92vw,30rem)]">
        <div className="text-center text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 font-sport">
          En el bombo
        </div>
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {visible.slice(0, 12).map((sq) => (
            <span
              key={`chip-${sq.id}`}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold transition-colors ${
                spinning ? "border-white/5 bg-slate-950/50 text-slate-400" : "border-white/10 bg-slate-900/60 text-slate-300"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/logos/clubs/${sq.clubId}.png`}
                alt=""
                className="h-3.5 w-3.5 object-contain"
                onError={(ev) => ((ev.target as HTMLImageElement).style.visibility = "hidden")}
              />
              {sq.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
