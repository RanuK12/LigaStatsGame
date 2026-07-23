"use client"

import React from "react"
import Image from "next/image"

export interface CareerCardData {
  playerName: string
  number: number
  position: string
  overall: number
  marketValue: string
  nationalityFlag?: string
  matchesPlayed: number
  goals: number
  assists: number
  clubs: { id: string; name: string; logoUrl?: string }[]
  trophies: { id: string; name: string; count: number; icon: string }[]
}

export default function CareerCardView({ data }: { data: CareerCardData }) {
  return (
    <div className="w-full max-w-md mx-auto card-gradient rounded-3xl p-6 sm:p-8 border border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.6)] font-sans relative text-white overflow-hidden">
      {/* Glow highlight top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 to-[#74ACDF]" />

      {/* HEADER SECTION: OVR, FLAG, VALOR, NAME/POS */}
      <div className="flex items-center gap-3 mb-6">
        {/* OVR BADGE */}
        <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-b from-amber-400 via-yellow-500 to-amber-600 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.4)] shrink-0 flex flex-col items-center justify-center text-slate-950">
          <span className="text-[9px] font-black tracking-widest uppercase font-sport opacity-80">OVR</span>
          <span className="text-3xl sm:text-4xl font-black font-display leading-none">{data.overall}</span>
        </div>

        {/* DETAILS COLUMN */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Top row: Flag + Market Value + Name Badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl leading-none" title={data.nationalityFlag ? "Nacionalidad" : "Argentina"}>{data.nationalityFlag || "🇦🇷"}</span>
            <div className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-[10px] font-bold tracking-wider uppercase font-sport text-slate-200">
              VALOR <span className="text-amber-400 font-black">{data.marketValue}</span>
            </div>
            <div className="px-3 py-1 rounded-xl bg-slate-900/80 border border-slate-700/80 text-[10px] font-bold tracking-wider uppercase font-sport text-slate-200 truncate max-w-[140px]">
              {data.playerName.toUpperCase()} • #{data.number} • {data.position}
            </div>
          </div>

          {/* STATS ROW: PJ, GLS, AST */}
          <div className="grid grid-cols-3 gap-2 bg-slate-950/60 border border-white/5 rounded-2xl p-2.5 text-center">
            <div>
              <div className="text-[8px] font-bold text-slate-400 font-sport uppercase tracking-wider">PJ</div>
              <div className="text-lg font-black text-white font-display">{data.matchesPlayed}</div>
            </div>
            <div className="border-x border-white/5">
              <div className="text-[8px] font-bold text-slate-400 font-sport uppercase tracking-wider">GLS</div>
              <div className="text-lg font-black text-green-400 font-display">{data.goals}</div>
            </div>
            <div>
              <div className="text-[8px] font-bold text-slate-400 font-sport uppercase tracking-wider">AST</div>
              <div className="text-lg font-black text-blue-400 font-display">{data.assists}</div>
            </div>
          </div>
        </div>
      </div>

      {/* TRAYECTORIA (CLUB LOGOS) */}
      <div className="mb-6">
        <h4 className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-[0.2em] text-center mb-3">
          TRAYECTORIA
        </h4>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {data.clubs.map((c, i) => (
            <div key={i} className="w-12 h-12 rounded-2xl bg-slate-950/80 border border-white/10 p-2 flex items-center justify-center shadow-md hover:scale-105 transition-transform" title={c.name}>
              {c.logoUrl ? (
                <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs font-black font-sport text-[#74ACDF]">{c.name.slice(0, 3).toUpperCase()}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TÍTULOS (TROPHY ICONS WITH COUNTERS) */}
      <div className="mb-6">
        <h4 className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-[0.2em] text-center mb-3">
          TÍTULOS
        </h4>
        <div className="flex items-center justify-center gap-5 flex-wrap">
          {data.trophies.map((t, i) => (
            <div key={i} className="flex flex-col items-center group relative">
              <div className="relative w-12 h-14 flex items-center justify-center">
                {/* 3D trophy rendered icon */}
                <div className="text-3xl filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.3)] group-hover:scale-110 transition-transform">
                  {t.icon}
                </div>
                {/* Badge count */}
                {t.count > 1 && (
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-slate-900 border border-amber-400 text-[9px] font-black font-sport text-amber-300 shadow-md">
                    ×{t.count}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-bold text-slate-400 font-sport uppercase mt-1 tracking-wider text-center max-w-[80px] truncate">
                {t.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER WATERMARK */}
      <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500 font-sport font-bold uppercase tracking-wider">
        <span>Modo Carrera</span>
        <span className="text-[#74ACDF]/70">ranuk12.github.io/LigaStatsGame</span>
      </div>
    </div>
  )
}
