"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { decodeEquipo, type EquipoCompartido } from "@/lib/equipo-link"
import { formations } from "@/lib/game-engine"
import { trackEvent, EVENTOS } from "@/components/Analytics"

/** El escudo del club, con las tres carpetas donde pueden vivir, como en el resto del sitio. */
function alFallarElEscudo(e: React.SyntheticEvent<HTMLImageElement>, clubId: string) {
  const img = e.target as HTMLImageElement
  const alternativas = [`/logos/carrera/${clubId}.png`, `/logos/ligas/${clubId}.svg`]
  const actual = new URL(img.src, location.origin).pathname
  const i = alternativas.indexOf(actual)
  if (i + 1 < alternativas.length) img.src = alternativas[i + 1]
  else img.style.visibility = "hidden"
}

export default function EquipoCompartidoCliente() {
  // El parámetro se lee en un efecto y no en el render: con export estático el HTML se genera en
  // el build, donde no hay URL, y leerlo directo rompería la hidratación.
  const [estado, setEstado] = useState<"cargando" | "ok" | "rota">("cargando")
  const [data, setData] = useState<EquipoCompartido | null>(null)

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("e")
    const e = param ? decodeEquipo(param) : null
    if (!e) {
      setEstado("rota")
      return
    }
    setData(e)
    setEstado("ok")
    trackEvent(EVENTOS.equipoLinkVisto, { ovr: e.ovr, torneo: e.torneo })
  }, [])

  // Las posiciones NO viajan en el link: se rearman del catálogo de formaciones a partir del
  // nombre. Si la formación no existe (link viejo o editado a mano), el once se muestra en lista.
  const posiciones = data ? formations[data.formacion]?.positions : undefined

  // El que abre el link puede jugar el MISMO bombo si el equipo salió del reto del día. Es la
  // diferencia entre "mirá lo que hice" y "a ver si lo superás".
  const destinoCta = data?.reto ? `/draft?mode=liga&reto=${data.reto}` : "/draft?mode=clasico"

  return (
    <div className="min-h-screen gradient-bg arg-stripe-bg px-4 py-8 font-sans text-white">
      <div className="mx-auto max-w-2xl space-y-6">
        {estado === "cargando" && <div className="h-64 animate-pulse rounded-3xl bg-slate-800/40" />}

        {estado === "rota" && (
          <div className="card-gradient rounded-3xl border border-white/10 p-8 text-center shadow-2xl">
            <h1 className="font-display text-2xl font-black uppercase">Este link no anda</h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
              El equipo viaja dentro del link, así que si se cortó al copiarlo no se puede
              recuperar. Pedile a quien te lo pasó que lo mande de nuevo entero.
            </p>
            <Link href="/draft?mode=clasico" className="btn-primary mt-6 inline-block px-8 py-3 font-sport">
              Armar mi 11
            </Link>
          </div>
        )}

        {estado === "ok" && data && (
          <>
            <div className="card-gradient relative overflow-hidden rounded-3xl border border-[#74ACDF]/20 p-6 text-center shadow-2xl sm:p-8">
              <div className="banda-argentina absolute inset-x-0 top-0 h-1 opacity-80" />
              <span className="font-sport mb-1 block text-[10px] font-bold uppercase tracking-widest text-[#74ACDF]">
                {data.torneo} · Gambeta
              </span>
              <h1 className="font-display text-2xl font-black uppercase tracking-tight sm:text-4xl">
                {data.resultado}
              </h1>
              <p className="font-sport mt-2 text-xs uppercase tracking-wider text-slate-400">
                {[`${data.ovr} de OVR`, data.formacion].filter(Boolean).join(" · ")}
              </p>
            </div>

            {/* El once dibujado en la cancha. Es el objeto que se mira: sin esto el link es un
                número, y un número no genera respuesta en un grupo. */}
            <div className="card-gradient rounded-3xl border border-white/10 p-4 shadow-xl">
              {posiciones ? (
                <div className="pitch relative mx-auto aspect-[68/105] w-full max-w-[360px] shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
                  <div className="pitch-lines" />
                  <div className="pitch-center" />
                  <div className="pitch-center-dot" />
                  <div className="pitch-area-top" />
                  <div className="pitch-area-bottom" />
                  {data.once.map((j, i) => {
                    const pos = posiciones[i]
                    if (!pos) return null
                    return (
                      <div
                        key={i}
                        className="absolute z-10 flex w-[74px] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D4AF37]/50 bg-slate-950/85 font-display text-[13px] font-black text-[#D4AF37]">
                          {j.o}
                        </div>
                        {j.c && (
                          <img
                            src={`/logos/clubs/${j.c}.png`}
                            alt=""
                            className="h-4 w-4 object-contain"
                            onError={(ev) => alFallarElEscudo(ev, j.c!)}
                          />
                        )}
                        <span className="w-full truncate text-center text-[10px] font-bold leading-tight text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                          {j.n}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {data.once.map((j, i) => (
                    <li key={i} className="flex items-center justify-between rounded-xl bg-black/25 px-3 py-2 text-sm">
                      <span className="truncate text-white">{j.n}</span>
                      <span className="font-sport text-[11px] uppercase tracking-wider text-slate-400">
                        {j.p} · {j.o}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* El motivo por el que existe la página: el que la abre tiene que poder jugar. */}
            <div className="card-gradient rounded-3xl border border-[#F6C750]/30 p-6 text-center shadow-2xl">
              <h2 className="font-display text-xl font-black uppercase">¿Armás uno mejor?</h2>
              <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-slate-400">
                {data.reto
                  ? "Jugá el mismo bombo de hoy, con los mismos jugadores en juego, y fijate si lo superás."
                  : "Elegí de planteles reales del fútbol argentino, armá tu once y jugá el torneo. Gratis y sin registrarte."}
              </p>
              <Link
                href={destinoCta}
                onClick={() => trackEvent(EVENTOS.equipoLinkCta, { reto: data.reto ? 1 : 0 })}
                className="btn-primary mt-5 inline-block px-10 py-4 font-sport"
              >
                {data.reto ? "Jugar el mismo bombo" : "Armar mi 11"}
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
