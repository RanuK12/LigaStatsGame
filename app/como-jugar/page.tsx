"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'

const STEPS = [
  {
    title: 'Te toca un plantel histórico',
    text: 'La ruleta sortea un club y una temporada del fútbol argentino.',
    icon: '🎰',
  },
  {
    title: 'Elegís formación',
    text: 'Jugás con 4-3-3, 4-4-2, 4-2-3-1 o 3-5-2.',
    icon: '📋',
  },
  {
    title: 'Drafteás por posición',
    text: 'Cada slot exige una posición compatible. Un central no puede ir de nueve.',
    icon: '⚽',
  },
  {
    title: 'Simulás la temporada',
    text: 'Tu once compite contra otros planteles históricos y se calcula el rendimiento.',
    icon: '🏆',
  },
]

export default function ComoJugarPage() {
  return (
    <div className="min-h-[calc(100vh-6rem)] py-10">
      <section className="mx-auto max-w-4xl text-center">
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-bold uppercase tracking-[0.3em] text-[#75AADB]"
        >
          Guía rápida
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mt-4 font-display text-4xl font-black text-white md:text-6xl"
        >
          Cómo se juega
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
            <div className="mb-4 text-4xl">{step.icon}</div>
            <h2 className="font-display text-xl font-bold text-white">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{step.text}</p>
          </motion.article>
        ))}
      </section>

      <section className="mx-auto mt-10 max-w-3xl rounded-3xl border border-[#75AADB]/15 bg-[#75AADB]/5 p-6 text-center">
        <h2 className="font-display text-2xl font-black text-white">
          Modos principales
        </h2>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link href="/draft?mode=clasico" className="btn-primary">
            Clásico ⚽
          </Link>
          <Link href="/draft?mode=almanaque" className="btn-secondary">
            Almanaque 🧠
          </Link>
          <Link href="/draft?mode=liga" className="btn-secondary">
            Liga Argentina 🏆
          </Link>
          <Link href="/draft?mode=copa" className="btn-secondary">
            Copa Argentina 🏅
          </Link>
        </div>
      </section>
    </div>
  )
}