'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

const NAV_ITEMS = [
  { href: '/', label: 'INICIO', match: '/' },
  { href: '/draft?mode=clasico', match: '/draft', label: 'DRAFT' },
  { href: '/versus', label: 'VERSUS' },
  { href: '/ruleta', label: 'RULETA' },
  { href: '/records', label: 'RECORDS' },
  { href: '/daily', label: 'RETO DIARIO' },
  { href: '/leaderboard', label: 'POSICIONES' },
]

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#020813]/72 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-[26px] h-[36px] sm:w-[29px] sm:h-[40px] shrink-0">
            <img
              src="/LigaStatsGame/logos/afa.png"
              alt="AFA Logo"
              className="w-full h-full object-contain drop-shadow-[0_2px_10px_rgba(116,172,223,0.3)] group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-bandera text-xs sm:text-sm text-white flex items-center gap-1.5 leading-none uppercase tracking-[0.18em]">
              DRAFT TRES ESTRELLAS 
              <span className="inline-flex gap-0.5 ml-1.5 animate-pulse shrink-0">
                {[1, 2, 3].map(n => (
                  <svg key={n} className="w-2.5 h-2.5 text-[#D4AF37] fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </span>
            </span>
            <span className="text-[8px] sm:text-[9px] text-[#74ACDF]/80 font-bold tracking-[0.25em] leading-none mt-1 font-sport uppercase">
              EL JUEGO DEL FÚTBOL ARGENTINO
            </span>
          </div>
        </Link>

        {/* Desktop Navigation (text-only, using Syncopate font-sport for premium look) */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const matchPath = item.match || item.href
            const isActive = pathname === matchPath || (matchPath !== '/' && pathname.startsWith(matchPath))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative rounded-2xl px-4 py-2.5 text-[10px] font-bold tracking-[0.35em] font-sport transition-all duration-300 ease-out uppercase ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#74ACDF]/16 via-[#74ACDF]/10 to-transparent border border-[#74ACDF]/25 shadow-[0_0_20px_rgba(116,172,223,0.12)]"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden rounded-2xl p-2.5 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all duration-300 ease-out"
          aria-label="Abrir menú"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            {menuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-white/5 bg-[#020813]/92 backdrop-blur-xl font-sport"
          >
            <div className="flex flex-col gap-1 px-4 py-3.5">
              {NAV_ITEMS.map((item) => {
                const matchPath = item.match || item.href
                const isActive = pathname === matchPath || (matchPath !== '/' && pathname.startsWith(matchPath))

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center rounded-2xl px-4 py-3 text-[10px] font-bold tracking-[0.35em] transition-all duration-300 ease-out uppercase ${
                      isActive
                        ? 'bg-gradient-to-r from-[#74ACDF]/20 to-transparent text-white border-l-4 border-[#74ACDF]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
