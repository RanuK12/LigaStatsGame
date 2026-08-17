"use client"

import { useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import type { MatchChronicle, MatchEvent } from "@/lib/chronicle"
import { useT } from "@/lib/i18n"

/**
 * El relato del partido, evento por evento.
 *
 * Antes cada línea era un recuadro gris con el tipo de evento escrito entre corchetes —"[GOL]",
 * "[AMARILLA]"— y todos pesaban lo mismo: el gol tuyo se leía igual que un saque del medio. Ahora
 * es una línea de tiempo con marcador arriba, que es como se mira un partido: primero el resultado,
 * después qué pasó. El color dice de quién fue antes de leer el texto y el arranque, el entretiempo
 * y el final son separadores, no eventos.
 *
 * Nada de esto simula: el partido ya está jugado y esto solo lo cuenta.
 */

/** Cuántos goles van, contando SOLO lo que ya se reveló: el marcador crece con el relato. */
function marcadorHasta(eventos: MatchEvent[]) {
  return eventos.reduce(
    (a, ev) => {
      if (ev.type !== "gol") return a
      if (ev.team === "propio") a.mios++
      else a.suyos++
      return a
    },
    { mios: 0, suyos: 0 },
  )
}

/** Delay antes de mostrar cada evento (pausa dramática en goles) */
function delayFor(ev: MatchEvent): number {
  if (ev.type === "gol" || ev.type === "penales") return 1500
  if (ev.type === "roja") return 1100
  return 650
}

/** El arranque, el entretiempo y el final no son jugadas: son cortes del partido. */
const ES_CORTE = (t: MatchEvent["type"]) => t === "inicio" || t === "entretiempo" || t === "final"

type Tono = { borde: string; fondo: string; color: string; texto: string }

function tonoDe(ev: MatchEvent): Tono {
  if (ev.type === "gol" && ev.team === "propio")
    return { borde: "border-[#74ACDF]/45", fondo: "bg-[#74ACDF]/[0.10]", color: "text-[#9CCBF0]", texto: "text-white font-semibold" }
  if (ev.type === "gol")
    return { borde: "border-red-500/30", fondo: "bg-red-500/[0.07]", color: "text-red-300", texto: "text-slate-300" }
  if (ev.type === "roja")
    return { borde: "border-red-500/45", fondo: "bg-red-500/[0.10]", color: "text-red-300", texto: "text-red-100" }
  if (ev.type === "amarilla")
    return { borde: "border-amber-400/30", fondo: "bg-amber-400/[0.07]", color: "text-amber-300", texto: "text-slate-300" }
  if (ev.type === "penales")
    return { borde: "border-[#F6C750]/40", fondo: "bg-[#F6C750]/[0.09]", color: "text-[#F6C750]", texto: "text-white font-semibold" }
  return { borde: "border-white/[0.07]", fondo: "bg-white/[0.02]", color: "text-slate-400", texto: "text-slate-300" }
}

/** El dibujito del evento. Inline y chico: son cuatro formas, no hace falta una librería. */
function Glifo({ ev }: { ev: MatchEvent }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const }
  if (ev.type === "amarilla" || ev.type === "roja")
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
        <rect x="4.5" y="2.5" width="7" height="11" rx="1.4" fill="currentColor" />
      </svg>
    )
  if (ev.type === "atajada")
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
        <path d="M8 2.2l4.6 1.7v3.6c0 2.6-1.8 4.7-4.6 5.8-2.8-1.1-4.6-3.2-4.6-5.8V3.9L8 2.2z" {...p} />
      </svg>
    )
  // Los penales van con el arco y no con otra pelota: a 14 píxeles dos círculos con un punto
  // adentro se confunden con el gol, y son las dos cosas que más importan del relato.
  if (ev.type === "penales")
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
        <path d="M2.2 12.8V4.4h11.6v8.4" {...p} />
        <path d="M6.1 4.6v8.2M9.9 4.6v8.2M2.4 8.7h11.2" {...p} strokeWidth={0.9} />
      </svg>
    )
  // Pelota: para el gol y para cualquier cosa que quede suelta.
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
      <circle cx="8" cy="8" r="5.6" {...p} />
      <path d="M8 5.1l1.9 1.4-.7 2.2H6.8l-.7-2.2L8 5.1z" fill="currentColor" stroke="none" />
      <path d="M8 2.4v2.7M12.9 6.2l-2.6 1.9M3.1 6.2l2.6 1.9M6.4 12.9l.7-2.4M9.6 12.9l-.7-2.4" {...p} strokeWidth={0.9} />
    </svg>
  )
}

