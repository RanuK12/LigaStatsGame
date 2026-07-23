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
    <div className="w-full max-w-md mx-auto rounded-3xl p-6 sm:p-7 border border-amber-400/20 shadow-[0_20px_60px_rgba(0,0,0,0.7)] font-sans relative text-white overflow-hidden bg-gradient-to-b from-[#0c1526] via-[#0a1220] to-[#060b16]">
      {/* Gold top accent + ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
      <div className="absolute -top-16 -right-10 w-52 h-52 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

      {/* HEADER: OVR + NAME */}
      <div className="flex items-center gap-4 mb-5 relative">
        {/* OVR BADGE (dorado 3D) */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-200 via-amber-400 to-amber-600 shadow-[0_6px_20px_rgba(245,158,11,0.45),inset_0_2px_4px_rgba(255,255,255,0.6)] flex flex-col items-center justify-center text-slate-950">
            <span className="text-[9px] font-black tracking-[0.2em] uppercase font-sport opacity-70 -mb-1">OVR</span>
            <span className="text-5xl font-black font-display leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.5)]">{data.overall}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-2xl leading-none">{data.nationalityFlag || "🇦🇷"}</span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-400/15 border border-amber-400/30 text-[11px] font-black tracking-wider uppercase font-sport text-amber-300">
              {data.marketValue}
            </span>
          </div>
          <h3 className="font-display font-black text-white uppercase leading-tight text-xl sm:text-2xl truncate">
            {data.playerName}
          </h3>
          <p className="text-[11px] font-bold text-slate-400 font-sport uppercase tracking-wider mt-0.5">
            #{data.number} · {data.position}
          </p>
        </div>
      </div>

      {/* STATS ROW: PJ, GLS, AST */}
      <div className="grid grid-cols-3 gap-2 bg-slate-950/70 border border-white/5 rounded-2xl p-3 text-center mb-6">
        <div>
          <div className="text-[8px] font-bold text-slate-400 font-sport uppercase tracking-wider">PJ</div>
          <div className="text-xl font-black text-white font-display">{data.matchesPlayed}</div>
        </div>
        <div className="border-x border-white/5">
          <div className="text-[8px] font-bold text-slate-400 font-sport uppercase tracking-wider">GLS</div>
          <div className="text-xl font-black text-green-400 font-display">{data.goals}</div>
        </div>
        <div>
          <div className="text-[8px] font-bold text-slate-400 font-sport uppercase tracking-wider">AST</div>
          <div className="text-xl font-black text-blue-400 font-display">{data.assists}</div>
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
