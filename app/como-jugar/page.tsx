"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useT } from "@/lib/i18n"

const STEPS = [
  {
    title: 'Te toca un plantel histórico',
    text: 'La ruleta sortea un club y una temporada del fútbol argentino.',
    number: '01',
  },
  {
    title: 'Elegís formación',
    text: 'Jugás con 4-3-3, 4-4-2, 4-2-3-1 o 3-5-2.',
    number: '02',
  },
  {
    title: 'Drafteás por posición',
    text: 'Cada slot exige una posición compatible. Un central no puede ir de nueve.',
    number: '03',
  },
  {
    title: 'Simulás la temporada',
    text: 'Tu once compite contra otros planteles históricos y se calcula el rendimiento.',
    number: '04',
  },
]

export default function ComoJugarPage() {
  const t = useT()
  return (
    <div className="min-h-[calc(100vh-6rem)] py-10">
      <section className="mx-auto max-w-4xl text-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-bold uppercase tracking-[0.3em] text-[#75AADB]"
        >
          {t('comojugar.guiaRapida', 'Guía rápida')}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-4 font-display text-4xl font-black text-white md:text-6xl"
        >
          {t('comojugar.comoSeJuega', 'Cómo se juega')}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-4 max-w-2xl text-slate-400"
        >
          Armá el mejor once posible con planteles históricos del fútbol argentino.
          La gracia está en conocer jugadores, elegir bien y bancarse la simulación.
        </motion.p>
      </section>

      <section className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-2">
        {STEPS.map((step, index) => (
          <motion.article
            key={step.title}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.06 }}
            className="card-gradient rounded-2xl p-6"
          >
            <div className="mb-4 text-2xl font-black text-[#75AADB] font-sport">{step.number}</div>
            <h2 className="font-display text-xl font-bold text-white">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{step.text}</p>
          </motion.article>
        ))}
      </section>

      <section className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <h2 className="font-display text-2xl font-black text-white text-center mb-5">
          {t('comojugar.puntajeYQuimica', 'Puntaje y Química')}
        </h2>
        <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            <span className="font-bold text-[#74ACDF]">{t('comojugar.elPuntajeDeTu', 'El puntaje de tu equipo')}</span> combina el
            promedio de rating de tus 11 con la <span className="font-bold text-amber-300">{t('comojugar.quimica', 'química')}</span>.
            No alcanza con juntar cracks sueltos: armar con lógica es lo que te hace competitivo. Llegar
            a 90+ es difícil a propósito.
          </p>
          <p>
            <span className="font-bold text-amber-300">{t('comojugar.laQuimica', 'La química')}</span> premia tres cosas entre jugadores
            cercanos en la cancha: que hayan compartido <span className="text-white">{t('comojugar.club', 'club')}</span>, que sean de
            la misma <span className="text-white">{t('comojugar.nacionalidad', 'nacionalidad')}</span>, y que cada uno juegue en su
            <span className="text-white"> {t('comojugar.puestoNatural', 'puesto natural')}</span>. Un jugador fuera de posición baja la química
            (y el rendimiento).
          </p>
          <p>
            {t('comojugar.laQuimicaNoEs', 'La química no es decorativa:')} <span className="font-bold text-white">{t('comojugar.afectaDeVerdadLa', 'afecta de verdad la simulación')}</span>.
            Un equipo con buena química ataca y defiende mejor, y gana más partidos. Fijate el panel de química
            (las líneas entre jugadores) mientras armás.
          </p>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-3xl rounded-3xl border border-[#75AADB]/15 bg-[#75AADB]/5 p-6 text-center">
        <h2 className="font-display text-2xl font-black text-white">
          {t('comojugar.modosPrincipales', 'Modos principales')}
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href="/draft?mode=clasico" className="btn-primary">
            {t('comojugar.modoClasico', 'Modo Clásico')}
          </Link>
          <Link href="/draft?mode=almanaque" className="btn-secondary">
            {t('comojugar.modoAlmanaque', 'Modo Almanaque')}
          </Link>
          <Link href="/draft?mode=liga" className="btn-secondary">
            {t('comojugar.ligaArgentina', 'Liga Argentina')}
          </Link>
          <Link href="/draft?mode=copa" className="btn-secondary">
            {t('comojugar.copaArgentina', 'Copa Argentina')}
          </Link>
        </div>
      </section>
    </div>
  )
}