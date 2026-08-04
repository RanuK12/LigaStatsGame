"use client"

import React, { useState } from "react"
import { motion } from "framer-motion"
import type { SeasonResult } from "@/lib/career-engine"

export default function CareerMomentumChart({
  history,
}: {
  history: SeasonResult[]
}) {
  const [selectedSeason, setSelectedSeason] = useState<SeasonResult | null>(
    history.length > 0 ? history[history.length - 1] : null
  )

  if (history.length === 0) {
    return (
      <div className="card-glass rounded-3xl p-6 text-center text-xs text-slate-400 font-sport">
        Simulá tu primera temporada para generar la curva de momentum de carrera.
      </div>
    )
  }

  const width = 500
  const height = 200
  const padding = 35

  const ovrs = history.map((h) => h.ovr)
  const minOvr = Math.min(...ovrs, 60) - 2
  const maxOvr = Math.max(...ovrs, 90) + 2

  const points = history.map((h, i) => {
    const x =
      padding +
      (i / Math.max(1, history.length - 1)) * (width - padding * 2)
    const y =
      height -
      padding -
      ((h.ovr - minOvr) / (maxOvr - minOvr)) * (height - padding * 2)
    return { x, y, season: h }
  })

  const pathD = points.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ""
  )

  return (
    <div className="card-glass rounded-3xl p-5 border border-[#74ACDF]/30 font-sans space-y-4 shadow-2xl relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-[#74ACDF] font-sport uppercase tracking-wider block">
            📈 EVOLUCIÓN & MOMENTUM DE CARRERA
          </span>
          <h4 className="text-sm font-bold text-white font-display uppercase tracking-tight">
            CURVA DE OVR E HITOS DE TEMPORADA
          </h4>
        </div>
        <span className="text-xs font-black text-amber-400 font-sport">
          {history.length} AÑOS
        </span>
      </div>

      {/* SVG MOMENTUM LINE GRAPH */}
      <div className="relative w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#74ACDF" />
              <stop offset="50%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#74ACDF" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Area Fill Under Curve */}
          {points.length > 1 && (
            <path
              d={`${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
              fill="url(#areaGrad)"
            />
          )}

          {/* Grid lines */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1"
          />

          {/* OVR Line */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#lineGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            className="filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          />

          {/* Season Nodes */}
          {points.map((p, i) => {
            const isSelected = selectedSeason?.year === p.season.year
            const hasMilestone = p.season.highlights.length > 0
            return (
              <g
                key={i}
                onClick={() => setSelectedSeason(p.season)}
                className="cursor-pointer group"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isSelected ? 7 : 5}
                  fill={isSelected ? "#ffffff" : hasMilestone ? "#F59E0B" : "#74ACDF"}
                  stroke="#050A14"
                  strokeWidth="2"
                  className="transition-all group-hover:scale-125"
                />
                <text
                  x={p.x}
                  y={height - 12}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  '{String(p.season.year).slice(2)}
                </text>
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  fill="#F59E0B"
                  fontSize="10"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  {p.season.ovr}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* SELECTED SEASON DETAIL CARD */}
      {selectedSeason && (
        <div className="card-glass rounded-2xl p-4 border border-white/10 space-y-2 font-sport">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300">
              AÑO {selectedSeason.year} · {selectedSeason.clubName}
            </span>
            <span className="font-black text-[#74ACDF]">
              {selectedSeason.matchesPlayed} PJ · {selectedSeason.goals} GLS · {selectedSeason.assists} AST
            </span>
          </div>
          {selectedSeason.cronica && (
            <p className="text-xs text-slate-300 italic leading-snug font-sans">
              "{selectedSeason.cronica}"
            </p>
          )}
        </div>
      )}
    </div>
  )
}
