"use client"

import Link from "next/link"
import { TIERS } from "@/lib/ranking"
import { DAILY_BASE_ELO, DAILY_MAX_ELO } from "@/lib/daily-progress"
import SolDeMayo from "@/components/ui/SolDeMayo"

/**
 * Cómo funciona el ranking: los seis escalones de ELO y de dónde salen los puntos.
 * Se muestra arriba de la tabla para que cualquiera entienda en qué se está metiendo.
 */
export default function EloExplainer() {
  return (
    <section className="relative overflow-hidden card-gradient rounded-3xl border border-[#74ACDF]/20 p-5 sm:p-7 mb-8">
      <SolDeMayo spin opacity={0.09} className="absolute -right-14 -top-14 w-56 h-56 pointer-events-none" />

      <div className="relative">
        <h2 className="font-display text-lg sm:text-xl font-black text-white uppercase tracking-tight">
          Cómo funciona el ranking
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm mt-1.5 font-sans leading-relaxed max-w-2xl">
          Cada torneo que simulás mueve tu <strong className="text-white">ELO</strong> según dónde termines contra
          los 27 rivales. Salir campeón te catapulta; pelear el descenso te hace perder puntos. El ELO define tu
          escalón, del Bronce a la Leyenda.
        </p>

        {/* Escalones */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-5">
          {TIERS.map((t, i) => {
            const next = TIERS[i + 1]
            return (
              <div
                key={t.name}
                className="rounded-2xl border p-3 text-center bg-slate-950/50"
                style={{ borderColor: `${t.color}44` }}
              >
                <div className="text-xl leading-none">{t.icon}</div>
                <div className="mt-1.5 font-sport text-[11px] font-black uppercase tracking-wider" style={{ color: t.color }}>
                  {t.name}
                </div>
                <div className="text-[10px] text-slate-500 mt-1 font-sport">
                  {next ? `${t.min} – ${next.min - 1}` : `${t.min}+`}
                </div>
              </div>
            )
          })}
        </div>

        {/* De dónde salen los puntos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4">
          {[
            { icon: "🏆", titulo: "Campeón", detalle: "+140 pts y salto grande de ELO", color: "#F6C750" },
            { icon: "⚖️", titulo: "Mitad de tabla", detalle: "Casi neutro: ni sumás ni perdés", color: "#9CCBF0" },
            { icon: "🔻", titulo: "Zona de descenso", detalle: "Restás puntos y bajás de escalón", color: "#F87171" },
          ].map((c) => (
            <div key={c.titulo} className="rounded-2xl border border-white/5 bg-slate-950/40 p-3.5 flex items-start gap-3">
              <span className="text-lg leading-none">{c.icon}</span>
              <div>
                <div className="font-sport text-[11px] font-black uppercase tracking-wider" style={{ color: c.color }}>
                  {c.titulo}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 font-sans">{c.detalle}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Reto diario: el atajo para sumar todos los días */}
        <div className="mt-4 rounded-2xl border border-orange-400/30 bg-orange-500/[0.07] p-3.5 flex items-start gap-3">
          <span className="text-lg leading-none">🔥</span>
          <div>
            <div className="font-sport text-[11px] font-black uppercase tracking-wider text-orange-300">
              Reto diario: +{DAILY_BASE_ELO} a +{DAILY_MAX_ELO} ELO
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 font-sans">
              Completá el reto del día y sumás ELO extra; la racha lo agranda hasta {DAILY_MAX_ELO}. Hay que estar
              registrado para que impacte en el ranking.{' '}
              <Link href="/daily" className="text-[#74ACDF] font-bold hover:text-white transition-colors">
                Ir al reto de hoy →
              </Link>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-500 mt-4 font-sport uppercase tracking-wider">
          Arrancás en 1000 (Plata) · el piso es 500 · Leyenda desde 1750
        </p>
      </div>
    </section>
  )
}
