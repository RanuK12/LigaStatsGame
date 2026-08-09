"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import SolDeMayo from "@/components/ui/SolDeMayo"
import { agruparEnFechas, tablaHasta } from "@/lib/fechas"
import type { ScheduleMatch } from "@/lib/types"

/**
 * El torneo corriéndose fecha por fecha, delante del que juega.
 *
 * Antes de esto, tocar "Simular Liga" calculaba las 27 fechas en un milisegundo y saltaba directo
 * a la tabla final. Se sentía como abrir un archivo, no como jugar un torneo: no había un solo
 * momento de "¿cómo vamos?". El modo carrera ya tenía su `SeasonProgress`, pero ahí las fases son
 * un cartel que corre solo; acá tenemos los RESULTADOS de verdad.
 *
 * Y con la tabla, que es lo que hace que sea un campeonato y no una lista de partidos. La tabla
 * se acumula fecha a fecha con los mismos resultados que ya calculó el motor —ver `lib/fechas`—,
 * así que la posición que se ve mientras corre es la posición real en la que ibas.
 *
 * Esto no simula ni cambia nada: solo revela lo que pasó. Tocando la pantalla se saltea.
 */

/** Cuánto dura el reveal entero, sin importar cuántas fechas sean. */
const DURACION_MS = 5200
const MIN_MS = 130
const MAX_MS = 620

