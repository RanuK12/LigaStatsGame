'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { BookOpen, Crown, Dices, Lightbulb, Shield, Swords, Trophy, type LucideIcon } from 'lucide-react'
import { useUserStore } from '@/lib/user-store'
import { loadDaily, completadoHoy } from '@/lib/daily-progress'
import { useEmbebido } from '@/lib/embebido'
import { useT, useRuta, rutaSinLocale } from '@/lib/i18n'
import SelectorIdioma from './SelectorIdioma'
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
  { href: '/draft?mode=clasico', match: '/draft', label: 'DRAFT', clave: 'nav.draft' },
  { href: '/carrera', label: 'CARRERA', clave: 'nav.carrera' },
  { href: '/dt', label: 'DT', clave: 'nav.dt' },
  { href: '/daily', label: 'RETO', clave: 'nav.reto' },
  { href: '/leaderboard', label: 'RANKING', clave: 'nav.ranking' },
]

/**
 * Lo que hay más allá de los cinco modos.
 *
 * Antes era una lista de siete palabras en mayúscula, una debajo de la otra, sin una sola pista de
 * qué había del otro lado: "DATOS", "RULETA", "RECORDS" no dicen nada al que entra por primera vez,
 * y el menú de un juego es el mapa del juego. Ahora cada destino va con su ícono y una línea que
 * dice qué es, agrupado por para qué se entra: jugar otra cosa, o mirar.
 */
type ItemMas = { href: string; label: string; clave: string; desc: string; claveDesc: string; Icono: LucideIcon }

const GRUPOS_MAS: { titulo: string; clave: string; items: ItemMas[] }[] = [
  {
    titulo: 'OTROS MODOS',
    clave: 'nav.grupoModos',
    items: [
      { href: '/retos', label: 'RETOS', clave: 'nav.retos', Icono: Trophy,
        desc: 'Los trofeos que se desbloquean jugando', claveDesc: 'nav.retosDesc' },
      { href: '/versus', label: 'VERSUS', clave: 'nav.versus', Icono: Swords,
        desc: 'Tu 11 contra el de otro, con el mismo bombo', claveDesc: 'nav.versusDesc' },
      { href: '/ruleta', label: 'RULETA', clave: 'nav.ruleta', Icono: Dices,
        desc: 'Girala y mirá qué leyenda te toca', claveDesc: 'nav.ruletaDesc' },
    ],
  },
  {
    titulo: 'PARA MIRAR',
    clave: 'nav.grupoMirar',
    items: [
      { href: '/equipos', label: 'EQUIPOS', clave: 'nav.equipos', Icono: Shield,
        desc: 'Los planteles campeones, jugador por jugador', claveDesc: 'nav.equiposDesc' },
      { href: '/records', label: 'LEYENDAS', clave: 'nav.records', Icono: Crown,
        desc: 'Los récords del fútbol argentino', claveDesc: 'nav.recordsDesc' },
      { href: '/datos', label: '¿SABÍAS QUE?', clave: 'nav.datos', Icono: Lightbulb,
        desc: 'Un dato por tirada, con sus fuentes', claveDesc: 'nav.datosDesc' },
      { href: '/como-jugar', label: 'CÓMO SE JUEGA', clave: 'nav.comoJugar', Icono: BookOpen,
        desc: 'Las reglas del juego en dos minutos', claveDesc: 'nav.comoJugarDesc' },
    ],
  },
]

const NAV_MAS: ItemMas[] = GRUPOS_MAS.flatMap((g) => g.items)

