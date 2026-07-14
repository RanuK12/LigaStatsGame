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
    <header className="sticky top-0 z-50 w-full border-b border-[rgba(116,172,223,0.12)] bg-[#020813]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 sm:w-9 sm:h-9">
            <Image
              src="/LigaStatsGame/logos/afa.png"
              alt="AFA Logo"
              fill
              className="object-contain drop-shadow-md group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-sport text-xs sm:text-sm font-bold tracking-wider text-white flex items-center gap-1.5 leading-none">
              DRAFT TRES ESTRELLAS <span className="text-[10px] text-[#FFD700] animate-pulse">⭐️⭐️⭐️</span>
            </span>
            <span className="text-[8px] sm:text-[9px] text-[#74ACDF]/70 font-black tracking-widest leading-none mt-0.5 font-sans">
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
                className={`relative rounded-xl px-4 py-2.5 text-[10px] font-bold tracking-widest font-sport transition-all ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#74ACDF]/15 to-[#4A90D9]/10 border border-[#74ACDF]/30 shadow-[0_0_12px_rgba(116,172,223,0.1)]"
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
          className="md:hidden rounded-xl p-2.5 text-slate-400 hover:text-white hover:bg-slate-800/40 border border-slate-800 transition-colors"
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
            className="md:hidden overflow-hidden border-t border-slate-800/80 bg-[#020813]/95 backdrop-blur-lg font-sport"
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
                    className={`flex items-center rounded-xl px-4 py-3 text-[10px] font-bold tracking-widest transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#74ACDF]/20 to-transparent text-white border-l-4 border-[#74ACDF]'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
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
