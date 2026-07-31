"use client"

import { motion } from "framer-motion"
import type { GameScore } from "@/lib/scores"
import TierBadge from "@/components/TierBadge"

/**
 * El podio del ranking global.
 *
 * Una tabla de filas iguales no da ganas de pelear el primer puesto: hay que VER la diferencia.
 * El 1° va más grande y más alto, el 2° un escalón abajo, el 3° otro más. En pantalla chica se
 * apilan en el mismo orden, pero conservando el tamaño relativo.
 */
// La diferencia tiene que verse desde lejos: con scale-95 y scale-90 el primero era apenas un 5%
// más grande que el segundo, y un podio que no se lee como podio no da ganas de pelear el primer
// puesto. El escalón también se agranda.
const ESTILOS = [
  { color: "#F6C750", nombre: "Oro", medalla: "🥇", altura: "sm:mt-0", escala: "scale-100" },
  { color: "#C6D2DE", nombre: "Plata", medalla: "🥈", altura: "sm:mt-14", escala: "sm:scale-[0.88]" },
  { color: "#CD7F32", nombre: "Bronce", medalla: "🥉", altura: "sm:mt-24", escala: "sm:scale-[0.8]" },
]

export default function Podio({
  top,
  usuario,
}: {
  top: (GameScore & { seed?: boolean; lema?: string })[]
  usuario?: string
}) {
  if (top.length === 0) return null
  // Orden visual: 2° · 1° · 3°, como un podio de verdad. En mobile queda 1, 2, 3.
  const orden = top.length >= 3 ? [1, 0, 2] : top.map((_, i) => i)

  return (
    <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
      {orden.map((idx) => {
        const s = top[idx]
        if (!s) return null
        const e = ESTILOS[idx]
        const esVos = !!usuario && s.username === usuario
        const primero = idx === 0
        return (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1, type: "spring", stiffness: 140, damping: 16 }}
            className={`${e.altura} ${e.escala} origin-bottom`}
          >
            <div
              className="relative overflow-hidden rounded-3xl border-2 p-4 text-center"
              style={{
                borderColor: `${e.color}66`,
                background: `linear-gradient(180deg, ${e.color}1c, rgba(2,8,19,0.72))`,
                boxShadow: primero ? `0 0 46px ${e.color}33` : `0 0 22px ${e.color}1f`,
              }}
            >
              {primero && (
                <motion.div
                  aria-hidden
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full"
                  style={{ background: `conic-gradient(from 0deg, transparent, ${e.color}22, transparent 40%)` }}
                />
              )}

              <div className={primero ? "text-6xl" : "text-4xl"}>{e.medalla}</div>
              <div
                className="mt-1 font-sport text-[11px] font-black uppercase tracking-[0.22em]"
                style={{ color: e.color }}
              >
                {idx + 1}° · {e.nombre}
              </div>

              <p
                className={`mt-2 truncate font-display font-black text-white ${primero ? "text-2xl" : "text-base"}`}
                title={s.username}
              >
                {s.username}
              </p>

              <div className="mt-1.5 flex items-center justify-center gap-1.5">
                <TierBadge elo={s.elo} />
                {esVos && (
                  <span className="rounded border border-[#74ACDF]/30 bg-[#74ACDF]/10 px-1.5 py-0.5 font-sport text-[11px] font-black uppercase tracking-wider text-[#74ACDF]">
                    Vos
                  </span>
                )}
              </div>

              <div
                className={`mt-3 font-display font-black leading-none ${primero ? "text-6xl" : "text-3xl"}`}
                style={{ color: e.color }}
              >
                {s.elo}
              </div>
              <div className="font-sport text-[11px] uppercase tracking-widest text-slate-400">ELO</div>

              {s.lema && <p className="mt-2 truncate text-[11px] italic text-slate-400">{s.lema}</p>}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
