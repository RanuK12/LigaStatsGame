"use client"

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import clubsData from '@/data/clubs.json'
import type { Club } from '@/lib/types'
import LiveScoresWidget from '@/components/LiveScoresWidget'
import DonationSection from '@/components/DonationSection'
import DailyCard from '@/components/DailyCard'
import CarreraEnCursoCard from '@/components/CarreraEnCursoCard'
import Novedades from '@/components/Novedades'
import ContinentalBanner from '@/components/ContinentalBanner'
import LigasBanner from '@/components/LigasBanner'
import SuggestionBox from '@/components/SuggestionBox'
import SolDeMayo from '@/components/ui/SolDeMayo'
import dbStats from '@/data/derived/stats.json'

const clubs: Club[] = clubsData as Club[]

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
  `LOS MEJORES EQUIPOS ARGENTINOS DE LOS ÚLTIMOS 35 AÑOS — ${dbStats.historicos} PLANTELES`,
  "EL VÉLEZ DEL 94 · LOS BOCA DE BIANCHI · EL RIVER DEL 96 · EL ESTUDIANTES DE VERÓN",
  "LIBERTADORES Y SUDAMERICANA — SE CLASIFICA, NO SE ELIGE",
  "CAMPEONES DE AMÉRICA Y DEL MUNDO EN LA BASE",
  "COPA ARGENTINA — MODO DE ELIMINACIÓN DIRECTA ACTIVADO",
  `+${dbStats.players} JUGADORES REALES · ${dbStats.squads} PLANTELES FILTRADOS`,
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
      initial={{ y: 20 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
      className="relative z-10 max-w-6xl mx-auto px-4 mb-14"
    >
      <div className="relative card-glass overflow-hidden">
        {/* Fondo DISEÑADO (acorde a la página, texto legible): degradado argentino,
            sol de mayo dorado a la derecha, líneas de cancha sutiles. */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2246] via-[#071528] to-[#0a1020]" />
        {/* Glow celeste arriba-izquierda */}
        <div className="absolute -top-24 left-[15%] w-[520px] h-[320px] rounded-full bg-[#74ACDF]/12 blur-3xl pointer-events-none" />
        {/* Sol de mayo / glow dorado detrás de los stats (derecha) */}
        <div className="absolute right-[-40px] top-1/2 -translate-y-1/2 w-[440px] h-[440px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.22), transparent 62%)' }} />
        <SolDeMayo spin opacity={0.22} className="absolute right-[-60px] top-1/2 -translate-y-1/2 w-[380px] h-[380px] pointer-events-none" />
        {/* Líneas de cancha sutiles, difuminadas hacia la derecha */}
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #74ACDF 0 1px, transparent 1px 84px), repeating-linear-gradient(0deg, #74ACDF 0 1px, transparent 1px 84px)', maskImage: 'radial-gradient(ellipse 80% 90% at 75% 50%, black, transparent 78%)', WebkitMaskImage: 'radial-gradient(ellipse 80% 90% at 75% 50%, black, transparent 78%)' }} />
        {/* Overlay para legibilidad: bien oscuro a la izquierda (donde va el texto) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#020813]/92 via-[#020813]/60 to-[#020813]/25 pointer-events-none" />
        
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
                <span className="text-[11px] font-black uppercase tracking-widest text-red-400 font-sport">MUNDIAL 2026</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#74ACDF]/20 via-white/10 to-[#74ACDF]/20 border border-[#74ACDF]/40 px-3 py-1 rounded-full">
                <span className="text-sm leading-none">🇦🇷</span>
                <span className="text-[11px] font-malvinas tracking-[0.14em] text-white">Las Malvinas son Argentinas</span>
              </div>
            </div>

            <h2 className="font-malvinas text-5xl sm:text-6xl lg:text-7xl text-white leading-[1.04] mb-2 tracking-[0.04em] drop-shadow-[0_2px_20px_rgba(116,172,223,0.3)]">
              Vamos{' '}
              <span className="gradient-text-gold">Argentina</span>
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
                  <span className="text-[11px] font-bold text-[#D4AF37] mt-1 font-sport">{y}</span>
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
                <span className="text-[11px] font-bold text-slate-400 mt-1 font-sport">2026</span>
              </motion.div>
            </div>

            <Link href="/draft?mode=clasico" className="btn-gold px-8 py-4 rounded-xl shadow-[0_4px_20px_rgba(212,175,55,0.25)]">
              ARMÁ TU 11 Y CLASIFICÁ
            </Link>
          </div>

          {/* Right: stats de la base, integradas con la estética argentina */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs shrink-0">
            {[
              { icon: '⚽', label: 'Jugadores', value: dbStats.players.toLocaleString('es-AR'), sub: 'Reales, auditados' },
              { icon: '📋', label: 'Planteles', value: `${dbStats.squads}`, sub: 'Temporadas oficiales' },
              { icon: '🛡️', label: 'Clubes', value: `${clubs.length}`, sub: 'Primera & Ascenso' },
              { icon: '🏆', label: 'Históricos', value: `${dbStats.historicos}`, sub: 'Equipos que hicieron historia' },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.9, y: 8 }}
                whileInView={{ scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 180 }}
                className="card-gold rounded-2xl p-4 text-center border border-[#ffd700]/20 shadow-[0_6px_24px_rgba(0,0,0,0.4)]"
              >
                <div className="text-lg mb-0.5">{s.icon}</div>
                <div className="text-2xl font-black gradient-text-gold font-display leading-none">{s.value}</div>
                <div className="text-[11px] text-[#D4AF37] font-bold mt-1 uppercase tracking-wider font-sport">{s.label}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{s.sub}</div>
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
              <div className={`text-[11px] font-bold px-2 py-0.5 rounded border tracking-widest font-sport uppercase ${mode.badgeColor}`}>
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
            <div className="mt-6 flex items-center gap-1.5 text-[11px] font-bold tracking-widest font-sport uppercase" style={{ color: mode.accent }}>
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
      {/* Sol de Mayo gigante girando detrás del título: el sello de la bandera */}
      <SolDeMayo
        spin
        opacity={0.13}
        className="absolute left-1/2 top-[-90px] -translate-x-1/2 w-[560px] h-[560px] pointer-events-none -z-10 sm:w-[680px] sm:h-[680px]"
      />

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
        <h1 className="font-impact text-[3.4rem] leading-[1.04] sm:text-7xl lg:text-[7.5rem] lg:leading-[1.0] mb-6 tracking-[-0.02em] font-black">
          <span className="block text-white drop-shadow-[0_2px_30px_rgba(255,255,255,0.15)]">ARMÁ TU</span>
          <span
            className="block bg-clip-text text-transparent drop-shadow-[0_2px_30px_rgba(116,172,223,0.35)]"
            style={{ backgroundImage: 'linear-gradient(180deg, #9CCBF0 0%, #FFFFFF 48%, #74ACDF 100%)' }}
          >
            EQUIPO SOÑADO
          </span>
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

        {/* Bandera: franja celeste-blanca-celeste con el sol en el centro */}
        <div className="relative mx-auto max-w-2xl h-8 rounded-full overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(116,172,223,0.18)]">
          <div className="banda-argentina absolute inset-0 opacity-90" />
          <SolDeMayo className="absolute left-1/2 top-1/2 w-9 h-9 -translate-x-1/2 -translate-y-1/2 drop-shadow" spin />
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

      {/* Grid siempre visible: es una lista filtrable, así que NO gateamos por opacity/
          whileInView (al filtrar, los clubes re-montados quedaban en opacity 0 e
          invisibles porque el whileInView once ya había disparado). */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5">
        {filtered.map((club) => (
          <motion.div
            key={club.id}
            whileHover={{ scale: 1.1, zIndex: 10 }}
            onMouseEnter={() => setHovered(club.id)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* El tile tenía cursor de mano, hover con escala y tooltip, y no llevaba a ningún
                lado: el hincha buscaba su club, lo tocaba y no pasaba nada. Ahora arranca un draft
                con ese club en el once. Es el punto de entrada más emocional del sitio. */}
            <Link href={`/draft?mode=liga&club=${club.id}`} className={`relative rounded-xl p-3 flex flex-col items-center justify-center aspect-square min-h-[88px] transition-all duration-200 ${
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
              <span className="text-[11px] text-slate-400 text-center font-bold uppercase tracking-wider font-sport truncate w-full">
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
                    <p className="text-[11px] text-slate-500 font-sans mt-0.5">{club.titles} títulos · {club.stadium}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-xs text-slate-600 py-8 font-sans font-medium">No se encontró ningún club con ese nombre</p>
      )}
    </section>
  )
}

/* ═══════════════════════════════════════════════════════════════
   HOW TO PLAY (mini section)
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   DETALLES DE LA LIGA SHOWCASE
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   CTA SECTION
   ═══════════════════════════════════════════════════════════════ */

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

      {/* ── MODOS DE JUEGO ── lo segundo que se ve.
          Estaba a 2.342px en teléfono: casi tres pantallas de scroll antes de que el hincha se
          enterara de que hay cinco formas de jugar. Con 3 minutos de permanencia medidos, nunca
          llegaba. El menú del juego va arriba; lo que explica y promociona, abajo. */}
      {/* ── RETO DIARIO ── arriba de los modos: es la palanca principal de retención diaria */}
      <DailyCard />

      {/* ── CARRERA EMPEZADA ── solo aparece si hay una guardada, y es el motivo más fuerte que
          tiene alguien para volver: ya invirtió temporadas en ese jugador. */}
      <CarreraEnCursoCard />

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

      {/* ── WORLD CUP BANNER ── */}
      <WorldCupBanner />

      {/* ── COPAS CONTINENTALES ── lo único que hay que ganarse, así que va en la portada */}
      <LigasBanner />

      <ContinentalBanner />

      {/* ── BANCAR EL PROYECTO ──
          Estaba al final de todo, después de las sugerencias: la veía el que scrolleaba la página
          entera, que es casi nadie. Va acá, cuando la persona ya entendió qué es el juego y todavía
          está leyendo. Sigue siendo pedir, no exigir: no hay nada pago adentro del juego. */}
      <DonationSection />

      {/* ── EXTRA LINKS ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 pb-16">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { href: '/como-jugar', title: 'CÓMO SE JUEGA', text: 'Aprendé el flujo del draft, las posiciones y la simulación táctica.', color: 'border-slate-900 hover:border-slate-800' },
            { href: '/records', title: 'RECORDS HISTÓRICOS', text: 'Consulta el ranking de mejores puntuaciones y leyendas de la liga.', color: 'border-slate-900 hover:border-slate-800' },
            { href: '/daily', title: 'RETO DIARIO', text: 'Competí en el desafío de simulación del día en igualdad de condiciones.', color: 'border-slate-900 hover:border-slate-800' },
            { href: '/datos', title: '¿SABÍAS QUE?', text: 'Tirá el dado y sacá un dato del fútbol argentino y del mundo. Ninguno inventado.', color: 'border-slate-900 hover:border-slate-800' },
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
                  <div className="text-[#74ACDF]/60 text-[11px] font-bold tracking-widest font-sport group-hover:text-[#74ACDF] transition-colors uppercase">
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

      {/* ── NOVEDADES ── al pie: le interesa al que ya juega, no al que entra por primera vez */}
      <Novedades />

      {/* ── SUGERENCIAS ── */}
      <SuggestionBox />

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
                <span className="text-slate-600 text-[10px] font-medium font-sans">
                  © 2026 Ranuk IT Solutions · El Draft del Fútbol Argentino ·{" "}
                  <Link href="/legal" className="underline underline-offset-2 hover:text-slate-400">
                    Legal
                  </Link>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-slate-600 text-[10px] font-bold font-sport tracking-wider mr-2 uppercase">CAMPEONES MUNDIALES:</span>
              {['1978', '1986', '2022'].map((y, i) => (
                <span key={i} className="badge-gold text-[11px] font-bold tracking-wider">{y}</span>
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
                  className="text-[#74ACDF]/40 hover:text-[#74ACDF] text-[11px] font-bold tracking-widest font-sport transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          {/* Dónde encontrarnos. Sin esto, el que quiere seguir el proyecto no tiene a dónde ir:
              entra, juega tres minutos y se va sin dejar rastro. */}
          <div className="mt-6 pt-6 border-t border-slate-900 text-center">
            <p className="font-sport text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
              Dónde encontrarnos
            </p>
            {/* Tarjetas, no links pelados: con el logo real de cada cosa y una línea que explica
                qué vas a encontrar. Antes eran tres pastillas grises indistinguibles entre sí. */}
            <div className="mx-auto mt-4 grid max-w-2xl gap-2.5 sm:grid-cols-3">
              <a
                href="https://x.com/GambetafutbolAR"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#74ACDF]/45 hover:bg-slate-900"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white transition-transform group-hover:scale-110" aria-hidden="true">
                  <path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5.3-6.9L4.8 22H1.7l8.1-9.3L1 2h7l4.8 6.3L18.9 2Zm-1.2 18h1.9L7.4 4H5.4l12.3 16Z" />
                </svg>
                <span className="font-sport text-[11px] font-black tracking-wider text-white">@GambetafutbolAR</span>
                <span className="font-sans text-[11px] leading-tight text-slate-500">Novedades del juego y fútbol argentino</span>
              </a>

              <a
                href="https://ranuk.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-[#64ffda]/45 hover:bg-slate-900"
              >
                <img src="/logos/marca/ranuk.svg" alt="Ranuk" className="h-6 w-auto transition-transform group-hover:scale-110" />
                <span className="font-sport text-[11px] font-black tracking-wider text-white">ranuk.dev</span>
                <span className="font-sans text-[11px] leading-tight text-slate-500">Quiénes hacemos Gambeta</span>
              </a>

              <Link
                href="/legal"
                className="group flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 transition-all hover:-translate-y-0.5 hover:border-white/25 hover:bg-slate-900"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-300 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 17.5v-13Z" />
                  <path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20" />
                  <path d="M8 7h8M8 10.5h5" />
                </svg>
                <span className="font-sport text-[11px] font-black tracking-wider text-white">Aviso legal</span>
                <span className="font-sans text-[11px] leading-tight text-slate-500">Titularidad y uso del nombre</span>
              </Link>
            </div>

            <p className="mt-5 text-slate-600 text-[10px] font-sans font-medium">
              Hecho con pasión para los hinchas del fútbol argentino · Temporada 2026
            </p>

            {/* Titularidad, dicha de frente y con fecha. Es lo que convierte "salimos antes" en algo
                que se puede mostrar. El detalle completo, en /legal. */}
            <div className="mx-auto mt-5 max-w-2xl rounded-2xl border border-white/5 bg-slate-950/50 px-4 py-3">
              <p className="font-sport text-[10px] font-black uppercase tracking-widest text-slate-500">
                © 2026 Ranuk IT Solutions · Todos los derechos reservados
              </p>
              <p className="mt-1.5 font-sans text-[10px] leading-relaxed text-slate-600">
                <strong className="text-slate-500">GAMBETA</strong> y{" "}
                <strong className="text-slate-500">GAMBETA FÚTBOL</strong>, con su logo e identidad visual, son
                signos distintivos en uso desde julio de 2026. El código, la base de datos y el diseño son obra
                propia, protegidos por la Ley 11.723.{" "}
                <Link href="/legal" className="text-[#74ACDF]/70 underline underline-offset-2 hover:text-[#74ACDF]">
                  Ver aviso legal completo
                </Link>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