export default function TorneoEnVivo({
  partidos,
  equipos,
  equipo,
  torneo,
  onListo,
}: {
  /** Los partidos ya jugados. En la liga, TODOS los de la zona; en copa, los del usuario. */
  partidos: ScheduleMatch[]
  /** Los equipos de la liga. Con esto se arma el fixture y la tabla; sin esto, es una lista. */
  equipos?: string[]
  equipo: string
  torneo: string
  onListo: () => void
}) {
  const conTabla = !!equipos && equipos.length > 2

  // Las fechas: en la liga cada equipo juega una vez por fecha; en copa, un partido por ronda.
  const fechas = useMemo(
    () => (conTabla ? agruparEnFechas(partidos, equipos!) : partidos.map((m) => [m])),
    [partidos, equipos, conTabla],
  )

  const [jugadas, setJugadas] = useState(0)
  const listo = useRef(false)

  const cadencia = useMemo(
    () => Math.min(MAX_MS, Math.max(MIN_MS, Math.round(DURACION_MS / Math.max(1, fechas.length)))),
    [fechas.length],
  )

  // Se termina una sola vez: el intervalo y el salto por toque compiten por el mismo final.
  const terminar = () => {
    if (listo.current) return
    listo.current = true
    onListo()
  }

  useEffect(() => {
    if (fechas.length === 0) {
      terminar()
      return
    }
    const t = setInterval(() => {
      setJugadas((n) => {
        if (n + 1 >= fechas.length) {
          clearInterval(t)
          // Un respiro para leer la última fecha antes de que aparezca el resultado.
          setTimeout(terminar, 800)
        }
        return Math.min(n + 1, fechas.length)
      })
    }, cadencia)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechas, cadencia])

  const esMio = (m: ScheduleMatch) => m.home === equipo || m.away === equipo
  const mios = fechas.flat().slice(0, undefined).filter(esMio)
  const miosJugados = fechas.slice(0, jugadas).flat().filter(esMio)

  const tally = miosJugados.reduce(
    (a, m) => {
      const local = m.home === equipo
      const gf = local ? m.homeGoals : m.awayGoals
      const gc = local ? m.awayGoals : m.homeGoals
      a.gf += gf
      a.gc += gc
      if (gf > gc) a.g++
      else if (gf === gc) a.e++
      else a.p++
      return a
    },
    { g: 0, e: 0, p: 0, gf: 0, gc: 0 },
  )

  const tabla = conTabla ? tablaHasta(fechas, jugadas, equipos!) : []
  const miPuesto = tabla.findIndex((f) => f.nombre === equipo) + 1
  // Los de arriba y tu fila, aunque estés vigésimo: la pregunta es en qué puesto vas.
  const visibles = conTabla
    ? [...tabla.slice(0, 4), ...(miPuesto > 4 ? [tabla[miPuesto - 1]] : [])].filter(Boolean)
    : []

  const ultimos = [...miosJugados].slice(-3).reverse()
  const pct = Math.round((jugadas / Math.max(1, fechas.length)) * 100)

  return (
    <div
      onClick={terminar}
      className="fixed inset-0 z-[115] flex cursor-pointer items-center justify-center overflow-y-auto bg-[#02050d]/93 px-4 py-6 backdrop-blur-sm"
    >
      <SolDeMayo spin opacity={0.07} className="pointer-events-none absolute h-[560px] w-[560px]" />

      <div className="panel-in relative my-auto w-full max-w-sm rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1728] to-[#050a14] p-5 shadow-2xl">
        <div className="banda-argentina absolute inset-x-0 top-0 h-1 rounded-t-3xl opacity-80" />

        <div className="text-center">
          <div className="font-sport text-[10px] font-black uppercase tracking-[0.3em] text-[#74ACDF]">{torneo}</div>
          <div className="mt-1 font-impact text-3xl font-black leading-none text-white">
            {conTabla ? `Fecha ${Math.max(1, jugadas)}` : `${miosJugados.length}/${mios.length}`}
            {conTabla && <span className="text-slate-600">/{fechas.length}</span>}
          </div>
          {conTabla && miPuesto > 0 && jugadas > 0 && (
            <div className="mt-1 font-sport text-[11px] font-bold uppercase tracking-wider text-[#F6C750]">
              Vas {miPuesto}º de {tabla.length}
            </div>
          )}
        </div>

        {/* El balance, que es la pregunta que uno se hace mientras corre: ¿cómo vamos? */}
        <div className="mt-4 grid grid-cols-4 gap-1.5 text-center font-sport">
          {[
            { v: tally.g, l: "G", c: "text-emerald-300" },
            { v: tally.e, l: "E", c: "text-slate-300" },
            { v: tally.p, l: "P", c: "text-red-300" },
            { v: `${tally.gf}:${tally.gc}`, l: "Goles", c: "text-[#F6C750]" },
          ].map((x) => (
            <div key={x.l} className="rounded-xl border border-white/[0.06] bg-black/25 px-1 py-2">
              <div className={`font-display text-lg font-black leading-none ${x.c}`}>{x.v}</div>
              <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">{x.l}</div>
            </div>
          ))}
        </div>

        {/* Tus resultados, con el color diciendo cómo salió antes de que se lea el número */}
        <div className="mt-3 min-h-[112px] space-y-1.5">
          {ultimos.map((m, i) => {
            const local = m.home === equipo
            const rival = local ? m.away : m.home
            const gf = local ? m.homeGoals : m.awayGoals
            const gc = local ? m.awayGoals : m.homeGoals
            const tono =
              gf > gc
                ? "border-emerald-400/30 bg-emerald-500/[0.09] text-emerald-200"
                : gf === gc
                  ? "border-white/10 bg-white/[0.03] text-slate-300"
                  : "border-red-400/25 bg-red-500/[0.07] text-red-200"
            return (
              <div
                key={`${m.home}-${m.away}-${i}`}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${tono} ${i === 0 ? "resultado-in" : "opacity-60"}`}
              >
                <span className="font-sport text-[9px] font-black uppercase tracking-wider opacity-60">
                  {local ? "L" : "V"}
                </span>
                <span className="flex-1 truncate font-sans text-[11px]">{rival}</span>
                <span className="font-display text-sm font-black tabular-nums">
                  {gf}-{gc}
                </span>
              </div>
            )
          })}
        </div>

        {/* La tabla en vivo: sin esto son partidos sueltos, con esto es un campeonato */}
        {conTabla && jugadas > 0 && (
          <div className="mt-3 rounded-2xl border border-white/[0.07] bg-black/25 p-3">
            <div className="font-sport text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
              Tabla
            </div>
            <div className="mt-2 space-y-1">
              {visibles.map((fila) => {
                const puesto = tabla.indexOf(fila) + 1
                const soyYo = fila.nombre === equipo
                return (
                  <div
                    key={fila.nombre}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1 ${
                      soyYo ? "bg-[#74ACDF]/15 text-white" : "text-slate-400"
                    }`}
                  >
                    <span
                      className={`w-4 shrink-0 text-right font-display text-[11px] font-black ${
                        puesto === 1 ? "text-[#F6C750]" : "text-slate-500"
                      }`}
                    >
                      {puesto}
                    </span>
                    <span className={`flex-1 truncate font-sans text-[11px] ${soyYo ? "font-bold" : ""}`}>
                      {fila.nombre}
                    </span>
                    <span className="font-display text-[11px] font-black tabular-nums">{fila.pts}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#74ACDF] to-[#F6C750] transition-[width] duration-200 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-3 text-center font-sport text-[9px] font-bold uppercase tracking-[0.25em] text-slate-600">
          Tocá para ver el resultado
        </p>
      </div>
    </div>
  )
}
