"use client"

import React, { useState, useRef } from "react"
import { motion } from "framer-motion"
import PlayerRadarChart from "@/components/charts/PlayerRadarChart"

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
  idolatria?: { nivel: string; icono?: string; clubName: string; imagen?: string }
  cleanSheets?: number
  penaltiesSaved?: number
}

export default function CareerCardView({ data }: { data: CareerCardData }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 })
  const [showRadar, setShowRadar] = useState(false)

  const kitColor = data.jerseyColor || "#74ACDF"
  const pattern = data.jerseyPattern || "sash"

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rX = ((y - centerY) / centerY) * -12
    const rY = ((x - centerX) / centerX) * 12

    setRotateX(rX)
    setRotateY(rY)
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.35,
    })
  }

  function handleMouseLeave() {
    setRotateX(0)
    setRotateY(0)
    setGlarePos({ x: 50, y: 50, opacity: 0 })
  }

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto py-2">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        animate={{ rotateX, rotateY }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
        className="w-full rounded-[36px] p-6 sm:p-7 border border-amber-400/30 shadow-[0_30px_90px_rgba(0,0,0,0.9)] font-sans relative text-white overflow-hidden bg-gradient-to-b from-[#0c162b] via-[#070e1c] to-[#030712] cursor-pointer"
      >
        {/* LIGHTING OVERLAY */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-30"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}) 0%, rgba(212,175,55,${glarePos.opacity * 0.4}) 30%, transparent 70%)`,
          }}
        />

        {/* HEADER SECTION */}
        <div
          className="flex items-start gap-4 mb-4 relative z-10"
          style={{ transform: "translateZ(35px)" }}
        >
          {/* OVR BADGE */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-[28px] bg-gradient-to-br from-[#FFF9EA] via-[#FDE8B3] to-[#E5C16C] p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.6)] flex items-center justify-center border border-amber-300/60">
              <div className="w-full h-full rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 flex flex-col items-center justify-center text-slate-950">
                <span className="text-[10px] font-black tracking-[0.2em] uppercase font-sport opacity-80">OVR</span>
                <span className="text-5xl font-black font-display leading-none text-slate-950 mt-0.5">
                  {data.overall}
                </span>
              </div>
            </div>
          </div>

          {/* DETAILS */}
          <div className="flex-1 min-w-0 pt-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-2xl leading-none">{data.nationalityFlag || "🇦🇷"}</span>
              <div className="px-3 py-1 rounded-xl bg-[#050A14] border border-amber-400/50 text-[11px] font-black tracking-wider uppercase font-sport text-amber-300 shadow-md">
                {data.marketValue}
              </div>
            </div>

            <h3 className="font-display font-black text-white uppercase leading-tight text-xl sm:text-2xl tracking-tight truncate">
              {data.playerName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs font-bold text-slate-400 font-sport uppercase tracking-wider">
                #{data.number} · {data.position}
              </p>
              <button
                onClick={() => setShowRadar(!showRadar)}
                className="px-2 py-0.5 rounded-lg bg-amber-400/20 border border-amber-400/40 text-[9px] font-bold text-amber-300 font-sport uppercase hover:bg-amber-400/30 transition-colors"
              >
                {showRadar ? "👕 Ver Camiseta" : "📊 Ver Radar"}
              </button>
            </div>
          </div>
        </div>

        {/* TOGGLE: 3D JERSEY GRAPHIC OR RADAR CHART */}
        {showRadar ? (
          <div className="mb-5 relative z-10" style={{ transform: "translateZ(40px)" }}>
            <PlayerRadarChart ovr={data.overall} position={data.position} />
          </div>
        ) : (
          <div
            className="relative w-full py-5 mb-5 rounded-2xl bg-gradient-to-b from-slate-950/80 to-slate-950 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl z-10"
            style={{ transform: "translateZ(45px)" }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-400/15 via-transparent to-transparent pointer-events-none" />

            <div className="relative w-32 h-36 flex items-center justify-center filter drop-shadow-[0_16px_28px_rgba(0,0,0,0.85)]">
              <svg viewBox="0 0 100 120" className="w-full h-full">
                <defs>
                  <linearGradient id="jerseyShadow" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#000000" stopOpacity="0" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
                  </linearGradient>
                  <linearGradient id="goldNum" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF3B0" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#D4AF37" />
                  </linearGradient>
                </defs>

                <path
                  d="M 20 20 L 35 10 L 65 10 L 80 20 L 95 35 L 85 50 L 75 42 L 75 110 L 25 110 L 25 42 L 15 50 L 5 35 Z"
                  fill={kitColor}
                  stroke="#ffffff"
                  strokeWidth="2.5"
                />

                <path
                  d="M 20 20 L 35 10 L 65 10 L 80 20 L 95 35 L 85 50 L 75 42 L 75 110 L 25 110 L 25 42 L 15 50 L 5 35 Z"
                  fill="url(#jerseyShadow)"
                />

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

                <polygon points="35,10 50,24 65,10" fill="#030712" />
                <polygon points="35,10 50,24 65,10" fill="none" stroke="#ffffff" strokeWidth="2" />

                <g transform="translate(28, 28) scale(0.6)">
                  <circle cx="10" cy="10" r="8" fill="#F59E0B" />
                  <path d="M10 4 L12 8 L16 8 L13 11 L14 15 L10 12 L6 15 L7 11 L4 8 L8 8 Z" fill="#ffffff" />
                </g>

                <text
                  x="50"
                  y="76"
                  textAnchor="middle"
                  fill="url(#goldNum)"
                  stroke="#000000"
                  strokeWidth="1.5"
                  fontSize="26"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  {data.number}
                </text>
              </svg>
            </div>
          </div>
        )}

        {/* STATS BOX: PJ, GLS, AST */}
        <div
          className="grid grid-cols-3 gap-2 bg-[#050A14] border border-white/10 rounded-2xl p-4 text-center mb-6 shadow-inner relative z-10"
          style={{ transform: "translateZ(30px)" }}
        >
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
        <div className="mb-5 relative z-10" style={{ transform: "translateZ(25px)" }}>
          <h4 className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-[0.35em] text-center mb-3">
            T R A Y E C T O R I A
          </h4>
          <div className="flex items-center justify-center gap-3.5 flex-wrap">
            {data.clubs.map((c, i) => (
              <div
                key={i}
                className="w-13 h-13 rounded-2xl bg-[#050A14] border border-white/10 p-2 flex items-center justify-center shadow-lg hover:scale-110 transition-transform overflow-hidden"
                title={c.name}
              >
                {c.logoUrl ? (
                  <img
                    src={c.logoUrl}
                    alt={c.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLElement
                      target.style.display = "none"
                      const parent = target.parentElement
                      if (parent && !parent.querySelector(".initials-fallback")) {
                        const span = document.createElement("span")
                        span.className = "initials-fallback text-[10px] font-black font-sport text-[#74ACDF]"
                        span.innerText = c.name.slice(0, 3).toUpperCase()
                        parent.appendChild(span)
                      }
                    }}
                  />
                ) : (
                  <span className="text-[10px] font-black font-sport text-[#74ACDF]">{c.name.slice(0, 3).toUpperCase()}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* TÍTULOS */}
        <div className="mb-5 relative z-10" style={{ transform: "translateZ(25px)" }}>
          <h4 className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-[0.35em] text-center mb-3">
            T Í T U L O S
          </h4>
          <div className="flex items-center justify-center gap-5 flex-wrap">
            {data.trophies.map((t, i) => (
              <div key={i} className="flex flex-col items-center group relative">
                <div className="relative w-12 h-14 flex items-center justify-center">
                  {t.icon && (t.icon.startsWith("/") || t.icon.includes(".svg")) ? (
                    <img
                      src={t.icon}
                      alt={t.name}
                      className="w-10 h-10 object-contain drop-shadow-[0_4px_10px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none"
                      }}
                    />
                  ) : (
                    <div className="text-3xl filter drop-shadow-[0_6px_12px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform">
                      {t.icon || "🏆"}
                    </div>
                  )}
                  {t.count > 1 && (
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-slate-950 border border-amber-400 text-[9px] font-black font-sport text-amber-300 shadow-md z-10">
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
        <div
          className="pt-3 border-t border-white/10 flex justify-between items-center text-[10px] font-sport font-bold uppercase tracking-wider relative z-10"
          style={{ transform: "translateZ(20px)" }}
        >
          <span className="font-display font-black text-white tracking-[0.15em]">GAMBETA</span>
          <span className="text-[#74ACDF] text-[9px] tracking-[0.2em]">EL JUEGO DEL FÚTBOL ARGENTINO</span>
        </div>
      </motion.div>
    </div>
  )
}
