"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { leerCarrera, CLAVE_CARRERA, type CarreraGuardada } from "@/lib/carrera-guardada"

/**
 * "Seguí donde quedaste", en el home.
 *
 * La carrera ya se guardaba sola (zustand `persist`), pero nada se lo decía a nadie: el que
 * jugaba tres temporadas y cerraba la pestaña volvía al home y veía la misma portada de siempre,
 * así que empezaba de cero o no volvía. Medido del 11/7 al 7/8: 1.243 de 1.244 usuarios son
 * nuevos.
 *
 * Se muestra el escudo por convención de ruta y no el nombre del club: el nombre vive en
 * `career-engine`, y traerlo hasta acá metería `ligas.json` (189 kB) en el bundle de la portada.
 */
export default function CarreraEnCursoCard() {
  const [carrera, setCarrera] = useState<CarreraGuardada | null>(null)

  // Después del montaje: en el servidor no hay localStorage, y pintar la tarjeta en el HTML
  // daría un parpadeo con datos de otra persona en cualquier caché intermedia.
  useEffect(() => setCarrera(leerCarrera(localStorage.getItem(CLAVE_CARRERA))), [])

  if (!carrera) return null

  return (
    <section className="relative z-10 max-w-6xl mx-auto px-4 pt-6">
      <Link
        href="/carrera"
        className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-[#D4AF37]/30 bg-gradient-to-r from-[#1a1508]/90 to-[#050a14]/90 p-4 transition-colors hover:border-[#D4AF37]/60 sm:p-5"
      >
        <img
          src={`/logos/clubs/${carrera.clubId}.png`}
          alt=""
          className="h-12 w-12 shrink-0 object-contain sm:h-14 sm:w-14"
          onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
        />

        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#D4AF37] font-sport">
            Tenés una carrera empezada
          </span>
          <h3 className="mt-1 truncate font-display text-xl font-black uppercase tracking-tight text-white sm:text-2xl">
            {carrera.nombre}
          </h3>
          <p className="mt-0.5 text-[12px] text-slate-400 font-sans">
            {carrera.temporadas === 0
              ? "Todavía no jugaste ninguna temporada"
              : `${carrera.temporadas} ${carrera.temporadas === 1 ? "temporada jugada" : "temporadas jugadas"}`}
            {" · "}
            {carrera.edad} años · {carrera.ovr} de media
          </p>
        </div>

        <span className="btn-gold shrink-0 whitespace-nowrap rounded-2xl px-5 py-3 text-[11px] font-black uppercase tracking-widest font-sport">
          Seguir
        </span>
      </Link>
    </section>
  )
}
