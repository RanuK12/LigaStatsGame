"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  tirar, tiradasDisponibles, totalDelMazo, vistos, efemerideDelDia,
  ESTILO_RAREZA, TIRADAS_BASE, type Curiosidad,
} from "@/lib/curiosidades"
import { trackEvent } from "@/components/Analytics"

import { useUserStore } from "@/lib/user-store"
import InteractiveDice from "@/components/dice/InteractiveDice"

/**
 * ¿Sabías que? — el dato no se lee de una lista: se tira y sale.
 *
 * La incertidumbre es el gancho, igual que en el bombo del draft. La rareza es lo que hace que
 * quieras seguir tirando, y el límite diario es lo que hace que vuelvas mañana.
 */
export default function DatosCliente() {
  const user = useUserStore((s) => s.user)
  const reducir = useReducedMotion()
  const [dato, setDato] = useState<Curiosidad | null>(null)
  const [rodando, setRodando] = useState(false)
  const [quedan, setQuedan] = useState<number | null>(null)
  const [coleccion, setColeccion] = useState(0)
  const total = totalDelMazo()
  const [efemeride, setEfemeride] = useState<ReturnType<typeof efemerideDelDia>>(null)

  useEffect(() => {
    setQuedan(tiradasDisponibles())
    setColeccion(vistos())
    setEfemeride(efemerideDelDia())
  }, [])

  const isAdmin = user?.isAdmin || user?.email?.toLowerCase() === 'tanquer9@gmail.com' || user?.username?.toLowerCase() === 'tanquer9'
  const sinTiradas = !isAdmin && quedan === 0

  const tirarDado = () => {
    if (rodando || sinTiradas) return
    setRodando(true)
    setDato(null)
    window.setTimeout(() => {
      const c = tirar()
      setDato(c)
      setRodando(false)
      setQuedan(tiradasDisponibles())
      setColeccion(vistos())
      if (c) trackEvent("dato_tirado", { rareza: c.rareza, id: c.id })
    }, reducir ? 120 : 850)
  }

  const compartir = async () => {
    if (!dato) return
    const texto = `${dato.texto}\n\nMás datos del fútbol argentino en gambetafutbol.games/datos?utm_source=directo&utm_medium=social&utm_campaign=dato`
    trackEvent("compartido", { red: "dato" })
    try {
      if (navigator.share) await navigator.share({ text: texto })
      else await navigator.clipboard.writeText(texto)
    } catch {
      /* el usuario canceló */
    }
  }

  const estilo = dato ? ESTILO_RAREZA[dato.rareza] : null

  return (
    <div className="gradient-bg arg-stripe-bg min-h-screen">
      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-24 pt-12">
        <header className="text-center">
          <h1 className="font-display text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
            ¿Sabías <span className="gradient-text">que?</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md font-sans text-[13px] leading-relaxed text-slate-400">
            Tirá el dado 3D y sacá un dato del fútbol argentino. Ninguno está inventado: los que
            contamos nosotros salen de la base del juego, y los demás tienen dos fuentes.
          </p>
        </header>

        {/* Un día como hoy */}
        {efemeride && (
          <section className="mt-7 rounded-3xl border border-[#E7C27D]/25 bg-gradient-to-r from-[#141026]/80 to-[#050a14]/80 p-4">
            <p className="font-sport text-[11px] font-black uppercase tracking-[0.3em] text-[#E7C27D]">
              Hace {efemeride.hace} años
            </p>
            <p className="mt-1.5 font-sans text-[13px] leading-relaxed text-slate-300">
              <strong className="text-white">{efemeride.label}</strong>. {efemeride.texto}
            </p>
          </section>
        )}

        {/* DADO 3D INTERACTIVO */}
        <section className="mt-8 text-center">
          <InteractiveDice
            rolling={rodando}
            onRoll={tirarDado}
            disabled={sinTiradas}
            remaining={isAdmin ? 999 : quedan}
          />

          <p className="mt-4 font-sport text-[11px] font-black uppercase tracking-widest text-slate-400">
            {isAdmin
              ? "👑 MODO SUPERUSUARIO ADMIN: TIRADAS ILIMITADAS"
              : quedan === null
              ? " "
              : quedan > 0
              ? `${quedan} ${quedan === 1 ? "tirada" : "tiradas"} de hoy`
              : "Se te acabaron las tiradas de hoy"}
          </p>
          {quedan === 0 && (
            <p className="mt-1.5 font-sans text-[11px] text-slate-500">
              Vuelven mañana.{" "}
              <Link href="/daily" className="text-[#74ACDF] underline underline-offset-2 hover:text-white">
                Completá el reto diario
              </Link>{" "}
              y te ganás una más hoy mismo.
            </p>
          )}
        </section>

        {/* La carta */}
        <AnimatePresence mode="wait">
          {dato && estilo && (
            <motion.article
              key={dato.id}
              initial={reducir ? { opacity: 0 } : { opacity: 0, rotateY: 90, y: 30 }}
              animate={reducir ? { opacity: 1 } : { opacity: 1, rotateY: 0, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
              style={{ transformPerspective: 1000, borderColor: estilo.borde, background: estilo.fondo }}
              className="mt-8 rounded-3xl border-2 p-6 text-center"
            >
              <p className="font-sport text-[10px] font-black uppercase tracking-[0.3em]" style={{ color: estilo.color }}>
                {estilo.label}
              </p>
              <p className="mt-3 font-sans text-[15px] leading-relaxed text-white">{dato.texto}</p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={compartir}
                  className="btn-primary px-6 py-2.5 font-sport text-[10px] font-black uppercase tracking-widest"
                >
                  Compartir
                </button>
                {quedan !== 0 && (
                  <button
                    onClick={tirarDado}
                    className="btn-secondary px-6 py-2.5 font-sport text-[10px] font-black uppercase tracking-widest"
                  >
                    Otra
                  </button>
                )}
              </div>

              {/* De dónde salió. Es la diferencia entre un dato y un rumor. */}
              <p className="mt-4 font-sport text-[11px] uppercase tracking-wider text-slate-500">
                {dato.origen === "derivado" ? (
                  "Calculado sobre la base del juego"
                ) : (
                  <>
                    Verificado en{" "}
                    {dato.fuentes?.map((f, i) => (
                      <span key={f}>
                        {i > 0 && " y "}
                        <a href={f} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-300">
                          {new URL(f).hostname.replace("www.", "")}
                        </a>
                      </span>
                    ))}
                  </>
                )}
              </p>
            </motion.article>
          )}
        </AnimatePresence>

        {/* La colección: lo que hace que esto no sea un adorno */}
        <section className="mt-10 text-center">
          <p className="font-sport text-[10px] font-black uppercase tracking-widest text-slate-500">
            Tu colección
          </p>
          <p className="mt-1 font-display text-2xl font-black text-white">
            {coleccion} <span className="text-slate-600">/ {total}</span>
          </p>
          <div className="mx-auto mt-2 h-1.5 w-56 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#74ACDF] to-[#F6C750] transition-all"
              style={{ width: `${total > 0 ? (coleccion / total) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 font-sans text-[11px] text-slate-500">
            No se repite ninguno hasta que salgan todos. Son {TIRADAS_BASE} tiradas por día.
          </p>
        </section>

        <Link
          href="/"
          className="mt-10 block text-center font-sport text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-white inline-block py-2.5 px-3"
        >
          ← Volver al inicio
        </Link>
      </main>
    </div>
  )
}
