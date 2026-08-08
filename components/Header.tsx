'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useUserStore } from '@/lib/user-store'
import { useEmbebido } from '@/lib/embebido'
import { supabase } from '@/lib/supabase'
import { profileFromSupabaseUser } from '@/lib/auth'
import TierBadge from './TierBadge'
import BotonSonido from './BotonSonido'

// Nueve items no entraban: medido, la barra pedía 1.136px y entre 768 y 1023px el botón de
// INGRESAR quedaba FUERA de la pantalla, con la página desplazándose de costado. Quedan los cuatro
// destinos que sostienen una sesión —jugar, la sesión larga, el motivo de volver mañana y el de
// competir— y el resto pasa a un menú. INICIO se va: el logo ya lleva al home, que es lo que
// todo el mundo espera.
const NAV_ITEMS = [
  { href: '/draft?mode=clasico', match: '/draft', label: 'DRAFT' },
  { href: '/carrera', label: 'CARRERA' },
  { href: '/daily', label: 'RETO' },
  { href: '/leaderboard', label: 'RANKING' },
]

// Consulta y modos sueltos: se visitan una vez, no compiten por la atención con DRAFT.
const NAV_MAS: { href: string; label: string; match?: string }[] = [
  { href: '/retos', label: 'RETOS 🏆' },
  { href: '/equipos', label: 'EQUIPOS' },
  { href: '/datos', label: '¿SABÍAS QUE?' },
  { href: '/ruleta', label: 'RULETA' },
  { href: '/versus', label: 'VERSUS' },
  { href: '/records', label: 'LEYENDAS' },
  { href: '/como-jugar', label: 'CÓMO SE JUEGA' },
]

