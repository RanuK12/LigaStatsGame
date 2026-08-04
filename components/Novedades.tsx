"use client"

import { useState } from "react"
import novedadesData from "@/data/novedades.json"

type Novedad = { fecha: string; titulo: string; texto: string }

const novedades = novedadesData as Novedad[]
const VISIBLES = 3

/**
 * Las últimas novedades del juego, en el home.
 *
 * El home se lleva 2 min 22 s de atención antes de que la gente entre al draft: es donde leen.
 * Que ahí se vea que el juego cambia todas las semanas es lo que hace que valga la pena volver
 * a mirarlo. Se agrega arriba de data/novedades.json y aparece solo.
 */
export default function Novedades() {
  const [abierto, setAbierto] = useState(false)
  const lista = abierto ? novedades : novedades.slice(0, VISIBLES)

  if (novedades.length === 0) return null

  return (
    <section id="novedades" className="relative z-10 max-w-6xl mx-auto px-4 pt-6 scroll-mt-24">
      <div className="relative overflow-hidden rounded-3xl border border-[#E7C27D]/25 bg-gradient-to-r from-[#141026]/90 to-[#050a14]/90 p-5 sm:p-6">
        <div className="banda-argentina absolute inset-x-0 top-0 h-1 opacity-80" />

        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E7C27D] font-sport">
            Novedades
          </span>
          <span className="text-[10px] text-slate-500 font-sport uppercase tracking-wider">
            {fechaCorta(novedades[0].fecha)}
          </span>
        </div>

        <ul className="mt-4 space-y-3.5">
          {lista.map((n) => (
            <li key={n.titulo} className="border-l-2 border-[#E7C27D]/30 pl-3.5">
              <h3 className="font-display text-sm sm:text-base font-black text-white uppercase tracking-tight">
                {n.titulo}
              </h3>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-400 font-sans">{n.texto}</p>
            </li>
          ))}
        </ul>

        {novedades.length > VISIBLES && (
          <button
            onClick={() => setAbierto((v) => !v)}
            className="mt-4 -mx-2 min-h-[44px] rounded-xl px-2 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#74ACDF] font-sport transition-colors hover:bg-white/5 hover:text-white"
          >
            {abierto ? "Ver menos" : `Ver las ${novedades.length} novedades`}
          </button>
        )}
      </div>
    </section>
  )
}

/** "2026-07-31" → "31 jul". Sin Date: el string ya viene normalizado y no hay zona horaria que rompa. */
function fechaCorta(fecha: string): string {
  const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
  const [, mes, dia] = fecha.split("-")
  return `${Number(dia)} ${MESES[Number(mes) - 1] ?? ""}`
}
