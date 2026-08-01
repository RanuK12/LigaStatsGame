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
import { loadDaily, completadoHoy, bonusForStreak, DAILY_BASE_ELO, DAILY_MAX_ELO } from "@/lib/daily-progress"
import { useUserStore } from "@/lib/user-store"

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
  // TODO lo que depende de la fecha se calcula DESPUÉS de montar. El sitio se genera estático
  // desde un servidor que puede estar en otro día que el usuario: calcularlo durante el render
  // hacía que el HTML del servidor y el del navegador no coincidieran, y React redibujaba la
  // página entera del lado del cliente (errores 418/423/425 en producción).
  const [today, setToday] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)
  const user = useUserStore((s) => s.user)
  const [progreso, setProgreso] = useState<{ hecho: boolean; streak: number }>({ hecho: false, streak: 0 })
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    setToday(localYmd())
    setCountdown(msUntilNextDay())
    const t = setInterval(() => setCountdown(msUntilNextDay()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const p = loadDaily()
    setProgreso({ hecho: completadoHoy(p), streak: p.streak })
  }, [])

  const desafiar = async () => {
    const c = challengeForDate(localYmd())
    const url = `https://gambetafutbol.games/draft?mode=clasico&reto=${c.id}`
    const texto = `Reto de hoy en Gambeta: ${c.title}. ${c.rule}\n\nMismo bombo para los dos. A ver quién arma el mejor 11.\n\n${url}`
    try {
      if (navigator.share) await navigator.share({ text: texto })
      else {
        await navigator.clipboard.writeText(texto)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 1800)
      }
    } catch {
      /* el usuario canceló */
    }
  }

  if (!today) {
    return (
      <div className="min-h-[calc(100vh-6rem)] px-4 py-10">
        <section className="relative z-10 mx-auto max-w-2xl">
          <div className="h-[420px] animate-pulse rounded-3xl border border-white/5 bg-slate-950/40" />
        </section>
      </div>
    )
  }

  const challenge = challengeForDate(today)
  const number = challengeNumber()
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

          {/* Premio: el reto suma al ranking */}
          <div className="mx-auto mt-6 flex max-w-md flex-wrap items-center justify-center gap-2">
            <span className="rounded-full border border-[#74ACDF]/40 bg-[#74ACDF]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#74ACDF] font-sport">
              ⚡ +{bonusForStreak(progreso.streak + (progreso.hecho ? 0 : 1))} ELO al completarlo
            </span>
            {progreso.streak > 0 && (
              <span className="rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-300 font-sport">
                🔥 Racha de {progreso.streak} {progreso.streak === 1 ? "día" : "días"}
              </span>
            )}
          </div>

          {progreso.hecho ? (
            <div className="mt-6">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-5 py-3 text-emerald-300">
                <span className="text-lg">✅</span>
                <span className="font-sport text-[11px] font-black uppercase tracking-widest">Reto de hoy completado</span>
              </div>
              <Link
                href={`/draft?mode=clasico&reto=${challenge.id}`}
                className="btn-secondary mt-4 block px-10 py-3 text-xs font-black uppercase tracking-widest"
              >
                Volver a jugarlo (sin bono)
              </Link>
            </div>
          ) : (
            <Link
              href={`/draft?mode=clasico&reto=${challenge.id}`}
              className="btn-primary mt-6 inline-block px-10 py-4 text-xs font-black uppercase tracking-widest"
            >
              Jugar el reto
            </Link>
          )}

          {!user?.isLoggedIn && (
            <p className="mt-4 text-[11px] text-amber-300/90 font-sport uppercase tracking-wider">
              Ingresá para que el bono sume a tu ELO del ranking
            </p>
          )}

          {/* Desafiar a alguien con el MISMO reto. Todo lo que se compartía llevaba al home, así
              que el que abría el link jugaba otra cosa y no había con qué compararse. */}
          <button
            onClick={desafiar}
            className="mx-auto mt-5 flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-2.5 font-sport text-[11px] font-black uppercase tracking-widest text-slate-300 transition-colors hover:border-[#74ACDF]/40 hover:text-white"
          >
            {copiado ? "¡Link copiado!" : "Desafiar a un amigo"}
          </button>
          <p className="mt-1.5 font-sans text-[11px] text-slate-500">
            Le llega el mismo bombo que a vos. Después comparan.
          </p>
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

        {/* Cómo suma al ranking */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-sport text-[11px] font-black uppercase tracking-widest text-[#74ACDF]">
            Cómo suma al ranking
          </h3>
          <ul className="mt-3 space-y-2 text-[12px] text-slate-300 font-sans leading-relaxed">
            <li>
              <strong className="text-white">+{DAILY_BASE_ELO} ELO</strong> la primera vez que completás el reto del día
              (armás el 11 con la consigna y simulás el torneo).
            </li>
            <li>
              <strong className="text-white">+3 ELO por cada día de racha</strong>, hasta {DAILY_MAX_ELO} ELO. Si te
              salteás un día, la racha vuelve a empezar.
            </li>
            <li>El bono es uno por día y se suma a los puntos que ya deja el torneo en la tabla de líderes.</li>
          </ul>
          <Link
            href="/leaderboard"
            className="mt-4 inline-block text-[11px] font-black uppercase tracking-widest text-[#74ACDF] font-sport hover:text-white transition-colors"
          >
            Ver la tabla de líderes →
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500 font-sans">
          Un reto nuevo cada día · el mismo para todos · a las 00:00 rota solo.
        </p>
      </section>
    </div>
  )
}
