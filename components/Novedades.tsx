"use client"

import { useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import novedadesData from "@/data/novedades.json"

/**
 * Una novedad, con a dónde se prueba lo que cuenta.
 *
 * `href` y `cta` son opcionales porque no toda novedad tiene una pantalla propia, pero cuando la
 * tiene el botón cambia todo: antes la sección contaba que existía el reto diario y el que lo
 * leía tenía que ir a buscarlo al menú. Contar algo sin dar la puerta es la mitad del trabajo.
 */
type Novedad = { fecha: string; titulo: string; texto: string; href?: string; cta?: string }

const novedades = novedadesData as Novedad[]
const VISIBLES = 4

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

        {/* Cada novedad es una tarjeta, no un renglón con una rayita al costado: se lee que
            son cosas distintas y las nuevas se distinguen de las de hace dos semanas. */}
        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {lista.map((n, i) => {
              const nueva = n.fecha === novedades[0].fecha
              return (
                <motion.li
                  key={n.titulo}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ delay: Math.min(i, VISIBLES) * 0.05 }}
                  whileHover={{ y: -3 }}
                  className={`group relative overflow-hidden rounded-2xl border p-3.5 transition-colors ${
                    nueva
                      ? "border-[#E7C27D]/40 bg-gradient-to-b from-[#E7C27D]/[0.09] to-transparent"
                      : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                  }`}
                >
                  {/* El resplandor que cruza al pasar el mouse: cuesta cero y hace que la
                      tarjeta se sienta viva en vez de un cuadro de texto. */}
                  <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent transition-[left] duration-700 group-hover:left-full" />
                  {nueva && (
                    <span className="font-sport mb-1 inline-block rounded-full bg-[#E7C27D]/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-[#E7C27D]">
                      Nuevo
                    </span>
                  )}
                  <h3 className="font-display text-sm font-black uppercase tracking-tight text-white sm:text-base">
                    {n.titulo}
                  </h3>
                  <p className="mt-1 font-sans text-[12px] leading-relaxed text-slate-400">{n.texto}</p>
                  {n.href && (
                    <Link
                      href={n.href}
                      className="font-sport relative mt-2.5 inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#74ACDF]/30 bg-[#74ACDF]/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#9CCBF0] transition-colors hover:border-[#74ACDF] hover:bg-[#74ACDF]/20 hover:text-white"
                    >
                      {n.cta || "Probarlo"}
                      <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                    </Link>
                  )}
                </motion.li>
              )
            })}
          </AnimatePresence>
        </ul>

        {novedades.length > VISIBLES && (
          <button
            onClick={() => setAbierto((v) => !v)}
            className="font-sport mt-4 flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-[#74ACDF] transition-colors hover:border-[#74ACDF]/40 hover:bg-white/5 hover:text-white"
          >
            {abierto ? "Ver menos" : `Ver las ${novedades.length} novedades`}
            <motion.span animate={{ rotate: abierto ? 180 : 0 }} transition={{ duration: 0.25 }} className="inline-block">
              ▾
            </motion.span>
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
