"use client"

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import clubsData from '@/data/clubs.json'
import squadsData from '@/data/squads.json'
import type { Club, Squad } from '@/lib/types'
import LiveScoresWidget from '@/components/LiveScoresWidget'
import DonationSection from '@/components/DonationSection'

const clubs: Club[] = clubsData as Club[]
const squads: Squad[] = squadsData as Squad[]

/* ─── GAME MODES ─────────────────────────────────────────────── */
const MODES = [
  {
    id: 'draft',
    name: 'Draft de Leyendas',
    desc: 'Armá tu XI de ensueño eligiendo de planteles reales año por año',
    initials: 'DL',
    href: '/draft?mode=clasico',
    gradient: 'from-[#74ACDF]/20 via-[#4A90D9]/10 to-transparent',
    border: 'rgba(116,172,223,0.4)',
    glow: 'rgba(116,172,223,0.25)',
    accent: '#74ACDF',
    badge: 'CLÁSICO',
    badgeColor: 'bg-[#74ACDF]/20 text-[#a8ccec] border-[#74ACDF]/30',
  },
  {
    id: 'almanaque',
    name: 'El Almanaque',
    desc: 'Ratings ocultos, gana la memoria al recordar la historia de los planteles',
    initials: 'EA',
    href: '/draft?mode=almanaque',
    gradient: 'from-amber-500/20 via-orange-500/10 to-transparent',
    border: 'rgba(245,158,11,0.4)',
    glow: 'rgba(245,158,11,0.25)',
    accent: '#f59e0b',
    badge: 'MEMORIA',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  {
    id: 'liga',
    name: 'Liga Argentina',
    desc: 'Competí en el campeonato tradicional de la Liga Profesional',
    initials: 'LA',
    href: '/draft?mode=liga',
    gradient: 'from-emerald-600/20 via-green-500/10 to-transparent',
    border: 'rgba(16,185,129,0.4)',
    glow: 'rgba(16,185,129,0.25)',
    accent: '#10b981',
    badge: 'LPF',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'copa',
    name: 'Copa Argentina',
    desc: 'El torneo más federal de eliminación directa con definiciones por penales',
    initials: 'CA',
    href: '/draft?mode=copa',
    gradient: 'from-yellow-500/20 via-amber-400/10 to-transparent',
    border: 'rgba(234,179,8,0.4)',
    glow: 'rgba(234,179,8,0.25)',
    accent: '#eab308',
    badge: 'COPA',
    badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  },
  {
    id: 'versus',
    name: 'Duelo Versus (Local)',
    desc: 'Armá tu 11 y competí contra un amigo en el mismo dispositivo',
    initials: 'VS',
    href: '/versus',
    gradient: 'from-purple-500/20 via-pink-450/10 to-transparent',
    border: 'rgba(168,85,247,0.4)',
    glow: 'rgba(168,85,247,0.25)',
    accent: '#a855f7',
    badge: 'AMIGOS',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
]

/* ─── TICKER ITEMS ───────────────────────────────────────────── */
const TICKER_ITEMS = [
  "MUNDIAL 2026 — ARGENTINA BUSCA LA 4TA ESTRELLA",
  "LIGA PROFESIONAL TEMPORADA 2026 — ACTUALIZADO",
  "GAMBETA — ARMÁ TU MEJOR ONCE HISTÓRICO",
  "CAMPEONES DE AMÉRICA Y DEL MUNDO EN LA BASE",
  "COPA ARGENTINA — MODO DE ELIMINACIÓN DIRECTA ACTIVADO",
  "+3600 JUGADORES REALES · 168 PLANTELES FILTRADOS",
]

/* ─── FRAMER VARIANTS ────────────────────────────────────────── */
const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
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
    <div className="ticker-strip py-3 overflow-hidden bg-[#020813]/60">
      <div className="animate-ticker flex gap-16 text-[10px] font-bold tracking-widest uppercase text-[#74ACDF]/70 font-sport">
        {items.map((t, i) => (
          <span key={i} className="flex-shrink-0 flex items-center gap-2">
            <svg className="w-2.5 h-2.5 text-[#D4AF37] fill-current" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
            </svg>
            <span>{t}</span>
          </span>
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
      className="relative z-10 max-w-6xl mx-auto px-4 mb-14"
    >
      <div className="relative card-glass overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/mundial_2026_banner.jpg')" }}
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020813]/92 via-[#050f21]/75 to-[#020813]/92" />
        
        {/* Flag borders */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#74ACDF] via-white to-[#74ACDF]" />
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#74ACDF] via-white to-[#74ACDF]" />

        <div className="relative z-10 px-8 py-12 sm:py-16 flex flex-col lg:flex-row items-center gap-8 justify-between">
          {/* Left: text */}
          <div className="text-center lg:text-left">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2 mb-4 justify-center lg:justify-start">
              <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-[9px] font-black uppercase tracking-widest text-red-400 font-sport">MUNDIAL 2026</span>
              </div>
              <div className="inline-flex items-center bg-[#74ACDF]/15 border border-[#74ACDF]/30 px-3 py-1 rounded-full">
                <span className="text-[9px] font-bandera tracking-[0.16em] text-white">LAS MALVINAS SON ARGENTINAS</span>
              </div>
            </div>

            <h2 className="font-bandera text-4xl sm:text-5xl lg:text-6xl text-white leading-none mb-2 uppercase tracking-[0.12em]">
              VAMOS{' '}
              <span className="gradient-text-gold">ARGENTINA</span>
            </h2>
            <p className="text-[#74ACDF] text-lg sm:text-xl font-bold mb-6 tracking-wide uppercase font-sport">
              Por la 4ta Copa del Mundo
            </p>

            {/* Stars row */}
            <div className="flex items-center gap-4 mb-8 justify-center lg:justify-start">
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
                    className="text-2xl text-[#D4AF37]"
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4 + i, ease: 'easeInOut' }}
                  >★</motion.span>
                  <span className="text-[9px] font-bold text-[#D4AF37] mt-1 font-sport">{y}</span>
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.65, type: 'spring', stiffness: 150 }}
                className="flex flex-col items-center opacity-30"
              >
                <span className="text-2xl text-slate-400">★</span>
                <span className="text-[9px] font-bold text-slate-400 mt-1 font-sport">2026</span>
              </motion.div>
            </div>

            <Link href="/draft?mode=clasico" className="btn-gold px-8 py-4 rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.25)]">
              ARMÁ TU 11 Y CLASIFICÁ
            </Link>
          </div>

          {/* Right: stats (unificadas y sin duplicar) */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs shrink-0">
            {[
              { label: 'Jugadores en DB', value: '2.995', sub: 'Estadísticas Reales' },
              { label: 'Planteles', value: `${squads.length}`, sub: 'Temporadas Oficiales' },
              { label: 'Clubes', value: `${clubs.length}`, sub: 'Primera & Ascenso' },
              { label: 'Mundiales', value: '3', sub: 'Ganados por Argentina' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="card-gold rounded-2xl p-4 text-center border border-[#ffd700]/15"
              >
                <div className="text-2xl font-black gradient-text-gold font-display">{s.value}</div>
                <div className="text-[9px] text-[#D4AF37] font-bold mt-0.5 uppercase tracking-wider font-sport">{s.label}</div>
                <div className="text-[9px] text-slate-400 mt-0.5 font-medium">{s.sub}</div>
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
              className="mode-card card-glass h-full flex flex-col"
          style={{
            border: `1px solid ${hovered ? mode.border : 'rgba(116,172,223,0.1)'}`,
            boxShadow: hovered ? `0 16px 36px ${mode.glow}` : '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          {/* Color bar top */}
          <div className="h-[2px] w-full" style={{ background: mode.accent }} />

          <div className="p-6 flex flex-col flex-1">
            {/* Badge row */}
            <div className="flex items-start justify-between mb-5">
              <div className={`text-[9px] font-bold px-2 py-0.5 rounded border tracking-widest font-sport uppercase ${mode.badgeColor}`}>
                {mode.badge}
              </div>
            </div>

            {/* Custom styled FUT-like badge with LPF integration */}
            <div className="flex items-center justify-between mb-4">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center font-sport text-xs font-bold border transition-all duration-300"
                style={{
                  background: hovered ? mode.accent : 'rgba(116, 172, 223, 0.05)',
                  color: hovered ? '#020813' : mode.accent,
                  borderColor: hovered ? mode.accent : 'rgba(116, 172, 223, 0.15)',
                  boxShadow: hovered ? `0 0 15px ${mode.glow}` : 'none'
                }}
              >
                {mode.initials}
              </div>
              {mode.id === 'liga' && (
                <div className="relative w-7 h-10 shrink-0">
                  <Image src="/logos/lpf.png" alt="LPF" fill className="object-contain" />
                </div>
              )}
            </div>

            <h4 className="font-display text-lg font-bold text-white mb-2 tracking-tight group-hover:text-white transition-colors">
              {mode.name}
            </h4>
            <p className="text-slate-400 text-xs flex-1 leading-relaxed group-hover:text-slate-300 transition-colors font-sans">
              {mode.desc}
            </p>

            {/* CTA row */}
            <div className="mt-6 flex items-center gap-1.5 text-[9px] font-bold tracking-widest font-sport uppercase" style={{ color: mode.accent }}>
              <span>JUGAR AHORA</span>
              <motion.span
                animate={hovered ? { x: 5 } : { x: 0 }}
                transition={{ duration: 0.2 }}
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
    <section className="relative z-10 max-w-6xl mx-auto px-4 pt-16 pb-16 sm:pt-20">
      {/* Fondo: grid de cancha sutil + glows pulsantes */}
      <div
        className="absolute inset-0 -z-10 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(116,172,223,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(116,172,223,0.5) 1px, transparent 1px)',
          backgroundSize: '54px 54px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 30%, black, transparent)',
        }}
      />
      {/* Glows animados por CSS (no compiten con la RAF de framer-motion). */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[620px] h-[300px] bg-gradient-to-b from-[#74ACDF]/20 to-transparent rounded-full blur-3xl pointer-events-none -z-10 anim-glow" />
      <div className="absolute top-20 right-10 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none -z-10 anim-glow-slow" />

      <motion.div
        initial={{ y: -16 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="text-center relative"
      >
        {/* Top Official Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="inline-flex items-center gap-2.5 bg-gradient-to-r from-[#74ACDF]/15 via-blue-500/10 to-[#74ACDF]/15 border border-[#74ACDF]/30 rounded-full px-5 py-2 mb-6 shadow-[0_0_20px_rgba(116,172,223,0.15)]"
        >
          <span className="relative w-4 h-5 inline-block shrink-0">
            <Image src="/logos/lpf.png" alt="LPF" fill className="object-contain" />
          </span>
          <span className="text-[11px] font-bold text-white uppercase tracking-[0.2em] font-sport">
            GAMBETA · EL JUEGO DEL FÚTBOL ARGENTINO
          </span>
        </motion.div>

        {/* Hero Title */}
        <h1 className="font-impact text-[3.4rem] leading-[0.95] sm:text-7xl lg:text-[7.5rem] lg:leading-[0.9] mb-6 tracking-[-0.02em] font-black">
          <span className="block text-white drop-shadow-[0_2px_30px_rgba(255,255,255,0.15)]">ARMÁ TU</span>
          <span className="hero-title-grad block">EQUIPO SOÑADO</span>
        </h1>

        <p className="text-slate-300/90 text-base sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-sans font-medium">
          Drafteá los mejores planteles del fútbol argentino, simulá tu carrera y competí con
          <span className="text-white font-semibold"> estadísticas reales</span> temporada por temporada.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 font-sport">
          <Link href="/draft?mode=clasico" className="btn-primary px-9 py-4 text-xs font-bold tracking-widest uppercase shadow-[0_4px_30px_rgba(116,172,223,0.25)] hover:scale-[1.02] transition-transform">
            DRAFT CLÁSICO 11
          </Link>
          <Link href="/draft?mode=liga" className="btn-secondary px-8 py-4 text-xs font-bold tracking-widest uppercase flex items-center gap-2.5 hover:scale-[1.02] transition-transform">
            <span className="relative w-4 h-5 inline-block shrink-0">
              <Image src="/logos/lpf.png" alt="LPF" fill className="object-contain" />
            </span>
            JUGAR LIGA ARGENTINA
          </Link>
        </div>

        {/* Métricas: se muestran una sola vez en el World Cup Banner (evita duplicar stats). */}
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
    <section className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
      <motion.div
        variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="text-center mb-8"
      >
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2 uppercase tracking-tight">
          Clubes <span className="gradient-text">Disponibles</span>
        </h3>
        <p className="text-slate-400 text-xs max-w-md mx-auto mb-6">
          Todos los equipos de la Liga Profesional Argentina con sus plantillas reales
        </p>
        {/* Search */}
        <div className="relative max-w-xs mx-auto">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="BUSCAR CLUB..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="input-field pl-9 py-2.5 text-xs tracking-wider font-sport"
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
            whileHover={{ scale: 1.1, zIndex: 10 }}
            onMouseEnter={() => setHovered(club.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className={`relative rounded-xl p-3 flex flex-col items-center justify-center aspect-square cursor-pointer transition-all duration-200 ${
              hovered === club.id
                ? 'bg-[#74ACDF]/10 border border-[#74ACDF]/30 shadow-lg'
                : 'card-gradient border border-transparent'
            }`}>
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 mb-2">
                <Image
                  src={`/logos/clubs/${club.id}.png`}
                  alt={club.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 640px) 40px, 44px"
                />
              </div>
              <span className="text-[9px] text-slate-400 text-center font-bold uppercase tracking-wider font-sport truncate w-full">
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
                    className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 whitespace-nowrap pointer-events-none shadow-xl text-center"
                  >
                    <p className="text-[10px] font-bold text-white font-sport uppercase tracking-wider">{club.name}</p>
                    <p className="text-[9px] text-slate-500 font-sans mt-0.5">{club.titles} títulos · {club.stadium}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <p className="text-center text-xs text-slate-600 py-8 font-sans font-medium">No se encontró ningún club con ese nombre</p>
      )}
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   HOW TO PLAY (mini section)
   ═══════════════════════════════════════════════════════════════ */
function HowToPlay() {
  const steps = [
    { n: '01', title: 'ELEGÍ LA POSICIÓN', desc: 'Seleccionás qué posición querés sortear: arquero, defensor, mediocampista o delantero.' },
    { n: '02', title: 'GIRÁS LA RULETA', desc: 'Sorteás un plantel real de la Liga Argentina y un año de temporada.' },
    { n: '03', title: 'ELEGÍS UN JUGADOR', desc: 'Tomás un solo jugador compatible con la posición sorteada.' },
    { n: '04', title: 'SIMULÁS EL TORNEO', desc: 'Con tu XI armado simulás la Liga o Copa y medís sus estadísticas reales.' },
  ]
  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
      <motion.div variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
        <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2 uppercase tracking-tight">Cómo <span className="gradient-text">Jugar</span></h3>
        <p className="text-slate-400 text-xs max-w-md mx-auto font-sans">4 pasos y sos el DT más capo de la liga</p>
      </motion.div>
      <motion.div
        variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {steps.map((s, i) => (
          <motion.div key={i} variants={item} whileHover={{ y: -4 }}
            className="relative card-gradient rounded-xl p-6 border border-slate-900"
          >
            <div className="text-4xl font-black text-slate-800 font-display select-none tracking-widest leading-none mb-3 font-sport">{s.n}</div>
            <h4 className="font-display font-bold text-white text-sm mb-2 uppercase tracking-wider">{s.title}</h4>
            <p className="text-slate-400 text-xs leading-relaxed font-sans">{s.desc}</p>
            {i < 3 && (
              <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-[#74ACDF]/20 text-xl">→</div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   DETALLES DE LA LIGA SHOWCASE
   ═══════════════════════════════════════════════════════════════ */
function LigaDetailsShowcase() {
  const details = [
    {
      title: "ESTRUCTURA LPF Y CLASIFICACIÓN",
      badge: "LIGA PROFESIONAL",
      color: "border-[#74ACDF]/30 text-[#74ACDF]",
      items: [
        "14 Equipos Históricos por Sorteo Determinístico",
        "Clasificación Directa a Copa Libertadores (1° al 3°)",
        "Clasificación a Copa Sudamericana (4° al 6°)",
        "Tabla de Promedios y Descenso Directo a la Primera B (14°)"
      ]
    },
    {
      title: "COPA ARGENTINA Y DEFINICIONES",
      badge: "ELIMINACIÓN DIRECTA",
      color: "border-amber-500/30 text-amber-400",
      items: [
        "Formato Federal de Llaves de Eliminación Directa",
        "Simulación Partido a Partido con Crónica Radial en Vivo",
        "Definiciones Agónicas por Penales en Empate",
        "Campeón del Cuadro Clasifica a la Recopa del Juego"
      ]
    },
    {
      title: "MOTOR TÁCTICO Y QUÍMICA 100%",
      badge: "STATS & QUÍMICA",
      color: "border-emerald-500/30 text-emerald-400",
      items: [
        "Bonificación por Clubes Compartidos (Boca, River, Racing, etc.)",
        "Química por Posición Natural (GK, CB, LB, CDM, CAM, ST)",
        "Motor de Cálculo Individual de Goles, Asistencias y Vallas Invictas",
        "Generación Instantánea del Reporte PDF Oficial de la Fecha"
      ]
    }
  ]

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
      <motion.div
        variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 bg-[#74ACDF]/10 border border-[#74ACDF]/20 px-3.5 py-1 rounded-full mb-3">
          <span className="text-[10px] font-bold text-[#74ACDF] font-sport uppercase tracking-widest">SISTEMA OFICIAL DE SIMULACIÓN</span>
        </div>
        <h3 className="font-display text-2xl sm:text-4xl font-black text-white uppercase tracking-tight">
          DETALLES DE LA <span className="gradient-text">LIGA Y TORNEOS</span>
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto font-sans mt-2">
          Conocé el motor táctico, las reglas de descenso y la clasificación continental del juego
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {details.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="card-gradient rounded-3xl p-6 border border-white/10 relative flex flex-col justify-between hover:border-[#74ACDF]/40 transition-colors shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border font-sport tracking-widest uppercase ${card.color}`}>
                  {card.badge}
                </span>
                <span className="text-xs font-black text-slate-600 font-sport">0{idx + 1}</span>
              </div>
              <h4 className="font-display text-base font-bold text-white mb-4 uppercase tracking-wider">
                {card.title}
              </h4>
              <ul className="space-y-3 font-sans text-xs text-slate-300">
                {card.items.map((it, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#74ACDF] mt-1.5 shrink-0" />
                    <span className="leading-relaxed">{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   CTA SECTION
   ═══════════════════════════════════════════════════════════════ */
function CTASection() {
  return (
    <section className="relative z-10 max-w-4xl mx-auto px-4 pb-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative rounded-2xl overflow-hidden border border-slate-900"
      >
        <div className="relative z-10 px-8 py-12 sm:py-16 text-center card-gradient">
          <h3 className="font-display text-2xl sm:text-4xl font-black text-white mb-3 uppercase tracking-tighter">
            ¿Listo para armar tu <span className="gradient-text">once soñado</span>?
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm mb-10 max-w-sm mx-auto font-sans leading-relaxed">
            Elegí un formato y empezá a crear el mejor equipo de la historia del fútbol local
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 font-sport">
            <Link href="/draft?mode=clasico" className="btn-primary px-8 py-4">
              Draft Clásico
            </Link>
            <Link href="/draft?mode=liga" className="btn-secondary px-8 py-4">
              Liga Argentina
            </Link>
            <Link href="/draft?mode=copa" className="btn-secondary px-8 py-4">
              Copa Argentina
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
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-20">
        <motion.div
          variants={fadeIn} initial="hidden" whileInView="visible" viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2 uppercase tracking-tight">
            Modos de <span className="gradient-text">Juego</span>
          </h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto font-sans">
            Seleccioná tu formato y demostrá tus conocimientos tácticos
          </p>
        </motion.div>

        <motion.div
          variants={container} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
        >
          {MODES.map((mode, i) => (
            <ModeCard key={mode.id} mode={mode} index={i} />
          ))}
        </motion.div>
      </section>

      {/* ── HOW TO PLAY ── */}
      <HowToPlay />

      {/* ── DETALLES DE LA LIGA SHOWCASE ── */}
      <LigaDetailsShowcase />

      {/* ── EXTRA LINKS ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { href: '/como-jugar', title: 'CÓMO SE JUEGA', text: 'Aprendé el flujo del draft, las posiciones y la simulación táctica.', color: 'border-slate-900 hover:border-slate-800' },
            { href: '/records', title: 'RECORDS HISTÓRICOS', text: 'Consulta el ranking de mejores puntuaciones y leyendas de la liga.', color: 'border-slate-900 hover:border-slate-800' },
            { href: '/daily', title: 'RETO DIARIO', text: 'Competí en el desafío de simulación del día en igualdad de condiciones.', color: 'border-slate-900 hover:border-slate-800' },
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
                  <h4 className="font-sport text-[10px] font-bold tracking-widest text-white group-hover:text-[#74ACDF] transition-colors mb-3">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans mb-4">{item.text}</p>
                  <div className="text-[#74ACDF]/60 text-[9px] font-bold tracking-widest font-sport group-hover:text-[#74ACDF] transition-colors uppercase">
                    VER MÁS →
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CLUB GRID ── */}
      <ClubGrid />

      {/* ── LIVE SCORES WIDGET ── */}
      <div className="max-w-6xl mx-auto px-4">
        <LiveScoresWidget />
      </div>

      {/* ── DONATION BOX ── */}
      <DonationSection />

      {/* ── CTA ── */}
      <CTASection />

      {/* ── FOOTER ── */}
      <footer className="relative z-10 border-t border-[rgba(116,172,223,0.10)] bg-[#020813]/40">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="relative w-8 h-8">
                <img src="/logos/afa.png" alt="AFA" className="w-full h-full opacity-40 object-contain" />
              </div>
              <div>
                <span className="text-[#74ACDF]/40 text-xs font-sport font-bold block tracking-wider">
                  GAMBETA
                </span>
                <span className="text-slate-600 text-[10px] font-medium font-sans">© 2026 · El Draft del Fútbol Argentino</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-600 text-[10px] font-bold font-sport tracking-wider mr-2 uppercase">CAMPEONES MUNDIALES:</span>
              {['1978', '1986', '2022'].map((y, i) => (
                <span key={i} className="badge-gold text-[9px] font-bold tracking-wider">{y}</span>
              ))}
            </div>
            <div className="flex items-center gap-5">
              {[
                { href: '/draft?mode=clasico', label: 'DRAFT' },
                { href: '/draft?mode=liga', label: 'LIGA' },
                { href: '/draft?mode=copa', label: 'COPA' },
                { href: '/records', label: 'RECORDS' },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="text-[#74ACDF]/40 hover:text-[#74ACDF] text-[9px] font-bold tracking-widest font-sport transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-900 text-center">
            <p className="text-slate-600 text-[10px] font-sans font-medium">
              Hecho con pasión para los hinchas del fútbol argentino · Temporada 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
