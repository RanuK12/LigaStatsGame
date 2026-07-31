"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { challengeForDate, challengeNumber, localYmd, msUntilNextDay } from "@/lib/daily-challenge"
import { loadDaily, completadoHoy, bonusForStreak } from "@/lib/daily-progress"

/**
 * El reto de hoy, arriba de todo en el home.
 *
 * Es el único motivo que tiene el juego para que alguien vuelva mañana, y estaba escondido en
 * /daily: de 640 usuarios en 28 días, ninguno volvió. Lo que engancha no es el reto sino la
 * RACHA, así que es lo que más grande se muestra.
 *
 * Todo sale de localStorage, así que se arma después del montaje: en el server no hay racha que
 * mostrar y pintarla en el HTML daría un número equivocado durante un instante.
 */
export default function DailyCard() {
  const [datos, setDatos] = useState<{ streak: number; hecho: boolean } | null>(null)
  const [faltan, setFaltan] = useState("")

  useEffect(() => {
    const p = loadDaily()
    setDatos({ streak: p.streak, hecho: completadoHoy(p) })
  }, [])

  useEffect(() => {
    const tic = () => {
      const ms = msUntilNextDay()
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      setFaltan(h > 0 ? `${h} h ${m} min` : `${m} min`)
    }
    tic()
    const id = setInterval(tic, 60000)
    return () => clearInterval(id)
  }, [])

  const reto = challengeForDate(localYmd())
  const streak = datos?.streak ?? 0
  const hecho = datos?.hecho ?? false

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 pt-6">
      <div className="relative overflow-hidden rounded-3xl border border-[#74ACDF]/25 bg-gradient-to-r from-[#0c1728]/90 to-[#050a14]/90 p-5 sm:p-6">
        <div className="banda-argentina absolute inset-x-0 top-0 h-1 opacity-80" />

        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          {/* Qué hay que hacer hoy */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#74ACDF] font-sport">
                Reto diario #{challengeNumber()}
              </span>
              {hecho && (
                <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-300 font-sport">
                  ✓ Hecho
                </span>
              )}
            </div>
            <h3 className="mt-1.5 font-display text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              {reto.icon} {reto.title}
            </h3>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400 font-sans">{reto.rule}</p>
            <p className="mt-1.5 text-[10px] text-slate-500 font-sport uppercase tracking-wider">
              {hecho ? `Cambia en ${faltan}` : `Te quedan ${faltan} · +${bonusForStreak(streak + 1)} ELO`}
            </p>
          </div>

          {/* La racha: lo que se pierde si no volvés */}
          <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2.5">
            <div className="text-center sm:text-right">
              <div className="font-display text-3xl font-black leading-none text-white">
                {streak > 0 ? "🔥" : "·"} {streak}
              </div>
              <div className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500 font-sport">
                {streak === 1 ? "día seguido" : "días seguidos"}
              </div>
            </div>
            <Link
              href="/daily"
              className="btn-primary whitespace-nowrap px-6 py-3 text-[11px] font-black uppercase tracking-widest font-sport rounded-2xl"
            >
              {hecho ? "Ver el reto" : streak > 0 ? "Seguir la racha" : "Jugar"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
