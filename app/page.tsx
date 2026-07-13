"use client"

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import clubsData from '@/data/clubs.json'
import squadsData from '@/data/squads.json'
import type { Club, Squad } from '@/lib/types'

const clubs: Club[] = clubsData as Club[]
const squads: Squad[] = squadsData as Squad[]

/* ─── GAME MODES ─────────────────────────────────────────────── */
const MODES = [
  {
    id: 'draft',
    name: 'Draft de Leyendas',
    desc: 'Armá tu XI elegiendo de planteles reales año por año',
    icon: '⚽',
    href: '/draft?mode=clasico',
    gradient: 'from-[#74ACDF]/20 via-[#4A90D9]/10 to-transparent',
    border: 'rgba(116,172,223,0.4)',
    glow: 'rgba(116,172,223,0.25)',
    accent: '#74ACDF',
    badge: 'CLÁSICO',
    badgeColor: 'bg-[#74ACDF]/20 text-[#a8ccec] border-[#74ACDF]/30',
    emoji: '🏟️',
  },
  {
    id: 'almanaque',
    name: 'El Almanaque',
    desc: 'Ratings ocultos, gana quien recuerda mejor la historia',
    icon: '🧠',
    href: '/draft?mode=almanaque',
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    border: 'rgba(245,158,11,0.4)',
    glow: 'rgba(245,158,11,0.25)',
    accent: '#f59e0b',
    badge: 'MEMORIA',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    emoji: '📖',
  },
  {
    id: 'liga',
    name: 'Liga Argentina',
    desc: '2 zonas + playoffs, sistema de puntos, campeonato real',
    icon: '🏆',
    href: '/draft?mode=liga',
    gradient: 'from-emerald-600/20 via-green-500/10 to-transparent',
    border: 'rgba(16,185,129,0.4)',
    glow: 'rgba(16,185,129,0.25)',
    accent: '#10b981',
    badge: 'TORNEO',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    emoji: '⚡',
  },
  {
    id: 'copa',
    name: 'Copa Argentina',
    desc: 'Eliminación directa, todo o nada — penales incluidos',
    icon: '🏅',
    href: '/draft?mode=copa',
    gradient: 'from-yellow-500/20 via-amber-400/10 to-transparent',
    border: 'rgba(234,179,8,0.4)',
    glow: 'rgba(234,179,8,0.25)',
    accent: '#eab308',
    badge: 'COPA',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    emoji: '🎯',
  },
]

/* ─── TICKER ITEMS ───────────────────────────────────────────── */
const TICKER_ITEMS = [
  "🇦🇷  MUNDIAL 2026 — ARGENTINA VA POR LA 4TA",
  "⚽  LIGA PROFESIONAL TEMPORADA 2026 — EN CURSO",
  "🏆  DRAFT DE LEYENDAS — ARMÁ TU MEJOR 11 HISTÓRICO",
  "🥇  CAMPEONES DEL MUNDO: 1978 · 1986 · 2022",
  "🎯  COPA ARGENTINA — ELIMINACIÓN DIRECTA · PENALES INCLUIDOS",
  "⭐  +1600 JUGADORES · +200 PLANTELES · 4 MODOS DE JUEGO",
  "🇦🇷  VAMOS ARGENTINA — BUSCAMOS LA 4TA ESTRELLA",
]

/* ─── WORLD CUP CHAMPIONS ────────────────────────────────────── */
const WC_CHAMPIONS = [
  { year: '1978', caption: 'Argentina – Buenos Aires', icon: '⭐' },
  { year: '1986', caption: 'Maradona – Ciudad de México', icon: '⭐' },
  { year: '2022', caption: 'Messi – Qatar', icon: '⭐' },
]

/* ─── FRAMER VARIANTS ────────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}
const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

/* ═══════════════════════════════════════════════════════════════
   TICKER STRIP
   ═══════════════════════════════════════════════════════════════ */