export default function MatchChronicleFeed({ chronicle, local }: {
  chronicle: MatchChronicle
  /** Cómo se llama tu equipo en el marcador. Sin esto dice "Tu equipo". */
  local?: string
}) {
  const t = useT()
  const reducedMotion = useReducedMotion()
  const [visibleCount, setVisibleCount] = useState(reducedMotion ? chronicle.events.length : 1)
  const done = visibleCount >= chronicle.events.length

  // Reiniciar el relato al cambiar de partido
  useEffect(() => {
    setVisibleCount(reducedMotion ? chronicle.events.length : 1)
  }, [chronicle, reducedMotion])

  useEffect(() => {
    if (done) return
    const next = chronicle.events[visibleCount]
    const t = setTimeout(() => setVisibleCount(c => c + 1), delayFor(next))
    return () => clearTimeout(t)
  }, [visibleCount, done, chronicle])

  const visible = useMemo(() => chronicle.events.slice(0, visibleCount), [chronicle, visibleCount])
  const marcador = useMemo(() => marcadorHasta(visible), [visible])
  const minuto = visible.length ? visible[visible.length - 1].minute : 0
  const yoLocal = chronicle.isHome !== false
  const miNombre = local || t('relato.tuEquipo', 'Tu equipo')

  return (
    <div>
      {/* El marcador, que es lo primero que se mira de un partido */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.05] to-transparent px-4 py-3.5">
        <div className="banda-argentina absolute inset-x-0 top-0 h-[2px] opacity-70" />
        <div className="flex items-center justify-between gap-2">
          <span className="font-sport text-[9px] font-black uppercase tracking-[0.28em] text-slate-500">
            {chronicle.roundLabel || t('relato.partido', 'Partido')}
          </span>
          {!done ? (
            <span className="flex items-center gap-1.5 font-sport text-[9px] font-black uppercase tracking-[0.2em] text-red-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              {minuto}&apos;
            </span>
          ) : (
            <button
              onClick={() => setVisibleCount(chronicle.events.length)}
              className="font-sport text-[9px] font-black uppercase tracking-[0.2em] text-slate-600"
            >
              {t('relato.final', 'Final')}
            </button>
          )}
        </div>

        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <span className={`truncate text-right font-display text-[13px] font-black uppercase leading-tight sm:text-sm ${yoLocal ? 'text-white' : 'text-slate-400'}`}>
            {yoLocal ? miNombre : chronicle.opponent}
          </span>
          <span className="rounded-xl border border-white/[0.08] bg-black/40 px-3 py-1 font-display text-lg font-black tabular-nums text-white sm:text-xl">
            {yoLocal ? marcador.mios : marcador.suyos}
            <span className="mx-1 text-slate-600">-</span>
            {yoLocal ? marcador.suyos : marcador.mios}
          </span>
          <span className={`truncate font-display text-[13px] font-black uppercase leading-tight sm:text-sm ${yoLocal ? 'text-slate-400' : 'text-white'}`}>
            {yoLocal ? chronicle.opponent : miNombre}
          </span>
        </div>

        {!done && (
          <button
            onClick={() => setVisibleCount(chronicle.events.length)}
            className="mt-3 w-full rounded-xl border border-white/[0.07] py-1.5 font-sport text-[9px] font-black uppercase tracking-[0.22em] text-slate-500 transition-colors hover:border-white/20 hover:text-white"
          >
            {t('relato.verTodo', 'Ver el partido entero')}
          </button>
        )}
      </div>

      {/* La línea de tiempo */}
      <div className="relative mt-3 pl-[26px]">
        <div className="absolute bottom-2 left-[7px] top-2 w-px bg-gradient-to-b from-white/[0.12] via-white/[0.07] to-transparent" />
        <div className="space-y-1.5">
          <AnimatePresence initial={false}>
            {visible.map((ev, i) => {
              const tono = tonoDe(ev)
              // Los cortes del partido no son una jugada: van como separador, sin recuadro.
              if (ES_CORTE(ev.type)) {
                return (
                  <motion.div
                    key={i}
                    initial={reducedMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="relative flex items-center gap-3 py-1.5"
                  >
                    <span className="absolute -left-[26px] flex w-[15px] justify-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                    </span>
                    <span className="font-sport text-[9px] font-black uppercase tracking-[0.28em] text-slate-500">
                      {ev.text}
                    </span>
                    <span className="h-px flex-1 bg-white/[0.06]" />
                  </motion.div>
                )
              }
              return (
                <motion.div
                  key={i}
                  initial={reducedMotion ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`relative flex items-start gap-2.5 rounded-xl border px-3 py-2 ${tono.borde} ${tono.fondo}`}
                >
                  {/* El punto sobre la línea de tiempo, del color del evento */}
                  <span className={`absolute -left-[26px] top-3 flex w-[15px] justify-center ${tono.color}`}>
                    <span className="h-[7px] w-[7px] rounded-full bg-current" />
                  </span>
                  <span className="mt-[3px] w-7 shrink-0 text-right font-display text-[10px] font-black tabular-nums text-slate-500">
                    {ev.minute}&apos;
                  </span>
                  <span className={`mt-[1px] shrink-0 rounded-md border border-white/[0.06] bg-black/30 p-1 ${tono.color}`}>
                    <Glifo ev={ev} />
                  </span>
                  <span className={`text-[13px] leading-snug ${tono.texto}`}>{ev.text}</span>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
