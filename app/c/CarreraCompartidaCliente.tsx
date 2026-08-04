"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import CareerCardView from "@/components/pitch/CareerCardView"
import { decodeCarrera, type CarreraCompartida } from "@/lib/career-link"
import { trackEvent, EVENTOS } from "@/components/Analytics"

export default function CarreraCompartidaCliente() {
  // El parámetro se lee en un efecto y no en el render: con export estático el HTML se genera
  // en el build, donde no hay URL, y leerlo directo rompería la hidratación.
  const [estado, setEstado] = useState<"cargando" | "ok" | "rota">("cargando")
  const [data, setData] = useState<CarreraCompartida | null>(null)

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("c")
    if (!param) {
      setEstado("rota")
      return
    }
    const c = decodeCarrera(param)
    if (!c) {
      setEstado("rota")
      return
    }
    setData(c)
    setEstado("ok")
    trackEvent(EVENTOS.carreraLinkVisto, { temporadas: c.temporadas })
  }, [])

  return (
    <div className="min-h-screen gradient-bg arg-stripe-bg px-4 py-8 font-sans text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        {estado === "cargando" && (
          <div className="h-64 animate-pulse rounded-3xl bg-slate-800/40" />
        )}

        {estado === "rota" && (
          <div className="card-gradient rounded-3xl border border-white/10 p-8 text-center shadow-2xl">
            <h1 className="font-display text-2xl font-black uppercase">Este link no anda</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
              La carrera viaja dentro del link, así que si se cortó al copiarlo no se puede
              recuperar. Pedile a quien te lo pasó que lo mande de nuevo entero.
            </p>
            <Link href="/carrera/" className="btn-primary mt-6 inline-block px-8 py-3 font-sport">
              Crear mi carrera
            </Link>
          </div>
        )}

        {estado === "ok" && data && (
          <>
            <div className="card-gradient relative overflow-hidden rounded-3xl border border-[#74ACDF]/20 p-6 text-center shadow-2xl sm:p-8">
              <span className="font-sport mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#74ACDF]">
                Modo carrera · Gambeta
              </span>
              <h1 className="font-display text-2xl font-black uppercase tracking-tight sm:text-4xl">
                {data.leyenda
                  ? `${data.card.playerName} se pareció a ${data.leyenda.nombre}`
                  : `La carrera de ${data.card.playerName}`}
              </h1>
              <p className="font-sport mt-2 text-xs uppercase tracking-wider text-slate-400">
                {[
                  data.card.idolatria && `${data.card.idolatria.nivel} de ${data.card.idolatria.clubName}`,
                  `${data.temporadas} temporadas`,
                  data.leyenda && `${data.leyenda.parecido}% de parecido`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>

            <CareerCardView data={data.card} />

            {data.pie && (
              <p className="mx-auto max-w-md rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-center text-[12px] italic leading-relaxed text-slate-300">
                📖 {data.pie}
              </p>
            )}

            {/* El motivo por el que existe la página: el que la abre tiene que poder jugar. */}
            <div className="card-gradient rounded-3xl border border-[#F6C750]/30 p-6 text-center shadow-2xl">
              <h2 className="font-display text-xl font-black uppercase">¿Y vos a quién te parecés?</h2>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-400">
                Creá tu crack, tomá las decisiones y jugá tu carrera entera. Gratis, en el
                navegador y sin registrarte.
              </p>
              <Link
                href="/carrera/"
                onClick={() => trackEvent(EVENTOS.carreraLinkCta)}
                className="btn-primary mt-5 inline-block px-10 py-4 font-sport"
              >
                Crear mi carrera
              </Link>
            </div>
          </>
        )}

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="font-sport inline-block px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-400 transition-colors hover:text-white"
          >
            ← Ir a Gambeta
          </Link>
        </div>
      </div>
    </div>
  )
}
