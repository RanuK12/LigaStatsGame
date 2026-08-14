"use client"

import { useEffect, useState } from "react"
import { topDelDia, type FilaReto, type Tabla } from "@/lib/reto-ranking"

const TABLAS: { id: Tabla; label: string; ayuda: string }[] = [
  { id: "general", label: "General", ayuda: "Los puntos que sacó en el torneo." },
  { id: "fuerza", label: "Fuerza", ayuda: "El OVR del once: el bombo mejor aprovechado." },
  { id: "eficiencia", label: "Eficiencia", ayuda: "Puntos por cada 10 de OVR: rendir por encima del papel." },
]

/**
 * Las tres tablas del reto de hoy.
 *
 * Con una sola tabla hay un primero por día. Con tres hay tres, y el que sale primero en algo es
 * el que lo publica. Es lo que hizo 7a0 cuando se le cayó la mitad del tráfico en un mes.
 *
 * Si Supabase no está configurado, no hay red o la tabla todavía no existe, el componente no
 * dibuja nada: el reto se juega igual sin tablas.
 */
export default function TablasDelDia({ fecha }: { fecha: string }) {
  const [tabla, setTabla] = useState<Tabla>("general")
  const [filas, setFilas] = useState<FilaReto[] | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    let vivo = true
    setCargando(true)
    topDelDia(fecha, tabla).then((r) => {
      if (!vivo) return
      setFilas(r)
      setCargando(false)
    })
    return () => {
      vivo = false
    }
  }, [fecha, tabla])

  // No se pudo consultar: no hay nada que contar. Un cartel de error acá no le sirve a nadie.
  if (!cargando && filas === null) return null

  const activa = TABLAS.find((t) => t.id === tabla)!
  const valor = (f: FilaReto) => (tabla === "general" ? f.pts : tabla === "fuerza" ? f.ovr : f.eficiencia)

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <h3 className="font-sport text-[11px] font-black uppercase tracking-widest text-[#74ACDF]">
        Las tablas de hoy
      </h3>

      <div className="mt-3 flex gap-2">
        {TABLAS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTabla(t.id)}
            className={`font-sport flex-1 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
              t.id === tabla
                ? "border-[#74ACDF]/50 bg-[#74ACDF]/15 text-white"
                : "border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mt-2 font-sans text-[11px] leading-relaxed text-slate-500">{activa.ayuda}</p>

      {cargando ? (
        <div className="mt-3 h-24 animate-pulse rounded-xl bg-slate-800/40" />
      ) : filas && filas.length > 0 ? (
        <ol className="mt-3 space-y-1">
          {filas.slice(0, 10).map((f, i) => (
            <li
              key={`${f.username}-${i}`}
              className="flex items-center gap-3 rounded-xl bg-black/25 px-3 py-2 text-[12px]"
            >
              <span className="font-display w-5 shrink-0 text-center font-black text-slate-500">{i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-white">{f.username}</span>
              <span className="font-display shrink-0 font-black text-[#D4AF37]">{valor(f)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-3 font-sans text-[12px] leading-relaxed text-slate-400">
          Todavía no jugó nadie el reto de hoy. El primero que lo haga encabeza las tres.
        </p>
      )}
    </div>
  )
}
