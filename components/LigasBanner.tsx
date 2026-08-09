"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import banner from "@/data/derived/ligas-banner.json"

/**
 * Las ligas del modo carrera, en la portada.
 *
 * Es lo más grande que tiene el juego y no se contaba en ningún lado: ocho países, diecinueve
 * categorías y más de cuatrocientos clubes, con el ascenso argentino entero. Ningún otro juego
 * del rubro deja empezar en el Federal A, y eso hay que decirlo donde la gente llega, no
 * esconderlo adentro del modo carrera.
 *
 * Los números exactos no se escriben acá a propósito —envejecen mal— sino que salen del dato.
 */

/**
 * Los números salen de `data/derived/ligas-banner.json`, que arma el build.
 *
 * Antes esto importaba `career-engine` para mostrar cuatro datos por país, y con eso se llevaba
 * `ligas.json` —189 kB— y el motor entero al bundle de la PORTADA. El móvil es la mayoría del
 * tráfico y convierte cuatro veces peor: ese peso se paga justo ahí. El archivo derivado pesa
 * 2 kB y se regenera solo con `npm run build:ligas-banner`, así que si mañana entra otro país
 * la portada lo sigue contando sola.
 */
const { paises: PAISES, totalLigas: TOTAL_LIGAS, totalClubes: TOTAL_CLUBES } = banner

export default function LigasBanner() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-2">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <p className="font-sport text-[10px] font-black uppercase tracking-[0.3em] text-[#34d399]">Nuevo</p>
        <h3 className="mt-1.5 font-display text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
          De la <span className="gradient-text">B del ascenso</span> al Maracaná
        </h3>
        <p className="mx-auto mt-2.5 max-w-2xl text-sm leading-relaxed text-slate-400">
          El modo carrera se juega en{" "}
          <strong className="text-slate-200">{PAISES.length} países</strong> y{" "}
          <strong className="text-slate-200">{TOTAL_LIGAS} categorías</strong>, con{" "}
          <strong className="text-slate-200">{TOTAL_CLUBES} clubes</strong>. Elegís dónde debutar
          —hasta en el Torneo Federal A— y subís peleándola.
        </p>
      </motion.div>

      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PAISES.map((p, i) => (
          <motion.div
            key={p.nombre}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -4 }}
          >
            <Link href="/carrera/" className="group block h-full">
              <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-[#0c1728]/80 to-[#050a14]/80 p-4 transition-colors group-hover:border-[#74ACDF]/45">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl leading-none">{p.bandera}</span>
                  <span className="font-display text-base font-black uppercase text-white">{p.nombre}</span>
                </div>

                <div className="mt-3 space-y-2">
                  {p.ligas.map((l) => (
                    <div key={l.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-sport text-[11px] font-bold uppercase tracking-wide text-slate-300">
                          {l.nombre}
                        </span>
                        <span className="shrink-0 font-sport text-[9px] uppercase tracking-wider text-slate-500">
                          {l.clubes}
                        </span>
                      </div>
                      {/* La barra de nivel: es lo que hace visible que el Federal A y la Série A
                          no son lo mismo, y que arrancar abajo es una decisión. */}
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#74ACDF] to-[#F6C750]"
                          style={{ width: `${l.nivel}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-3">
                  <span className="font-sport text-[10px] font-bold uppercase tracking-wider text-[#F6C750]">
                    {p.etiqueta} · {p.copa}
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-7 text-center">
        <Link href="/carrera/" className="btn-primary inline-block px-10 py-4 font-sport">
          Empezar mi carrera
        </Link>
        <p className="mt-2.5 text-[11px] text-slate-500">
          Gratis, sin registrarte. Ascensos y descensos de verdad.
        </p>
      </div>
    </section>
  )
}