export default function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [masOpen, setMasOpen] = useState(false)
  const cierre = useRef<ReturnType<typeof setTimeout> | null>(null)
  const masActivo = NAV_MAS.some((i) => pathname.startsWith(i.href))
  const { user, openAuthModal, openProfileModal, setUser, closeAuthModal } = useUserStore()
  // Dentro del reproductor de un portal no se ofrece login: CrazyGames lo prohíbe y el juego
  // anda entero de invitado. Ver lib/embebido.ts.
  const embebido = useEmbebido()

  // Hydrate the local store from Supabase Auth (OAuth redirect + persisted session).
  // Al detectar sesión también cerramos el modal: sin esto, tras el login con Google
  // el recuadro seguía abierto y se repetía en loop aunque el usuario ya estaba logueado.
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(profileFromSupabaseUser(data.session.user, useUserStore.getState().user))
        closeAuthModal()
      }
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(profileFromSupabaseUser(session.user, useUserStore.getState().user))
        closeAuthModal()
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [setUser, closeAuthModal])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.07] bg-[#020813]/[0.93] shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1400px] items-center justify-between gap-3 px-4">
        {/* Brand Logo */}
        <Link href="/" className="flex shrink-0 basis-0 grow items-center gap-2.5 group transition-transform">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 shrink-0">
            <img
              src="/logos/gambeta.svg"
              alt="Gambeta Logo"
              className="w-full h-full object-contain drop-shadow-[0_2px_12px_rgba(116,172,223,0.4)] group-hover:scale-105 transition-transform"
            />
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-malvinas text-xl sm:text-2xl text-white uppercase tracking-[0.14em]" title="Gambeta">
                GAMBETA
              </span>
              {/* Las estrellas quedaban tapadas por el botón INGRESAR en teléfono. Desde sm. */}
              <span className="hidden sm:inline-flex gap-0.5 ml-1 animate-pulse shrink-0">
                {[1, 2, 3].map(n => (
                  <svg key={n} className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#D4AF37] fill-current drop-shadow-[0_0_6px_rgba(212,175,55,0.6)]" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                ))}
              </span>
            </div>
            {/* En teléfono la bajada quedaba a tres píxeles del botón INGRESAR, y en 360px se
                solapaban. Se oculta: el hero repite el mismo texto palabra por palabra. */}
            <span className="hidden sm:block text-[11px] sm:text-[10px] text-[#74ACDF] font-bold tracking-[0.22em] leading-none font-sport uppercase whitespace-nowrap mt-1">
              EL JUEGO DEL FÚTBOL ARGENTINO
            </span>
          </div>
        </Link>

        {/* Desktop Navigation — a lg, no a md: con md se encendía a 768px, donde no entraba */}
        <nav className="hidden shrink-0 items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            // SOLO los cuatro modos de juego. Antes, de 1280px para arriba, se mostraban los
            // diez destinos con el mismo peso: DRAFT pesaba igual que CÓMO SE JUEGA y la barra
            // se leía como el menú de un sitio corporativo, sin decir a qué se viene a jugar.
            // El resto vive en MÁS, que ahora está siempre.
            const secundario = false
            const matchPath = item.match || item.href
            const isActive = pathname === matchPath || (matchPath !== '/' && pathname.startsWith(matchPath))

            return (
              <Link
                key={item.href}
                href={item.href}
                // 12px con poco tracking en vez de 11px con 0.1em: las mayúsculas espaciadas se
                // leen palabra por palabra, y una nav se lee de un vistazo o no se lee.
                className={`relative rounded-2xl px-3.5 py-2.5 font-sport text-[12px] font-bold uppercase tracking-[0.04em] transition-all duration-300 ease-out ${
                  isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                } ${secundario ? 'hidden xl:block' : ''}`}
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

          {/* MÁS: lo que se visita una vez y no pelea con DRAFT por la atención */}
          {/* Se cerraba con onMouseLeave a secas: apenas el mouse salía un píxel el menú
              desaparecía, y para llegar a una opción había que cruzar el hueco entre el botón y la
              lista. Ahora hay un margen de gracia de 420ms y el hueco está cubierto. */}
          <div
            className="relative"
            onMouseEnter={() => { if (cierre.current) clearTimeout(cierre.current) }}
            onMouseLeave={() => { cierre.current = setTimeout(() => setMasOpen(false), 420) }}
          >
            <button
              onMouseEnter={() => { if (cierre.current) clearTimeout(cierre.current); setMasOpen(true) }}
              onClick={() => setMasOpen((v) => !v)}
              className={`relative flex items-center gap-1.5 rounded-2xl px-3.5 py-2.5 font-sport text-[12px] font-bold uppercase tracking-[0.04em] transition-all duration-300 ease-out ${
                masActivo ? 'text-white' : 'text-slate-400 hover:text-white'
              }`}
              aria-expanded={masOpen}
            >
              {masActivo && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl border border-[#74ACDF]/25 bg-gradient-to-r from-[#74ACDF]/16 via-[#74ACDF]/10 to-transparent shadow-[0_0_20px_rgba(116,172,223,0.12)]"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">MÁS</span>
              <svg className={`relative z-10 h-2.5 w-2.5 transition-transform ${masOpen ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2 4l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <AnimatePresence>
              {masOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 top-full z-[60] w-56 overflow-hidden rounded-2xl border border-[#74ACDF]/20 bg-[#050d1a] p-1.5 pt-2 shadow-[0_24px_60px_rgba(0,0,0,0.75)]"
                >
                  {NAV_MAS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMasOpen(false)}
                      className={`block rounded-xl px-3 py-2.5 font-sport text-[10px] font-bold uppercase tracking-[0.18em] transition-colors ${
                        pathname.startsWith(item.href) ? 'bg-[#74ACDF]/12 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* User profile / Login button */}
        <div className="flex shrink-0 basis-0 grow items-center justify-end gap-2">
          {user?.isLoggedIn ? (
            <button
              onClick={openProfileModal}
              className="flex items-center gap-2 bg-gradient-to-r from-[#74ACDF]/20 to-blue-600/20 border border-[#74ACDF]/40 px-3 py-1.5 rounded-2xl font-sport text-xs text-white hover:border-[#74ACDF] transition-all shadow-[0_0_12px_rgba(116,172,223,0.15)]"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover border border-[#74ACDF]/60"
                />
              ) : (
                <span className="w-6 h-6 rounded-full bg-[#74ACDF] text-slate-950 font-black text-[10px] flex items-center justify-center">
                  {user.username.slice(0, 2).toUpperCase()}
                </span>
              )}
              <span className="font-bold max-w-[90px] truncate">{user.username}</span>
              <span className="text-[10px] text-[#74ACDF] font-bold">⚡{user.elo}</span>
              <span className="hidden sm:inline-flex"><TierBadge elo={user.elo} /></span>
            </button>
          ) : embebido ? null : (
            <button
              onClick={openAuthModal}
              // `.btn-primary` trae letter-spacing 0.28em y font-family Sora, y como los define
              // en CSS puro le ganan a las utilidades de Tailwind. A este tamaño 0.28em da 3 px
              // entre letras —bien para el CTA grande del home, ilegible acá— y la fuente
              // distinta hacía que en la misma barra convivieran tres tipografías. Se pisan las
              // dos con `!`, sin tocar el global que usa el resto del sitio.
              className="btn-primary min-h-0 rounded-xl px-4 py-2 !font-sport text-[11px] font-bold uppercase !tracking-[0.06em] shadow-md"
            >
              INGRESAR
            </button>
          )}

          {/* Prender el sonido. Arranca apagado: un sitio que suena sin permiso se cierra. */}
          <BotonSonido className="hidden sm:flex" />

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl p-2.5 text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition-all duration-300 ease-out"
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
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden overflow-hidden border-t border-white/5 bg-[#020813] shadow-[0_20px_50px_rgba(0,0,0,0.6)] font-sport"
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
                    className={`flex items-center rounded-2xl px-4 py-3.5 text-xs font-bold tracking-[0.35em] transition-all duration-300 ease-out uppercase ${
                      isActive
                        ? 'bg-gradient-to-r from-[#74ACDF]/20 to-transparent text-white border-l-4 border-[#74ACDF]'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {/* Lo secundario, más chico y separado: se ve que es otra categoría */}
              <div className="mt-2 flex flex-col gap-0.5 border-t border-white/5 pt-2.5">
                {NAV_MAS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center rounded-2xl px-4 py-3 text-[10px] font-bold uppercase tracking-[0.25em] transition-colors ${
                      pathname.startsWith(item.href) ? 'text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
