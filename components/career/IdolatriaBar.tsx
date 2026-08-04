"use client"

import type { Idolatria } from "@/lib/career-idolatria"
import { NIVELES } from "@/lib/career-idolatria"

/**
 * La barra de idolatría del club donde jugás hoy.
 *
 * Sin esto, quedarse no tiene premio visible y el jugador agarra siempre la oferta más alta.
 * La barra es el motivo para decir que no.
 */
export default function IdolatriaBar({ idolatria, clubName }: { idolatria: Idolatria; clubName: string }) {
  const { nivel, siguiente, progreso } = idolatria
  const esLeyenda = nivel.id === "leyenda"
  const idx = NIVELES.findIndex((n) => n.id === nivel.id)

  return (
    <div className="relative mt-4">
      <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest font-sport">
        <span className="text-slate-500">
          Idolatría en {clubName}
        </span>
        <span className={`flex items-center gap-1.5 ${esLeyenda ? "text-[#F6C750]" : "text-[#74ACDF]"}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={nivel.imagen} alt="" className="h-5 w-5 object-contain" />
          {nivel.nombre}
        </span>
      </div>

      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`barra-crece h-full rounded-full ${
            esLeyenda
              ? "bg-gradient-to-r from-[#F6C750] to-[#FFE9A8]"
              : "bg-gradient-to-r from-[#74ACDF] to-[#9CCBF0]"
          }`}
          style={{ width: `${Math.round(progreso * 100)}%` }}
        />
      </div>

      {/* Los cinco escalones, para que se vea cuánto falta hasta la estatua. */}
      <div className="mt-1.5 flex items-center justify-between font-sport text-[9px] uppercase tracking-wider">
        {/* Los cinco escalones. Los que faltan van apagados: se ve cuánto queda para la estatua. */}
        {NIVELES.map((n, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={n.id}
            src={n.imagen}
            alt={n.nombre}
            title={n.nombre}
            className={`h-5 w-5 object-contain transition-opacity ${i <= idx ? "opacity-100" : "opacity-25 grayscale"}`}
          />
        ))}
      </div>

      <p className="mt-1 text-[10px] leading-snug text-slate-500 font-sans">
        {esLeyenda
          ? "Tenés tu estatua en la puerta del estadio. Muy pocos llegan acá."
          : siguiente
            ? `Faltan ${siguiente.faltan} para ser ${siguiente.nivel.nombre}. Quedarte es el camino más corto.`
            : nivel.descripcion}
      </p>
    </div>
  )
}
