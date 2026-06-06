"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import clubsData from '@/data/clubs.json'
import squadsData from '@/data/squads.json'
import { Club, Squad } from '@/lib/types'

const clubs: Club[] = clubsData as Club[]
const squads: Squad[] = squadsData as Squad[]

const MODES = [
  {
    id: 'draft',
    name: 'Draft de Leyendas',
    desc: 'Armá tu 11 con plantels reales por año',
    icon: '⚽',
    href: '/draft?mode=clasico',
    color: 'from-[#75AADB] to-[#4a8ab8]',
    accent: '#75AADB'
  },
  {
    id: 'almanaque',
    name: 'El Almanaque',
    desc: 'Ratings ocultos, gana la memoria',
    icon: '🧠',
    href: '/draft?mode=almanaque',
    color: 'from-amber-600 to-orange-500',
    accent: '#f59e0b'
  },
  {
    id: 'liga',
    name: 'Liga Argentina',
    desc: '2 zonas + playoffs, formato real argentino',
    icon: '🏆',
    href: '/draft?mode=liga',
    color: 'from-green-600 to-emerald-500',
    accent: '#10b981'
  },
  {
    id: 'copa',
    name: 'Copa Argentina',
    desc: 'Eliminación directa, batacazos y penales',
    icon: '🏅',
    href: '/draft?mode=copa',
    color: 'from-yellow-600 to-amber-500',
    accent: '#eab308'
  }
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
}

const clubCardVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
}

