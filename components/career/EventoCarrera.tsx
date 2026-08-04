"use client"

import { AnimatePresence, motion } from "framer-motion"
import type { CareerDecision } from "@/lib/career-engine"
import { effectLabelFor } from "@/lib/career-engine"

/**
 * El momento de decidir, como un momento y no como un panel.
 *
 * Antes cada decisión —la pretemporada, la sustancia, los barras— era un bloque fijo en la
 * pantalla: aparecía y se quedaba ahí temporada tras temporada, sin que nada indicara que
 * había que resolverlo ni que ya estaba resuelto. Se leía como algo roto.
 *
 * Ahora interrumpe: aparece, se decide, se va. Es lo que hace El Ídolo con sus tres tipos de
 * evento —golpe duro, decisión difícil, pasan cosas— y es la razón por la que su carrera se
 * siente jugada en vez de configurada.
 */

export type TonoEvento = "duro" | "dificil" | "raro"

const TONOS: Record<TonoEvento, { volanta: string; color: string; borde: string; fondo: string; icono: string }> = {
  duro: {
    volanta: "Golpe duro",
    color: "#F87171",
    borde: "border-red-400/45",
    fondo: "from-[#2a0d10]/95 to-slate-950/97",
    icono: "💥",
  },
  dificil: {
    volanta: "Decisión difícil",
    color: "#74ACDF",
    borde: "border-[#74ACDF]/45",
    fondo: "from-[#0b1a2e]/95 to-slate-950/97",
    icono: "🧠",
  },
  raro: {
    volanta: "Pasan cosas",
    color: "#C084FC",
    borde: "border-purple-400/45",
    fondo: "from-[#1b0e2b]/95 to-slate-950/97",
    icono: "🌀",
  },
}

export interface EventoPendiente {
  decision: CareerDecision
  tono: TonoEvento
}

export default function EventoCarrera({
  evento,
  posicion,
  onElegir,
}: {
  evento: EventoPendiente | null
  /** La posición del jugador: "+Goles" no le dice lo mismo a un arquero que a un 9. */
  posicion: string
  onElegir: (optionId: string) => void
}) {
  const t = evento ? TONOS[evento.tono] : TONOS.dificil

  return (
    <AnimatePresence>
      {evento && (
        <motion.div
          className="fixed inset-0 z-[125] flex items-start justify-center overflow-y-auto overscroll-contain p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{ background: "rgba(2,4,10,0.82)", backdropFilter: "blur(6px)" }}
        >
          <motion.div
            className={`relative my-auto w-[420px] max-w-[94vw] rounded-3xl border bg-gradient-to-b ${t.borde} ${t.fondo} p-6 text-center shadow-2xl`}
            initial={{ scale: 0.86, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: -12, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
          >
            {/* El ícono entra girando: es lo que hace que se sienta un golpe y no un formulario. */}
            <motion.div
              className="mx-auto mb-2 text-4xl"
              initial={{ scale: 0, rotate: -35 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.08 }}
            >
              {t.icono}
            </motion.div>

            <div className="font-sport text-[10px] font-black uppercase tracking-[0.35em]" style={{ color: t.color }}>
              {t.volanta}
            </div>
            <h3 className="mt-1 font-display text-xl font-black uppercase leading-tight text-white">
              {evento.decision.title}
            </h3>
            <p className="mx-auto mt-2 max-w-sm text-[12px] leading-relaxed text-slate-300">
              {evento.decision.description}
            </p>

            <div className="mt-5 space-y-2.5 font-sport">
              {evento.decision.options.map((opt, i) => (
                <motion.button
                  key={opt.id}
                  onClick={() => onElegir(opt.id)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.14 + i * 0.07 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-slate-950/70 p-3.5 text-left text-xs font-bold text-slate-200 transition-colors hover:border-white/35 hover:text-white"
                >
                  <span className="min-w-0 flex-1">{opt.label}</span>
                  <span className="shrink-0 text-right text-[10px] font-bold" style={{ color: t.color }}>
                    {effectLabelFor(opt.effectDescription, posicion)}
                  </span>
                </motion.button>
              ))}
            </div>

            <p className="mt-4 text-[10px] leading-snug text-slate-500">
              No hay opción sin costo. Elegí y seguí.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
