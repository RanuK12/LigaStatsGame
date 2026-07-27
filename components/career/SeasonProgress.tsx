"use client"

import { useEffect, useState } from "react"
import SolDeMayo from "@/components/ui/SolDeMayo"

/**
 * La temporada corriéndose delante del jugador.
 *
 * El cálculo es instantáneo, así que sin esto el resultado aparecía de golpe y la simulación
 * se sentía como abrir un archivo, no como jugar un año. Acá se muestran las fases con la
 * cadencia justa para que se lea, y recién al final se revela la temporada.
 */
interface Fase { icono: string; texto: string }

const MS_POR_FASE = 620

/** Las fases dependen de en qué torneos está metido el club esta temporada. */
function fasesDe(continental: string | undefined, mundialClubes: boolean, esArgentino: boolean): Fase[] {
  const nombreCont: Record<string, string> = {
    libertadores: "Copa Libertadores",
    sudamericana: "Copa Sudamericana",
    champions: "Champions League",
    europa: "Europa League",
  }
  const fases: Fase[] = [{ icono: "🏋️", texto: "Pretemporada" }]
  fases.push({ icono: esArgentino ? "🇦🇷" : "🏟️", texto: esArgentino ? "Liga Profesional" : "Liga local" })
  if (esArgentino) fases.push({ icono: "🥛", texto: "Copa Argentina" })
  if (continental) {
    fases.push({
      icono: continental === "libertadores" ? "🏆" : continental === "champions" ? "🌟" : continental === "europa" ? "🎖️" : "🥇",
      texto: nombreCont[continental] || "Copa continental",
    })
  }
  if (mundialClubes) fases.push({ icono: "🌐", texto: "Mundial de Clubes" })
  fases.push({ icono: "📋", texto: "Cierre de temporada" })
  return fases
}

/** Duración máxima (todas las fases posibles), para temporizar el reveal sin cortar nada. */
export const SEASON_PROGRESS_MS = 7 * MS_POR_FASE

export default function SeasonProgress({
  activo,
  anio,
  club,
  temporadas = 1,
  continental,
  mundialClubes = false,
  esArgentino = true,
}: {
  activo: boolean
  anio: number
  club?: string
  /** Cuántas temporadas se están simulando de una (para el modo rápido) */
  temporadas?: number
  continental?: string
  mundialClubes?: boolean
  esArgentino?: boolean
}) {
  const [fase, setFase] = useState(0)
  const FASES = fasesDe(continental, mundialClubes, esArgentino)

  useEffect(() => {
    if (!activo) {
      setFase(0)
      return
    }
    const t = setInterval(() => setFase((f) => f + 1), MS_POR_FASE)
    return () => clearInterval(t)
  }, [activo])

  if (!activo) return null

  const hechas = Math.min(fase, FASES.length)
  const pct = Math.round((hechas / FASES.length) * 100)

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-[#02050d]/92 px-4 backdrop-blur-sm">
      <SolDeMayo spin opacity={0.07} className="pointer-events-none absolute h-[560px] w-[560px]" />

      <div className="panel-in relative w-full max-w-sm rounded-3xl border border-white/10 bg-gradient-to-b from-[#0c1728] to-[#050a14] p-6 shadow-2xl">
        <div className="banda-argentina absolute inset-x-0 top-0 h-1 rounded-t-3xl opacity-80" />

        <div className="text-center">
          <div className="font-sport text-[10px] font-black uppercase tracking-[0.3em] text-[#74ACDF]">
            {temporadas > 1 ? `Simulando ${temporadas} temporadas` : "Simulando temporada"}
          </div>
          <div key={anio} className="contador-in mt-1 font-impact text-4xl font-black text-white">
            {anio}
          </div>
          {club && <div className="mt-0.5 text-[11px] text-slate-400 font-sans">{club}</div>}
        </div>

        {/* Fases */}
        <div className="mt-5 space-y-2">
          {FASES.map((f, i) => {
            const hecha = i < hechas
            const actual = i === hechas
            return (
              <div
                key={f.texto}
                className={`relative flex items-center gap-3 rounded-xl border px-3 py-2 transition-all duration-300 ${
                  hecha
                    ? "border-emerald-400/25 bg-emerald-500/[0.07]"
                    : actual
                      ? "border-[#74ACDF]/50 bg-[#74ACDF]/10"
                      : "border-white/5 bg-white/[0.02] opacity-45"
                }`}
              >
                <span className="text-base leading-none">{f.icono}</span>
                {f.texto === "Mundial de Clubes" && !hecha && (
                  <span className="absolute -right-1 -top-1 h-1.5 w-1.5 animate-ping rounded-full bg-[#F6C750]" />
                )}
                <span
                  className={`flex-1 font-sport text-[11px] font-bold uppercase tracking-wider ${
                    hecha ? "text-emerald-300" : actual ? "text-white" : "text-slate-500"
                  }`}
                >
                  {f.texto}
                </span>
                {hecha && <span className="text-[11px] text-emerald-400">✓</span>}
                {actual && (
                  <span className="flex gap-1">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1 w-1 animate-bounce rounded-full bg-[#74ACDF]"
                        style={{ animationDelay: `${d * 120}ms` }}
                      />
                    ))}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Barra */}
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#74ACDF] to-[#F6C750] transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  )
}
