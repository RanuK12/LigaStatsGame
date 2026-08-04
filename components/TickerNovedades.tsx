"use client"

import Link from "next/link"
import novedadesData from "@/data/novedades.json"

type Novedad = { fecha: string; titulo: string; texto: string }

/**
 * La cinta de novedades que corre arriba de todo.
 *
 * Sale de data/novedades.json, el mismo archivo que la sección del home: si fueran dos listas
 * distintas se iban a desincronizar el primer día y la cinta terminaría anunciando algo que ya
 * no existe.
 *
 * Solo los títulos, y solo los más nuevos: es un titular al pasar, no un boletín.
 */
const CUANTAS = 6
const novedades = (novedadesData as Novedad[]).slice(0, CUANTAS)

export default function TickerNovedades() {
  if (novedades.length === 0) return null

  // La lista va DOS veces: la animación desplaza exactamente la mitad, así que cuando la
  // primera copia termina de salir, la segunda está justo donde arrancó la primera y el bucle
  // no tiene salto. Con una sola copia se ve el corte en cada vuelta.
  const items = [...novedades, ...novedades]
  // Más novedades, más recorrido: si la duración fuera fija, con seis títulos volaría.
  const segundos = Math.max(28, novedades.length * 7)

  return (
    <div className="relative w-full overflow-hidden border-b border-white/[0.07] bg-[#0a1424]">
      {/* La banda argentina de un pelo, para que la cinta sea parte de la marca */}
      <div className="banda-argentina absolute inset-x-0 top-0 h-[2px] opacity-70" />

      {/* Los bordes se desvanecen: el texto entra y sale en vez de aparecer cortado. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#0a1424] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#0a1424] to-transparent" />

      <div className="flex items-center py-1.5">
        <span className="font-sport z-20 shrink-0 border-r border-white/10 bg-[#0a1424] px-3 text-[9px] font-black uppercase tracking-[0.25em] text-[#E7C27D]">
          Novedades
        </span>

        {/* group para que se frene al pasar el mouse: si algo interesa, hay que poder leerlo. */}
        <div className="group relative flex-1 overflow-hidden">
          <div
            className="ticker-cinta flex w-max items-center gap-8 pl-8 group-hover:[animation-play-state:paused]"
            style={{ animationDuration: `${segundos}s` }}
          >
            {items.map((n, i) => (
              <Link
                key={`${n.titulo}-${i}`}
                href="/#novedades"
                // aria-hidden en la segunda copia: existe solo para que el bucle no salte, y
                // un lector de pantalla no tiene por qué leer todo dos veces.
                aria-hidden={i >= novedades.length}
                tabIndex={i >= novedades.length ? -1 : undefined}
                className="flex shrink-0 items-center gap-2 text-[11px] text-slate-300 transition-colors hover:text-white"
              >
                <span className="text-[#74ACDF]">▸</span>
                <span className="whitespace-nowrap font-bold">{n.titulo}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
