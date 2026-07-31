"use client"

import React, { useState, useRef } from "react"
import { motion } from "framer-motion"

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
  cleanSheets?: number
  penaltiesSaved?: number
  clubs: { id: string; name: string; logoUrl?: string }[]
  trophies: { id: string; name: string; count: number; icon: string }[]
  jerseyPattern?: string
  jerseyColor?: string
}

export default function CareerCardView({ data }: { data: CareerCardData }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 })

  // Un arquero no se luce con goles: su ficha muestra vallas invictas y penales atajados.
  const isGK = ["GK", "POR", "Arquero", "Portero"].includes(data.position)
  const isDEF = ["CB", "LB", "RB", "LWB", "RWB", "DEF", "LI", "LD"].includes(data.position)

  const kitColor = data.jerseyColor || "#74ACDF"
  const pattern = data.jerseyPattern || "sash"

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rX = ((y - centerY) / centerY) * -12 // Max 12 deg tilt X
    const rY = ((x - centerX) / centerX) * 12 // Max 12 deg tilt Y

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
        {/* DYNAMIC LIGHTING / HOLOGRAPHIC GLARE OVERLAY */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-30"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,${glarePos.opacity}) 0%, rgba(212,175,55,${glarePos.opacity * 0.4}) 30%, transparent 70%)`,
          }}
        />

        {/* 3D ACCENT BACKDROP */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gradient-to-br from-amber-400/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none" />

        {/* HEADER SECTION (TranslateZ for 3D depth) */}
        <div
          className="flex items-start gap-4 mb-5 relative z-10"
          style={{ transform: "translateZ(35px)" }}
        >
          {/* OVR BADGE (3D Card style) */}
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-26 sm:h-26 rounded-[28px] bg-gradient-to-br from-[#FFF9EA] via-[#FDE8B3] to-[#E5C16C] p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.6),inset_0_2px_4px_rgba(255,255,255,0.8)] flex items-center justify-center border border-amber-300/60">
              <div className="w-full h-full rounded-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 flex flex-col items-center justify-center text-slate-950 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]">
                <span className="text-[10px] font-black tracking-[0.2em] uppercase font-sport opacity-80">OVR</span>
                <span className="text-5xl font-black font-display leading-none text-slate-950 mt-0.5 drop-shadow-sm">
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

            <h3 className="font-display font-black text-white uppercase leading-tight text-xl sm:text-2xl tracking-tight truncate drop-shadow-md">
              {data.playerName}
            </h3>
            <p className="text-xs font-bold text-slate-400 font-sport uppercase tracking-wider mt-1">
              #{data.number} · {data.position}
            </p>
          </div>
        </div>

        {/* CAMISETA: SVG con corte real (hombros, mangas, cuello ribeteado) y tela sombreada */}
        <div
          className="relative w-full py-6 mb-5 rounded-2xl bg-gradient-to-b from-slate-950/80 to-slate-950 border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl z-10"
          style={{ transform: "translateZ(45px)" }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(circle at 50% 35%, ${kitColor}22, transparent 62%)` }} />
          {/* Halo detrás de la camiseta */}
          <div className="absolute h-32 w-32 rounded-full blur-2xl opacity-40" style={{ background: kitColor }} />

          <div className="relative w-36 h-40 flex items-center justify-center drop-shadow-[0_18px_30px_rgba(0,0,0,0.85)]">
            <svg viewBox="0 0 120 130" className="w-full h-full">
              <defs>
                <linearGradient id="telaLuz" x1="15%" y1="0%" x2="85%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
                  <stop offset="45%" stopColor="#ffffff" stopOpacity="0.04" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
                </linearGradient>
                <linearGradient id="mangaSombra" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.38" />
                </linearGradient>
                <linearGradient id="numeroOro" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FFF6C9" />
                  <stop offset="48%" stopColor="#F3C14B" />
                  <stop offset="100%" stopColor="#C9911F" />
                </linearGradient>
                {/* La tela recorta patrones y brillos para que nada se salga de la prenda */}
                <clipPath id="cuerpoCamiseta">
                  <path d="M42,16 C42,26 78,26 78,16 L92,21 C99,24 105,31 108,39 L112,50 C113,54 111,57 107,58 L96,61 C93,62 90,60 90,57 L90,49 L90,112 C90,117 87,120 82,120 L38,120 C33,120 30,117 30,112 L30,49 L30,57 C30,60 27,62 24,61 L13,58 C9,57 7,54 8,50 L12,39 C15,31 21,24 28,21 Z" />
                </clipPath>
              </defs>

              {/* Cuerpo + mangas en una silueta continua */}
              <path
                d="M42,16 C42,26 78,26 78,16 L92,21 C99,24 105,31 108,39 L112,50 C113,54 111,57 107,58 L96,61 C93,62 90,60 90,57 L90,49 L90,112 C90,117 87,120 82,120 L38,120 C33,120 30,117 30,112 L30,49 L30,57 C30,60 27,62 24,61 L13,58 C9,57 7,54 8,50 L12,39 C15,31 21,24 28,21 Z"
                fill={kitColor}
              />

              <g clipPath="url(#cuerpoCamiseta)">
                {/* Diseño de la camiseta */}
                {pattern === "sash" && (
                  <path d="M18,18 L104,120 L84,120 L8,34 Z" fill="#ffffff" opacity="0.92" />
                )}
                {pattern === "stripes" && (
                  <>
                    {[36, 52, 68, 84].map((x) => (
                      <rect key={x} x={x} y="8" width="8" height="120" fill="#ffffff" opacity="0.9" />
                    ))}
                  </>
                )}
                {pattern === "hoops" && (
                  <>
                    {[40, 66, 92].map((y) => (
                      <rect key={y} x="0" y={y} width="120" height="13" fill="#ffffff" opacity="0.9" />
                    ))}
                  </>
                )}

                {/* Textura de tela + volumen */}
                <rect x="0" y="0" width="120" height="130" fill="url(#telaLuz)" />
                <rect x="0" y="0" width="120" height="130" fill="url(#mangaSombra)" opacity="0.35" />
                {/* Pliegues */}
                <path d="M44,60 C48,80 46,100 43,118" stroke="#000" strokeOpacity="0.16" strokeWidth="2.5" fill="none" />
                <path d="M76,58 C72,78 74,98 77,118" stroke="#000" strokeOpacity="0.16" strokeWidth="2.5" fill="none" />
                {/* Brillo especular del hombro izquierdo */}
                <ellipse cx="40" cy="34" rx="16" ry="9" fill="#ffffff" opacity="0.12" />
              </g>

              {/* Costuras de las mangas */}
              <path d="M30,49 L30,57" stroke="#000" strokeOpacity="0.25" strokeWidth="2" />
              <path d="M90,49 L90,57" stroke="#000" strokeOpacity="0.25" strokeWidth="2" />

              {/* Cuello redondo con ribete */}
              <path d="M42,16 C42,27 78,27 78,16" fill="none" stroke="#050b16" strokeWidth="6" strokeLinecap="round" />
              <path d="M42,16 C42,27 78,27 78,16" fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />

              {/* Escudito y estrellas de campeón */}
              <g transform="translate(36,40)">
                <circle cx="0" cy="0" r="6" fill="#0b1220" stroke="#F3C14B" strokeWidth="1.2" />
                <path d="M0,-3.4 L1,-1 L3.6,-1 L1.5,0.6 L2.3,3.1 L0,1.6 L-2.3,3.1 L-1.5,0.6 L-3.6,-1 L-1,-1 Z" fill="#F3C14B" />
              </g>

              {/* Dorsal */}
              <text
                x="60"
                y="92"
                textAnchor="middle"
                fill="url(#numeroOro)"
                stroke="#05070d"
                strokeWidth="1.6"
                paintOrder="stroke"
                fontSize="34"
                fontWeight="900"
                fontFamily="var(--font-impact, Impact, sans-serif)"
                letterSpacing="-1"
              >
                {data.number}
              </text>

              {/* Sombra al piso */}
              <ellipse cx="60" cy="125" rx="30" ry="4" fill="#000" opacity="0.45" />
            </svg>
          </div>
        </div>

        {/* STATS BOX: las dos métricas que importan según el puesto (TranslateZ 30px) */}
        <div
          className="grid grid-cols-3 gap-2 bg-[#050A14] border border-white/10 rounded-2xl p-4 text-center mb-6 shadow-inner relative z-10"
          style={{ transform: "translateZ(30px)" }}
        >
          <div>
            <div className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-wider">PJ</div>
            <div className="text-3xl font-black text-white font-display mt-0.5">{data.matchesPlayed}</div>
          </div>
          {isGK ? (
            <>
              <div className="border-x border-white/10">
                <div className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-wider">V. INV.</div>
                <div className="text-3xl font-black text-emerald-400 font-display mt-0.5">{data.cleanSheets ?? 0}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-wider">PEN. ATAJ.</div>
                <div className="text-3xl font-black text-sky-400 font-display mt-0.5">{data.penaltiesSaved ?? 0}</div>
              </div>
            </>
          ) : isDEF ? (
            <>
              <div className="border-x border-white/10">
                <div className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-wider">V. INV.</div>
                <div className="text-3xl font-black text-emerald-400 font-display mt-0.5">{data.cleanSheets ?? 0}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-wider">GLS+AST</div>
                <div className="text-3xl font-black text-sky-400 font-display mt-0.5">{data.goals + data.assists}</div>
              </div>
            </>
          ) : (
            <>
              <div className="border-x border-white/10">
                <div className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-wider">GLS</div>
                <div className="text-3xl font-black text-emerald-400 font-display mt-0.5">{data.goals}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-wider">AST</div>
                <div className="text-3xl font-black text-sky-400 font-display mt-0.5">{data.assists}</div>
              </div>
            </>
          )}
        </div>

        {/* TRAYECTORIA (TranslateZ 25px) */}
        <div className="mb-5 relative z-10" style={{ transform: "translateZ(25px)" }}>
          <h4 className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-[0.35em] text-center mb-3">
            T R A Y E C T O R I A
          </h4>
          <div className="flex items-center justify-center gap-3.5 flex-wrap">
            {data.clubs.map((c, i) => (
              <div
                key={i}
                className="w-14 h-14 shrink-0 rounded-2xl bg-[#050A14] border border-white/10 p-2 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
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

        {/* TÍTULOS (TranslateZ 25px) */}
        <div className="mb-5 relative z-10" style={{ transform: "translateZ(25px)" }}>
          <h4 className="text-[10px] font-bold text-slate-400 font-sport uppercase tracking-[0.35em] text-center mb-3">
            T Í T U L O S
          </h4>
          <div className="flex items-center justify-center gap-5 flex-wrap">
            {data.trophies.map((t, i) => (
              <div key={i} className="flex flex-col items-center group relative">
                <div className="relative w-12 h-14 flex items-center justify-center">
                  <div className="text-3xl filter drop-shadow-[0_6px_12px_rgba(245,158,11,0.5)] group-hover:scale-110 transition-transform">
                    {t.icon}
                  </div>
                  {t.count > 1 && (
                    <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-slate-950 border border-amber-400 text-[11px] font-black font-sport text-amber-300 shadow-md">
                      ×{t.count}
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-400 font-sport uppercase mt-1 tracking-wider text-center max-w-[80px] truncate">
                  {t.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER WATERMARK (TranslateZ 20px) */}
        <div
          className="pt-3 border-t border-white/10 flex justify-between items-center text-[10px] font-sport font-bold uppercase tracking-wider relative z-10"
          style={{ transform: "translateZ(20px)" }}
        >
          <span className="font-display font-black text-white tracking-[0.15em]">GAMBETA</span>
          <span className="text-[#74ACDF] text-[11px] tracking-[0.2em]">GAMBETAFUTBOL.GAMES</span>
        </div>
      </motion.div>
    </div>
  )
}