export default function HomePage() {
  const [hoveredClub, setHoveredClub] = useState<string | null>(null)
  const totalClubs = clubs.length
  const totalSquads = squads.length

  return (
    <div className="gradient-bg min-h-screen">
      {/* Header */}
      <header className="relative z-10 border-b border-[rgba(117,170,219,0.12)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logos/afa/afa.svg"
              alt="AFA Logo"
              width={48}
              height={48}
              className="drop-shadow-lg"
            />
            <Image
              src="/logos/afa/liga.svg"
              alt="Liga Logo"
              width={40}
              height={40}
              className="drop-shadow-lg"
            />
            <div className="ml-2">
              <h1 className="font-display text-2xl sm:text-3xl font-bold gradient-text leading-tight">
                Liga Argentina Fans
              </h1>
              <p className="text-[#75AADB]/60 text-xs sm:text-sm font-medium tracking-wide">
                El Draft del Fútbol Argentino
              </p>
            </div>
          </div>
          <Link
            href="/draft?mode=clasico"
            className="btn-primary text-sm sm:text-base"
          >
            Jugar Ahora ⚽
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center"
        >
          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
            Armá tu{' '}
            <span className="gradient-text">Equipo Soñado</span>
          </h2>
          <p className="text-[#75AADB]/70 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
            Elegí entre los mejores jugadores del fútbol argentino.
            Desafía a tus amigos con los modos de juego más picantes.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto mb-16"
        >
          <motion.div variants={itemVariants} className="card-gradient rounded-2xl p-5 text-center">
            <div className="text-3xl sm:text-4xl font-display font-bold text-white">
              {totalClubs}
            </div>
            <div className="text-[#75AADB]/60 text-sm mt-1">Clubes</div>
          </motion.div>
          <motion.div variants={itemVariants} className="card-gradient rounded-2xl p-5 text-center">
            <div className="text-3xl sm:text-4xl font-display font-bold text-white">
              {totalSquads}
            </div>
            <div className="text-[#75AADB]/60 text-sm mt-1">Plantel por Año</div>
          </motion.div>
          <motion.div variants={itemVariants} className="card-gradient rounded-2xl p-5 text-center">
            <div className="text-3xl sm:text-4xl font-display font-bold text-[#75AADB]">
              4
            </div>
            <div className="text-[#75AADB]/60 text-sm mt-1">Modos de Juego</div>
          </motion.div>
          <motion.div variants={itemVariants} className="card-gradient rounded-2xl p-5 text-center">
            <div className="text-3xl sm:text-4xl font-display font-bold text-[#75AADB]">
              11
            </div>
            <div className="text-[#75AADB]/60 text-sm mt-1">Titulares</div>
          </motion.div>
        </motion.div>
      </section>

      {/* Game Modes */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
            Modos de Juego
          </h3>
          <p className="text-[#75AADB]/60 text-base max-w-lg mx-auto">
            Elegí tu formato favorito y demostrá quién la tiene más clara
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {MODES.map((mode) => (
            <motion.div key={mode.id} variants={itemVariants}>
              <Link href={mode.href} className="block group">
                <div className="card-hover rounded-2xl overflow-hidden h-full">
                  <div className={`bg-gradient-to-br ${mode.color} p-1 rounded-2xl`}>
                    <div className="bg-[#0a1e33] rounded-[14px] p-6 h-full flex flex-col">
                      <div className="text-5xl mb-4">{mode.icon}</div>
                      <h4 className="font-display text-xl font-bold text-white mb-2 group-hover:text-[#75AADB] transition-colors">
                        {mode.name}
                      </h4>
                      <p className="text-[#75AADB]/50 text-sm flex-1">
                        {mode.desc}
                      </p>
                      <div className="mt-5 flex items-center gap-2 text-sm font-semibold" style={{ color: mode.accent }}>
                        <span>Jugar</span>
                        <motion.span
                          className="inline-block"
                          initial={{ x: 0 }}
                          whileHover={{ x: 5 }}
                        >
                          →
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Club Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
            Clubes Disponibles
          </h3>
          <p className="text-[#75AADB]/60 text-base max-w-lg mx-auto">
            Todos los equipos de la Liga Argentina con sus plantillas históricas
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3"
        >
          {clubs.map((club) => (
            <motion.div
              key={club.id}
              variants={clubCardVariants}
              onMouseEnter={() => setHoveredClub(club.id)}
              onMouseLeave={() => setHoveredClub(null)}
            >
              <div className="card-gradient rounded-xl p-3 flex flex-col items-center justify-center aspect-square cursor-pointer group transition-all duration-300 hover:border-[#75AADB]/30">
                <div className="relative w-12 h-12 sm:w-14 sm:h-14 mb-2">
                  <Image
                    src={`/logos/clubs/${club.id}.svg`}
                    alt={club.name}
                    fill
                    className="object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                    sizes="(max-width: 640px) 48px, 56px"
                  />
                </div>
                <span className="text-[10px] sm:text-xs text-[#75AADB]/70 text-center font-medium leading-tight line-clamp-2 group-hover:text-white transition-colors">
                  {club.name}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="card-gradient rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#75AADB]/10 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="text-5xl mb-4">⚽</div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-3">
              ¿Listo para armar tu equipo?
            </h3>
            <p className="text-[#75AADB]/60 text-base mb-8 max-w-md mx-auto">
              Elegí un modo de juego y empezá a crear el mejor once de la historia del fútbol argentino
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/draft?mode=clasico" className="btn-primary text-base">
                Draft Clásico ⚽
              </Link>
              <Link
                href="/draft?mode=liga"
                className="px-6 py-3 rounded-xl border border-[rgba(117,170,219,0.25)] text-[#75AADB] font-semibold hover:bg-[#75AADB]/10 transition-all duration-300 text-base"
              >
                Liga Argentina 🏆
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[rgba(117,170,219,0.12)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logos/afa/afa.svg"
                alt="AFA"
                width={28}
                height={28}
                className="opacity-50"
              />
              <span className="text-[#75AADB]/40 text-sm font-display font-medium">
                Liga Argentina Fans © 2026 — Fútbol Argentino
              </span>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/draft?mode=clasico"
                className="text-[#75AADB]/40 hover:text-[#75AADB] text-sm transition-colors"
              >
                Jugar
              </Link>
              <Link
                href="/draft?mode=liga"
                className="text-[#75AADB]/40 hover:text-[#75AADB] text-sm transition-colors"
              >
                Liga
              </Link>
              <Link
                href="/draft?mode=copa"
                className="text-[#75AADB]/40 hover:text-[#75AADB] text-sm transition-colors"
              >
                Copa
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
