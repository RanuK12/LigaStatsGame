"use client"

import React from "react"

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
  jerseyPattern?: string
  jerseyColor?: string
}

export default function CareerCardView({ data }: { data: CareerCardData }) {
  const kitColor = data.jerseyColor || "#74ACDF"
  const pattern = data.jerseyPattern || "sash"

  return (
    <div className="w-full max-w-md mx-auto rounded-[32px] p-6 sm:p-7 border border-amber-400/25 shadow-[0_25px_70px_rgba(0,0,0,0.85)] font-sans relative text-white overflow-hidden bg-gradient-to-b from-[#091122] via-[#060b18] to-[#03060d]">
      {/* Radial ambient glow */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gradient-to-br from-amber-400/10 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* HEADER SECTION */}
      <div className="flex items-start gap-4 mb-5 relative z-10">
        {/* OVR BADGE (Fondo beige claro + degradado dorado 3D) */}
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-[26px] bg-[#FFF8E7] p-2.5 shadow-[0_8px_25px_rgba(0,0,0,0.5)] flex items-center justify-center">
            <div className="w-full h-full rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 flex flex-col items-center justify-center text-slate-950 shadow-inner">
              <span className="text-[10px] font-black tracking-[0.2em] uppercase font-sport opacity-75">OVR</span>
              <span className="text-5xl font-black font-display leading-none text-slate-950 mt-0.5">
                {data.overall}
              </span>
            </div>
          </div>
        </div>

        {/* DETAILS */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-2xl leading-none">{data.nationalityFlag || "🇦🇷"}</span>
            <div className="px-3 py-1 rounded-xl bg-[#050A14] border border-amber-400/40 text-[11px] font-black tracking-wider uppercase font-sport text-amber-300 shadow-sm">
              {data.marketValue}
            </div>
          </div>

          <h3 className="font-display font-black text-white uppercase leading-tight text-xl sm:text-2xl tracking-tight truncate drop-shadow-sm">
            {data.playerName}
          </h3>
          <p className="text-xs font-bold text-slate-400 font-sport uppercase tracking-wider mt-1">
            #{data.number} · {data.position}
          </p>
        </div>
      </div>

      {/* 3D JERSEY GRAPHIC DISPLAY */}
      <div className="relative w-full py-4 mb-5 rounded-2xl bg-gradient-to-b from-slate-950/70 to-slate-950/90 border border-white/5 flex items-center justify-center overflow-hidden shadow-inner z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative w-28 h-32 flex items-center justify-center filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)] transition-transform hover:scale-105">
          <svg viewBox="0 0 100 120" className="w-full h-full">
            {/* 3D Jersey Shadow Layer */}
            <path
              d="M 20 20 L 35 10 L 65 10 L 80 20 L 95 35 L 85 50 L 75 42 L 75 110 L 25 110 L 25 42 L 15 50 L 5 35 Z"
              fill={kitColor}
              stroke="#ffffff"
              strokeWidth="2.5"
            />
            {/* Jersey Pattern */}
            {pattern === "sash" && (
              <path d="M 20 20 L 75 110 L 60 110 L 20 40 Z" fill="#ffffff" opacity="0.9" />
            )}
            {pattern === "stripes" && (
              <>
                <rect x="35" y="10" width="10" height="100" fill="#ffffff" opacity="0.85" />
                <rect x="55" y="10" width="10" height="100" fill="#ffffff" opacity="0.85" />
              </>
            )}
            {pattern === "hoops" && (
              <rect x="25" y="50" width="50" height="20" fill="#ffffff" opacity="0.9" />
            )}
            {/* Collar 3D Detail */}
            <polygon points="35,10 50,22 65,10" fill="#050A14" />
            <polygon points="35,10 50,22 65,10" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            {/* Metallic Gold Number */}
            <text x="50" y="75" textAnchor="middle" fill="#ffffff" stroke="#000000" strokeWidth="1" fontSize="26" fontWeight="900" fontFamily="sans-serif">
              {data.number}
            </text>
          </svg>
        </div>
      </div>

      {/* STATS BOX: PJ, GLS, AST */}
      <div className="grid grid-cols-3 gap-2 bg-[#050A14] border border-white/5 rounded-2xl p-4 text-center mb-6 shadow-inner relative z-10">
        <div>
          <div className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-wider">PJ</div>
          <div className="text-3xl font-black text-white font-display mt-0.5">{data.matchesPlayed}</div>
        </div>
        <div className="border-x border-white/10">
          <div className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-wider">GLS</div>
          <div className="text-3xl font-black text-emerald-400 font-display mt-0.5">{data.goals}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-wider">AST</div>
          <div className="text-3xl font-black text-sky-400 font-display mt-0.5">{data.assists}</div>
        </div>
      </div>

      {/* TRAYECTORIA */}
      <div className="mb-5 relative z-10">
        <h4 className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-[0.35em] text-center mb-3">
          T R A Y E C T O R I A
        </h4>
        <div className="flex items-center justify-center gap-3.5 flex-wrap">
          {data.clubs.map((c, i) => (
            <div
              key={i}
              className="w-13 h-13 rounded-2xl bg-[#050A14] border border-white/10 p-2 flex items-center justify-center shadow-md hover:scale-105 transition-transform"
              title={c.name}
            >
              {c.logoUrl ? (
                <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain" />
              ) : (
                <span className="text-[10px] font-black font-sport text-[#74ACDF]">{c.name.slice(0, 3).toUpperCase()}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* TÍTULOS */}
      <div className="mb-5 relative z-10">
        <h4 className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-[0.35em] text-center mb-3">
          T Í T U L O S
        </h4>
        <div className="flex items-center justify-center gap-5 flex-wrap">
          {data.trophies.map((t, i) => (
            <div key={i} className="flex flex-col items-center group relative">
              <div className="relative w-12 h-14 flex items-center justify-center">
                <div className="text-3xl filter drop-shadow-[0_4px_10px_rgba(245,158,11,0.4)] group-hover:scale-110 transition-transform">
                  {t.icon}
                </div>
                {t.count > 1 && (
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-slate-950 border border-amber-400 text-[9px] font-black font-sport text-amber-300 shadow-md">
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
      <div className="pt-3 border-t border-white/10 flex justify-between items-center text-[10px] font-sport font-bold uppercase tracking-wider relative z-10">
        <span className="font-display font-black text-white tracking-[0.15em]">GAMBETA</span>
        <span className="text-[#74ACDF] text-[9px] tracking-[0.2em]">EL JUEGO DEL FÚTBOL ARGENTINO</span>
      </div>
    </div>
  )
}
