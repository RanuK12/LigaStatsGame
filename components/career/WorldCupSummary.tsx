"use client"

import type { WorldCupRun } from "@/lib/world-cup"

const NOMBRE_ROL: Record<WorldCupRun["rol"], { texto: string; color: string }> = {
  figura: { texto: "Figura del equipo", color: "#F6C750" },
  titular: { texto: "Titular", color: "#74ACDF" },
  alternativa: { texto: "Alternativa", color: "#9CA3AF" },
  convocado: { texto: "Convocado", color: "#6B7280" },
}

const NOMBRE_RONDA: Record<WorldCupRun["ronda"], string> = {
  grupos: "Fase de grupos",
  octavos: "Octavos de final",
  cuartos: "Cuartos de final",
  semi: "Semifinal",
  final: "Subcampeón del mundo",
  campeon: "¡CAMPEÓN DEL MUNDO!",
}

/**
 * El Mundial contado partido por partido: hasta dónde llegó la selección, contra quién quedó
 * afuera y qué hizo el jugador. Antes esto era una sola línea de texto entre los highlights.
 */
export default function WorldCupSummary({ wc, categoria }: { wc: WorldCupRun; categoria: string }) {
  const rol = NOMBRE_ROL[wc.rol]
  const esArquero = categoria === "GK"
  const esDefensor = categoria === "DEF"

  return (
    <div
      className={`panel-in relative overflow-hidden rounded-2xl border p-4 ${
        wc.campeon
          ? "border-[#F6C750]/50 bg-gradient-to-b from-[#F6C750]/12 to-transparent shadow-[0_0_28px_rgba(246,199,80,0.18)]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <div className="banda-argentina absolute inset-x-0 top-0 h-0.5 opacity-70" />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-sport text-[9px] font-black uppercase tracking-[0.3em] text-[#74ACDF]">
            Mundial {wc.year} · {wc.seleccion}
          </div>
          <div
            className={`mt-1 font-impact font-black uppercase leading-none ${wc.campeon ? "text-[#F6C750] text-xl" : "text-white text-base"}`}
          >
            {NOMBRE_RONDA[wc.ronda]}
          </div>
          {!wc.campeon && wc.eliminadoPor && (
            <div className="mt-1 text-[11px] text-slate-400 font-sans">Eliminados por {wc.eliminadoPor}</div>
          )}
        </div>
        <span
          className="shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wider font-sport"
          style={{ color: rol.color, borderColor: `${rol.color}55`, background: `${rol.color}14` }}
        >
          {rol.texto}
        </span>
      </div>

      {/* Recorrido */}
      <div className="mt-3 space-y-1">
        {wc.partidos.map((p, i) => {
          const gano = p.golesAFavor > p.golesEnContra || (p.penales && i === wc.partidos.length - 1 && wc.ronda !== "grupos" && !wc.eliminadoPor)
          const perdio = p.golesAFavor < p.golesEnContra
          return (
            <div key={i} className="flex items-center gap-2 rounded-lg bg-black/25 px-2.5 py-1.5 text-[11px]">
              <span className="w-16 shrink-0 font-sport text-[9px] font-bold uppercase tracking-wider text-slate-500">
                {p.ronda}
              </span>
              <span className="flex-1 truncate text-slate-300">{p.rival}</span>
              <span
                className={`font-display font-black tabular-nums ${gano ? "text-emerald-400" : perdio ? "text-red-400" : "text-slate-300"}`}
              >
                {p.golesAFavor}-{p.golesEnContra}
              </span>
              {p.penales && <span className="text-[9px] text-[#F6C750] font-sport">({p.penales}p)</span>}
            </div>
          )
        })}
      </div>

      {/* Lo que hizo el jugador */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-center font-sport">
        {[
          { v: wc.caps, l: "Partidos", c: "#60a5fa" },
          esArquero || esDefensor
            ? { v: wc.vallasInvictas, l: "V. invictas", c: "#34d399" }
            : { v: wc.goles, l: "Goles", c: "#34d399" },
          esArquero ? { v: wc.goles, l: "Goles", c: "#fb923c" } : { v: wc.asistencias, l: "Asist.", c: "#fb923c" },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-white/5 bg-white/5 py-2">
            <div className="font-display text-lg font-black" style={{ color: s.c }}>
              {s.v}
            </div>
            <div className="text-[8px] uppercase tracking-wider text-slate-400">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