export default function Header() {
  const pathnameCrudo = usePathname()
  // Sin el prefijo de idioma: en /en/draft/ el item activo sigue siendo /draft.
  const pathname = rutaSinLocale(pathnameCrudo || '/')
  const t = useT()
  const ruta = useRuta()
  const [menuOpen, setMenuOpen] = useState(false)
  const [masOpen, setMasOpen] = useState(false)
  const cierre = useRef<ReturnType<typeof setTimeout> | null>(null)
  const masActivo = NAV_MAS.some((i) => pathname.startsWith(i.href))
  // Se lee en el cliente y después del primer render: el reto vive en localStorage y pintarlo en
  // el servidor rompería la hidratación.
  const [retoPendiente, setRetoPendiente] = useState(false)
  useEffect(() => { setRetoPendiente(!completadoHoy(loadDaily())) }, [])
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
        <Link href={ruta("/")} className="flex shrink-0 basis-0 grow items-center gap-2.5 group transition-transform">
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
              {t('marca.bajada', 'EL JUEGO DEL FÚTBOL ARGENTINO')}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation — a lg, no a md: con md se encendía a 768px, donde no entraba */}
        {/* Los modos van adentro de una misma pista: así se leen como los botones de un juego y no
            como los links sueltos de un sitio corporativo, y MÁS queda claramente del otro lado. */}
        <nav className="hidden shrink-0 items-center gap-0.5 rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-1 lg:flex">
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
                href={ruta(item.href)}
                // 12px con poco tracking en vez de 11px con 0.1em: las mayúsculas espaciadas se
                // leen palabra por palabra, y una nav se lee de un vistazo o no se lee.
                className={`relative rounded-[14px] px-3.5 py-2 font-sport text-[12px] font-bold uppercase tracking-[0.04em] transition-all duration-300 ease-out ${
                  isActive ? 'text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
                } ${secundario ? 'hidden xl:block' : ''}`}
              >
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-[14px] border border-[#74ACDF]/30 bg-gradient-to-b from-[#74ACDF]/20 to-[#74ACDF]/[0.06] shadow-[0_2px_14px_rgba(116,172,223,0.18)]"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {t(item.clave, item.label)}
                  {/* El reto de hoy sin jugar: un punto que respira. Es el único motivo del juego
                      para volver mañana y no había forma de enterarse sin entrar a la página. */}
                  {item.href === '/daily' && retoPendiente && (
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F6C750] opacity-70" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#F6C750]" />
                    </span>
                  )}
                </span>
              </Link>
            )
          })}

          <span className="mx-1 h-5 w-px shrink-0 bg-white/[0.08]" />

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
              className={`relative flex items-center gap-1.5 rounded-[14px] px-3.5 py-2 font-sport text-[12px] font-bold uppercase tracking-[0.04em] transition-all duration-300 ease-out ${
                masActivo ? 'text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-white'
              }`}
              aria-expanded={masOpen}
            >
              {masActivo && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-[14px] border border-[#74ACDF]/30 bg-gradient-to-b from-[#74ACDF]/20 to-[#74ACDF]/[0.06] shadow-[0_2px_14px_rgba(116,172,223,0.18)]"
                  transition={{ type: 'spring', bounce: 0.18, duration: 0.4 }}
                />
              )}
              <span className="relative z-10">{t('nav.mas', 'MÁS')}</span>
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
                  className="absolute right-0 top-full z-[60] mt-2 w-[560px] overflow-hidden rounded-3xl border border-white/10 bg-[#050d1a]/98 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.75)] backdrop-blur-xl"
                >
                  <div className="banda-argentina absolute inset-x-0 top-0 h-[2px] opacity-70" />
                  <div className="grid grid-cols-2 gap-x-2">
                    {GRUPOS_MAS.map((grupo) => (
                      <div key={grupo.clave}>
                        <div className="px-3 pb-1 pt-2 font-sport text-[9px] font-black uppercase tracking-[0.28em] text-slate-600">
                          {t(grupo.clave, grupo.titulo)}
                        </div>
                        {grupo.items.map((item) => {
                          const activo = pathname.startsWith(item.href)
                          return (
                            <Link
                              key={item.href}
                              href={ruta(item.href)}
                              onClick={() => setMasOpen(false)}
                              className={`group flex items-start gap-2.5 rounded-2xl px-3 py-2.5 transition-colors ${
                                activo ? 'bg-[#74ACDF]/12' : 'hover:bg-white/[0.05]'
                              }`}
                            >
                              <span
                                className={`mt-[1px] shrink-0 rounded-xl border p-1.5 transition-colors ${
                                  activo
                                    ? 'border-[#74ACDF]/40 bg-[#74ACDF]/15 text-[#9CCBF0]'
                                    : 'border-white/[0.07] bg-white/[0.03] text-slate-500 group-hover:border-[#74ACDF]/30 group-hover:text-[#9CCBF0]'
                                }`}
                              >
                                <item.Icono className="h-3.5 w-3.5" strokeWidth={2} />
                              </span>
                              <span className="min-w-0">
                                <span className={`block font-sport text-[11px] font-black uppercase tracking-[0.06em] ${activo ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                  {t(item.clave, item.label)}
                                </span>
                                <span className="mt-0.5 block font-sans text-[10.5px] leading-snug text-slate-500">
                                  {t(item.claveDesc, item.desc)}
                                </span>
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* User profile / Login button */}
        <div className="flex shrink-0 basis-0 grow items-center justify-end gap-2">
          {/* El idioma, al lado de la sesión. Se esconde en teléfono chico: ahí la barra ya venía
              justa y el botón de ingresar es lo que no puede faltar. */}
          <SelectorIdioma className="hidden sm:flex" />
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
              {t('nav.ingresar', 'INGRESAR')}
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
                    href={ruta(item.href)}
                    onClick={() => setMenuOpen(false)}
                    // 0.35em de tracking era una palabra deletreada; a 0.08em se lee de un saque.
                    className={`flex items-center justify-between gap-2 rounded-2xl px-4 py-3.5 text-[13px] font-black uppercase tracking-[0.08em] transition-all duration-300 ease-out ${
                      isActive
                        ? 'bg-gradient-to-r from-[#74ACDF]/20 to-transparent text-white border-l-4 border-[#74ACDF]'
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <span>{t(item.clave, item.label)}</span>
                    {item.href === '/daily' && retoPendiente && (
                      <span className="rounded-full bg-[#F6C750]/15 px-2 py-0.5 text-[9px] font-black tracking-[0.14em] text-[#F6C750]">
                        {t('nav.hoy', 'HOY')}
                      </span>
                    )}
                  </Link>
                )
              })}

              {/* Lo secundario: mismo mapa que el menú de escritorio, con el ícono y la línea que
                  dice qué es cada cosa. En el teléfono es el único mapa que hay. */}
              {GRUPOS_MAS.map((grupo) => (
                <div key={grupo.clave} className="mt-2 flex flex-col gap-0.5 border-t border-white/5 pt-2.5">
                  <div className="px-4 pb-1 text-[9px] font-black uppercase tracking-[0.28em] text-slate-600">
                    {t(grupo.clave, grupo.titulo)}
                  </div>
                  {grupo.items.map((item) => {
                    const activo = pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={ruta(item.href)}
                        onClick={() => setMenuOpen(false)}
                        className={`flex items-start gap-3 rounded-2xl px-4 py-2.5 transition-colors ${
                          activo ? 'bg-[#74ACDF]/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <span className={`mt-[1px] shrink-0 rounded-xl border p-1.5 ${
                          activo ? 'border-[#74ACDF]/40 bg-[#74ACDF]/15 text-[#9CCBF0]' : 'border-white/[0.07] bg-white/[0.03] text-slate-500'
                        }`}>
                          <item.Icono className="h-3.5 w-3.5" strokeWidth={2} />
                        </span>
                        <span className="min-w-0">
                          <span className={`block text-[11px] font-black uppercase tracking-[0.06em] ${activo ? 'text-white' : 'text-slate-300'}`}>
                            {t(item.clave, item.label)}
                          </span>
                          <span className="mt-0.5 block font-sans text-[10.5px] normal-case leading-snug tracking-normal text-slate-500">
                            {t(item.claveDesc, item.desc)}
                          </span>
                        </span>
                      </Link>
                    )
                  })}
                </div>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
