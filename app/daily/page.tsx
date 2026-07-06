"use client"

import Link from 'next/link'
import { motion } from 'framer-motion'

function getDailySeed() {
  const today = new Date().toISOString().slice(0, 10)
  return today.replaceAll('-', '')
}

export default function DailyPage() {
  const seed = getDailySeed()

  return (
    <div className="min-h-[calc(100vh-6rem)] py-10">
      <section className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-orange-400/30 bg-orange-500/10 text-5xl"
        >
          🔥
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-bold uppercase tracking-[0.3em] text-orange-300"
        >
          Seed diario #{seed}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 font-display text-4xl font-black text-white md:text-6xl"
        >
          Reto diario
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mx-auto mt-4 max-w-2xl text-slate-400"
        >
          Próximamente todos van a jugar con el mismo sorteo del día:
          mismo plantel, mismas restricciones y ranking compartido.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="mx-auto mt-8 max-w-xl rounded-3xl border border-orange-400/20 bg-orange-500/5 p-6"
        >
          <h2 className="font-display text-2xl font-black text-white">
            Mientras tanto, jugá el modo Clásico
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            El reto diario queda conectado cuando tengamos la base histórica ampliada
            y un generador determinístico de sorteos.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/draft?mode=clasico" className="btn-primary">
              Jugar clásico ⚽
            </Link>
            <Link href="/como-jugar" className="btn-secondary">
              Cómo se juega
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}