function TickerStrip() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]
  return (
    <div className="ticker-strip py-2 overflow-hidden">
      <div className="animate-ticker flex gap-12 text-xs font-semibold tracking-wide uppercase text-[#74ACDF]/80">
        {items.map((t, i) => (
          <span key={i} className="flex-shrink-0">{t}</span>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   WORLD CUP BANNER
   ═══════════════════════════════════════════════════════════════ */
function WorldCupBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-14"
    >
      <div className="relative rounded-3xl overflow-hidden border border-[rgba(212,175,55,0.28)] shadow-[0_0_60px_rgba(212,175,55,0.12)]">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/LigaStatsGame/img/mundial_banner.jpg')" }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#040D18]/92 via-[#071422]/80 to-[#040D18]/92" />
        {/* Argentine stripe accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#74ACDF] via-white to-[#74ACDF]" />
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#74ACDF] via-white to-[#74ACDF]" />

        <div className="relative z-10 px-6 py-10 sm:py-14 flex flex-col lg:flex-row items-center gap-8 justify-between">
          {/* Left: text */}
          <div className="text-center lg:text-left">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2 mb-4">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-red-400">En Curso · Mundial 2026</span>
            </div>

            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-none mb-2">
              ¡VAMOS{' '}
              <span className="gradient-text-gold">ARGENTINA!</span>
            </h2>
            <p className="text-[#74ACDF] text-xl sm:text-2xl font-bold mb-6">
              🏆 Por la 4<sup>ta</sup> Copa del Mundo
            </p>

            {/* Stars row */}
            <div className="flex items-center gap-3 mb-6 justify-center lg:justify-start">
              {['1978', '1986', '2022'].map((y, i) => (
                <motion.div
                  key={y}
                  initial={{ scale: 0, rotate: -20 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.12, type: 'spring', stiffness: 200 }}
                  className="flex flex-col items-center"
                >
                  <motion.span
                    className="text-3xl"
                    animate={{ rotate: [0, 8, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 3 + i * 0.5, ease: 'easeInOut' }}
                  >⭐</motion.span>
                  <span className="text-[10px] font-bold text-[#D4AF37] mt-0.5">{y}</span>
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.65, type: 'spring', stiffness: 150 }}
                className="flex flex-col items-center opacity-40"
              >
                <span className="text-3xl filter grayscale">⭐</span>
                <span className="text-[10px] font-bold text-slate-400 mt-0.5">2026?</span>
              </motion.div>
            </div>

            <Link href="/draft?mode=clasico"
              className="btn-gold text-base font-black px-8 py-3.5 rounded-2xl shadow-[0_0_30px_rgba(212,175,55,0.4)]">
              ⚽ Armá tu 11 y clasificá
            </Link>
          </div>

          {/* Right: stats */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs shrink-0">
            {[
              { label: 'Años de Gloria', value: '3', sub: 'Mundiales' },
              { label: 'Mejor Jugador', value: '#10', sub: 'El Diego · La Pulga' },
              { label: 'Clubes en DB', value: `${clubs.length}`, sub: 'Históricos' },
              { label: 'Planteles', value: `${squads.length}`, sub: 'Por temporada' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="card-gold rounded-2xl p-4 text-center"
              >
                <div className="text-2xl font-black gradient-text-gold">{s.value}</div>
                <div className="text-[10px] text-[#D4AF37]/80 font-semibold mt-0.5">{s.label}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{s.sub}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MODE CARD
   ═══════════════════════════════════════════════════════════════ */
function ModeCard({ mode, index }: { mode: typeof MODES[0]; index: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <motion.div
      variants={item}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-full"
    >
      <Link href={mode.href} className="block h-full group">
        <div
          className="mode-card h-full flex flex-col"
          style={{
            background: `linear-gradient(145deg, rgba(13,33,55,0.85) 0%, rgba(8,18,35,0.95) 100%)`,
            border: `1px solid ${hovered ? mode.border : 'rgba(116,172,223,0.12)'}`,
            boxShadow: hovered ? `0 20px 60px ${mode.glow}, 0 0 0 1px ${mode.border}` : '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          {/* Color bar top */}
          <div className="h-1 w-full rounded-t-[inherit]" style={{ background: mode.accent }} />

          <div className="p-6 flex flex-col flex-1">
            {/* Badge + Icon row */}
            <div className="flex items-start justify-between mb-5">
              <div className={`text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest ${mode.badgeColor}`}>
                {mode.badge}
              </div>
              <motion.div
                className="text-4xl"
                animate={hovered ? { scale: 1.2, rotate: [-5, 5, 0] } : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.4 }}
              >
                {mode.emoji}
              </motion.div>
            </div>

            {/* Icon big */}
            <motion.div
              className="text-5xl mb-4"
              animate={hovered ? { y: -4 } : { y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {mode.icon}
            </motion.div>

            <h4 className="font-display text-xl font-black text-white mb-2 group-hover:text-white transition-colors">
              {mode.name}
            </h4>
            <p className="text-slate-400 text-sm flex-1 leading-relaxed group-hover:text-slate-300 transition-colors">
              {mode.desc}
            </p>

            {/* CTA row */}
            <div className="mt-6 flex items-center gap-2 text-sm font-bold" style={{ color: mode.accent }}>
              <span>Jugar ahora</span>
              <motion.span
                animate={hovered ? { x: 6 } : { x: 0 }}
                transition={{ duration: 0.25 }}
                className="inline-block"
              >→</motion.span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════════════════════════ */
function HeroSection() {
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
      {/* Ambient glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#74ACDF]/8 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="text-center relative"
      >
        {/* Sub-badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 bg-[#74ACDF]/10 border border-[#74ACDF]/20 rounded-full px-4 py-1.5 mb-6"
        >
          <span className="text-sm">🇦🇷</span>
          <span className="text-xs font-bold text-[#74ACDF] uppercase tracking-widest">El Draft del Fútbol Argentino</span>
        </motion.div>

        <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-5">
          Armá tu{' '}
          <span className="gradient-text">Equipo</span>
          <br />
          <span className="gradient-text">Soñado</span>
        </h2>

        <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Elegí de los mejores planteles del fútbol argentino por año.
          Simulá torneos con <strong className="text-[#74ACDF]">estadísticas reales</strong> y demostrá que sos el que más sabe.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
          <Link href="/draft?mode=clasico"
            className="btn-primary text-base px-8 py-4 rounded-2xl text-lg font-black shadow-[0_0_30px_rgba(116,172,223,0.35)]">
            ⚽ Jugar Ahora
          </Link>
          <Link href="/draft?mode=liga"
            className="btn-secondary text-base px-7 py-4 rounded-2xl text-base font-bold">
            🏆 Liga Argentina
          </Link>
        </div>

        {/* Stats row */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto"
        >
          {[
            { val: clubs.length, label: 'Clubes', icon: '🏟️' },
            { val: squads.length, label: 'Planteles', icon: '📋' },
            { val: 4, label: 'Modos', icon: '🎮' },
            { val: 11, label: 'Titulares', icon: '👕' },
          ].map((s, i) => (
            <motion.div
              key={i}
              variants={item}
              whileHover={{ y: -4, scale: 1.02 }}
              className="card-gradient rounded-2xl py-5 px-3 text-center cursor-default"
            >
              <div className="text-xl mb-1">{s.icon}</div>
              <div className="text-3xl sm:text-4xl font-display font-black text-white">{s.val}</div>
              <div className="text-[#74ACDF]/60 text-xs mt-1 font-medium">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CLUB GRID
   ═══════════════════════════════════════════════════════════════ */
function ClubGrid() {
  const [hovered, setHovered] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const filtered = filter
    ? clubs.filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
    : clubs

  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <motion.div
        variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="text-center mb-8"
      >
        <h3 className="font-display text-3xl sm:text-4xl font-black text-white mb-3">
          Clubes <span className="gradient-text">Disponibles</span>
        </h3>
        <p className="text-slate-400 text-base max-w-lg mx-auto mb-6">
          Todos los equipos históricos de la Liga Argentina con sus plantillas reales
        </p>
        {/* Search */}
        <div className="relative max-w-xs mx-auto">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Buscar club..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700 text-white text-sm placeholder-slate-500 focus:border-[#74ACDF]/50 focus:outline-none focus:ring-1 focus:ring-[#74ACDF]/20 transition-all"
          />
        </div>
      </motion.div>

      <motion.div
        variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }}
        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5"
      >
        {filtered.map((club) => (
          <motion.div
            key={club.id}
            variants={item}
            whileHover={{ scale: 1.12, zIndex: 10 }}
            onMouseEnter={() => setHovered(club.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className={`relative rounded-xl p-3 flex flex-col items-center justify-center aspect-square cursor-pointer transition-all duration-250 ${
              hovered === club.id
                ? 'bg-[#74ACDF]/15 border border-[#74ACDF]/40 shadow-lg shadow-[#74ACDF]/15'
                : 'card-gradient border border-transparent'
            }`}>
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 mb-1.5">
                <Image
                  src={`/LigaStatsGame/logos/clubs/${club.id}.png`}
                  alt={club.name}
                  fill
                  className={`object-contain drop-shadow-md transition-all duration-250 ${hovered === club.id ? 'scale-110' : ''}`}
                  sizes="(max-width: 640px) 44px, 48px"
                />
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-400 text-center font-medium leading-tight line-clamp-2 group-hover:text-white transition-colors">
                {club.shortName || club.name}
              </span>
              {/* Tooltip */}
              <AnimatePresence>
                {hovered === club.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 bg-slate-900 border border-[#74ACDF]/30 rounded-lg px-2.5 py-1.5 whitespace-nowrap pointer-events-none shadow-xl"
                  >
                    <p className="text-xs font-bold text-white">{club.name}</p>
                    <p className="text-[10px] text-slate-400">{club.titles} títulos · {club.stadium}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <p className="text-center text-slate-500 py-8">No se encontró ningún club con ese nombre</p>
      )}
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   HOW TO PLAY (mini section)
   ═══════════════════════════════════════════════════════════════ */
function HowToPlay() {
  const steps = [
    { n: '01', title: 'Elegí la posición', desc: 'Seleccionás qué posición querés sortear — arquero, defensa, mediocampista o delantero.', icon: '🎯' },
    { n: '02', title: 'Girás la ruleta', desc: 'Te toca un equipo real de la Liga Argentina con su año de temporada.', icon: '🎰' },
    { n: '03', title: 'Elegís un jugador', desc: 'De ese plantel tomás UN solo jugador compatible con la posición.', icon: '👕' },
    { n: '04', title: 'Simulás el torneo', desc: 'Con tu XI armado simulás la Liga o Copa y ves estadísticas individuales.', icon: '📊' },
  ]
  return (
    <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
        <h3 className="font-display text-3xl sm:text-4xl font-black text-white mb-3">Cómo <span className="gradient-text">Jugar</span></h3>
        <p className="text-slate-400 text-base max-w-lg mx-auto">4 pasos y sos el DT más capo del Argentina</p>
      </motion.div>
      <motion.div
        variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {steps.map((s, i) => (
          <motion.div key={i} variants={item} whileHover={{ y: -5 }}
            className="relative card-gradient rounded-2xl p-6 border border-slate-700/50 hover:border-[#74ACDF]/25 transition-all duration-300"
          >
            <div className="text-4xl mb-4">{s.icon}</div>
            <div className="absolute top-4 right-5 text-5xl font-black text-slate-800 font-display select-none">{s.n}</div>
            <h4 className="font-display font-black text-white text-lg mb-2">{s.title}</h4>
            <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
            {i < 3 && (
              <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-[#74ACDF]/40 text-2xl">→</div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CTA SECTION
   ═══════════════════════════════════════════════════════════════ */
function CTASection() {
  return (
    <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative rounded-3xl overflow-hidden border border-[#74ACDF]/20 shadow-[0_0_80px_rgba(116,172,223,0.1)]"
      >
        {/* Decorative bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#74ACDF]/8 via-transparent to-[#4A90D9]/6" />
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#74ACDF]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#4A90D9]/5 rounded-full blur-3xl" />

        {/* Argentine stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#74ACDF] via-white via-40% to-[#74ACDF]" />

        <div className="relative z-10 px-8 py-14 sm:py-20 text-center card-gradient">
          <motion.div
            className="text-6xl mb-6 inline-block"
            animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          >⚽</motion.div>
          <h3 className="font-display text-3xl sm:text-5xl font-black text-white mb-4">
            ¿Listo para armar tu{' '}
            <span className="gradient-text">once soñado</span>?
          </h3>
          <p className="text-slate-400 text-base sm:text-lg mb-10 max-w-md mx-auto">
            Elegí un modo de juego y empezá a crear el mejor once de la historia del fútbol argentino
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/draft?mode=clasico" className="btn-primary text-lg px-10 py-4 rounded-2xl font-black">
              ⚽ Draft Clásico
            </Link>
            <Link href="/draft?mode=liga" className="btn-secondary text-base px-8 py-4 rounded-2xl font-bold">
              🏆 Liga Argentina
            </Link>
            <Link href="/draft?mode=copa" className="btn-secondary text-base px-8 py-4 rounded-2xl font-bold">
              🏅 Copa Argentina
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  return (
    <div className="gradient-bg arg-stripe-bg min-h-screen">
      {/* ── TOP TICKER ── */}
      <TickerStrip />

      {/* ── HERO ── */}
      <HeroSection />


      {/* ── WORLD CUP BANNER ── */}
      <WorldCupBanner />

      {/* ── GAME MODES ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="font-display text-3xl sm:text-4xl font-black text-white mb-3">
            Modos de <span className="gradient-text">Juego</span>
          </h3>
          <p className="text-slate-400 text-base max-w-lg mx-auto">
            Elegí tu formato y demostrá quién la tiene más clara en el fútbol argentino
          </p>
        </motion.div>

        <motion.div
          variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {MODES.map((mode, i) => (
            <ModeCard key={mode.id} mode={mode} index={i} />
          ))}
        </motion.div>
      </section>

      {/* ── HOW TO PLAY ── */}
      <HowToPlay />

      {/* ── EXTRA LINKS ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { href: '/como-jugar', title: 'Cómo se juega', text: 'Aprendé el flujo del draft, las posiciones y la simulación.', icon: '📘', color: 'border-blue-500/20 hover:border-blue-400/40' },
            { href: '/records', title: 'Records Históricos', text: 'Rankings de ratings, goleadores y leyendas de la base actual.', icon: '📚', color: 'border-amber-500/20 hover:border-amber-400/40' },
            { href: '/daily', title: 'Reto del Día', text: 'El desafío diario compartido — el mismo sorteo para todos.', icon: '🔥', color: 'border-red-500/20 hover:border-red-400/40' },
          ].map((item, i) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
            >
              <Link href={item.href} className="group block h-full">
                <div className={`card-gradient rounded-2xl p-6 h-full transition-all duration-300 border ${item.color} hover:shadow-lg`}>
                  <div className="text-3xl mb-3">{item.icon}</div>
                  <h4 className="font-display text-lg font-black text-white group-hover:text-[#74ACDF] transition-colors mb-2">
                    {item.title}
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
                  <div className="mt-4 text-[#74ACDF]/60 text-sm font-semibold group-hover:text-[#74ACDF] transition-colors">
                    Ver más →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CLUB GRID ── */}
      <ClubGrid />

      {/* ── CTA ── */}
      <CTASection />

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-[rgba(116,172,223,0.10)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <Image src="/LigaStatsGame/logos/afa.png" alt="AFA" width={28} height={28} className="opacity-40" />
              <div>
                <span className="text-[#74ACDF]/40 text-sm font-display font-bold block">
                  Liga Argentina Fans
                </span>
                <span className="text-slate-600 text-xs">© 2026 · El Draft del Fútbol Argentino</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-600 text-xs mr-2">Campeones del Mundo</span>
              {['⭐1978', '⭐1986', '⭐2022'].map((y, i) => (
                <span key={i} className="badge-gold text-[10px]">{y}</span>
              ))}
            </div>
            <div className="flex items-center gap-6">
              {[
                { href: '/draft?mode=clasico', label: 'Draft' },
                { href: '/draft?mode=liga', label: 'Liga' },
                { href: '/draft?mode=copa', label: 'Copa' },
                { href: '/records', label: 'Records' },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="text-[#74ACDF]/40 hover:text-[#74ACDF] text-sm transition-colors font-medium">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-slate-600 text-xs">
              🇦🇷 Hecho con pasión para los hinchas del fútbol argentino · Temporada 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
