"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  challengeForDate,
  challengeNumber,
  localYmd,
  msUntilNextDay,
  type Difficulty,
} from "@/lib/daily-challenge"

const DIFF_STYLE: Record<Difficulty, string> = {
  Fácil: "text-emerald-300 border-emerald-400/40 bg-emerald-500/10",
  Media: "text-[#74ACDF] border-[#74ACDF]/40 bg-[#74ACDF]/10",
  Difícil: "text-orange-300 border-orange-400/40 bg-orange-500/10",
  Leyenda: "text-[#D4AF37] border-[#D4AF37]/40 bg-[#D4AF37]/10",
}

function fmt(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(s / 3600)).padStart(2, "0")
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0")
  const sec = String(s % 60).padStart(2, "0")
  return `${h}:${m}:${sec}`
}

export default function DailyPage() {
  // Se calcula en cliente para que ancle al día real del usuario y rote solo.
  const [today] = useState(() => localYmd())
  const challenge = challengeForDate(today)
  const number = challengeNumber()
  const [countdown, setCountdown] = useState(() => msUntilNextDay())

  useEffect(() => {
    const t = setInterval(() => setCountdown(msUntilNextDay()), 1000)
    return () => clearInterval(t)
  }, [])

  const fecha = new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })

  return (
    <div className="min-h-[calc(100vh-6rem)] px-4 py-10">
      {/* glow ambiente */}
      <div className="pointer-events-none absolute left-1/2 top-24 -z-0 h-72 w-[560px] -translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl" />

      <section className="relative z-10 mx-auto max-w-2xl">
        {/* encabezado */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-1.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-orange-500" />
            </span>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-300 font-sport">
              Reto Diario · #{number}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 font-display text-4xl font-black uppercase tracking-wider text-white md:text-6xl"
          >
            El Reto del Día
          </motion.h1>
          <p className="mt-2 text-sm capitalize text-slate-400 font-sans">{fecha}</p>
        </div>

        {/* tarjeta del reto */}
        <motion.div
          key={challenge.id}
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 140, damping: 16 }}
          className="relative mt-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-slate-950/80 p-8 text-center shadow-2xl backdrop-blur-md"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 text-[120px] opacity-[0.06] select-none">
            {challenge.icon}
          </div>

          <div className="text-6xl drop-shadow-[0_4px_16px_rgba(212,175,55,0.25)]">{challenge.icon}</div>

          <div
            className={`mt-4 inline-block rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest font-sport ${DIFF_STYLE[challenge.difficulty]}`}
          >
            {challenge.difficulty}
          </div>

          <h2 className="mt-4 font-display text-3xl font-black uppercase tracking-wide text-white">{challenge.title}</h2>
          <p className="mx-auto mt-3 max-w-md text-slate-300 leading-relaxed font-sans">{challenge.rule}</p>

          <Link
            href={`/draft?mode=clasico&reto=${challenge.id}`}
            className="btn-primary mt-7 inline-block px-10 py-4 text-xs font-black uppercase tracking-widest"
          >
            Jugar el reto
          </Link>
        </motion.div>

        {/* countdown al próximo reto */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-6 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-400 font-sport">
            Próximo reto en
          </span>
          <span className="font-display text-2xl font-black tabular-nums text-white tracking-widest">
            {fmt(countdown)}
          </span>
        </motion.div>

        <p className="mt-6 text-center text-xs text-slate-500 font-sans">
          Un reto nuevo cada día · el mismo para todos · a las 00:00 rota solo.
        </p>
      </section>
    </div>
  )
}
